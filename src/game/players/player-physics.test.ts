import { describe, expect, it } from "vitest";
import { integrateDistanceAtFrameRate } from "./player-physics";

describe("frame-rate independent player acceleration", () => {
  it("produces similar travel at 30, 60, and 120 fps", () => {
    const samples = [30, 60, 120].map((fps) => integrateDistanceAtFrameRate({
      duration: 3,
      fps,
      targetSpeed: 8.5,
      acceleration: 8.2,
      braking: 10.8,
    }));
    const distances = samples.map((sample) => sample.distance);
    expect(Math.max(...distances) - Math.min(...distances)).toBeLessThan(0.32);
    samples.forEach((sample) => expect(sample.speed).toBeCloseTo(8.5, 6));
  });
});

