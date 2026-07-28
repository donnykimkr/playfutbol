import { describe, expect, it } from "vitest";
import {
  distanceAfterAcceleration,
  PLAYER_MOVEMENT,
  timeToMovementSpeed,
} from "./player-movement";

describe("player movement pace", () => {
  it("keeps the controlled profile in the intended football pace bands", () => {
    const profile = PLAYER_MOVEMENT.controlled;
    expect(profile.walk).toBeGreaterThanOrEqual(1.8);
    expect(profile.walk).toBeLessThanOrEqual(2.2);
    expect(profile.jog).toBeGreaterThanOrEqual(4);
    expect(profile.jog).toBeLessThanOrEqual(5.2);
    expect(profile.run).toBeGreaterThanOrEqual(6);
    expect(profile.run).toBeLessThanOrEqual(7.2);
    expect(profile.sprint).toBeGreaterThanOrEqual(8.2);
    expect(profile.sprint).toBeLessThanOrEqual(9.4);
    expect(profile.burstSprint).toBeGreaterThanOrEqual(9.8);
    expect(profile.burstSprint).toBeLessThanOrEqual(10.2);
  });

  it("makes possession sprinting slower than open-field sprinting", () => {
    const profile = PLAYER_MOVEMENT.controlled;
    expect(profile.sprint * profile.dribbleSprintMultiplier).toBeLessThan(profile.sprint);
    expect(profile.sprint * profile.dribbleSprintMultiplier).toBeGreaterThan(profile.run);
  });

  it("reports deterministic acceleration timings and five-second distance", () => {
    const profile = PLAYER_MOVEMENT.controlled;
    expect(timeToMovementSpeed(profile.run, profile.acceleration)).toBeCloseTo(0.573, 2);
    expect(timeToMovementSpeed(profile.sprint, profile.acceleration)).toBeCloseTo(0.746, 2);
    expect(distanceAfterAcceleration(5, profile.sprint, profile.acceleration)).toBeCloseTo(42.8, 1);
  });
});
