export type Point2 = { x: number; z: number };

export function distanceToSegment2D(point: Point2, start: Point2, end: Point2) {
  const segmentX = end.x - start.x;
  const segmentZ = end.z - start.z;
  const lengthSquared = segmentX * segmentX + segmentZ * segmentZ;
  if (lengthSquared <= Number.EPSILON) return Math.hypot(point.x - start.x, point.z - start.z);
  const amount = Math.max(0, Math.min(1, (
    (point.x - start.x) * segmentX + (point.z - start.z) * segmentZ
  ) / lengthSquared));
  return Math.hypot(
    point.x - (start.x + segmentX * amount),
    point.z - (start.z + segmentZ * amount),
  );
}

export function sweptContact2D(
  previousBall: Point2,
  currentBall: Point2,
  contactPoint: Point2,
  reach: number,
) {
  return distanceToSegment2D(contactPoint, previousBall, currentBall) <= reach;
}

export function tackleContactIsLegal(input: {
  tackler: Point2;
  ball: Point2;
  tacklerFacing: Point2;
  carrierFacing: Point2;
  reach: number;
}) {
  const toBallX = input.ball.x - input.tackler.x;
  const toBallZ = input.ball.z - input.tackler.z;
  const distance = Math.hypot(toBallX, toBallZ);
  if (distance > input.reach || distance <= Number.EPSILON) return false;
  const normalizedX = toBallX / distance;
  const normalizedZ = toBallZ / distance;
  const facingBall = input.tacklerFacing.x * normalizedX + input.tacklerFacing.z * normalizedZ;
  const carrierToTacklerX = -normalizedX;
  const carrierToTacklerZ = -normalizedZ;
  const fromBehind = input.carrierFacing.x * carrierToTacklerX
    + input.carrierFacing.z * carrierToTacklerZ < -0.35;
  return !fromBehind && facingBall >= 0.45;
}

