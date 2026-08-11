import {
  changeFormation,
  DEFAULT_OFFLINE_SETTINGS,
  normalizeOfflineSettings,
  type OfflineSettings,
} from "@/lib/anonymous-team-setup";
import { SETTINGS_STORAGE_KEY } from "@/lib/futbahl-match-config";

export type { OfflineSettings };

export function fixedFormationSettings(settings: unknown): OfflineSettings {
  const normalized = normalizeOfflineSettings(settings);
  return {
    ...normalized,
    userTeam: changeFormation(normalized.userTeam, "home", "4-3-3"),
    aiTeam: changeFormation(normalized.aiTeam, "away", "4-3-3"),
  };
}

export const DEFAULT_MATCH_SETTINGS = fixedFormationSettings(DEFAULT_OFFLINE_SETTINGS);

export function detectAppleMobile() {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function loadOfflineSettings() {
  if (typeof window === "undefined") return fixedFormationSettings(DEFAULT_MATCH_SETTINGS);
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    const normalized = fixedFormationSettings(raw ? JSON.parse(raw) : null);
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  } catch {
    return fixedFormationSettings(DEFAULT_MATCH_SETTINGS);
  }
}

export function saveOfflineSettings(settings: OfflineSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}
