"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

type Props = {
  aiEnabled: boolean;
  fullscreenAvailable: boolean;
  fullscreenActive: boolean;
  onKey: (code: string, pressed: boolean) => void;
  onToggleAi: () => void;
  onToggleFullscreen: () => void;
  onOpenSettings: () => void;
};

const DIRECTION_KEYS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"] as const;

export function FutbahlMobileControls({
  aiEnabled,
  fullscreenAvailable,
  fullscreenActive,
  onKey,
  onToggleAi,
  onToggleFullscreen,
  onOpenSettings,
}: Props) {
  const joystickPointer = useRef<number | null>(null);
  const activeDirections = useRef(new Set<string>());
  const [stick, setStick] = useState({ x: 0, y: 0 });

  const releaseDirections = () => {
    activeDirections.current.forEach((code) => onKey(code, false));
    activeDirections.current.clear();
    setStick({ x: 0, y: 0 });
  };
  const updateJoystick = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const radius = Math.max(1, Math.min(rect.width, rect.height) * 0.5);
    const rawX = (event.clientX - (rect.left + rect.width * 0.5)) / radius;
    const rawY = (event.clientY - (rect.top + rect.height * 0.5)) / radius;
    const length = Math.hypot(rawX, rawY);
    const scale = length > 1 ? 1 / length : 1;
    const x = rawX * scale;
    const y = rawY * scale;
    setStick({ x, y });
    const next = new Set<string>();
    if (length > 0.2) {
      if (y < -0.22) next.add("ArrowUp");
      if (y > 0.22) next.add("ArrowDown");
      if (x < -0.22) next.add("ArrowLeft");
      if (x > 0.22) next.add("ArrowRight");
    }
    DIRECTION_KEYS.forEach((code) => {
      const wasPressed = activeDirections.current.has(code);
      const pressed = next.has(code);
      if (wasPressed !== pressed) onKey(code, pressed);
    });
    activeDirections.current = next;
  };
  const startJoystick = (event: ReactPointerEvent<HTMLDivElement>) => {
    joystickPointer.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    updateJoystick(event);
  };
  const moveJoystick = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (joystickPointer.current !== event.pointerId) return;
    updateJoystick(event);
  };
  const endJoystick = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (joystickPointer.current !== event.pointerId) return;
    joystickPointer.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    releaseDirections();
  };
  const actionHandlers = (code: string) => ({
    onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => {
      event.currentTarget.setPointerCapture(event.pointerId);
      onKey(code, true);
    },
    onPointerUp: (event: ReactPointerEvent<HTMLButtonElement>) => {
      onKey(code, false);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    },
    onPointerCancel: () => onKey(code, false),
    onLostPointerCapture: () => onKey(code, false),
  });

  return (
    <div className="pointer-events-none fixed inset-0 z-30 select-none touch-none" aria-label="Touch controls">
      <div
        data-testid="mobile-joystick"
        className="pointer-events-auto absolute bottom-[calc(env(safe-area-inset-bottom)+1.4rem)] left-[calc(env(safe-area-inset-left)+1.25rem)] h-32 w-32 rounded-full border-2 border-white/30 bg-black/25 shadow-xl backdrop-blur-[2px]"
        onPointerDown={startJoystick}
        onPointerMove={moveJoystick}
        onPointerUp={endJoystick}
        onPointerCancel={endJoystick}
        onLostPointerCapture={releaseDirections}
      >
        <span
          className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/45 bg-white/30 shadow-lg"
          style={{ transform: `translate(calc(-50% + ${stick.x * 34}px), calc(-50% + ${stick.y * 34}px))` }}
        />
      </div>

      <div className="pointer-events-auto absolute bottom-[calc(env(safe-area-inset-bottom)+1rem)] right-[calc(env(safe-area-inset-right)+1rem)] grid grid-cols-2 gap-2">
        <button {...actionHandlers("KeyS")} className="h-16 w-16 rounded-full border-2 border-cyan-200/65 bg-cyan-700/55 text-xs font-black text-white shadow-lg">PASS</button>
        <button {...actionHandlers("KeyD")} className="h-20 w-20 -translate-y-4 rounded-full border-2 border-rose-200/70 bg-rose-700/60 text-xs font-black text-white shadow-lg">SHOOT</button>
        <button {...actionHandlers("KeyE")} className="h-14 w-14 rounded-full border-2 border-amber-200/60 bg-amber-700/55 text-[10px] font-black text-white shadow-lg">SWITCH</button>
        <button {...actionHandlers("Space")} className="h-16 w-16 rounded-full border-2 border-emerald-200/60 bg-emerald-700/55 text-xs font-black text-white shadow-lg">TACKLE</button>
      </div>

      <div className="pointer-events-auto absolute right-[calc(env(safe-area-inset-right)+0.8rem)] top-[calc(env(safe-area-inset-top)+5.8rem)] flex gap-2">
        <button className={`rounded-full border px-3 py-2 text-[10px] font-black ${aiEnabled ? "border-lime-200 bg-lime-400/70 text-slate-950" : "border-white/30 bg-black/50 text-white"}`} onClick={onToggleAi}>AI {aiEnabled ? "ON" : "OFF"}</button>
        <button className="rounded-full border border-white/30 bg-black/50 px-3 py-2 text-[10px] font-black text-white" onClick={onOpenSettings}>PAUSE</button>
        {fullscreenAvailable && <button className="rounded-full border border-white/30 bg-black/50 px-3 py-2 text-[10px] font-black text-white" onClick={onToggleFullscreen}>{fullscreenActive ? "WINDOW" : "FULL"}</button>}
      </div>
    </div>
  );
}
