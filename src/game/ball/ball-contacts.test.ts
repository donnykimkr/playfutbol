import { describe, expect, it } from "vitest";
import { sweptContact2D, tackleContactIsLegal } from "./ball-contacts";

describe("swept ball contacts", () => {
  it("detects a fast ball crossing a foot contact zone between frames", () => {
    expect(sweptContact2D({ x: -2, z: 0 }, { x: 2, z: 0 }, { x: 0, z: 0.2 }, 0.3)).toBe(true);
  });

  it("does not claim contact outside the physical reach", () => {
    expect(sweptContact2D({ x: -2, z: 0 }, { x: 2, z: 0 }, { x: 0, z: 0.7 }, 0.3)).toBe(false);
  });
});

describe("tackle geometry", () => {
  const base = {
    tackler: { x: 0, z: 0 },
    ball: { x: 0, z: 0.7 },
    tacklerFacing: { x: 0, z: 1 },
    reach: 0.76,
  };

  it("accepts a front tackle with ball contact", () => {
    expect(tackleContactIsLegal({ ...base, carrierFacing: { x: 0, z: -1 } })).toBe(true);
  });

  it("accepts a side tackle when facing the ball", () => {
    expect(tackleContactIsLegal({
      ...base,
      ball: { x: 0.55, z: 0.25 },
      tacklerFacing: { x: 0.9, z: 0.4 },
      carrierFacing: { x: -1, z: 0 },
    })).toBe(true);
  });

  it("rejects a from-behind tackle", () => {
    expect(tackleContactIsLegal({ ...base, carrierFacing: { x: 0, z: 1 } })).toBe(false);
  });
});
