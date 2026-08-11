import { getSupabaseClient } from "@/lib/supabase";
import { VISITOR_STORAGE_KEY } from "@/lib/futbahl-match-config";
import type { GameSessionAnalytics } from "@/lib/futbahl-match-types";

export function getAnonymousVisitorId() {
  if (typeof window === "undefined") return null;
  const existing = window.localStorage.getItem(VISITOR_STORAGE_KEY);
  if (existing) return existing;
  const fallback = `visitor-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  const visitorId = globalThis.crypto?.randomUUID?.() ?? fallback;
  window.localStorage.setItem(VISITOR_STORAGE_KEY, visitorId);
  return visitorId;
}

async function ensureVisitorRecord(visitorId: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return false;
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("visitors")
    .upsert({ visitor_id: visitorId, last_seen: now }, { onConflict: "visitor_id" });
  if (error) {
    console.warn("Futbahl visitor upsert failed", error.message);
    return false;
  }
  const { data, error: verifyError } = await supabase
    .from("visitors")
    .select("visitor_id")
    .eq("visitor_id", visitorId)
    .maybeSingle();
  if (verifyError || !data) {
    console.warn("Futbahl visitor verify failed", verifyError?.message ?? "visitor row missing");
    return false;
  }
  return true;
}

export async function trackVisitorPageView(visitorId: string, path: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  await ensureVisitorRecord(visitorId);
  await supabase.from("page_views").insert({ visitor_id: visitorId, path });
}

export async function startAnalyticsSession(visitorId: string) {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("game_sessions")
    .insert({
      visitor_id: visitorId,
      started_at: new Date().toISOString(),
      goals_scored: 0,
      goals_conceded: 0,
      duration_seconds: 0,
    })
    .select("id")
    .single();
  if (error) return null;
  return (data as { id: string }).id;
}

export async function finishAnalyticsSession(
  session: GameSessionAnalytics | null,
  visitorId: string | null,
  score: { home: number; away: number },
) {
  if (!session?.id || !visitorId) return;
  const supabase = getSupabaseClient();
  if (!supabase) return;
  const durationSeconds = Math.max(1, Math.round((performance.now() - session.startedAt) / 1000));
  await supabase
    .from("game_sessions")
    .update({
      ended_at: new Date().toISOString(),
      goals_scored: Math.max(0, score.home - session.startedScore.home),
      goals_conceded: Math.max(0, score.away - session.startedScore.away),
      duration_seconds: durationSeconds,
    })
    .eq("id", session.id)
    .eq("visitor_id", visitorId);
}
