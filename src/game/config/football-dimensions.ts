export const METERS_PER_WORLD_UNIT = 1;

export const FOOTBALL_DIMENSIONS = Object.freeze({
  pitchLength: 105,
  pitchWidth: 68,
  goalWidth: 7.32,
  goalHeight: 2.44,
  ballRadius: 0.11,
  penaltyAreaDepth: 16.5,
  penaltyAreaWidth: 40.32,
  goalAreaDepth: 5.5,
  goalAreaWidth: 18.32,
  penaltySpotDistance: 11,
  centerCircleRadius: 9.15,
  penaltyArcRadius: 9.15,
  cornerArcRadius: 1,
} as const);

export const HALF_PITCH_LENGTH = FOOTBALL_DIMENSIONS.pitchLength / 2;
export const HALF_PITCH_WIDTH = FOOTBALL_DIMENSIONS.pitchWidth / 2;
export const HALF_GOAL_WIDTH = FOOTBALL_DIMENSIONS.goalWidth / 2;
export const HALF_PENALTY_AREA_WIDTH = FOOTBALL_DIMENSIONS.penaltyAreaWidth / 2;
export const HALF_GOAL_AREA_WIDTH = FOOTBALL_DIMENSIONS.goalAreaWidth / 2;

export type TeamEnd = -1 | 1;
export type BoundaryClassification = "in-play" | "touchline" | "goal-line" | "goal";

export function isInsidePenaltyArea(x: number, z: number, end: TeamEnd, ballRadius = 0) {
  const depthFromGoalLine = HALF_PITCH_LENGTH - end * z;
  return Math.abs(x) <= HALF_PENALTY_AREA_WIDTH + ballRadius
    && depthFromGoalLine >= -ballRadius
    && depthFromGoalLine <= FOOTBALL_DIMENSIONS.penaltyAreaDepth + ballRadius;
}

export function classifyBallBoundary(
  x: number,
  y: number,
  z: number,
  ballRadius = FOOTBALL_DIMENSIONS.ballRadius,
): BoundaryClassification {
  if (Math.abs(x) - ballRadius > HALF_PITCH_WIDTH) return "touchline";
  if (Math.abs(z) - ballRadius <= HALF_PITCH_LENGTH) return "in-play";

  const wholeBallAcrossLine = Math.abs(z) - ballRadius > HALF_PITCH_LENGTH;
  const insideGoalMouth = Math.abs(x) + ballRadius < HALF_GOAL_WIDTH;
  const belowCrossbar = y + ballRadius < FOOTBALL_DIMENSIONS.goalHeight;
  if (wholeBallAcrossLine && insideGoalMouth && belowCrossbar) return "goal";
  return "goal-line";
}

export function penaltySpotZ(end: TeamEnd) {
  return end * (HALF_PITCH_LENGTH - FOOTBALL_DIMENSIONS.penaltySpotDistance);
}

