import { describe, expect, it } from "vitest";
import {
  BODY_PRESET_HEIGHT_RANGES,
  kickingLeg,
  normalizedShirtNumber,
  shirtNumberGlyphs,
  targetHeightForPreset,
} from "./player-appearance";

describe("player appearance configuration", () => {
  it.each([1, 9, 10, 11, 12, 47, 99])("renders shirt number %i without wrapping", (number) => {
    expect(normalizedShirtNumber(number)).toBe(number);
    expect(shirtNumberGlyphs(number).join("")).toBe(String(number));
  });

  it("keeps deterministic heights inside each body preset range", () => {
    for (const [preset, [minimum, maximum]] of Object.entries(BODY_PRESET_HEIGHT_RANGES)) {
      const first = targetHeightForPreset(preset as keyof typeof BODY_PRESET_HEIGHT_RANGES, "home-9");
      const second = targetHeightForPreset(preset as keyof typeof BODY_PRESET_HEIGHT_RANGES, "home-9");
      expect(first).toBe(second);
      expect(first).toBeGreaterThanOrEqual(minimum);
      expect(first).toBeLessThanOrEqual(maximum);
    }
  });

  it("selects the preferred kicking leg", () => {
    expect(kickingLeg("left")).toBe("leftLeg");
    expect(kickingLeg("right")).toBe("rightLeg");
  });
});

