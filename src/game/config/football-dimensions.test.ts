import { describe, expect, it } from "vitest";
import {
  classifyBallBoundary,
  FOOTBALL_DIMENSIONS,
  HALF_PITCH_LENGTH,
  HALF_PITCH_WIDTH,
  isInsidePenaltyArea,
} from "./football-dimensions";

describe("official football dimensions", () => {
  it("uses one metre per world unit and official dimensions", () => {
    expect(FOOTBALL_DIMENSIONS.pitchLength).toBe(105);
    expect(FOOTBALL_DIMENSIONS.pitchWidth).toBe(68);
    expect(FOOTBALL_DIMENSIONS.goalWidth).toBe(7.32);
    expect(FOOTBALL_DIMENSIONS.goalHeight).toBe(2.44);
  });

  it("classifies touchlines and goal lines using the whole ball", () => {
    expect(classifyBallBoundary(HALF_PITCH_WIDTH + 0.1, 0.11, 0)).toBe("in-play");
    expect(classifyBallBoundary(HALF_PITCH_WIDTH + 0.23, 0.11, 0)).toBe("touchline");
    expect(classifyBallBoundary(5, 0.11, HALF_PITCH_LENGTH + 0.23)).toBe("goal-line");
  });

  it("awards a goal only after the whole ball crosses", () => {
    expect(classifyBallBoundary(0, 0.11, HALF_PITCH_LENGTH + 0.1)).toBe("in-play");
    expect(classifyBallBoundary(0, 0.11, HALF_PITCH_LENGTH + 0.23)).toBe("goal");
    expect(classifyBallBoundary(3.6, 0.11, HALF_PITCH_LENGTH + 0.23)).toBe("goal-line");
  });

  it("uses official penalty-area bounds at both ends", () => {
    expect(isInsidePenaltyArea(20, HALF_PITCH_LENGTH - 16, 1)).toBe(true);
    expect(isInsidePenaltyArea(20.3, HALF_PITCH_LENGTH - 16, 1)).toBe(false);
    expect(isInsidePenaltyArea(0, -HALF_PITCH_LENGTH + 16, -1)).toBe(true);
    expect(isInsidePenaltyArea(0, -HALF_PITCH_LENGTH + 17, -1)).toBe(false);
  });
});

