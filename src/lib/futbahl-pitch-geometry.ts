import * as THREE from "three";
import {
  BALL_RADIUS,
  FIELD_L,
  FIELD_W,
  PENALTY_AREA_DEPTH,
  PENALTY_AREA_HALF_WIDTH,
  PLAYER_RADIUS,
} from "@/lib/futbahl-match-config";
import type { PlayerBody, TeamId } from "@/lib/futbahl-match-types";

export function headingForHome(z: number) {
  return z >= 0 ? Math.PI : 0;
}

export function forwardFromHeading(heading: number) {
  return new THREE.Vector3(Math.sin(heading), 0, Math.cos(heading));
}

export function headingFromDirection(direction: THREE.Vector3) {
  return Math.atan2(direction.x, direction.z);
}

export function teamGoalZ(team: TeamId, half: 1 | 2) {
  const firstHalfGoal = team === "home" ? FIELD_L / 2 : -FIELD_L / 2;
  return half === 1 ? firstHalfGoal : -firstHalfGoal;
}

export function attackingGoalZ(team: TeamId, half: 1 | 2) {
  return -teamGoalZ(team, half);
}

export function upfieldKickDirection(team: TeamId, half: 1 | 2) {
  const z = Math.sign(attackingGoalZ(team, half)) || 1;
  return new THREE.Vector3(0, 0, z);
}

export function pointInsideOwnPenaltyArea(
  team: TeamId,
  half: 1 | 2,
  point: THREE.Vector3,
  margin = 0,
) {
  const goalZ = teamGoalZ(team, half);
  const intoField = -Math.sign(goalZ) || 1;
  const depth = (point.z - goalZ) * intoField;
  return Math.abs(point.x) <= PENALTY_AREA_HALF_WIDTH + margin
    && depth >= -BALL_RADIUS - margin
    && depth <= PENALTY_AREA_DEPTH + margin;
}

export function cornerKickDirection(team: TeamId, half: 1 | 2, spot: THREE.Vector3) {
  const goalZ = attackingGoalZ(team, half);
  return new THREE.Vector3(0, BALL_RADIUS, goalZ - Math.sign(goalZ) * 15)
    .sub(spot)
    .setY(0)
    .normalize();
}

export function goalKickKeeperSpot(team: TeamId, half: 1 | 2) {
  const goalZ = teamGoalZ(team, half);
  return new THREE.Vector3(0, 0, goalZ - Math.sign(goalZ) * 5.2);
}

export function goalKickRunupSpot(team: TeamId, half: 1 | 2) {
  const direction = upfieldKickDirection(team, half);
  return goalKickKeeperSpot(team, half).sub(direction.multiplyScalar(4.4));
}

export function goalKickBallSpotForTeam(team: TeamId, half: 1 | 2) {
  return goalKickKeeperSpot(team, half)
    .add(upfieldKickDirection(team, half).multiplyScalar(1.65))
    .setY(BALL_RADIUS);
}

export function goalKickBallSpot(keeper: PlayerBody, direction: THREE.Vector3) {
  return keeper.pos.clone().add(direction.clone().multiplyScalar(1.65)).setY(BALL_RADIUS);
}

export function throwInTakerSpot(spot: THREE.Vector3) {
  const side = Math.sign(spot.x || 1);
  return new THREE.Vector3(
    side * (FIELD_W / 2 + PLAYER_RADIUS + 0.32),
    0,
    Math.max(-FIELD_L / 2 + 2.4, Math.min(FIELD_L / 2 - 2.4, spot.z)),
  );
}

export function teamSide(team: TeamId, half: 1 | 2) {
  return teamGoalZ(team, half) > 0 ? 1 : -1;
}

export function opponent(team: TeamId): TeamId {
  return team === "home" ? "away" : "home";
}
