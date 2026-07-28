import type { BodyPresetId, PreferredFoot } from "@/lib/anonymous-team-setup";

export const BODY_PRESET_HEIGHT_RANGES: Record<BodyPresetId, readonly [number, number]> = {
  compact: [1.68, 1.73],
  quick: [1.71, 1.77],
  agile: [1.73, 1.79],
  balanced: [1.76, 1.82],
  strong: [1.78, 1.85],
  tall: [1.86, 1.94],
};

export function stableStringHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function targetHeightForPreset(bodyPresetId: BodyPresetId, playerId: string) {
  const [minimum, maximum] = BODY_PRESET_HEIGHT_RANGES[bodyPresetId];
  const fraction = stableStringHash(`${playerId}:${bodyPresetId}`) / 0xffffffff;
  return minimum + (maximum - minimum) * fraction;
}

export function normalizedShirtNumber(number: number) {
  return Math.max(1, Math.min(99, Math.trunc(number)));
}

export function shirtNumberGlyphs(number: number) {
  return String(normalizedShirtNumber(number)).split("").map(Number);
}

export function kickingLeg(preferredFoot: PreferredFoot) {
  return preferredFoot === "left" ? "leftLeg" : "rightLeg";
}

