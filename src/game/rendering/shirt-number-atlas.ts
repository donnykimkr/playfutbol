import * as THREE from "three";

let numberAtlas: THREE.CanvasTexture | null = null;
let numberMaterial: THREE.MeshBasicMaterial | null = null;
const geometryCache = new Map<string, THREE.BufferGeometry>();

function atlasTexture() {
  if (numberAtlas) return numberAtlas;
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#ffffff";
  context.strokeStyle = "rgba(0,0,0,0.72)";
  context.lineWidth = 12;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = "900 72px Arial, sans-serif";
  for (let number = 1; number <= 99; number += 1) {
    const column = (number - 1) % 10;
    const row = Math.floor((number - 1) / 10);
    const x = column * 102.4 + 51.2;
    const y = row * 102.4 + 51.2;
    context.strokeText(String(number), x, y);
    context.fillText(String(number), x, y);
  }
  numberAtlas = new THREE.CanvasTexture(canvas);
  numberAtlas.colorSpace = THREE.SRGBColorSpace;
  numberAtlas.generateMipmaps = false;
  numberAtlas.minFilter = THREE.LinearFilter;
  numberAtlas.magFilter = THREE.LinearFilter;
  numberAtlas.name = "futbahl-shirt-number-atlas";
  return numberAtlas;
}

function atlasMaterial() {
  if (numberMaterial) return numberMaterial;
  const map = atlasTexture();
  if (!map) return null;
  numberMaterial = new THREE.MeshBasicMaterial({
    map,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  });
  numberMaterial.userData.shared = true;
  return numberMaterial;
}

function atlasGeometry(number: number, width: number, height: number) {
  const normalized = Math.max(1, Math.min(99, Math.trunc(number)));
  const key = `${normalized}:${width}:${height}`;
  const cached = geometryCache.get(key);
  if (cached) return cached;
  const geometry = new THREE.PlaneGeometry(width, height);
  const column = (normalized - 1) % 10;
  const row = Math.floor((normalized - 1) / 10);
  const u0 = column / 10;
  const u1 = (column + 1) / 10;
  const v1 = 1 - row / 10;
  const v0 = 1 - (row + 1) / 10;
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute([
    u0, v1, u1, v1, u0, v0, u1, v0,
  ], 2));
  geometry.userData.shared = true;
  geometryCache.set(key, geometry);
  return geometry;
}

export function createShirtNumberMesh(
  number: number,
  width: number,
  height: number,
) {
  const material = atlasMaterial();
  if (!material) return null;
  return new THREE.Mesh(atlasGeometry(number, width, height), material);
}

export function disposeShirtNumberAtlas() {
  numberMaterial?.dispose();
  numberAtlas?.dispose();
  geometryCache.forEach((geometry) => geometry.dispose());
  geometryCache.clear();
  numberMaterial = null;
  numberAtlas = null;
}
