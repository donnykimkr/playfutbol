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

export type BallisticLandingSolution = {
  velocity: THREE.Vector3;
  predictedLandingPoint: THREE.Vector3;
  error: number;
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

/**
 * Solves a collision-free launch velocity against the same integrator used by
 * live play. Iterative landing correction accounts for drag, rather than
 * relying on a vacuum-only parabola that visibly misses the selected marker.
 */
export function solveBallisticLandingVelocity(
  origin: THREE.Vector3,
  target: THREE.Vector3,
  constants: BallPhysicsConstants,
  options: {
    minimumFlightTime?: number;
    maximumFlightTime?: number;
    preferredHorizontalSpeed?: number;
    iterations?: number;
  } = {},
): BallisticLandingSolution {
  const horizontalTarget = target.clone().sub(origin).setY(0);
  const distance = horizontalTarget.length();
  const direction = distance > 0.001
    ? horizontalTarget.clone().multiplyScalar(1 / distance)
    : new THREE.Vector3(0, 0, 1);
  const minimumFlightTime = options.minimumFlightTime ?? 0.85;
  const maximumFlightTime = options.maximumFlightTime ?? 5.5;
  const preferredHorizontalSpeed = Math.max(1, options.preferredHorizontalSpeed ?? 27);
  const reachRatio = constants.maxHorizontalSpeed
    ? distance / constants.maxHorizontalSpeed
    : 0;
  const effectiveHorizontalSpeed = constants.maxHorizontalSpeed && reachRatio > 1.05
    ? Math.min(preferredHorizontalSpeed, constants.maxHorizontalSpeed * 0.31)
    : preferredHorizontalSpeed;
  const flightTime = THREE.MathUtils.clamp(
    distance / effectiveHorizontalSpeed + 0.42,
    minimumFlightTime,
    maximumFlightTime,
  );
  const velocity = direction.multiplyScalar(distance / flightTime);
  velocity.y = Math.max(
    2.8,
    (target.y - origin.y + 0.5 * constants.gravity * flightTime * flightTime) / flightTime,
  );

  let predictedLandingPoint = origin.clone();
  let error = Number.POSITIVE_INFINITY;
  const correctionTime = Math.max(0.55, flightTime);
  const correctionGain = reachRatio > 1.05 ? 2.2 : 1.5;
  for (let iteration = 0; iteration < (options.iterations ?? 24); iteration += 1) {
    const prediction = simulateBallTrajectory(
      {
        position: origin.clone(),
        velocity: velocity.clone(),
        angularVelocity: new THREE.Vector3(),
        curve: new THREE.Vector3(),
        grounded: false,
      },
      1 / 120,
      constants,
      { maxSteps: 720, stopAtFirstLanding: true, sampleEvery: 12 },
    );
    predictedLandingPoint = (prediction.landingPoint ?? prediction.endpoint).clone();
    const correction = target.clone().sub(predictedLandingPoint).setY(0);
    error = correction.length();
    if (error <= 0.08) break;
    velocity.addScaledVector(correction, correctionGain / correctionTime);
    if (constants.maxHorizontalSpeed) {
      const horizontalSpeed = Math.hypot(velocity.x, velocity.z);
      if (horizontalSpeed > constants.maxHorizontalSpeed) {
        const scale = constants.maxHorizontalSpeed / horizontalSpeed;
        velocity.x *= scale;
        velocity.z *= scale;
      }
    }
  }

  return { velocity, predictedLandingPoint, error };
}
