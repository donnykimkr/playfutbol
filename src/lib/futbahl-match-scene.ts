import * as THREE from "three";
import {
  ADVERTISING_BRANDS,
  AD_BOARD_BASE_Y,
  AD_BOARD_BRAND_DURATION,
  AD_BOARD_COLLISION_TOP,
  AD_BOARD_CORNER_RADIUS,
  AD_BOARD_CORNER_SEGMENTS,
  AD_BOARD_DISPLAY_HEIGHT,
  AD_BOARD_DISPLAY_RENDER_ORDER,
  AD_BOARD_DISPLAY_Y,
  AD_BOARD_FACE_OFFSET,
  AD_BOARD_HEIGHT,
  AD_BOARD_INNER_X,
  AD_BOARD_INNER_Z,
  AD_BOARD_SCROLL_SPEED,
  AD_BOARD_TEXTURE_HEIGHT,
  AD_BOARD_TEXTURE_REPEATS,
  AD_BOARD_TEXTURE_WIDTH,
  AD_BOARD_THICKNESS,
  AD_BOARD_TRANSITION_DURATION,
  BALL_RADIUS,
  BLOB_SHADOW_Y,
  FIELD_L,
  FIELD_MARKINGS_Y,
  FIELD_W,
  GOAL_DEPTH,
  GOAL_FRAME_OUTER_W,
  GOAL_FRONT_Z,
  GOAL_H,
  GOAL_LINE_RUNOFF,
  GOAL_POST_CENTER_X,
  GOAL_POST_THICKNESS,
  GOAL_W,
  GRASS_DARK_COLOR,
  GRASS_LIGHT_COLOR,
  GRASS_STRIPE_WIDTH,
  LANDING_MARKER_Y,
  LOCOMOTION_REFERENCE_SPEEDS,
  LOCOMOTION_STRIDE_LENGTHS,
  OUTER_GRASS_COLOR,
  PITCH_SURFACE_Y,
  STADIUM_BASE_TOP_Y,
  TOUCHLINE_RUNOFF,
} from "@/lib/futbahl-match-config";
import type { MatchRuntime } from "@/lib/futbahl-match-types";
import { sharedGeometry } from "@/lib/futbahl-three-resources";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function createSoccerBall() {
  const ball = new THREE.Group();
  const white = new THREE.Mesh(
    new THREE.SphereGeometry(BALL_RADIUS, 12, 8),
    new THREE.MeshLambertMaterial({ color: "#f8fafc" }),
  );
  ball.add(white);

  const patchMaterial = new THREE.MeshBasicMaterial({ color: "#111827", side: THREE.DoubleSide });
  const points = [
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, -1, 0),
    new THREE.Vector3(1, 0.15, 0),
    new THREE.Vector3(-1, 0.15, 0),
    new THREE.Vector3(0, 0.15, 1),
    new THREE.Vector3(0, 0.15, -1),
    new THREE.Vector3(0.72, -0.45, 0.72),
    new THREE.Vector3(-0.72, -0.45, 0.72),
    new THREE.Vector3(0.72, -0.45, -0.72),
    new THREE.Vector3(-0.72, -0.45, -0.72),
  ];
  points.forEach((point) => {
    const normal = point.normalize();
    const patch = new THREE.Mesh(new THREE.CircleGeometry(BALL_RADIUS * 0.24, 5), patchMaterial);
    patch.position.copy(normal.multiplyScalar(BALL_RADIUS + 0.006));
    patch.lookAt(normal.clone().multiplyScalar(2));
    ball.add(patch);
  });
  ball.traverse((child) => {
    if (child instanceof THREE.Mesh) child.castShadow = true;
  });
  return ball;
}

export function createBlobShadow(radius: number, opacity: number) {
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 18),
    new THREE.MeshBasicMaterial({
      color: "#03130a",
      transparent: true,
      opacity,
      depthWrite: false,
      depthTest: true,
    }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = BLOB_SHADOW_Y;
  return shadow;
}

function createYellowLandingPlus(name: string) {
  const marker = new THREE.Group();
  marker.name = name;
  const material = new THREE.MeshBasicMaterial({
    color: "#facc15",
    transparent: true,
    opacity: 0.98,
    side: THREE.DoubleSide,
    depthTest: false,
    depthWrite: false,
  });
  const horizontal = new THREE.Mesh(
    sharedGeometry("landing-plus-horizontal", () => new THREE.PlaneGeometry(1.65, 0.16)),
    material,
  );
  horizontal.rotation.x = -Math.PI / 2;
  horizontal.renderOrder = 27;
  const vertical = horizontal.clone();
  vertical.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
  marker.add(horizontal, vertical);
  marker.position.y = LANDING_MARKER_Y;
  marker.renderOrder = 27;
  marker.visible = false;
  return marker;
}

export function createPassTargetMarker() {
  return createYellowLandingPlus("pass-target-marker");
}

export function createKickTrajectoryPreview() {
  const pointCapacity = 52;
  const guideGeometry = new THREE.BufferGeometry();
  guideGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pointCapacity * 3), 3));
  guideGeometry.setDrawRange(0, 0);
  const guide = new THREE.Line(
    guideGeometry,
    new THREE.LineBasicMaterial({
      color: "#ffffff",
      transparent: true,
      opacity: 0.58,
      depthTest: false,
      depthWrite: false,
    }),
  );
  guide.name = "kick-trajectory-full-guide";
  guide.renderOrder = 23;
  guide.visible = false;

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pointCapacity * 2 * 3), 3));
  const indices: number[] = [];
  for (let index = 0; index < pointCapacity - 1; index += 1) {
    const offset = index * 2;
    indices.push(offset, offset + 2, offset + 1, offset + 1, offset + 2, offset + 3);
  }
  geometry.setIndex(indices);
  geometry.setDrawRange(0, 0);
  const material = new THREE.MeshBasicMaterial({
    color: "#f8fafc",
    transparent: true,
    opacity: 0.9,
    side: THREE.DoubleSide,
    depthTest: false,
    depthWrite: false,
  });
  const line = new THREE.Mesh(geometry, material);
  line.name = "kick-trajectory-preview";
  line.renderOrder = 24;
  line.visible = false;

  const endpoint = new THREE.Mesh(
    new THREE.RingGeometry(0.42, 0.62, 18),
    new THREE.MeshBasicMaterial({
      color: "#ffffff",
      transparent: true,
      opacity: 0.92,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false,
    }),
  );
  endpoint.name = "kick-trajectory-endpoint";
  endpoint.rotation.x = -Math.PI / 2;
  endpoint.renderOrder = 25;
  endpoint.visible = false;

  const landingZone = createYellowLandingPlus("kick-landing-plus");
  return { guide, line, endpoint, landingZone };
}

function addFieldMarking(
  fieldMarkings: THREE.Group,
  material: THREE.MeshBasicMaterial,
  x: number,
  z: number,
  w: number,
  h: number,
) {
  const top = new THREE.Mesh(new THREE.BoxGeometry(w, 0.025, 0.15), material);
  const bottom = top.clone();
  const left = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.025, h), material);
  const right = left.clone();
  top.position.set(x, 0, z - h / 2);
  bottom.position.set(x, 0, z + h / 2);
  left.position.set(x - w / 2, 0, z);
  right.position.set(x + w / 2, 0, z);
  fieldMarkings.add(top, bottom, left, right);
}

function addPitchBoundaryMarking(fieldMarkings: THREE.Group, material: THREE.MeshBasicMaterial) {
  const touchline = new THREE.BoxGeometry(0.15, 0.025, FIELD_L);
  [-1, 1].forEach((side) => {
    const line = new THREE.Mesh(touchline, material);
    line.position.set(side * FIELD_W / 2, 0, 0);
    fieldMarkings.add(line);
  });
  const endSegmentWidth = (FIELD_W - GOAL_FRAME_OUTER_W) / 2;
  const endSegmentX = (FIELD_W + GOAL_FRAME_OUTER_W) / 4;
  const endSegment = new THREE.BoxGeometry(endSegmentWidth, 0.025, 0.15);
  [-1, 1].forEach((goalSide) => {
    [-1, 1].forEach((xSide) => {
      const line = new THREE.Mesh(endSegment, material);
      line.position.set(xSide * endSegmentX, 0, goalSide * FIELD_L / 2);
      fieldMarkings.add(line);
    });
  });
}

export function addPitch(scene: THREE.Scene) {
  const grassWidth = FIELD_W;
  const grassLength = FIELD_L;
  const grassBaseHeight = 0.16;
  const grassBase = new THREE.Mesh(
    new THREE.BoxGeometry(FIELD_W + TOUCHLINE_RUNOFF * 2, grassBaseHeight, FIELD_L + GOAL_LINE_RUNOFF * 2),
    new THREE.MeshLambertMaterial({
      color: OUTER_GRASS_COLOR,
      side: THREE.FrontSide,
      transparent: false,
      opacity: 1,
      depthTest: true,
      depthWrite: true,
    }),
  );
  grassBase.name = "stadium-base-floor";
  grassBase.position.y = STADIUM_BASE_TOP_Y - grassBaseHeight / 2;
  grassBase.userData.floorSurfaceOffsetY = grassBaseHeight / 2;
  grassBase.userData.outerGrassColor = OUTER_GRASS_COLOR;
  scene.add(grassBase);

  const stripeCount = Math.ceil(grassLength / GRASS_STRIPE_WIDTH);
  const textureWidth = 384;
  const textureHeight = 576;
  const grassCanvas = document.createElement("canvas");
  const normalCanvas = document.createElement("canvas");
  const roughnessCanvas = document.createElement("canvas");
  grassCanvas.width = normalCanvas.width = roughnessCanvas.width = textureWidth;
  grassCanvas.height = normalCanvas.height = roughnessCanvas.height = textureHeight;
  const grassContext = grassCanvas.getContext("2d");
  const normalContext = normalCanvas.getContext("2d");
  const roughnessContext = roughnessCanvas.getContext("2d");
  const heightField = new Float32Array(textureWidth * textureHeight);
  const noise = (x: number, y: number) => {
    const value = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return value - Math.floor(value);
  };
  if (grassContext && normalContext && roughnessContext) {
    const colorImage = grassContext.createImageData(textureWidth, textureHeight);
    const normalImage = normalContext.createImageData(textureWidth, textureHeight);
    const roughnessImage = roughnessContext.createImageData(textureWidth, textureHeight);
    const dark = new THREE.Color(GRASS_DARK_COLOR);
    const light = new THREE.Color(GRASS_LIGHT_COLOR);
    for (let y = 0; y < textureHeight; y += 1) {
      const stripe = Math.floor(y / textureHeight * stripeCount);
      const stripeColor = stripe % 2 === 0 ? dark : light;
      for (let x = 0; x < textureWidth; x += 1) {
        const pixel = y * textureWidth + x;
        const index = pixel * 4;
        const fine = noise(x, y) - 0.5;
        const broad = Math.sin(x * 0.031 + y * 0.014) * 0.5 + Math.sin(x * 0.011 - y * 0.023) * 0.5;
        const centerWear = Math.exp(-Math.pow((x / textureWidth - 0.5) / 0.19, 2))
          * Math.exp(-Math.pow((y / textureHeight - 0.5) / 0.32, 2));
        const variation = fine * 0.055 + broad * 0.018 - centerWear * 0.026;
        colorImage.data[index] = Math.round(clamp((stripeColor.r + variation) * 255, 0, 255));
        colorImage.data[index + 1] = Math.round(clamp((stripeColor.g + variation * 1.12) * 255, 0, 255));
        colorImage.data[index + 2] = Math.round(clamp((stripeColor.b + variation * 0.72) * 255, 0, 255));
        colorImage.data[index + 3] = 255;
        heightField[pixel] = fine * 0.55 + broad * 0.18;
        const roughness = clamp(226 + fine * 18 + centerWear * 8, 196, 246);
        roughnessImage.data[index] = roughness;
        roughnessImage.data[index + 1] = roughness;
        roughnessImage.data[index + 2] = roughness;
        roughnessImage.data[index + 3] = 255;
      }
    }
    for (let y = 0; y < textureHeight; y += 1) {
      for (let x = 0; x < textureWidth; x += 1) {
        const index = (y * textureWidth + x) * 4;
        const left = heightField[y * textureWidth + Math.max(0, x - 1)];
        const right = heightField[y * textureWidth + Math.min(textureWidth - 1, x + 1)];
        const up = heightField[Math.max(0, y - 1) * textureWidth + x];
        const down = heightField[Math.min(textureHeight - 1, y + 1) * textureWidth + x];
        const nx = clamp((left - right) * 0.16, -1, 1);
        const ny = clamp((up - down) * 0.16, -1, 1);
        normalImage.data[index] = Math.round((nx * 0.5 + 0.5) * 255);
        normalImage.data[index + 1] = Math.round((ny * 0.5 + 0.5) * 255);
        normalImage.data[index + 2] = 255;
        normalImage.data[index + 3] = 255;
      }
    }
    grassContext.putImageData(colorImage, 0, 0);
    normalContext.putImageData(normalImage, 0, 0);
    roughnessContext.putImageData(roughnessImage, 0, 0);
  }
  const grassTexture = new THREE.CanvasTexture(grassCanvas);
  grassTexture.colorSpace = THREE.SRGBColorSpace;
  grassTexture.wrapS = THREE.ClampToEdgeWrapping;
  grassTexture.wrapT = THREE.ClampToEdgeWrapping;
  grassTexture.minFilter = THREE.LinearMipmapLinearFilter;
  grassTexture.magFilter = THREE.LinearFilter;
  const normalTexture = new THREE.CanvasTexture(normalCanvas);
  normalTexture.wrapS = THREE.ClampToEdgeWrapping;
  normalTexture.wrapT = THREE.ClampToEdgeWrapping;
  normalTexture.minFilter = THREE.LinearMipmapLinearFilter;
  normalTexture.magFilter = THREE.LinearFilter;
  const roughnessTexture = new THREE.CanvasTexture(roughnessCanvas);
  roughnessTexture.wrapS = THREE.ClampToEdgeWrapping;
  roughnessTexture.wrapT = THREE.ClampToEdgeWrapping;
  roughnessTexture.minFilter = THREE.LinearMipmapLinearFilter;
  roughnessTexture.magFilter = THREE.LinearFilter;
  const pitch = new THREE.Mesh(
    new THREE.PlaneGeometry(grassWidth, grassLength, 1, 1),
    new THREE.MeshStandardMaterial({
      map: grassTexture,
      color: "#ffffff",
      normalMap: normalTexture,
      normalScale: new THREE.Vector2(0.16, 0.16),
      roughnessMap: roughnessTexture,
      roughness: 0.94,
      metalness: 0,
      side: THREE.FrontSide,
      transparent: false,
      opacity: 1,
      depthTest: true,
      depthWrite: true,
    }),
  );
  pitch.name = "grass-surface";
  pitch.rotation.x = -Math.PI / 2;
  pitch.position.y = PITCH_SURFACE_Y;
  pitch.receiveShadow = true;
  pitch.userData.stripeCount = stripeCount;
  pitch.userData.stripeWidth = grassLength / stripeCount;
  pitch.userData.surfaceWidth = grassWidth;
  pitch.userData.surfaceLength = grassLength;
  pitch.userData.darkGrass = GRASS_DARK_COLOR;
  pitch.userData.lightGrass = GRASS_LIGHT_COLOR;
  pitch.userData.outerGrass = OUTER_GRASS_COLOR;
  scene.add(pitch);

  const markingMaterial = new THREE.MeshBasicMaterial({
    color: "#dffcff",
    side: THREE.FrontSide,
    transparent: false,
    opacity: 1,
    depthTest: true,
    depthWrite: true,
  });
  const fieldMarkings = new THREE.Group();
  fieldMarkings.name = "field-markings";
  fieldMarkings.position.y = FIELD_MARKINGS_Y;
  fieldMarkings.userData.floorSurfaceOffsetY = 0;
  addPitchBoundaryMarking(fieldMarkings, markingMaterial);
  addFieldMarking(fieldMarkings, markingMaterial, 0, FIELD_L / 2 - 3.5, 20, 7);
  addFieldMarking(fieldMarkings, markingMaterial, 0, -FIELD_L / 2 + 3.5, 20, 7);
  addFieldMarking(fieldMarkings, markingMaterial, 0, FIELD_L / 2 - 9, 44, 18);
  addFieldMarking(fieldMarkings, markingMaterial, 0, -FIELD_L / 2 + 9, 44, 18);
  const centerLine = new THREE.Mesh(new THREE.BoxGeometry(FIELD_W, 0.025, 0.18), markingMaterial);
  fieldMarkings.add(centerLine);
  const centerCircle = new THREE.Mesh(new THREE.TorusGeometry(8, 0.035, 8, 72), markingMaterial);
  centerCircle.rotation.x = Math.PI / 2;
  fieldMarkings.add(centerCircle);
  scene.add(fieldMarkings);
}

function addNetLines(scene: THREE.Scene, side: -1 | 1) {
  const frontZ = side * GOAL_FRONT_Z;
  const backZ = frontZ + side * GOAL_DEPTH;
  const material = new THREE.LineBasicMaterial({ color: "#f8fafc", transparent: true, opacity: 0.72, depthWrite: false });
  const points: THREE.Vector3[] = [];
  const bottom = 0.14;
  const topFront = GOAL_H - 0.08;
  const topBack = GOAL_H * 0.8;
  const widthSteps = 10;
  const heightSteps = 7;
  const depthSteps = 5;
  for (let i = 0; i <= widthSteps; i += 1) {
    const x = -GOAL_W / 2 + (GOAL_W * i) / widthSteps;
    const sag = 0.12 * (1 - Math.abs(x) / (GOAL_W / 2));
    points.push(new THREE.Vector3(x, bottom, backZ), new THREE.Vector3(x, topBack - sag, backZ));
    points.push(new THREE.Vector3(x, topFront, frontZ), new THREE.Vector3(x, topBack - sag, backZ));
    points.push(new THREE.Vector3(x, bottom, frontZ), new THREE.Vector3(x, bottom, backZ));
  }
  for (let j = 0; j <= heightSteps; j += 1) {
    const mix = j / heightSteps;
    const yBack = bottom + (topBack - bottom) * mix;
    const yFront = bottom + (topFront - bottom) * mix;
    points.push(new THREE.Vector3(-GOAL_W / 2, yBack, backZ), new THREE.Vector3(GOAL_W / 2, yBack, backZ));
    points.push(new THREE.Vector3(-GOAL_W / 2, yFront, frontZ), new THREE.Vector3(-GOAL_W / 2, yBack, backZ));
    points.push(new THREE.Vector3(GOAL_W / 2, yFront, frontZ), new THREE.Vector3(GOAL_W / 2, yBack, backZ));
  }
  for (let k = 0; k <= depthSteps; k += 1) {
    const z = frontZ + side * ((GOAL_DEPTH * k) / depthSteps);
    const roofMix = k / depthSteps;
    const roofY = topFront + (topBack - topFront) * roofMix;
    points.push(new THREE.Vector3(-GOAL_W / 2, roofY, z), new THREE.Vector3(GOAL_W / 2, roofY, z));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  scene.add(new THREE.LineSegments(geometry, material));
}

export function addGoal(scene: THREE.Scene, side: -1 | 1) {
  const goalMat = new THREE.MeshStandardMaterial({ color: "#f8fafc", roughness: 0.35 });
  const z = side * GOAL_FRONT_Z;
  const crossbar = new THREE.Mesh(
    new THREE.BoxGeometry(GOAL_FRAME_OUTER_W, GOAL_POST_THICKNESS, GOAL_POST_THICKNESS),
    goalMat,
  );
  crossbar.position.set(0, GOAL_H, z);
  const postA = new THREE.Mesh(new THREE.BoxGeometry(GOAL_POST_THICKNESS, GOAL_H, GOAL_POST_THICKNESS), goalMat);
  postA.position.set(-GOAL_POST_CENTER_X, GOAL_H / 2, z);
  const postB = postA.clone();
  postB.position.x = GOAL_POST_CENTER_X;
  scene.add(crossbar, postA, postB);
  addNetLines(scene, side);
}

export function resolveGoalFrameCollision(ball: THREE.Vector3, velocity: THREE.Vector3) {
  const collisionRadius = BALL_RADIUS + GOAL_POST_THICKNESS / 2;
  [-1, 1].forEach((goalSide) => {
    const goalLineZ = goalSide * GOAL_FRONT_Z;
    [-1, 1].forEach((postSide) => {
      if (ball.y > GOAL_H + BALL_RADIUS) return;
      const postCenter = new THREE.Vector2(postSide * GOAL_POST_CENTER_X, goalLineZ);
      const offset = new THREE.Vector2(ball.x - postCenter.x, ball.z - postCenter.y);
      const distance = offset.length();
      if (distance >= collisionRadius || distance < 0.0001) return;
      const normal = offset.multiplyScalar(1 / distance);
      ball.x = postCenter.x + normal.x * collisionRadius;
      ball.z = postCenter.y + normal.y * collisionRadius;
      const horizontalVelocity = new THREE.Vector2(velocity.x, velocity.z);
      const towardFrame = horizontalVelocity.dot(normal);
      if (towardFrame < 0) {
        horizontalVelocity.addScaledVector(normal, -1.62 * towardFrame);
        velocity.x = horizontalVelocity.x * 0.72;
        velocity.z = horizontalVelocity.y * 0.72;
      }
    });

    if (Math.abs(ball.x) > GOAL_FRAME_OUTER_W / 2 + BALL_RADIUS) return;
    const crossbarOffset = new THREE.Vector2(ball.y - GOAL_H, ball.z - goalLineZ);
    const crossbarDistance = crossbarOffset.length();
    if (crossbarDistance >= collisionRadius || crossbarDistance < 0.0001) return;
    const normal = crossbarOffset.multiplyScalar(1 / crossbarDistance);
    ball.y = GOAL_H + normal.x * collisionRadius;
    ball.z = goalLineZ + normal.y * collisionRadius;
    const verticalVelocity = new THREE.Vector2(velocity.y, velocity.z);
    const towardFrame = verticalVelocity.dot(normal);
    if (towardFrame < 0) {
      verticalVelocity.addScaledVector(normal, -1.58 * towardFrame);
      velocity.y = verticalVelocity.x * 0.68;
      velocity.z = verticalVelocity.y * 0.68;
    }
  });
}

function addRoundedRectContour(path: THREE.Shape | THREE.Path, width: number, length: number, radius: number) {
  const halfW = width / 2;
  const halfL = length / 2;
  const r = Math.min(radius, halfW - 0.1, halfL - 0.1);
  path.moveTo(-halfW + r, -halfL);
  path.lineTo(halfW - r, -halfL);
  path.quadraticCurveTo(halfW, -halfL, halfW, -halfL + r);
  path.lineTo(halfW, halfL - r);
  path.quadraticCurveTo(halfW, halfL, halfW - r, halfL);
  path.lineTo(-halfW + r, halfL);
  path.quadraticCurveTo(-halfW, halfL, -halfW, halfL - r);
  path.lineTo(-halfW, -halfL + r);
  path.quadraticCurveTo(-halfW, -halfL, -halfW + r, -halfL);
  path.closePath();
}

function stadiumRingGeometry(
  innerWidth: number,
  innerLength: number,
  outerWidth: number,
  outerLength: number,
  innerRadius: number,
  outerRadius: number,
  height: number,
) {
  const shape = new THREE.Shape();
  addRoundedRectContour(shape, outerWidth, outerLength, outerRadius);
  const hole = new THREE.Path();
  addRoundedRectContour(hole, innerWidth, innerLength, innerRadius);
  shape.holes.push(hole);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: false,
    curveSegments: 8,
  });
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, height, 0);
  geometry.computeVertexNormals();
  return geometry;
}

function stadiumApronGeometry(
  innerWidth: number,
  innerLength: number,
  outerWidth: number,
  outerLength: number,
  innerRadius: number,
  outerRadius: number,
) {
  const shape = new THREE.Shape();
  addRoundedRectContour(shape, outerWidth, outerLength, outerRadius);
  const hole = new THREE.Path();
  addRoundedRectContour(hole, innerWidth, innerLength, innerRadius);
  shape.holes.push(hole);
  const geometry = new THREE.ShapeGeometry(shape, 12);
  geometry.rotateX(-Math.PI / 2);
  return geometry;
}

function advertisingBrandFontSize(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement, brandName: string) {
  const horizontalPadding = canvas.width * 0.04;
  const maximumTextWidth = canvas.width - horizontalPadding * 2;
  let fontSize = Math.floor(canvas.height * 0.92);
  do {
    context.font = `900 ${fontSize}px "Arial Black", Arial, sans-serif`;
    if (context.measureText(brandName).width <= maximumTextWidth) break;
    fontSize -= 4;
  } while (fontSize > 30);
  return fontSize;
}

function paintAdvertisingBrand(
  canvas: HTMLCanvasElement,
  brandIndex: number,
) {
  const context = canvas.getContext("2d");
  if (!context) return null;
  const brand = ADVERTISING_BRANDS[brandIndex % ADVERTISING_BRANDS.length];
  context.fillStyle = brand.background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.textAlign = "center";
  context.textBaseline = "middle";
  const fontSize = advertisingBrandFontSize(context, canvas, brand.name);
  context.font = `900 ${fontSize}px "Arial Black", Arial, sans-serif`;
  context.lineJoin = "round";
  context.lineWidth = Math.max(2, fontSize * 0.045);
  context.strokeStyle = "rgba(0, 0, 0, 0.52)";
  context.strokeText(brand.name, canvas.width / 2, canvas.height * 0.505);
  context.fillStyle = brand.accent;
  context.fillText(brand.name, canvas.width / 2, canvas.height * 0.505);
  return fontSize;
}

function drawAdvertisingBrand(texture: THREE.CanvasTexture, brandIndex: number) {
  const canvas = texture.image as HTMLCanvasElement;
  let stagingCanvas = texture.userData.advertisingStagingCanvas as HTMLCanvasElement | undefined;
  if (!stagingCanvas) {
    stagingCanvas = document.createElement("canvas");
    stagingCanvas.width = canvas.width;
    stagingCanvas.height = canvas.height;
    texture.userData.advertisingStagingCanvas = stagingCanvas;
  }
  texture.userData.advertisingBrandIndex = brandIndex;
  const fontSize = paintAdvertisingBrand(stagingCanvas, brandIndex);
  if (fontSize === null) return;
  const context = canvas.getContext("2d");
  if (!context) return;
  context.save();
  context.globalCompositeOperation = "copy";
  context.drawImage(stagingCanvas, 0, 0);
  context.restore();
  texture.userData.advertisingFontSize = fontSize;
  texture.needsUpdate = true;
}

function blendAdvertisingBrands(
  texture: THREE.CanvasTexture,
  currentBrandIndex: number,
  nextBrandIndex: number,
  progress: number,
) {
  const canvas = texture.image as HTMLCanvasElement;
  let currentCanvas = texture.userData.advertisingTransitionCurrentCanvas as HTMLCanvasElement | undefined;
  let nextCanvas = texture.userData.advertisingTransitionNextCanvas as HTMLCanvasElement | undefined;
  if (!currentCanvas || !nextCanvas) {
    currentCanvas = document.createElement("canvas");
    nextCanvas = document.createElement("canvas");
    currentCanvas.width = nextCanvas.width = canvas.width;
    currentCanvas.height = nextCanvas.height = canvas.height;
    texture.userData.advertisingTransitionCurrentCanvas = currentCanvas;
    texture.userData.advertisingTransitionNextCanvas = nextCanvas;
  }
  if (
    texture.userData.advertisingTransitionFrom !== currentBrandIndex
    || texture.userData.advertisingTransitionTo !== nextBrandIndex
  ) {
    paintAdvertisingBrand(currentCanvas, currentBrandIndex);
    paintAdvertisingBrand(nextCanvas, nextBrandIndex);
    texture.userData.advertisingTransitionFrom = currentBrandIndex;
    texture.userData.advertisingTransitionTo = nextBrandIndex;
  }
  const context = canvas.getContext("2d");
  if (!context) return;
  const eased = THREE.MathUtils.smoothstep(clamp(progress, 0, 1), 0, 1);
  context.save();
  context.globalCompositeOperation = "copy";
  context.globalAlpha = 1;
  context.drawImage(currentCanvas, 0, 0);
  context.globalCompositeOperation = "source-over";
  context.globalAlpha = eased;
  context.drawImage(nextCanvas, 0, 0);
  context.restore();
  texture.needsUpdate = true;
}

function createAdvertisingBoardTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = AD_BOARD_TEXTURE_WIDTH;
  canvas.height = AD_BOARD_TEXTURE_HEIGHT;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(AD_BOARD_TEXTURE_REPEATS, 1);
  texture.generateMipmaps = false;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  drawAdvertisingBrand(texture, 0);
  const context = canvas.getContext("2d");
  texture.userData.advertisingFontSizes = context
    ? ADVERTISING_BRANDS.map((brand) => advertisingBrandFontSize(context, canvas, brand.name))
    : [];
  texture.userData.advertisingCanvasAspect = canvas.width / canvas.height;
  return texture;
}

type AdvertisingPathSample = { x: number; z: number; distance: number };

function sampleRoundedAdvertisingPerimeter(halfWidth: number, halfLength: number, radius: number) {
  const samples: AdvertisingPathSample[] = [{ x: -halfWidth + radius, z: -halfLength, distance: 0 }];
  let cumulativeDistance = 0;
  const pathSpacing = radius * Math.PI / 2 / AD_BOARD_CORNER_SEGMENTS;
  const appendLine = (x: number, z: number) => {
    const start = samples[samples.length - 1];
    const length = Math.hypot(x - start.x, z - start.z);
    const segments = Math.max(1, Math.ceil(length / pathSpacing));
    for (let index = 1; index <= segments; index += 1) {
      const mix = index / segments;
      cumulativeDistance += length / segments;
      samples.push({
        x: start.x + (x - start.x) * mix,
        z: start.z + (z - start.z) * mix,
        distance: cumulativeDistance,
      });
    }
  };
  const appendArc = (centerX: number, centerZ: number, startAngle: number) => {
    const arcStep = radius * Math.PI / 2 / AD_BOARD_CORNER_SEGMENTS;
    for (let index = 1; index <= AD_BOARD_CORNER_SEGMENTS; index += 1) {
      const angle = startAngle + index / AD_BOARD_CORNER_SEGMENTS * Math.PI / 2;
      cumulativeDistance += arcStep;
      samples.push({
        x: centerX + Math.cos(angle) * radius,
        z: centerZ + Math.sin(angle) * radius,
        distance: cumulativeDistance,
      });
    }
  };

  appendLine(halfWidth - radius, -halfLength);
  appendArc(halfWidth - radius, -halfLength + radius, -Math.PI / 2);
  appendLine(halfWidth, halfLength - radius);
  appendArc(halfWidth - radius, halfLength - radius, 0);
  appendLine(-halfWidth + radius, halfLength);
  appendArc(-halfWidth + radius, halfLength - radius, Math.PI / 2);
  appendLine(-halfWidth, -halfLength + radius);
  appendArc(-halfWidth + radius, -halfLength + radius, Math.PI);

  return { samples, totalLength: cumulativeDistance };
}

function createAdvertisingPerimeterRibbon(
  halfWidth: number,
  halfLength: number,
  radius: number,
  inwardFacing: boolean,
) {
  const { samples, totalLength } = sampleRoundedAdvertisingPerimeter(halfWidth, halfLength, radius);
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const lowerY = AD_BOARD_BASE_Y;
  const upperY = AD_BOARD_BASE_Y + AD_BOARD_DISPLAY_HEIGHT;
  samples.forEach((sample) => {
    positions.push(sample.x, lowerY, sample.z, sample.x, upperY, sample.z);
    const u = sample.distance / totalLength;
    uvs.push(u, 0, u, 1);
  });
  for (let index = 0; index < samples.length - 1; index += 1) {
    const bottom = index * 2;
    const top = bottom + 1;
    const nextBottom = bottom + 2;
    const nextTop = bottom + 3;
    if (inwardFacing) indices.push(bottom, nextBottom, top, top, nextBottom, nextTop);
    else indices.push(bottom, top, nextBottom, top, nextTop, nextBottom);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.userData.perimeterLength = totalLength;
  geometry.userData.sampleCount = samples.length;
  return geometry;
}

function createAdvertisingCornerSolidGeometry(
  innerRadius: number,
  outerRadius: number,
  height: number,
  startAngle: number,
) {
  const positions: number[] = [];
  const indices: number[] = [];
  for (let index = 0; index <= AD_BOARD_CORNER_SEGMENTS; index += 1) {
    const progress = index / AD_BOARD_CORNER_SEGMENTS;
    const angle = startAngle + progress * Math.PI / 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    positions.push(
      cos * innerRadius, -height / 2, sin * innerRadius,
      cos * innerRadius, height / 2, sin * innerRadius,
      cos * outerRadius, -height / 2, sin * outerRadius,
      cos * outerRadius, height / 2, sin * outerRadius,
    );
  }
  for (let index = 0; index < AD_BOARD_CORNER_SEGMENTS; index += 1) {
    const base = index * 4;
    const next = base + 4;
    indices.push(
      base, next, base + 1, base + 1, next, next + 1,
      base + 2, base + 3, next + 2, base + 3, next + 3, next + 2,
      base + 1, next + 1, base + 3, base + 3, next + 1, next + 3,
      base, base + 2, next, base + 2, next + 2, next,
    );
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createStadiumSeatGeometry() {
  // A seat is read from the broadcast camera as a colored pan/back silhouette.
  // Two double-sided quads preserve that shape while avoiding ~700k hidden box
  // triangles across the 19k-seat bowl.
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute([
    -0.42, 0.18, -0.28,
    0.42, 0.18, -0.28,
    0.42, 0.18, 0.27,
    -0.42, 0.18, 0.27,
    -0.42, 0.18, 0.27,
    0.42, 0.18, 0.27,
    0.42, 0.87, 0.36,
    -0.42, 0.87, 0.36,
  ], 3));
  geometry.setIndex([
    0, 2, 1,
    0, 3, 2,
    4, 5, 6,
    4, 6, 7,
  ]);
  geometry.computeVertexNormals();
  return geometry;
}

type StadiumDeck = {
  startOffset: number;
  startY: number;
  rows: number;
  rowDepth: number;
  rowRise: number;
};

type StadiumSeatPlacement = {
  position: THREE.Vector3;
  rotationY: number;
  color: string;
};

function stadiumSeatHeading(position: THREE.Vector3) {
  const towardPitch = position.clone().setY(0).multiplyScalar(-1);
  return Math.atan2(-towardPitch.x, -towardPitch.z);
}

export function addLightweightStadium(scene: THREE.Scene) {
  const stadium = new THREE.Group();
  stadium.name = "lightweight-stadium";
  const adTexture = createAdvertisingBoardTexture();
  const adMaterial = new THREE.MeshBasicMaterial({
    map: adTexture,
    color: "#ffffff",
    side: THREE.FrontSide,
    depthTest: true,
    depthWrite: true,
    polygonOffset: true,
    polygonOffsetFactor: -3,
    polygonOffsetUnits: -3,
  });
  const adBackingMaterial = new THREE.MeshLambertMaterial({ color: "#101923" });
  const adTopMaterial = new THREE.MeshLambertMaterial({ color: "#101923" });
  const runoffWidth = FIELD_W + TOUCHLINE_RUNOFF * 2;
  const runoffLength = FIELD_L + GOAL_LINE_RUNOFF * 2;
  const innerFaceX = AD_BOARD_INNER_X - AD_BOARD_FACE_OFFSET;
  const innerFaceZ = AD_BOARD_INNER_Z - AD_BOARD_FACE_OFFSET;
  const cornerCenterX = innerFaceX - AD_BOARD_CORNER_RADIUS;
  const cornerCenterZ = innerFaceZ - AD_BOARD_CORNER_RADIUS;
  const straightGoalBoardWidth = cornerCenterX * 2;
  const straightSideBoardLength = cornerCenterZ * 2;
  [-1, 1].forEach((side) => {
    const goalBoardZ = side * (runoffLength / 2 + AD_BOARD_THICKNESS / 2);
    const goalBacking = new THREE.Mesh(
      new THREE.BoxGeometry(straightGoalBoardWidth, AD_BOARD_HEIGHT, AD_BOARD_THICKNESS),
      adBackingMaterial,
    );
    goalBacking.position.set(0, AD_BOARD_BASE_Y + AD_BOARD_HEIGHT / 2, goalBoardZ);
    goalBacking.name = `ad-board-backing-goal-${side}`;
    stadium.add(goalBacking);
    const goalTop = new THREE.Mesh(
      new THREE.BoxGeometry(straightGoalBoardWidth, 0.08, AD_BOARD_THICKNESS + 0.08),
      adTopMaterial,
    );
    goalTop.position.set(0, AD_BOARD_BASE_Y + AD_BOARD_HEIGHT + 0.04, goalBoardZ);
    goalTop.name = `ad-board-clean-top-goal-${side}`;
    stadium.add(goalTop);

    const sideBoardX = side * (runoffWidth / 2 + AD_BOARD_THICKNESS / 2);
    const sideBacking = new THREE.Mesh(
      new THREE.BoxGeometry(AD_BOARD_THICKNESS, AD_BOARD_HEIGHT, straightSideBoardLength),
      adBackingMaterial,
    );
    sideBacking.position.set(sideBoardX, AD_BOARD_BASE_Y + AD_BOARD_HEIGHT / 2, 0);
    sideBacking.name = `ad-board-backing-side-${side}`;
    stadium.add(sideBacking);
    const sideTop = new THREE.Mesh(
      new THREE.BoxGeometry(AD_BOARD_THICKNESS + 0.08, 0.08, straightSideBoardLength),
      adTopMaterial,
    );
    sideTop.position.set(sideBoardX, AD_BOARD_BASE_Y + AD_BOARD_HEIGHT + 0.04, 0);
    sideTop.name = `ad-board-clean-top-side-${side}`;
    stadium.add(sideTop);
  });

  for (const xSide of [-1, 1]) {
    for (const zSide of [-1, 1]) {
      let startAngle = Math.atan2(zSide, xSide) - Math.PI / 4;
      if (startAngle < 0) startAngle += Math.PI * 2;
      const cornerCenter = new THREE.Vector3(xSide * cornerCenterX, 0, zSide * cornerCenterZ);
      const backing = new THREE.Mesh(
        createAdvertisingCornerSolidGeometry(
          AD_BOARD_CORNER_RADIUS + AD_BOARD_FACE_OFFSET,
          AD_BOARD_CORNER_RADIUS + AD_BOARD_FACE_OFFSET + AD_BOARD_THICKNESS,
          AD_BOARD_HEIGHT,
          startAngle,
        ),
        adBackingMaterial,
      );
      backing.position.set(cornerCenter.x, AD_BOARD_DISPLAY_Y, cornerCenter.z);
      backing.name = `ad-board-backing-corner-${xSide}-${zSide}`;

      const top = new THREE.Mesh(
        createAdvertisingCornerSolidGeometry(
          AD_BOARD_CORNER_RADIUS + AD_BOARD_FACE_OFFSET - 0.04,
          AD_BOARD_CORNER_RADIUS + AD_BOARD_FACE_OFFSET + AD_BOARD_THICKNESS + 0.04,
          0.08,
          startAngle,
        ),
        adTopMaterial,
      );
      top.position.set(
        cornerCenter.x,
        AD_BOARD_BASE_Y + AD_BOARD_HEIGHT + 0.04,
        cornerCenter.z,
      );
      top.name = `ad-board-clean-top-corner-${xSide}-${zSide}`;
      stadium.add(backing, top);
    }
  }

  const innerRibbonGeometry = createAdvertisingPerimeterRibbon(
    innerFaceX,
    innerFaceZ,
    AD_BOARD_CORNER_RADIUS,
    true,
  );
  const innerRibbon = new THREE.Mesh(innerRibbonGeometry, adMaterial);
  innerRibbon.name = "animated-ad-board-continuous-inner-ribbon";
  innerRibbon.renderOrder = AD_BOARD_DISPLAY_RENDER_ORDER;
  const outerRibbonGeometry = createAdvertisingPerimeterRibbon(
    innerFaceX + AD_BOARD_THICKNESS + AD_BOARD_FACE_OFFSET * 2,
    innerFaceZ + AD_BOARD_THICKNESS + AD_BOARD_FACE_OFFSET * 2,
    AD_BOARD_CORNER_RADIUS + AD_BOARD_THICKNESS + AD_BOARD_FACE_OFFSET * 2,
    false,
  );
  const outerRibbon = new THREE.Mesh(outerRibbonGeometry, adMaterial);
  outerRibbon.name = "animated-ad-board-continuous-outer-ribbon";
  outerRibbon.renderOrder = AD_BOARD_DISPLAY_RENDER_ORDER;
  adTexture.userData.perimeterLength = innerRibbonGeometry.userData.perimeterLength;
  adTexture.userData.perimeterSampleCount = innerRibbonGeometry.userData.sampleCount;
  stadium.add(innerRibbon, outerRibbon);

  const apronInnerWidth = runoffWidth + AD_BOARD_THICKNESS * 2 + 0.04;
  const apronInnerLength = runoffLength + AD_BOARD_THICKNESS * 2 + 0.04;
  const apronOuterWidth = runoffWidth + 3.72;
  const apronOuterLength = runoffLength + 3.72;
  const pitchSideApron = new THREE.Mesh(
    stadiumApronGeometry(
      apronInnerWidth,
      apronInnerLength,
      apronOuterWidth,
      apronOuterLength,
      AD_BOARD_CORNER_RADIUS + AD_BOARD_THICKNESS + 0.04,
      7.24,
    ),
    new THREE.MeshLambertMaterial({
      color: "#0d3f29",
      side: THREE.FrontSide,
    }),
  );
  pitchSideApron.name = "continuous-pitch-side-apron";
  pitchSideApron.position.y = STADIUM_BASE_TOP_Y + 0.008;
  pitchSideApron.receiveShadow = true;
  pitchSideApron.userData.innerWidth = apronInnerWidth;
  pitchSideApron.userData.innerLength = apronInnerLength;
  pitchSideApron.userData.outerWidth = apronOuterWidth;
  pitchSideApron.userData.outerLength = apronOuterLength;
  stadium.add(pitchSideApron);

  const concrete = new THREE.MeshLambertMaterial({ color: "#344553" });
  const upperConcrete = new THREE.MeshLambertMaterial({ color: "#263641" });
  const innerWidth = runoffWidth + 0.5;
  const innerLength = runoffLength + 0.5;
  const concourses = [
    { inset: 3.8, out: 6.2, y: 2.72, radius: 7.2, material: concrete },
    { inset: 16.3, out: 19.4, y: 8.76, radius: 13.6, material: upperConcrete },
    { inset: 28.1, out: 31.4, y: 15.35, radius: 20.5, material: concrete },
    { inset: 41.2, out: 57.4, y: 22.8, radius: 27.4, material: upperConcrete },
  ];
  concourses.forEach((concourse) => {
    const ring = new THREE.Mesh(
      stadiumRingGeometry(
        innerWidth + concourse.inset,
        innerLength + concourse.inset,
        innerWidth + concourse.out,
        innerLength + concourse.out,
        concourse.radius,
        concourse.radius + 2.4,
        0.34,
      ),
      concourse.material,
    );
    ring.position.y = concourse.y;
    ring.receiveShadow = false;
    stadium.add(ring);
  });

  // A substantial upper shell closes the bowl without a thin hovering roof.
  const upperShell = new THREE.Mesh(
    stadiumRingGeometry(
      innerWidth + 50.8,
      innerLength + 50.8,
      innerWidth + 64.5,
      innerLength + 64.5,
      30.8,
      38.4,
      13.8,
    ),
    new THREE.MeshLambertMaterial({ color: "#1a2732" }),
  );
  upperShell.position.y = 20.8;
  upperShell.name = "stadium-upper-enclosing-shell";
  stadium.add(upperShell);

  const roofFascia = new THREE.Mesh(
    stadiumRingGeometry(
      innerWidth + 55.8,
      innerLength + 55.8,
      innerWidth + 64.5,
      innerLength + 64.5,
      33.4,
      38.4,
      3.4,
    ),
    new THREE.MeshLambertMaterial({ color: "#182631" }),
  );
  roofFascia.position.y = 31.4;
  roofFascia.name = "stadium-substantial-upper-crown";
  stadium.add(roofFascia);

  const decks: StadiumDeck[] = [
    { startOffset: 5.8, startY: 3.08, rows: 11, rowDepth: 1.05, rowRise: 0.54 },
    { startOffset: 19.2, startY: 9.65, rows: 9, rowDepth: 1.08, rowRise: 0.58 },
    { startOffset: 31.0, startY: 16.15, rows: 11, rowDepth: 1.08, rowRise: 0.64 },
  ];
  const tierBackingMaterial = new THREE.MeshLambertMaterial({ color: "#223640" });
  decks.forEach((deck, deckIndex) => {
    const outerEdge = deck.startOffset + deck.rows * deck.rowDepth + 0.7;
    const backingThickness = 1.55;
    const backingHeight = deck.rows * deck.rowRise + 1.45;
    const tierBacking = new THREE.Mesh(
      stadiumRingGeometry(
        runoffWidth + (outerEdge - backingThickness) * 2,
        runoffLength + (outerEdge - backingThickness) * 2,
        runoffWidth + outerEdge * 2,
        runoffLength + outerEdge * 2,
        7.2 + outerEdge - backingThickness,
        7.2 + outerEdge,
        backingHeight,
      ),
      tierBackingMaterial,
    );
    tierBacking.position.y = Math.max(0.2, deck.startY - 1.2);
    tierBacking.name = `stadium-tier-rear-and-corner-infill-${deckIndex + 1}`;
    stadium.add(tierBacking);
  });
  const sidelineAisles = [-0.33, -0.11, 0.11, 0.33].map((value) => value * runoffLength);
  const endAisles = [-0.27, 0, 0.27].map((value) => value * runoffWidth);
  const seatPlacements: StadiumSeatPlacement[] = [];
  const seatSpacing = 1.02;
  const seatColors = ["#17798b", "#1f95a8", "#29aec0", "#166b7d"];
  const addSeat = (position: THREE.Vector3, deckIndex: number, sectionIndex: number) => {
    seatPlacements.push({
      position,
      rotationY: stadiumSeatHeading(position),
      color: seatColors[(deckIndex * 2 + sectionIndex) % seatColors.length],
    });
  };

  const deckSupportMaterial = new THREE.MeshLambertMaterial({ color: "#344953" });
  decks.forEach((deck, deckIndex) => {
    const innerOffset = Math.max(0.8, deck.startOffset - 1.15);
    const outerOffset = deck.startOffset + deck.rows * deck.rowDepth + 0.75;
    const deckSupport = new THREE.Mesh(
      stadiumRingGeometry(
        runoffWidth + innerOffset * 2,
        runoffLength + innerOffset * 2,
        runoffWidth + outerOffset * 2,
        runoffLength + outerOffset * 2,
        7.2 + innerOffset,
        7.2 + outerOffset,
        0.48,
      ),
      deckSupportMaterial,
    );
    deckSupport.position.y = Math.max(0.24, deck.startY - 0.7);
    deckSupport.name = `stadium-solid-seat-deck-${deckIndex + 1}`;
    stadium.add(deckSupport);
  });

  const treadPlacements: Array<{ position: THREE.Vector3; scale: THREE.Vector3; rotationY: number }> = [];
  const riserPlacements: Array<{ position: THREE.Vector3; scale: THREE.Vector3; rotationY: number }> = [];
  const straightSideLength = runoffLength - 14.4;
  const straightEndLength = runoffWidth - 14.4;
  const cornerSegments = 12;
  decks.forEach((deck) => {
    for (let row = 0; row < deck.rows; row += 1) {
      const rowOffset = deck.startOffset + row * deck.rowDepth;
      const treadY = deck.startY + row * deck.rowRise;
      const priorY = row === 0 ? deck.startY - 0.36 : treadY - deck.rowRise;
      const riserHeight = treadY - priorY;
      for (const side of [-1, 1]) {
        treadPlacements.push({
          position: new THREE.Vector3(side * (runoffWidth / 2 + rowOffset + deck.rowDepth / 2), treadY - 0.08, 0),
          scale: new THREE.Vector3(deck.rowDepth, 0.16, straightSideLength),
          rotationY: 0,
        });
        riserPlacements.push({
          position: new THREE.Vector3(side * (runoffWidth / 2 + rowOffset), priorY + riserHeight / 2, 0),
          scale: new THREE.Vector3(0.18, riserHeight, straightSideLength),
          rotationY: 0,
        });
        treadPlacements.push({
          position: new THREE.Vector3(0, treadY - 0.08, side * (runoffLength / 2 + rowOffset + deck.rowDepth / 2)),
          scale: new THREE.Vector3(straightEndLength, 0.16, deck.rowDepth),
          rotationY: 0,
        });
        riserPlacements.push({
          position: new THREE.Vector3(0, priorY + riserHeight / 2, side * (runoffLength / 2 + rowOffset)),
          scale: new THREE.Vector3(straightEndLength, riserHeight, 0.18),
          rotationY: 0,
        });
      }
      const cornerCenterX = runoffWidth / 2 - 7.2;
      const cornerCenterZ = runoffLength / 2 - 7.2;
      const treadRadius = rowOffset + 7.2 + deck.rowDepth / 2;
      const riserRadius = rowOffset + 7.2;
      const arcLength = Math.PI * treadRadius / 2 / cornerSegments * 1.04;
      for (const xSide of [-1, 1]) {
        for (const zSide of [-1, 1]) {
          for (let segment = 0; segment < cornerSegments; segment += 1) {
            const angle = (segment + 0.5) / cornerSegments * Math.PI / 2;
            const rotationY = -xSide * zSide * angle;
            treadPlacements.push({
              position: new THREE.Vector3(
                xSide * (cornerCenterX + Math.cos(angle) * treadRadius),
                treadY - 0.08,
                zSide * (cornerCenterZ + Math.sin(angle) * treadRadius),
              ),
              scale: new THREE.Vector3(deck.rowDepth * 1.06, 0.16, arcLength),
              rotationY,
            });
            riserPlacements.push({
              position: new THREE.Vector3(
                xSide * (cornerCenterX + Math.cos(angle) * riserRadius),
                priorY + riserHeight / 2,
                zSide * (cornerCenterZ + Math.sin(angle) * riserRadius),
              ),
              scale: new THREE.Vector3(0.18, riserHeight, arcLength),
              rotationY,
            });
          }
        }
      }
    }
  });
  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const treadMaterial = new THREE.MeshLambertMaterial({ color: "#667984", side: THREE.FrontSide });
  const riserMaterial = new THREE.MeshLambertMaterial({ color: "#425560", side: THREE.FrontSide });
  const terraceTreads = new THREE.InstancedMesh(unitBox, treadMaterial, treadPlacements.length);
  const terraceRisers = new THREE.InstancedMesh(unitBox, riserMaterial, riserPlacements.length);
  const terraceMatrix = new THREE.Matrix4();
  const terraceQuaternion = new THREE.Quaternion();
  treadPlacements.forEach((placement, index) => {
    terraceQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), placement.rotationY);
    terraceMatrix.compose(placement.position, terraceQuaternion, placement.scale);
    terraceTreads.setMatrixAt(index, terraceMatrix);
  });
  riserPlacements.forEach((placement, index) => {
    terraceQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), placement.rotationY);
    terraceMatrix.compose(placement.position, terraceQuaternion, placement.scale);
    terraceRisers.setMatrixAt(index, terraceMatrix);
  });
  terraceTreads.name = "stadium-physical-terrace-treads";
  terraceRisers.name = "stadium-physical-terrace-risers";
  terraceTreads.instanceMatrix.needsUpdate = true;
  terraceRisers.instanceMatrix.needsUpdate = true;
  stadium.add(terraceTreads, terraceRisers);

  decks.forEach((deck, deckIndex) => {
    for (let row = 0; row < deck.rows; row += 1) {
      const rowOffset = deck.startOffset + row * deck.rowDepth;
      const y = deck.startY + row * deck.rowRise + 0.015;
      const sideLimit = runoffLength / 2 - 7.2;
      const sideSeatCount = Math.floor(sideLimit * 2 / seatSpacing);
      for (const side of [-1, 1]) {
        for (let index = 0; index <= sideSeatCount; index += 1) {
          const z = -sideLimit + index * seatSpacing;
          if (sidelineAisles.some((aisle) => Math.abs(z - aisle) < 0.84)) continue;
          const sectionIndex = sidelineAisles.filter((aisle) => aisle < z).length;
          addSeat(new THREE.Vector3(side * (runoffWidth / 2 + rowOffset), y, z), deckIndex, sectionIndex);
        }
      }

      const endLimit = runoffWidth / 2 - 7.2;
      const endSeatCount = Math.floor(endLimit * 2 / seatSpacing);
      for (const side of [-1, 1]) {
        for (let index = 0; index <= endSeatCount; index += 1) {
          const x = -endLimit + index * seatSpacing;
          if (endAisles.some((aisle) => Math.abs(x - aisle) < 0.84)) continue;
          const sectionIndex = endAisles.filter((aisle) => aisle < x).length;
          addSeat(new THREE.Vector3(x, y, side * (runoffLength / 2 + rowOffset)), deckIndex, sectionIndex + 1);
        }
      }

      const cornerCenterX = runoffWidth / 2 - 7.2;
      const cornerCenterZ = runoffLength / 2 - 7.2;
      const cornerRadius = rowOffset + 7.2;
      const cornerSeatCount = Math.max(8, Math.floor(Math.PI * cornerRadius / (2 * seatSpacing)));
      for (const xSide of [-1, 1]) {
        for (const zSide of [-1, 1]) {
          for (let index = 1; index < cornerSeatCount; index += 1) {
            const angle = index / cornerSeatCount * Math.PI / 2;
            if (Math.abs(angle - Math.PI / 4) * cornerRadius < 0.86) continue;
            const position = new THREE.Vector3(
              xSide * (cornerCenterX + Math.cos(angle) * cornerRadius),
              y,
              zSide * (cornerCenterZ + Math.sin(angle) * cornerRadius),
            );
            addSeat(position, deckIndex, index < cornerSeatCount / 2 ? 2 : 3);
          }
        }
      }
    }
  });

  const seatMaterial = new THREE.MeshLambertMaterial({ color: "#ffffff", side: THREE.DoubleSide });
  const stadiumSeats = new THREE.InstancedMesh(createStadiumSeatGeometry(), seatMaterial, seatPlacements.length);
  const instanceMatrix = new THREE.Matrix4();
  const instanceQuaternion = new THREE.Quaternion();
  const instanceScale = new THREE.Vector3(1, 1, 1);
  const instanceColor = new THREE.Color();
  seatPlacements.forEach((seat, index) => {
    instanceQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), seat.rotationY);
    instanceMatrix.compose(seat.position, instanceQuaternion, instanceScale);
    stadiumSeats.setMatrixAt(index, instanceMatrix);
    stadiumSeats.setColorAt(index, instanceColor.set(seat.color));
  });
  stadiumSeats.name = "stadium-individual-seat-rows";
  stadiumSeats.instanceMatrix.needsUpdate = true;
  if (stadiumSeats.instanceColor) stadiumSeats.instanceColor.needsUpdate = true;
  stadiumSeats.castShadow = false;
  stadiumSeats.receiveShadow = false;
  stadium.add(stadiumSeats);

  const stairPlacements: Array<{ position: THREE.Vector3; scale: THREE.Vector3; rotationY: number }> = [];
  decks.forEach((deck) => {
    for (let row = 0; row < deck.rows; row += 1) {
      const rowOffset = deck.startOffset + row * deck.rowDepth;
      const y = deck.startY + row * deck.rowRise + 0.04;
      for (const side of [-1, 1]) {
        sidelineAisles.forEach((z) => stairPlacements.push({
          position: new THREE.Vector3(side * (runoffWidth / 2 + rowOffset), y, z),
          scale: new THREE.Vector3(deck.rowDepth * 0.96, 0.08, 1.52),
          rotationY: 0,
        }));
        endAisles.forEach((x) => stairPlacements.push({
          position: new THREE.Vector3(x, y, side * (runoffLength / 2 + rowOffset)),
          scale: new THREE.Vector3(1.52, 0.08, deck.rowDepth * 0.96),
          rotationY: 0,
        }));
      }
      const cornerCenterX = runoffWidth / 2 - 7.2;
      const cornerCenterZ = runoffLength / 2 - 7.2;
      const cornerRadius = rowOffset + 7.2;
      for (const xSide of [-1, 1]) {
        for (const zSide of [-1, 1]) {
          const angle = Math.PI / 4;
          const position = new THREE.Vector3(
            xSide * (cornerCenterX + Math.cos(angle) * cornerRadius),
            y,
            zSide * (cornerCenterZ + Math.sin(angle) * cornerRadius),
          );
          stairPlacements.push({
            position,
            scale: new THREE.Vector3(1.52, 0.08, deck.rowDepth * 0.96),
            rotationY: xSide * zSide * -Math.PI / 4,
          });
        }
      }
    }
  });
  const stairMaterial = new THREE.MeshLambertMaterial({ color: "#d2dadd" });
  const stadiumStairs = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), stairMaterial, stairPlacements.length);
  stairPlacements.forEach((step, index) => {
    instanceQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), step.rotationY);
    instanceMatrix.compose(step.position, instanceQuaternion, step.scale);
    stadiumStairs.setMatrixAt(index, instanceMatrix);
  });
  stadiumStairs.name = "stadium-integrated-stair-aisles";
  stadiumStairs.instanceMatrix.needsUpdate = true;
  stadiumStairs.castShadow = false;
  stadiumStairs.receiveShadow = false;
  stadium.add(stadiumStairs);

  const bowlBackingMaterial = new THREE.MeshLambertMaterial({ color: "#293b46" });
  const lowerBowlBacking = new THREE.Mesh(
    stadiumRingGeometry(
      runoffWidth + 3.6,
      runoffLength + 3.6,
      runoffWidth + 5.15,
      runoffLength + 5.15,
      7.2,
      8.6,
      2.35,
    ),
    bowlBackingMaterial,
  );
  lowerBowlBacking.position.y = 0.34;
  lowerBowlBacking.name = "stadium-lower-bowl-solid-backing";
  stadium.add(lowerBowlBacking);

  // Bridge the full lower-bowl depth from the board chassis to the first terrace.
  // The infill starts behind the boards and sits below the first seat row, avoiding
  // both pitch occlusion and the near-coplanar surfaces that caused earlier flicker.
  for (const side of [-1, 1]) {
    const sideInfill = new THREE.Mesh(
      new THREE.BoxGeometry(11.8, 3.05, straightSideBoardLength - 0.4),
      bowlBackingMaterial,
    );
    sideInfill.position.set(side * (runoffWidth / 2 + 5.9), 1.5, 0);
    sideInfill.name = `stadium-sideline-continuous-lower-bowl-${side}`;
    sideInfill.castShadow = false;
    sideInfill.receiveShadow = false;
    stadium.add(sideInfill);
  }

  const rearWall = new THREE.Mesh(
    stadiumRingGeometry(
      runoffWidth + 43.8,
      runoffLength + 43.8,
      runoffWidth + 47.2,
      runoffLength + 47.2,
      28.8,
      31.6,
      12.4,
    ),
    new THREE.MeshLambertMaterial({ color: "#20313b" }),
  );
  rearWall.position.y = 17.9;
  rearWall.name = "stadium-upper-seating-rear-wall";
  stadium.add(rearWall);

  const portalMaterial = new THREE.MeshLambertMaterial({ color: "#0f1b22" });
  const portalPlacements = [
    new THREE.Vector3(-runoffWidth / 2 - 18.5, 10.15, -runoffLength * 0.25),
    new THREE.Vector3(-runoffWidth / 2 - 18.5, 10.15, runoffLength * 0.25),
    new THREE.Vector3(runoffWidth / 2 + 18.5, 10.15, -runoffLength * 0.25),
    new THREE.Vector3(runoffWidth / 2 + 18.5, 10.15, runoffLength * 0.25),
    new THREE.Vector3(-runoffWidth * 0.25, 10.15, -runoffLength / 2 - 18.5),
    new THREE.Vector3(runoffWidth * 0.25, 10.15, -runoffLength / 2 - 18.5),
    new THREE.Vector3(-runoffWidth * 0.25, 10.15, runoffLength / 2 + 18.5),
    new THREE.Vector3(runoffWidth * 0.25, 10.15, runoffLength / 2 + 18.5),
  ];
  portalPlacements.forEach((position, index) => {
    const onSideline = Math.abs(position.x) > runoffWidth / 2;
    const portal = new THREE.Mesh(
      new THREE.BoxGeometry(onSideline ? 0.52 : 5.8, 3.5, onSideline ? 5.8 : 0.52),
      portalMaterial,
    );
    portal.position.copy(position);
    portal.name = `stadium-entry-opening-${index + 1}`;
    stadium.add(portal);
  });

  const roofSupportMaterial = new THREE.MeshLambertMaterial({ color: "#5b6d76" });
  const supportPlacements: Array<{ position: THREE.Vector3; rotationY: number }> = [];
  for (const side of [-1, 1]) {
    [-0.34, -0.11, 0.11, 0.34].forEach((ratio) => {
      supportPlacements.push({
        position: new THREE.Vector3(side * (runoffWidth / 2 + 53.5), 25.5, ratio * runoffLength),
        rotationY: 0,
      });
      supportPlacements.push({
        position: new THREE.Vector3(ratio * runoffWidth, 25.5, side * (runoffLength / 2 + 53.5)),
        rotationY: Math.PI / 2,
      });
    });
  }
  const roofSupports = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.52, 18.2, 0.52),
    roofSupportMaterial,
    supportPlacements.length,
  );
  supportPlacements.forEach((support, index) => {
    instanceQuaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), support.rotationY);
    instanceMatrix.compose(support.position, instanceQuaternion, new THREE.Vector3(1, 1, 1));
    roofSupports.setMatrixAt(index, instanceMatrix);
  });
  roofSupports.instanceMatrix.needsUpdate = true;
  roofSupports.name = "stadium-roof-support-columns";
  stadium.add(roofSupports);

  stadium.userData.seatingRows = decks.reduce((sum, deck) => sum + deck.rows, 0);
  stadium.userData.seatCount = seatPlacements.length;
  stadium.userData.distantCrowdCount = 0;
  stadium.userData.stairAisles = sidelineAisles.length * 2 + endAisles.length * 2 + 4;
  stadium.userData.terraceTreadCount = treadPlacements.length;
  stadium.userData.terraceRiserCount = riserPlacements.length;
  stadium.userData.terraceRakeDegrees = decks.map((deck) => THREE.MathUtils.radToDeg(Math.atan2(deck.rowRise, deck.rowDepth)));
  stadium.userData.terraceRowRise = decks.map((deck) => deck.rowRise);
  stadium.userData.terraceRowDepth = decks.map((deck) => deck.rowDepth);
  stadium.userData.seatSpacing = seatSpacing;
  stadium.userData.maximumHeight = 37.1;
  stadium.userData.upperTierCount = 3;
  stadium.userData.thinRoofRemoved = true;
  stadium.userData.solidSeatDeckCount = decks.length;
  stadium.userData.voidFillStructureCount = 7;
  adTexture.userData.stadiumDiagnostics = {
    seatingRows: stadium.userData.seatingRows,
    seatCount: stadium.userData.seatCount,
    distantCrowdCount: stadium.userData.distantCrowdCount,
    stairAisles: stadium.userData.stairAisles,
    terraceTreadCount: stadium.userData.terraceTreadCount,
    terraceRiserCount: stadium.userData.terraceRiserCount,
    terraceRakeDegrees: stadium.userData.terraceRakeDegrees,
    terraceRowRise: stadium.userData.terraceRowRise,
    terraceRowDepth: stadium.userData.terraceRowDepth,
    seatSpacing,
    thinRoofRemoved: stadium.userData.thinRoofRemoved,
    solidSeatDeckCount: stadium.userData.solidSeatDeckCount,
    voidFillStructureCount: stadium.userData.voidFillStructureCount,
  };

  scene.add(stadium);
  return adTexture;
}

export function updateAdvertisingBoards(active: MatchRuntime, dt: number) {
  active.adBrandTimer += dt;
  active.adBoardTexture.offset.x = (active.adBoardTexture.offset.x - dt * AD_BOARD_SCROLL_SPEED + 1) % 1;
  const transitionStart = AD_BOARD_BRAND_DURATION - AD_BOARD_TRANSITION_DURATION;
  let transitionProgress = 0;
  if (active.adBrandTimer >= transitionStart) {
    transitionProgress = clamp(
      (active.adBrandTimer - transitionStart) / AD_BOARD_TRANSITION_DURATION,
      0,
      1,
    );
    blendAdvertisingBrands(
      active.adBoardTexture,
      active.adBrandIndex,
      (active.adBrandIndex + 1) % ADVERTISING_BRANDS.length,
      transitionProgress,
    );
  }
  if (active.adBrandTimer >= AD_BOARD_BRAND_DURATION) {
    active.adBrandTimer %= AD_BOARD_BRAND_DURATION;
    active.adBrandIndex = (active.adBrandIndex + 1) % ADVERTISING_BRANDS.length;
    drawAdvertisingBrand(active.adBoardTexture, active.adBrandIndex);
    active.adBoardTexture.userData.advertisingTransitionFrom = undefined;
    active.adBoardTexture.userData.advertisingTransitionTo = undefined;
  }
  active.renderer.domElement.dataset.adBrand = ADVERTISING_BRANDS[active.adBrandIndex].name;
  active.renderer.domElement.dataset.adBrandIndex = String(active.adBrandIndex);
  active.renderer.domElement.dataset.adBrandSeconds = active.adBrandTimer.toFixed(2);
  active.renderer.domElement.dataset.adBrandTransition = transitionProgress.toFixed(3);
  active.renderer.domElement.dataset.adBoardFaceOffset = AD_BOARD_FACE_OFFSET.toFixed(3);
  active.renderer.domElement.dataset.adBoardDisplayHeight = AD_BOARD_DISPLAY_HEIGHT.toFixed(3);
  active.renderer.domElement.dataset.adBoardDisplayY = AD_BOARD_DISPLAY_Y.toFixed(3);
  active.renderer.domElement.dataset.adBrandFontSize = String(active.adBoardTexture.userData.advertisingFontSize ?? "");
  active.renderer.domElement.dataset.adBrandFontSizes = (active.adBoardTexture.userData.advertisingFontSizes as number[] | undefined)?.join(",") ?? "";
  active.renderer.domElement.dataset.adBoardTextureSize = `${AD_BOARD_TEXTURE_WIDTH}x${AD_BOARD_TEXTURE_HEIGHT}`;
  active.renderer.domElement.dataset.adBoardTextureRepeats = String(AD_BOARD_TEXTURE_REPEATS);
  active.renderer.domElement.dataset.adBoardTextureAspect = Number(active.adBoardTexture.userData.advertisingCanvasAspect ?? 0).toFixed(3);
  active.renderer.domElement.dataset.adBoardMipmaps = String(active.adBoardTexture.generateMipmaps);
  active.renderer.domElement.dataset.adBoardCornerRadius = AD_BOARD_CORNER_RADIUS.toFixed(2);
  active.renderer.domElement.dataset.adBoardCornerSegments = String(AD_BOARD_CORNER_SEGMENTS);
  active.renderer.domElement.dataset.adBoardScrollSpeed = AD_BOARD_SCROLL_SPEED.toFixed(3);
  active.renderer.domElement.dataset.adBoardPerimeterLength = Number(active.adBoardTexture.userData.perimeterLength ?? 0).toFixed(3);
  active.renderer.domElement.dataset.adBoardPerimeterSamples = String(active.adBoardTexture.userData.perimeterSampleCount ?? 0);
  active.renderer.domElement.dataset.pitchStripeCount = String(Math.ceil(FIELD_L / GRASS_STRIPE_WIDTH));
  active.renderer.domElement.dataset.pitchStripeWidth = (FIELD_L / Math.ceil(FIELD_L / GRASS_STRIPE_WIDTH)).toFixed(3);
  active.renderer.domElement.dataset.pitchSurfaceWidth = FIELD_W.toFixed(2);
  active.renderer.domElement.dataset.pitchSurfaceLength = FIELD_L.toFixed(2);
  active.renderer.domElement.dataset.pitchDarkGrass = GRASS_DARK_COLOR;
  active.renderer.domElement.dataset.pitchLightGrass = GRASS_LIGHT_COLOR;
  active.renderer.domElement.dataset.outerGrassColor = OUTER_GRASS_COLOR;
  active.renderer.domElement.dataset.locomotionStrideLengths = JSON.stringify(LOCOMOTION_STRIDE_LENGTHS);
  active.renderer.domElement.dataset.locomotionReferenceStepsPerSecond = JSON.stringify(Object.fromEntries(
    Object.entries(LOCOMOTION_STRIDE_LENGTHS).map(([state, stride]) => [
      state,
      Number((LOCOMOTION_REFERENCE_SPEEDS[state as keyof typeof LOCOMOTION_REFERENCE_SPEEDS] * 2 / stride).toFixed(2)),
    ]),
  ));
  active.renderer.domElement.dataset.stadiumDiagnostics = JSON.stringify(active.adBoardTexture.userData.stadiumDiagnostics ?? {});
}

export function resolveAdvertisingBoardCollision(active: MatchRuntime) {
  if (active.ballOwnerId || active.ballPos.y > AD_BOARD_COLLISION_TOP) return;
  const xLimit = AD_BOARD_INNER_X - BALL_RADIUS;
  const zLimit = AD_BOARD_INNER_Z - BALL_RADIUS;
  const cornerCenterX = AD_BOARD_INNER_X - AD_BOARD_FACE_OFFSET - AD_BOARD_CORNER_RADIUS;
  const cornerCenterZ = AD_BOARD_INNER_Z - AD_BOARD_FACE_OFFSET - AD_BOARD_CORNER_RADIUS;
  const cornerCollisionRadius = AD_BOARD_CORNER_RADIUS + AD_BOARD_FACE_OFFSET - BALL_RADIUS;
  const absX = Math.abs(active.ballPos.x);
  const absZ = Math.abs(active.ballPos.z);
  let hitSurface: "x" | "z" | "corner" | null = null;
  if (absZ <= cornerCenterZ && absX >= xLimit && active.ballVel.x * active.ballPos.x > 0) {
    active.ballPos.x = Math.sign(active.ballPos.x || 1) * xLimit;
    active.ballVel.x *= -0.58;
    active.ballVel.z *= 0.9;
    hitSurface = "x";
  }
  if (absX <= cornerCenterX && absZ >= zLimit && active.ballVel.z * active.ballPos.z > 0) {
    active.ballPos.z = Math.sign(active.ballPos.z || 1) * zLimit;
    active.ballVel.z *= -0.58;
    active.ballVel.x *= 0.9;
    hitSurface = "z";
  }
  if (absX > cornerCenterX && absZ > cornerCenterZ) {
    const center = new THREE.Vector3(
      Math.sign(active.ballPos.x || 1) * cornerCenterX,
      active.ballPos.y,
      Math.sign(active.ballPos.z || 1) * cornerCenterZ,
    );
    const normal = active.ballPos.clone().sub(center).setY(0);
    const distance = normal.length();
    if (distance > cornerCollisionRadius && distance > 0.0001) {
      normal.multiplyScalar(1 / distance);
      const outwardSpeed = active.ballVel.dot(normal);
      active.ballPos.copy(center).addScaledVector(normal, cornerCollisionRadius);
      if (outwardSpeed > 0) {
        active.ballVel.addScaledVector(normal, -(1 + 0.58) * outwardSpeed);
        active.ballVel.x *= 0.9;
        active.ballVel.z *= 0.9;
      }
      hitSurface = "corner";
      active.renderer.domElement.dataset.lastAdBoardCornerNormalX = normal.x.toFixed(4);
      active.renderer.domElement.dataset.lastAdBoardCornerNormalZ = normal.z.toFixed(4);
    }
  }
  if (!hitSurface) return;
  active.ballVel.y = Math.max(0.4, Math.abs(active.ballVel.y) * 0.28);
  active.adBoardBounces += 1;
  active.renderer.domElement.dataset.lastAdBoardBounce = hitSurface;
  active.renderer.domElement.dataset.adBoardBounces = String(active.adBoardBounces);
}
