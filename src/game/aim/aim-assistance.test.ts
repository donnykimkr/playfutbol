import { describe, expect, it } from "vitest";
import { correctedAim } from "./aim-assistance";

describe("aim assistance", () => {
  it("preserves raw direction in manual mode", () => {
    const result = correctedAim({ x: 1, z: 0 }, { x: 0, z: 1 }, "manual", "shot");
    expect(result.corrected.x).toBeCloseTo(1);
    expect(result.corrected.z).toBeCloseTo(0);
    expect(result.correctionDegrees).toBeCloseTo(0);
  });

  it("bounds assisted correction instead of replacing the target", () => {
    const result = correctedAim({ x: 1, z: 0 }, { x: 0, z: 1 }, "assisted", "pass");
    expect(Math.abs(result.correctionDegrees)).toBeLessThanOrEqual(14);
    expect(result.corrected.x).toBeGreaterThan(0.9);
  });
});
