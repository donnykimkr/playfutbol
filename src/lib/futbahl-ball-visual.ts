import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";

export const FUTBAHL_BALL_ASSET = {
  path: "/models/futbahl-soccer-ball.glb",
  licensePath: "/models/futbahl-soccer-ball.LICENSE.txt",
  source: "dLeom 3D Soccer Ball",
  license: "CC0 1.0",
} as const;

let sharedBallPromise: Promise<THREE.Group> | null = null;
let warned = false;

function loadBall() {
  sharedBallPromise ??= new GLTFLoader().loadAsync(FUTBAHL_BALL_ASSET.path).then((gltf) => gltf.scene);
  return sharedBallPromise;
}

export async function attachLicensedBallVisual(
  host: THREE.Group,
  radius: number,
) {
  try {
    const source = await loadBall();
    const visual = cloneSkeleton(source) as THREE.Group;
    visual.name = "futbahl-licensed-soccer-ball";
    const bounds = new THREE.Box3().setFromObject(visual);
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    const diameter = Math.max(size.x, size.y, size.z);
    if (!(diameter > 0)) throw new Error("Ball model has invalid bounds.");
    visual.position.copy(center).multiplyScalar(-1);
    visual.scale.setScalar((radius * 2) / diameter);
    visual.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = true;
      object.receiveShadow = false;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((material) => {
        if (material instanceof THREE.MeshStandardMaterial) {
          material.roughness = 0.58;
          material.metalness = 0;
        }
      });
    });
    host.children.forEach((child) => {
      if (child !== visual) child.visible = false;
    });
    host.add(visual);
    host.userData.licensedBallLoaded = true;
    return visual;
  } catch (error) {
    if (!warned) {
      warned = true;
      console.warn("[Futbahl ball] Licensed CC0 visual failed to load; keeping the procedural sphere.", error);
    }
    host.userData.licensedBallLoaded = false;
    return null;
  }
}
