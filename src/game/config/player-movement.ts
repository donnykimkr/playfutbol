export const PLAYER_COLLISION = Object.freeze({
  fieldRadius: 0.42,
  keeperRadius: 0.46,
  personalSpaceRadius: 0.88,
  firstTouchReach: 0.78,
  standingTackleReach: 0.76,
  dribbleControlDistance: 0.64,
  keeperHandReach: 0.72,
  keeperBodyReach: 0.5,
  maximumCorrectionPerFrame: 0.12,
} as const);

export const PLAYER_MOVEMENT = Object.freeze({
  controlled: {
    walk: 2.1,
    jog: 4.8,
    run: 7.1,
    sprint: 9.25,
    burstSprint: 10.1,
    dribbleSprintMultiplier: 0.9,
    acceleration: 12.4,
    braking: 13.2,
    turnRate: 6.2,
  },
  ai: {
    walk: 2,
    jog: 4.6,
    run: 6.9,
    sprint: 9,
    burstSprint: 9.9,
    dribbleSprintMultiplier: 0.89,
    acceleration: 11.2,
    braking: 12.6,
    turnRate: 5.8,
  },
  goalkeeper: {
    walk: 1.8,
    jog: 4,
    run: 6.2,
    sprint: 7.6,
    burstSprint: 8.2,
    dribbleSprintMultiplier: 0.9,
    acceleration: 9.2,
    braking: 11.8,
    turnRate: 6.1,
  },
  jockey: {
    walk: 1.8,
    jog: 3.8,
    run: 5.4,
    sprint: 6.3,
    burstSprint: 6.8,
    dribbleSprintMultiplier: 0.92,
    acceleration: 9.4,
    braking: 13.4,
    turnRate: 6.7,
  },
} as const);

export const ANIMATION_LOD = Object.freeze({
  nearDistance: 48,
  mediumDistance: 82,
  farDistance: 118,
  mediumInterval: 1 / 30,
  farInterval: 1 / 15,
} as const);

export type MovementProfile = keyof typeof PLAYER_MOVEMENT;

export function movementProfileFor(role: "field" | "keeper", controlled: boolean, jockeying: boolean): MovementProfile {
  if (role === "keeper") return "goalkeeper";
  if (jockeying) return "jockey";
  return controlled ? "controlled" : "ai";
}

export function timeToMovementSpeed(targetSpeed: number, acceleration: number) {
  return Math.max(0, targetSpeed) / Math.max(0.001, acceleration);
}

export function distanceAfterAcceleration(
  seconds: number,
  targetSpeed: number,
  acceleration: number,
) {
  const duration = Math.max(0, seconds);
  const safeTarget = Math.max(0, targetSpeed);
  const safeAcceleration = Math.max(0.001, acceleration);
  const accelerationTime = Math.min(duration, safeTarget / safeAcceleration);
  const accelerationDistance = 0.5 * safeAcceleration * accelerationTime * accelerationTime;
  return accelerationDistance + Math.max(0, duration - accelerationTime) * safeTarget;
}
