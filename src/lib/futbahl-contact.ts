import * as THREE from "three";

export type SweptSphereContact = {
  distance: number;
  t: number;
  firstPoint: THREE.Vector3;
  secondPoint: THREE.Vector3;
};

/** Closest approach of two points moving linearly over the same frame. */
export function sweptMovingSphereContact(
  firstFrom: THREE.Vector3,
  firstTo: THREE.Vector3,
  secondFrom: THREE.Vector3,
  secondTo: THREE.Vector3,
  combinedRadius: number,
): SweptSphereContact | null {
  const relativeStart = firstFrom.clone().sub(secondFrom);
  const relativeVelocity = firstTo.clone().sub(firstFrom)
    .sub(secondTo.clone().sub(secondFrom));
  const denominator = relativeVelocity.lengthSq();
  const t = denominator > 0.000001
    ? THREE.MathUtils.clamp(-relativeStart.dot(relativeVelocity) / denominator, 0, 1)
    : 1;
  const firstPoint = firstFrom.clone().lerp(firstTo, t);
  const secondPoint = secondFrom.clone().lerp(secondTo, t);
  const distance = firstPoint.distanceTo(secondPoint);
  return distance <= combinedRadius ? { distance, t, firstPoint, secondPoint } : null;
}
