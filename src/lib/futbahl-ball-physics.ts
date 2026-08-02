import * as THREE from "three";

export type BallPhysicsConstants = {
  radius: number;
  gravity: number;
  airDrag: number;
  magnus: number;
  bounce: number;
  rollingFriction: number;
  slidingFriction: number;
  spinDamping: number;
  maxHorizontalSpeed?: number;
  enterGroundedThreshold: number;
  leaveGroundedThreshold: number;
};

export type BallPhysicsState = {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  angularVelocity: THREE.Vector3;
  curve: THREE.Vector3;
  grounded: boolean;
};

export type BallPhysicsStepResult = {
  landed: boolean;
  bounced: boolean;
  grounded: boolean;
  frictionState: "airborne" | "sliding" | "rolling";
};

const magnusForce = new THREE.Vector3();
const rollingAngularTarget = new THREE.Vector3();

/**
 * Integrates one collision-free ball step. World collisions and restart rules
 * remain owned by the match engine; previews and live play share this motion.
 */
export function stepBallPhysics(
  state: BallPhysicsState,
  dt: number,
  constants: BallPhysicsConstants,
): BallPhysicsStepResult {
  let landed = false;
  let bounced = false;
  let frictionState: BallPhysicsStepResult["frictionState"] = "airborne";

  if (state.grounded) {
    if (
      state.position.y > constants.leaveGroundedThreshold
      || state.velocity.y > 1.15
    ) state.grounded = false;
  } else if (
    state.position.y <= constants.enterGroundedThreshold
    && Math.abs(state.velocity.y) <= 1
  ) {
    state.grounded = true;
  }

  if (!state.grounded) {
    state.velocity.y -= constants.gravity * dt;
    const airSpeed = state.velocity.length();
    state.velocity.multiplyScalar(Math.exp(-constants.airDrag * airSpeed * dt));
    magnusForce.crossVectors(state.angularVelocity, state.velocity)
      .multiplyScalar(constants.magnus * dt);
    state.velocity.add(magnusForce);
  }

  if (state.curve.lengthSq() > 0.0001) {
    state.velocity.addScaledVector(state.curve, dt * (state.grounded ? 0.38 : 1));
    state.curve.multiplyScalar(Math.pow(state.grounded ? 0.18 : 0.36, dt));
  }

  if (constants.maxHorizontalSpeed) {
    const horizontalSpeed = Math.hypot(state.velocity.x, state.velocity.z);
    if (horizontalSpeed > constants.maxHorizontalSpeed) {
      const scale = constants.maxHorizontalSpeed / horizontalSpeed;
      state.velocity.x *= scale;
      state.velocity.z *= scale;
    }
  }

  state.position.addScaledVector(state.velocity, dt);
  if (state.position.y < constants.radius) {
    state.position.y = constants.radius;
    landed = !state.grounded;
    if (state.velocity.y < -1.2) {
      state.velocity.y = -state.velocity.y * constants.bounce;
      state.angularVelocity.x *= 0.9;
      state.angularVelocity.z *= 0.9;
      state.grounded = false;
      bounced = true;
    } else {
      state.velocity.y = 0;
      state.grounded = true;
    }
  }

  if (state.grounded) {
    rollingAngularTarget.set(
      state.velocity.z / constants.radius,
      state.angularVelocity.y,
      -state.velocity.x / constants.radius,
    );
    const slip = rollingAngularTarget.distanceTo(state.angularVelocity) * constants.radius;
    const sliding = slip > 0.65;
    const damping = Math.exp(
      -(sliding ? constants.slidingFriction : constants.rollingFriction) * dt,
    );
    state.velocity.x *= damping;
    state.velocity.z *= damping;
    state.angularVelocity.lerp(
      rollingAngularTarget,
      1 - Math.exp(-(sliding ? 5.5 : 12) * dt),
    );
    frictionState = sliding ? "sliding" : "rolling";
  }

  state.angularVelocity.multiplyScalar(Math.exp(-constants.spinDamping * dt));
  return { landed, bounced, grounded: state.grounded, frictionState };
}

export type BallTrajectoryStop = {
  goalPlaneZ?: number;
  targetDistance?: number;
  targetDirection?: THREE.Vector3;
  stopAtFirstLanding?: boolean;
  stopSpeed?: number;
  maxSteps: number;
  sampleEvery?: number;
};

export type BallTrajectoryResult = {
  endpoint: THREE.Vector3;
  landingPoint: THREE.Vector3 | null;
  samples: THREE.Vector3[];
};

export function simulateBallTrajectory(
  initial: BallPhysicsState,
  stepSeconds: number,
  constants: BallPhysicsConstants,
  stop: BallTrajectoryStop,
): BallTrajectoryResult {
  const state: BallPhysicsState = {
    position: initial.position.clone(),
    velocity: initial.velocity.clone(),
    angularVelocity: initial.angularVelocity.clone(),
    curve: initial.curve.clone(),
    grounded: initial.grounded,
  };
  const start = state.position.clone();
  const samples = [state.position.clone()];
  let landingPoint: THREE.Vector3 | null = null;
  const sampleEvery = Math.max(1, stop.sampleEvery ?? 1);

  for (let index = 1; index < stop.maxSteps; index += 1) {
    const previous = state.position.clone();
    const result = stepBallPhysics(state, stepSeconds, constants);
    if (result.landed && !landingPoint) landingPoint = state.position.clone();
    if (index % sampleEvery === 0) samples.push(state.position.clone());

    if (
      stop.goalPlaneZ !== undefined
      && (previous.z - stop.goalPlaneZ) * (state.position.z - stop.goalPlaneZ) <= 0
      && Math.abs(state.position.z - previous.z) > 0.001
    ) {
      const crossing = THREE.MathUtils.clamp(
        (stop.goalPlaneZ - previous.z) / (state.position.z - previous.z),
        0,
        1,
      );
      state.position.lerpVectors(previous, state.position, crossing);
      samples.push(state.position.clone());
      break;
    }
    if (stop.stopAtFirstLanding && landingPoint) {
      state.position.copy(landingPoint);
      samples.push(state.position.clone());
      break;
    }
    if (
      stop.targetDistance !== undefined
      && stop.targetDirection
      && state.position.clone().sub(start).setY(0).dot(stop.targetDirection) >= stop.targetDistance
    ) {
      samples.push(state.position.clone());
      break;
    }
    if (state.velocity.length() < (stop.stopSpeed ?? 0.035)) {
      samples.push(state.position.clone());
      break;
    }
  }

  return { endpoint: state.position, landingPoint, samples };
}
