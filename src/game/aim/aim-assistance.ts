import type { AssistanceLevel } from "../config/gameplay-tuning";
import { AIM_ASSISTANCE } from "../config/gameplay-tuning";

export type Direction2 = { x: number; z: number };

function normalize(direction: Direction2) {
  const length = Math.hypot(direction.x, direction.z);
  if (length <= Number.EPSILON) return { x: 0, z: 1 };
  return { x: direction.x / length, z: direction.z / length };
}

export function correctedAim(
  rawDirection: Direction2,
  suggestedDirection: Direction2,
  level: AssistanceLevel,
  kind: "pass" | "loft" | "shot",
) {
  const raw = normalize(rawDirection);
  const suggested = normalize(suggestedDirection);
  const config = AIM_ASSISTANCE[level];
  const maximumDegrees = kind === "loft"
    ? config.loftDegrees
    : kind === "shot"
      ? config.shotDegrees
      : config.passDegrees;
  const rawAngle = Math.atan2(raw.x, raw.z);
  const suggestedAngle = Math.atan2(suggested.x, suggested.z);
  const delta = Math.atan2(Math.sin(suggestedAngle - rawAngle), Math.cos(suggestedAngle - rawAngle));
  const maximumRadians = maximumDegrees * Math.PI / 180;
  const correction = Math.max(-maximumRadians, Math.min(maximumRadians, delta * config.strength));
  const correctedAngle = rawAngle + correction;
  return {
    raw,
    corrected: { x: Math.sin(correctedAngle), z: Math.cos(correctedAngle) },
    correctionRadians: correction,
    correctionDegrees: correction * 180 / Math.PI,
    strength: config.strength,
  };
}
