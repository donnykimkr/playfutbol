import * as THREE from "three";

const sharedGeometryCache = new Map<string, THREE.BufferGeometry>();
const sharedMaterialCache = new Map<string, THREE.Material>();

export function sharedGeometry(key: string, create: () => THREE.BufferGeometry) {
  const existing = sharedGeometryCache.get(key);
  if (existing) return existing;
  const geometry = create();
  geometry.userData.shared = true;
  sharedGeometryCache.set(key, geometry);
  return geometry;
}

export function sharedLambertMaterial(color: string) {
  const key = `lambert:${color}`;
  const existing = sharedMaterialCache.get(key);
  if (existing instanceof THREE.MeshLambertMaterial) return existing;
  const material = new THREE.MeshLambertMaterial({ color, side: THREE.FrontSide });
  material.userData.shared = true;
  sharedMaterialCache.set(key, material);
  return material;
}

export function sharedBasicMaterial(color: string) {
  const key = `basic:${color}`;
  const existing = sharedMaterialCache.get(key);
  if (existing instanceof THREE.MeshBasicMaterial) return existing;
  const material = new THREE.MeshBasicMaterial({ color, side: THREE.FrontSide });
  material.userData.shared = true;
  sharedMaterialCache.set(key, material);
  return material;
}

export function disposeObjectTree(object: THREE.Object3D) {
  object.traverse((child) => {
    const maybeMesh = child as THREE.Mesh | THREE.Sprite;
    const maybeGeometry = (maybeMesh as THREE.Mesh).geometry;
    if (maybeGeometry && !maybeGeometry.userData.shared) maybeGeometry.dispose();
    const material = maybeMesh.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(material)) {
      material.forEach((item) => {
        if (!item.userData.shared) item.dispose();
      });
    } else if (material && !material.userData.shared) {
      material.dispose();
    }
  });
}

export function disposeSharedResources() {
  sharedGeometryCache.forEach((geometry) => geometry.dispose());
  sharedGeometryCache.clear();
  sharedMaterialCache.forEach((material) => material.dispose());
  sharedMaterialCache.clear();
}
