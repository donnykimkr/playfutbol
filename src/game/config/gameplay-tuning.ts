export const GAMEPLAY_TUNING = Object.freeze({
  ballMassKg: 0.43,
  gravity: 9.81,
  ballMaxSpeed: 42,
  ballRollingFriction: 0.7,
  ballSlidingFriction: 2.7,
  ballAirDrag: 0.018,
  ballSpinDamping: 0.36,
  ballMagnus: 0.0018,
  ballBounce: 0.46,
  physicsStep: 1 / 120,
  maximumPhysicsSubsteps: 5,
  actionCooldown: 0.22,
} as const);

export type AssistanceLevel = "assisted" | "semi-assisted" | "manual";

export const AIM_ASSISTANCE = Object.freeze({
  assisted: { passDegrees: 14, loftDegrees: 24, shotDegrees: 12, strength: 1 },
  "semi-assisted": { passDegrees: 8, loftDegrees: 13, shotDegrees: 7, strength: 0.55 },
  manual: { passDegrees: 0, loftDegrees: 0, shotDegrees: 0, strength: 0 },
} satisfies Record<AssistanceLevel, {
  passDegrees: number;
  loftDegrees: number;
  shotDegrees: number;
  strength: number;
}>);

