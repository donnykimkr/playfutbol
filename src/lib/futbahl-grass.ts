import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

const GRASS_ASSET_PATH = "/models/quaternius-grass/Grass2.obj";

let sourceGeometryPromise: Promise<THREE.BufferGeometry> | null = null;

function loadSourceGeometry() {
  sourceGeometryPromise ??= new OBJLoader().loadAsync(GRASS_ASSET_PATH).then((root) => {
    const sourceMesh = root.getObjectByProperty("isMesh", true) as THREE.Mesh<THREE.BufferGeometry> | undefined;
    if (!sourceMesh) throw new Error("Quaternius Grass2 geometry is missing");
    const source = sourceMesh.geometry.clone();

    source.computeBoundingBox();
    const bounds = source.boundingBox;
    if (bounds) {
      source.translate(
        -(bounds.min.x + bounds.max.x) / 2,
        -bounds.min.y,
        -(bounds.min.z + bounds.max.z) / 2,
      );
    }
    source.computeVertexNormals();
    return source;
  });
  return sourceGeometryPromise;
}

function seededUnit(seed: number) {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
}

export async function attachLicensedPitchGrass(
  scene: THREE.Scene,
  fieldWidth: number,
  fieldLength: number,
  surfaceY: number,
) {
  const source = await loadSourceGeometry();
  const geometry = source.clone();
  // Grass2 is deliberately compressed into maintained, short football turf.
  geometry.scale(7.2, 0.55, 7.2);
  const material = new THREE.MeshStandardMaterial({
    color: "#2f8f49",
    roughness: 0.92,
    metalness: 0,
    side: THREE.DoubleSide,
  });

  const placements: Array<{ x: number; z: number; rotation: number; scale: number }> = [];
  let seed = 1;
  const addPatch = (x: number, z: number) => {
    placements.push({
      x: x + (seededUnit(seed++) - 0.5) * 0.65,
      z: z + (seededUnit(seed++) - 0.5) * 0.65,
      rotation: seededUnit(seed++) * Math.PI * 2,
      scale: 0.72 + seededUnit(seed++) * 0.34,
    });
  };

  // Dense enough to catch the near-camera light, sparse enough to remain one cheap draw call.
  for (let z = -fieldLength / 2 + 2; z <= fieldLength / 2 - 2; z += 4.5) {
    addPatch(-fieldWidth / 2 + 0.7, z);
    if (Math.abs(z) > fieldLength * 0.31) addPatch(fieldWidth / 2 - 0.7, z);
  }
  for (let x = -fieldWidth / 2 + 2; x <= fieldWidth / 2 - 2; x += 4.8) {
    addPatch(x, -fieldLength / 2 + 0.75);
    addPatch(x, fieldLength / 2 - 0.75);
  }
  for (const side of [-1, 1]) {
    for (let x = -12; x <= 12; x += 3.6) addPatch(x, side * (fieldLength / 2 - 3.6));
  }

  const grass = new THREE.InstancedMesh(geometry, material, placements.length);
  grass.name = "quaternius-short-grass-details";
  grass.castShadow = false;
  grass.receiveShadow = false;
  grass.frustumCulled = true;
  grass.userData.assetSource = "https://quaternius.com/packs/simplenature.html";
  grass.userData.license = "CC0-1.0";
  const transform = new THREE.Object3D();
  placements.forEach((placement, index) => {
    transform.position.set(placement.x, surfaceY + 0.006, placement.z);
    transform.rotation.set(0, placement.rotation, 0);
    transform.scale.setScalar(placement.scale);
    transform.updateMatrix();
    grass.setMatrixAt(index, transform.matrix);
  });
  grass.instanceMatrix.needsUpdate = true;
  grass.computeBoundingBox();
  grass.computeBoundingSphere();

  if (scene.userData.disposed) {
    geometry.dispose();
    material.dispose();
    return null;
  }
  scene.add(grass);
  return grass;
}
