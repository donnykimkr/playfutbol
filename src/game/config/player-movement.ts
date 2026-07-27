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
    walk: 1.8,
    jog: 4.2,
    run: 6.6,
    sprint: 8.7,
    acceleration: 8.8,
    braking: 11.5,
    turnRate: 5.4,
  },
  ai: {
    walk: 1.7,
    jog: 4,
    run: 6.4,
    sprint: 8.5,
    acceleration: 8.2,
    braking: 10.8,
    turnRate: 5.1,
  },
  goalkeeper: {
    walk: 1.5,
    jog: 3.5,
    run: 5.8,
    sprint: 7.2,
    acceleration: 7.4,
    braking: 10.5,
    turnRate: 5.8,
  },
  jockey: {
    walk: 1.5,
    jog: 3.3,
    run: 4.9,
    sprint: 5.8,
    acceleration: 7,
    braking: 12,
    turnRate: 6.2,
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

