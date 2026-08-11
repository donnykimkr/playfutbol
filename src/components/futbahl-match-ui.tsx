"use client";

import Image from "next/image";
import { Keyboard, Settings } from "lucide-react";
import { FIELD_L, FIELD_W, FULL_TIME_SECONDS } from "@/lib/futbahl-match-config";
import type { MatchRuntime, MinimapSnapshot, TeamId } from "@/lib/futbahl-match-types";
import type { OfflineSettings } from "@/lib/futbahl-offline-settings";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function minimapPoint(x: number, z: number) {
  return {
    left: clamp(((z + FIELD_L / 2) / FIELD_L) * 100, 3, 97),
    top: clamp(((FIELD_W / 2 - x) / FIELD_W) * 100, 3, 97),
  };
}

function formatSoccerClock(value: number) {
  const capped = Math.min(FULL_TIME_SECONDS, Math.max(0, Math.floor(value)));
  const minutes = String(Math.floor(capped / 60)).padStart(2, "0");
  const seconds = String(capped % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function createMinimapSnapshot(active: MatchRuntime): MinimapSnapshot {
  return {
    ball: { x: active.ballPos.x, z: active.ballPos.z },
    players: active.players
      .filter((player) => !player.sentOff)
      .map((player) => ({
        id: player.id,
        team: player.team,
        x: player.pos.x,
        z: player.pos.z,
        controlled: player.controlledBy === "p1",
      })),
  };
}

export function MatchScoreboard({
  homeName,
  homeColor,
  awayName,
  awayColor,
  score,
  gameClock,
  goalBannerTeam,
}: {
  homeName: string;
  homeColor: string;
  awayName: string;
  awayColor: string;
  score: { home: number; away: number };
  gameClock: number;
  goalBannerTeam: TeamId | null;
}) {
  return (
    <section className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center px-2 pt-[calc(env(safe-area-inset-top)+0.45rem)] sm:px-4">
      <div aria-label="Match scoreboard" className={`futbahl-scoreboard ${goalBannerTeam ? `futbahl-scoreboard--goal futbahl-scoreboard--goal-${goalBannerTeam}` : ""}`}>
        <div
          className={`futbahl-scoreboard__team futbahl-scoreboard__team--home ${goalBannerTeam === "home" ? "is-scoring" : ""}`}
          style={{ backgroundColor: homeColor }}
        >
          <span className="futbahl-scoreboard__team-name">{homeName.toUpperCase()}</span>
          <span className="futbahl-scoreboard__goal-label">GOAL</span>
        </div>
        <div className="futbahl-scoreboard__score" aria-label={`${score.home} to ${score.away}`}>
          <span>{score.home}</span>
          <span className="futbahl-scoreboard__separator">-</span>
          <span>{score.away}</span>
        </div>
        <div
          className={`futbahl-scoreboard__team futbahl-scoreboard__team--away ${goalBannerTeam === "away" ? "is-scoring" : ""}`}
          style={{ backgroundColor: awayColor }}
        >
          <span className="futbahl-scoreboard__team-name">{awayName.toUpperCase()}</span>
          <span className="futbahl-scoreboard__goal-label">GOAL</span>
        </div>
        <span className="futbahl-scoreboard__time">{formatSoccerClock(gameClock)}</span>
      </div>
    </section>
  );
}

export function DesktopMatchControls({
  aiEnabled,
  guideOpen,
  appleMobile,
  onOpenSettings,
  onToggleAi,
  onToggleGuide,
}: {
  aiEnabled: boolean;
  guideOpen: boolean;
  appleMobile: boolean;
  onOpenSettings: () => void;
  onToggleAi: () => void;
  onToggleGuide: () => void;
}) {
  const controls = [
    ["Arrow Keys", "Move"],
    ["E", "Sprint"],
    ["S", "Pass / Switch"],
    ["W", "Through Pass"],
    ["A", "Loft / Cross"],
    ["D", "Shoot / Kick"],
    ["Z + D", "Finesse"],
    ["Space", "Tackle"],
    ["U", "AI Mode"],
    ["C", "Camera"],
    ...(appleMobile ? [] : [["F", "Fullscreen"]]),
  ];

  return (
    <>
      <button
        type="button"
        className="pointer-events-auto fixed right-4 top-[calc(env(safe-area-inset-top)+7rem)] z-[70] inline-flex items-center gap-2 rounded-md border border-white/20 bg-black/60 px-4 py-2 text-xs font-black uppercase tracking-wide text-white shadow-lg backdrop-blur-sm active:bg-white/15 sm:right-6"
        onClick={onOpenSettings}
      >
        <Settings size={15} />
        Settings
      </button>
      <div
        data-testid="desktop-hud-tools"
        className="pointer-events-auto fixed right-4 top-[calc(env(safe-area-inset-top)+10.25rem)] z-[70] flex w-48 flex-col items-end gap-2 sm:right-6"
      >
        <button
          data-testid="ai-toggle"
          type="button"
          className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-black uppercase shadow-lg backdrop-blur-sm ${
            aiEnabled ? "border-lime-200/55 bg-lime-400/25 text-lime-50" : "border-white/20 bg-black/55 text-white/85"
          }`}
          onClick={onToggleAi}
          aria-pressed={aiEnabled}
        >
          <span>AI</span>
          <span className={`relative inline-flex h-5 w-9 rounded-full border ${aiEnabled ? "border-lime-100/60 bg-lime-300/35" : "border-white/25 bg-white/10"}`}>
            <span className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white transition-transform ${aiEnabled ? "translate-x-4" : "translate-x-0.5"}`} />
          </span>
          <span>{aiEnabled ? "ON" : "OFF"}</span>
        </button>
        <button
          data-testid="keyboard-guide-toggle"
          type="button"
          className="hidden items-center gap-2 rounded-md border border-white/20 bg-black/55 px-3 py-2 text-xs font-black uppercase text-white/85 shadow-lg backdrop-blur-sm md:inline-flex"
          onClick={onToggleGuide}
          aria-expanded={guideOpen}
          aria-controls="keyboard-guide"
        >
          <Keyboard size={15} />
          Controls
        </button>
        {guideOpen && (
          <div
            id="keyboard-guide"
            data-testid="keyboard-guide"
            className="hidden w-48 grid-cols-2 gap-x-2 gap-y-1.5 rounded-md border border-white/15 bg-black/55 px-2.5 py-2 text-[11px] font-bold text-white/80 shadow-lg backdrop-blur-sm md:grid"
          >
            {controls.map(([key, label]) => (
              <span key={key} className="inline-flex min-w-0 items-center gap-1">
                <kbd className="shrink-0 rounded border border-white/25 bg-white/10 px-1.5 py-0.5 font-mono text-[10px] font-black text-white">{key}</kbd>
                <span className="truncate text-white/65">{label}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export function ShotPowerGauge({ charge, x, y }: { charge: number; x: number; y: number }) {
  return (
    <div
      aria-label="Shot power"
      className="pointer-events-none fixed z-20 h-2 w-24 -translate-x-1/2 bg-emerald-500 shadow-[0_1px_4px_rgba(0,0,0,0.65)]"
      style={{ left: x, top: y }}
    >
      <span
        className="absolute -top-0.5 h-3 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_2px_rgba(0,0,0,0.85)]"
        style={{ left: `${Math.round(clamp(charge, 0, 1) * 100)}%` }}
      />
    </div>
  );
}

export function StaminaGauge({ stamina, x, y }: { stamina: number; x: number; y: number }) {
  return (
    <div
      aria-label="Sprint stamina"
      className="pointer-events-none fixed z-20 h-1.5 w-[4.5rem] -translate-x-1/2 overflow-hidden rounded-sm border border-white/35 bg-black/60 shadow-[0_1px_3px_rgba(0,0,0,0.55)]"
      style={{ left: x, top: y }}
    >
      <span
        className="block h-full bg-emerald-300 transition-[width] duration-75"
        style={{ width: `${Math.round(clamp(stamina, 0, 1) * 100)}%` }}
      />
    </div>
  );
}

export function MatchMinimap({ snapshot }: { snapshot: MinimapSnapshot }) {
  const ballPoint = minimapPoint(snapshot.ball.x, snapshot.ball.z);
  return (
    <div
      className="pointer-events-none fixed right-3 top-[calc(env(safe-area-inset-top)+13rem)] z-20 h-16 w-28 rounded-md border border-white/25 bg-black/45 shadow-lg backdrop-blur-sm sm:left-1/2 sm:right-auto sm:top-[calc(env(safe-area-inset-top)+4.25rem)] sm:h-20 sm:w-36 sm:-translate-x-1/2 lg:h-24 lg:w-44"
      aria-label="Match minimap"
    >
      <div className="absolute inset-2 rounded-sm border border-emerald-100/45">
        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-emerald-100/25" />
        <div className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-100/25 sm:h-9 sm:w-9" />
        {snapshot.players.map((player) => {
          const point = minimapPoint(player.x, player.z);
          return (
            <span
              key={player.id}
              className={`absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${player.team === "home" ? "bg-cyan-300" : "bg-rose-300"} ${player.controlled ? "ring-2 ring-white" : ""}`}
              style={{ left: `${point.left}%`, top: `${point.top}%` }}
            />
          );
        })}
        <span
          className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow"
          style={{ left: `${ballPoint.left}%`, top: `${ballPoint.top}%` }}
        />
      </div>
    </div>
  );
}

export function HalftimeOverlay() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[75] grid place-items-center">
      <div className="rounded-md border border-white/25 bg-black/35 px-10 py-5 text-center shadow-2xl backdrop-blur-[2px]">
        <div className="text-5xl font-black tracking-normal text-white drop-shadow-[0_4px_18px_rgba(0,0,0,0.85)] sm:text-7xl">HALFTIME</div>
      </div>
    </div>
  );
}

export function MatchSettingsDialog({
  cameraMode,
  draftSettings,
  matchInProgress,
  onClose,
  onSave,
  onCameraMode,
  onHomeColor,
  onMinimap,
  onCrowdVolume,
  onExitGame,
}: {
  cameraMode: "broadcast" | "first-person";
  draftSettings: OfflineSettings;
  matchInProgress: boolean;
  onClose: () => void;
  onSave: () => void;
  onCameraMode: (mode: "broadcast" | "first-person") => void;
  onHomeColor: (color: string) => void;
  onMinimap: (enabled: boolean) => void;
  onCrowdVolume: (volume: number) => void;
  onExitGame: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[90] overflow-y-auto bg-black/65 p-4 text-white backdrop-blur-sm">
      <div className="mx-auto my-4 w-full max-w-5xl rounded-md border border-white/15 bg-[#08130d]/95 p-4 shadow-2xl sm:p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <Image src="/branding/futbahl-f-symbol.svg" width={42} height={42} className="h-10 w-10 object-contain" alt="Futbahl" />
              <h2 className="text-2xl font-black">Match Settings</h2>
            </div>
            <p className="mt-1 text-sm text-white/60">Tune the match presentation without interrupting play.</p>
          </div>
          <div className="flex gap-2">
            <button className="rounded-md border border-white/15 px-4 py-2 text-sm font-bold text-white hover:bg-white/10" onClick={onClose}>Close</button>
            <button className="rounded-md bg-emerald-300 px-4 py-2 text-sm font-black text-slate-950 hover:bg-emerald-200 disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/35" onClick={onSave}>Save</button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-md border border-white/10 bg-white/5 p-3 text-xs font-bold text-white/75">
            <span className="mb-2 block">Camera</span>
            <div className="grid grid-cols-2 gap-2" role="group" aria-label="Camera mode">
              {(["broadcast", "first-person"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={`rounded border px-3 py-2 font-black ${cameraMode === mode ? "border-emerald-200 bg-emerald-300 text-slate-950" : "border-white/15 bg-black/20 text-white/70"}`}
                  onClick={() => onCameraMode(mode)}
                >
                  {mode === "broadcast" ? "Broadcast" : "First Person"}
                </button>
              ))}
            </div>
          </div>
          <label className="rounded-md border border-white/10 bg-white/5 p-3 text-xs font-bold text-white/75">
            <span className="mb-2 flex justify-between"><span>Home kit color</span><span>{draftSettings.homeColor.toUpperCase()}</span></span>
            <input
              type="color"
              value={draftSettings.homeColor}
              className="h-10 w-full rounded border border-white/15 bg-black/30 p-1"
              onChange={(event) => onHomeColor(event.target.value)}
            />
          </label>
          <label className="flex items-center justify-between gap-4 rounded-md border border-white/10 bg-white/5 p-3 text-xs font-bold text-white/75">
            <span>
              <span className="block text-sm font-black text-white">Minimap</span>
              <span className="mt-0.5 block font-medium text-white/50">Show tactical player positions</span>
            </span>
            <input
              type="checkbox"
              checked={draftSettings.minimapEnabled}
              className="h-5 w-5 accent-emerald-300"
              onChange={(event) => onMinimap(event.target.checked)}
            />
          </label>
          <label className="rounded-md border border-white/10 bg-white/5 p-3 text-xs font-bold text-white/75">
            <span className="mb-2 flex justify-between"><span>Crowd</span><span>{Math.round(draftSettings.crowdVolume * 100)}%</span></span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={draftSettings.crowdVolume}
              className="w-full accent-emerald-300"
              onChange={(event) => onCrowdVolume(Number(event.target.value))}
            />
          </label>
        </div>

        {matchInProgress && (
          <div className="mt-4 flex justify-end border-t border-white/10 pt-4">
            <button className="rounded-md border border-rose-200/35 bg-rose-500/85 px-4 py-2 text-sm font-black uppercase text-white hover:bg-rose-400/85" onClick={onExitGame}>Exit Game</button>
          </div>
        )}
      </div>
    </div>
  );
}

export function SoccerBallLogo() {
  return (
    <Image
      src="/branding/futbahl-f-symbol.svg"
      width={96}
      height={96}
      className="h-20 w-20 object-contain sm:h-24 sm:w-24"
      priority
      alt="Futbahl"
    />
  );
}
