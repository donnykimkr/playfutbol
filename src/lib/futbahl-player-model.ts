import * as THREE from "three";
import {
  BODY_PRESETS as ANONYMOUS_BODY_PRESETS,
  type BodyPresetId,
} from "@/lib/anonymous-team-setup";
import {
  AWAY_COLOR,
  AWAY_KEEPER_COLOR,
  AWAY_SHORTS,
  AWAY_TRIM,
  HOME_KIT,
} from "@/lib/futbahl-match-config";
import type { PlayerRole, TeamId } from "@/lib/futbahl-match-types";
import { sharedBasicMaterial, sharedGeometry, sharedLambertMaterial } from "@/lib/futbahl-three-resources";

function createEllipticalSectionGeometry(
  rings: Array<{ y: number; radiusX: number; radiusZ: number }>,
  radialSegments = 8,
) {
  const geometry = new THREE.BufferGeometry();
  const positions: number[] = [];
  const indices: number[] = [];
  rings.forEach((ring) => {
    for (let segment = 0; segment < radialSegments; segment += 1) {
      const angle = segment / radialSegments * Math.PI * 2;
      positions.push(
        Math.cos(angle) * ring.radiusX,
        ring.y,
        Math.sin(angle) * ring.radiusZ,
      );
    }
  });
  for (let ring = 0; ring < rings.length - 1; ring += 1) {
    for (let segment = 0; segment < radialSegments; segment += 1) {
      const next = (segment + 1) % radialSegments;
      const currentBottom = ring * radialSegments + segment;
      const nextBottom = ring * radialSegments + next;
      const currentTop = (ring + 1) * radialSegments + segment;
      const nextTop = (ring + 1) * radialSegments + next;
      indices.push(currentBottom, currentTop, nextBottom, nextBottom, currentTop, nextTop);
    }
  }
  const bottomCenter = positions.length / 3;
  positions.push(0, rings[0].y, 0);
  const topCenter = positions.length / 3;
  positions.push(0, rings[rings.length - 1].y, 0);
  for (let segment = 0; segment < radialSegments; segment += 1) {
    const next = (segment + 1) % radialSegments;
    // Ring vertices advance counter-clockwise in X/Z. The bottom and top
    // caps need opposite winding so FrontSide culling keeps both exteriors.
    indices.push(bottomCenter, segment, next);
    const topOffset = (rings.length - 1) * radialSegments;
    indices.push(topCenter, topOffset + next, topOffset + segment);
  }
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createTorsoGeometry() {
  return createEllipticalSectionGeometry([
    { y: -0.62, radiusX: 0.31, radiusZ: 0.2 },
    { y: -0.34, radiusX: 0.36, radiusZ: 0.22 },
    { y: 0.08, radiusX: 0.48, radiusZ: 0.26 },
    { y: 0.45, radiusX: 0.57, radiusZ: 0.29 },
    { y: 0.64, radiusX: 0.5, radiusZ: 0.25 },
  ], 12);
}

function createPelvisGeometry() {
  return createEllipticalSectionGeometry([
    { y: -0.25, radiusX: 0.35, radiusZ: 0.21 },
    { y: 0.01, radiusX: 0.42, radiusZ: 0.25 },
    { y: 0.24, radiusX: 0.36, radiusZ: 0.22 },
  ], 10);
}

function createShirtHemGeometry() {
  return createEllipticalSectionGeometry([
    { y: -0.08, radiusX: 0.34, radiusZ: 0.215 },
    { y: 0.08, radiusX: 0.37, radiusZ: 0.23 },
  ], 12);
}

function createUpperArmGeometry() {
  return createEllipticalSectionGeometry([
    { y: -0.24, radiusX: 0.1, radiusZ: 0.09 },
    { y: -0.08, radiusX: 0.12, radiusZ: 0.105 },
    { y: 0.1, radiusX: 0.135, radiusZ: 0.12 },
    { y: 0.24, radiusX: 0.15, radiusZ: 0.135 },
  ], 10);
}

function createForearmGeometry() {
  return createEllipticalSectionGeometry([
    { y: -0.26, radiusX: 0.085, radiusZ: 0.075 },
    { y: -0.08, radiusX: 0.095, radiusZ: 0.085 },
    { y: 0.1, radiusX: 0.105, radiusZ: 0.095 },
    { y: 0.22, radiusX: 0.09, radiusZ: 0.08 },
  ], 10);
}

function createSleeveGeometry() {
  return createEllipticalSectionGeometry([
    { y: -0.19, radiusX: 0.13, radiusZ: 0.12 },
    { y: -0.02, radiusX: 0.15, radiusZ: 0.135 },
    { y: 0.14, radiusX: 0.17, radiusZ: 0.15 },
  ], 10);
}

function createThighGeometry() {
  return createEllipticalSectionGeometry([
    { y: -0.3, radiusX: 0.145, radiusZ: 0.13 },
    { y: -0.12, radiusX: 0.175, radiusZ: 0.155 },
    { y: 0.12, radiusX: 0.19, radiusZ: 0.17 },
    { y: 0.3, radiusX: 0.205, radiusZ: 0.18 },
  ], 10);
}

function createCalfGeometry() {
  return createEllipticalSectionGeometry([
    { y: -0.29, radiusX: 0.09, radiusZ: 0.08 },
    { y: -0.08, radiusX: 0.135, radiusZ: 0.12 },
    { y: 0.13, radiusX: 0.155, radiusZ: 0.135 },
    { y: 0.25, radiusX: 0.13, radiusZ: 0.115 },
  ], 10);
}

function createShortsLegGeometry() {
  return createEllipticalSectionGeometry([
    { y: -0.2, radiusX: 0.2, radiusZ: 0.18 },
    { y: 0.04, radiusX: 0.22, radiusZ: 0.2 },
    { y: 0.18, radiusX: 0.21, radiusZ: 0.19 },
  ], 10);
}

function createFootballBootGeometry() {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array([
    -0.11, -0.09, -0.16, 0.11, -0.09, -0.16, 0.1, 0.09, -0.13, -0.1, 0.09, -0.13,
    -0.145, -0.08, 0.36, 0.145, -0.08, 0.36, 0.12, 0.055, 0.32, -0.12, 0.055, 0.32,
  ]);
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setIndex([
    0, 1, 2, 0, 2, 3,
    4, 6, 5, 4, 7, 6,
    0, 4, 5, 0, 5, 1,
    3, 2, 6, 3, 6, 7,
    1, 5, 6, 1, 6, 2,
    0, 3, 7, 0, 7, 4,
  ]);
  geometry.computeVertexNormals();
  return geometry;
}

function makeHumanFigure({
  shirt,
  trim,
  shorts,
  socks = "#f8fafc",
  boot = "#d1d5db",
  skin = "#e8b88f",
  hair = "#3f2b1d",
  accent,
  bodyPresetId = "balanced",
  receiverColor = "#60a5fa",
}: {
  shirt: string;
  trim: string;
  shorts: string;
  socks?: string;
  boot?: string;
  skin?: string;
  hair?: string;
  accent?: string;
  sponsor?: string;
  bodyPresetId?: BodyPresetId;
  receiverColor?: string;
}) {
  const bodyPreset = ANONYMOUS_BODY_PRESETS[bodyPresetId];
  const group = new THREE.Group();
  const bodyRoot = new THREE.Group();
  bodyRoot.name = "body-root";

  const shirtMaterial = sharedLambertMaterial(shirt);
  const trimMaterial = sharedLambertMaterial(trim);
  const shortsMaterial = sharedLambertMaterial(shorts);
  const skinMaterial = sharedLambertMaterial(skin);
  const hairMaterial = sharedLambertMaterial(hair);
  const sockMaterial = sharedLambertMaterial(socks);
  const bootMaterial = sharedLambertMaterial(boot);
  const featureMaterial = sharedBasicMaterial("#1b120d");

  const pelvisRoot = new THREE.Group();
  pelvisRoot.name = "pelvis-root";
  const pelvisRestY = 1.48;
  pelvisRoot.position.y = pelvisRestY;
  pelvisRoot.userData.restY = pelvisRestY;
  const hip = new THREE.Mesh(sharedGeometry("player-hip-athletic", createPelvisGeometry), shortsMaterial);
  hip.position.y = 0;
  const spineLower = new THREE.Group();
  spineLower.name = "spine-lower";
  spineLower.position.y = 0.18;
  const spineUpper = new THREE.Group();
  spineUpper.name = "spine-upper";
  spineUpper.position.y = 0.5;
  const torso = new THREE.Mesh(sharedGeometry("player-torso-athletic", createTorsoGeometry), shirtMaterial);
  torso.name = "torso";
  torso.position.y = 0.43;
  const shirtHem = new THREE.Mesh(sharedGeometry("player-shirt-hem-closed", createShirtHemGeometry), shirtMaterial);
  shirtHem.name = "shirt-hem";
  shirtHem.position.y = -0.14;
  const chestRoot = new THREE.Group();
  chestRoot.name = "chest-root";
  chestRoot.position.y = 0.36;
  const collar = new THREE.Mesh(sharedGeometry("player-collar", () => new THREE.TorusGeometry(0.16, 0.034, 5, 10, Math.PI)), trimMaterial);
  collar.rotation.x = Math.PI / 2;
  collar.position.set(0, 0.14, 0.23);
  const neckBase = new THREE.Group();
  neckBase.name = "neck-base";
  neckBase.position.y = 0.28;
  const neckBaseMesh = new THREE.Mesh(sharedGeometry("player-neck-base", () => new THREE.CylinderGeometry(0.105, 0.14, 0.15, 7)), skinMaterial);
  neckBaseMesh.position.y = 0.065;
  const neckTop = new THREE.Group();
  neckTop.name = "neck-top";
  neckTop.position.y = 0.14;
  const neckTopMesh = new THREE.Mesh(sharedGeometry("player-neck-top", () => new THREE.CylinderGeometry(0.095, 0.108, 0.14, 7)), skinMaterial);
  neckTopMesh.position.y = 0.055;
  const headRoot = new THREE.Group();
  headRoot.name = "head-root";
  headRoot.position.y = 0.12;
  const head = new THREE.Mesh(sharedGeometry("player-head", () => new THREE.SphereGeometry(0.245, 8, 6)), skinMaterial);
  head.name = "head";
  head.scale.set(0.84, 1.08, 0.88);
  head.position.y = 0.17;
  const headContact = new THREE.Object3D();
  headContact.name = "head-contact";
  headContact.position.set(0, 0.2, 0.2);
  const hairCap = new THREE.Mesh(sharedGeometry("player-hair-cap", () => new THREE.SphereGeometry(0.26, 7, 4, 0, Math.PI * 2, 0, Math.PI / 2)), hairMaterial);
  hairCap.scale.set(0.88, 0.5, 0.94);
  hairCap.position.y = 0.39;
  const jaw = new THREE.Mesh(sharedGeometry("player-jaw", () => new THREE.SphereGeometry(0.19, 7, 5)), skinMaterial);
  jaw.scale.set(0.88, 0.72, 0.84);
  jaw.position.set(0, 0.06, 0.02);
  const nose = new THREE.Mesh(sharedGeometry("player-nose", () => new THREE.ConeGeometry(0.035, 0.085, 4)), skinMaterial);
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, 0.18, 0.245);

  [-1, 1].forEach((side) => {
    const clavicle = new THREE.Group();
    clavicle.name = side < 0 ? "left-clavicle" : "right-clavicle";
    clavicle.position.set(side * 0.3, 0.17, 0.01);
    clavicle.rotation.z = side * 0.045;
    const shoulder = new THREE.Group();
    shoulder.name = side < 0 ? "left-arm" : "right-arm";
    shoulder.position.set(side * bodyPreset.shoulderWidth, 0, 0);
    shoulder.rotation.z = side * 0.105;
    const sleeve = new THREE.Mesh(sharedGeometry("player-shirt-sleeve-closed", createSleeveGeometry), shirtMaterial);
    sleeve.position.y = -0.08;
    const upperArm = new THREE.Mesh(sharedGeometry("player-upper-arm-tapered", createUpperArmGeometry), skinMaterial);
    upperArm.position.y = -0.32;
    const elbow = new THREE.Group();
    elbow.name = side < 0 ? "left-elbow" : "right-elbow";
    elbow.position.y = -0.53;
    // Elbow animation uses one positive local-X hinge convention on both sides.
    // The relaxed bend is supplied by locomotion rather than baked into rest.
    elbow.rotation.x = 0;
    const forearm = new THREE.Mesh(sharedGeometry("player-forearm-tapered", createForearmGeometry), skinMaterial);
    forearm.position.y = -0.24;
    const hand = new THREE.Mesh(sharedGeometry("player-hand", () => new THREE.SphereGeometry(0.105, 6, 5)), skinMaterial);
    hand.name = side < 0 ? "left-hand" : "right-hand";
    hand.scale.set(0.82, 1.12, 0.72);
    hand.position.y = -0.5;
    elbow.add(forearm, hand);
    shoulder.add(sleeve, upperArm, elbow);
    clavicle.add(shoulder);
    chestRoot.add(clavicle);
  });

  [-1, 1].forEach((side) => {
    const leg = new THREE.Group();
    leg.name = side < 0 ? "left-leg" : "right-leg";
    leg.position.set(side * 0.225, -0.03, 0);
    leg.scale.y = bodyPreset.legLength;
    const shortsLeg = new THREE.Mesh(sharedGeometry("player-shorts-leg-closed", createShortsLegGeometry), shortsMaterial);
    shortsLeg.position.y = -0.12;
    const thigh = new THREE.Mesh(sharedGeometry("player-thigh-tapered", createThighGeometry), skinMaterial);
    thigh.name = side < 0 ? "left-thigh" : "right-thigh";
    thigh.position.y = -0.38;
    const knee = new THREE.Group();
    knee.name = side < 0 ? "left-knee" : "right-knee";
    knee.position.y = -0.72;
    const kneecap = new THREE.Mesh(sharedGeometry("player-kneecap", () => new THREE.SphereGeometry(0.14, 6, 5)), skinMaterial);
    kneecap.scale.set(1, 0.9, 0.92);
    const calf = new THREE.Mesh(sharedGeometry("player-calf-shaped", createCalfGeometry), sockMaterial);
    calf.name = side < 0 ? "left-calf" : "right-calf";
    calf.position.y = -0.28;
    const ankle = new THREE.Group();
    ankle.name = side < 0 ? "left-foot" : "right-foot";
    ankle.position.y = -0.62;
    const bootMesh = new THREE.Mesh(sharedGeometry("player-football-boot", createFootballBootGeometry), bootMaterial);
    bootMesh.name = side < 0 ? "left-boot" : "right-boot";
    bootMesh.position.set(0, -0.005, 0.145);
    bootMesh.scale.set(1.16, 1.08, 1.16);
    ankle.add(bootMesh);
    knee.add(kneecap, calf, ankle);
    leg.add(shortsLeg, thigh, knee);
    pelvisRoot.add(leg);
  });

  [-1, 1].forEach((side) => {
    const eye = new THREE.Mesh(sharedGeometry("player-eye", () => new THREE.SphereGeometry(0.025, 4, 3)), featureMaterial);
    eye.position.set(side * 0.072, 0.23, 0.225);
    headRoot.add(eye);
  });
  const mouth = new THREE.Mesh(sharedGeometry("player-mouth", () => new THREE.BoxGeometry(0.1, 0.012, 0.01)), featureMaterial);
  mouth.position.set(0, 0.08, 0.235);

  torso.scale.x = bodyPreset.torsoWidth;
  if (bodyPreset.hairStyle === "curly") {
    const curlCount = 12;
    const curlGeometry = sharedGeometry("player-hair-curl", () => new THREE.SphereGeometry(0.072, 6, 5));
    for (let index = 0; index < curlCount; index += 1) {
      const angle = index / curlCount * Math.PI * 2;
      const curl = new THREE.Mesh(curlGeometry, hairMaterial);
      const crownLift = index % 2 === 0 ? 0.045 : 0;
      curl.position.set(Math.cos(angle) * 0.185, 0.37 + crownLift, Math.sin(angle) * 0.185);
      curl.scale.set(0.88, 0.96 + crownLift, 0.88);
      headRoot.add(curl);
    }
  } else if (bodyPreset.hairStyle === "buzz") {
    hairCap.scale.set(0.84, 0.25, 0.9);
    hairCap.position.y = 0.37;
  } else {
    hairCap.scale.set(0.89, 0.42, 0.95);
    hairCap.position.y = 0.39;
    const sweptFringeGeometry = sharedGeometry(
      "player-swept-fringe",
      () => new THREE.BoxGeometry(0.105, 0.075, 0.09, 1, 1, 1),
    );
    [-1, 0, 1].forEach((side, index) => {
      const fringe = new THREE.Mesh(sweptFringeGeometry, hairMaterial);
      fringe.position.set(side * 0.082, 0.365 + index * 0.014, 0.205);
      fringe.rotation.set(-0.34, 0, side * -0.16);
      fringe.scale.set(index === 1 ? 1.12 : 0.94, 1, 1);
      headRoot.add(fringe);
    });
    const templeGeometry = sharedGeometry(
      "player-hair-temple",
      () => new THREE.SphereGeometry(0.075, 6, 4),
    );
    [-1, 1].forEach((side) => {
      const temple = new THREE.Mesh(templeGeometry, hairMaterial);
      temple.position.set(side * 0.205, 0.315, 0.025);
      temple.scale.set(0.62, 1.05, 0.78);
      headRoot.add(temple);
    });
  }

  headRoot.add(head, headContact, jaw, hairCap, nose, mouth);
  neckTop.add(neckTopMesh, headRoot);
  neckBase.add(neckBaseMesh, neckTop);
  chestRoot.add(collar, neckBase);
  spineUpper.add(chestRoot);
  spineLower.add(torso, shirtHem, spineUpper);
  pelvisRoot.add(hip, spineLower);
  bodyRoot.add(pelvisRoot);
  group.add(bodyRoot);
  group.scale.set(...bodyPreset.scale);

  group.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    child.castShadow = true;
    child.receiveShadow = false;
  });

  bodyRoot.traverse((joint) => {
    if (!(joint instanceof THREE.Group || joint instanceof THREE.Object3D)) return;
    joint.userData.restQuaternion = joint.quaternion.clone();
    joint.userData.restPosition = joint.position.clone();
  });

  const receiverMaterial = new THREE.MeshBasicMaterial({ color: receiverColor });
  receiverMaterial.transparent = true;
  receiverMaterial.opacity = 0.9;
  receiverMaterial.depthTest = false;
  receiverMaterial.depthWrite = false;
  const receiverMarker = new THREE.Mesh(
    sharedGeometry("receiver-diamond", () => new THREE.ConeGeometry(0.22, 0.42, 4)),
    receiverMaterial,
  );
  receiverMarker.name = "receiver-marker";
  receiverMarker.position.y = 3.52;
  receiverMarker.rotation.z = Math.PI;
  receiverMarker.renderOrder = 22;
  receiverMarker.visible = false;
  group.add(receiverMarker);

  if (accent) {
    const marker = new THREE.Mesh(
      sharedGeometry("control-diamond", () => new THREE.ConeGeometry(0.24, 0.46, 4)),
      new THREE.MeshBasicMaterial({
        color: "#67e8f9",
        transparent: true,
        opacity: 0.96,
        depthTest: false,
        depthWrite: false,
      }),
    );
    marker.rotation.z = Math.PI;
    marker.position.y = 3.66;
    marker.renderOrder = 24;
    marker.name = "control-marker";
    marker.visible = false;
    group.add(marker);
  }
  return group;
}

export function makeKit(
  team: TeamId,
  role: PlayerRole,
  accent: string,
  bodyPresetId: BodyPresetId = "balanced",
  configuredHomeColor?: string,
) {
  const isKeeper = role === "keeper";
  const home = HOME_KIT;
  const homeColor = configuredHomeColor || home.primary;
  const shirt = isKeeper ? (team === "home" ? home.keeper : AWAY_KEEPER_COLOR) : (team === "home" ? homeColor : AWAY_COLOR);
  const trim = isKeeper ? "#111827" : team === "home" ? home.secondary : AWAY_TRIM;
  const shorts = isKeeper ? "#111827" : team === "home" ? home.shorts : AWAY_SHORTS;
  const socks = isKeeper ? "#111827" : team === "home" ? home.socks : "#f8fafc";
  const boot = team === "home" ? "#d1d5db" : "#111827";
  const bodyPreset = ANONYMOUS_BODY_PRESETS[bodyPresetId];
  const figure = makeHumanFigure({
    shirt,
    trim,
    shorts,
    socks,
    boot,
    skin: bodyPreset.skin,
    hair: bodyPreset.hair,
    accent: isKeeper ? "#f8fafc" : team === "home" ? home.accent : accent,
    bodyPresetId,
    receiverColor: team === "home" ? "#60a5fa" : "#f87171",
  });
  return figure;
}
