export function integrateSpeed(
  currentSpeed: number,
  targetSpeed: number,
  acceleration: number,
  braking: number,
  dt: number,
) {
  const rate = targetSpeed > currentSpeed ? acceleration : braking;
  const change = Math.max(-rate * dt, Math.min(rate * dt, targetSpeed - currentSpeed));
  return Math.max(0, currentSpeed + change);
}

export function integrateDistanceAtFrameRate(input: {
  duration: number;
  fps: number;
  targetSpeed: number;
  acceleration: number;
  braking: number;
}) {
  const dt = 1 / input.fps;
  let speed = 0;
  let distance = 0;
  for (let time = 0; time < input.duration - dt / 2; time += dt) {
    speed = integrateSpeed(speed, input.targetSpeed, input.acceleration, input.braking, dt);
    distance += speed * dt;
  }
  return { speed, distance };
}

