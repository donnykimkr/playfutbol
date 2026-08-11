import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";

export type FutbahlLocomotionState =
  | "Idle"
  | "Walk"
  | "Jog"
  | "Run"
  | "Sprint"
  | "Accelerate"
  | "Decelerate"
  | "ForwardLeft"
  | "ForwardRight"
  | "BackwardLeft"
  | "BackwardRight"
  | "StrafeLeft"
  | "StrafeRight"
  | "Backpedal"
  | "TurnLeft"
  | "TurnRight"
  | "SharpTurnLeft"
  | "SharpTurnRight"
  | "TurnAround"
  | "Stop";

export type FutbahlLocomotionDirection =
  | "Forward"
  | "ForwardRight"
  | "Right"
  | "BackwardRight"
  | "Backward"
  | "BackwardLeft"
  | "Left"
  | "ForwardLeft";

export type FutbahlAnimationState =
  | FutbahlLocomotionState
  | "DefensiveReady"
  | "KeeperReady"
  | "Dribble"
  | "CloseControl"
  | "Pass"
  | "ShortPass"
  | "FirmPass"
  | "LongPass"
  | "ThroughPass"
  | "Shot"
  | "PowerShot"
  | "Header"
  | "SlideTackle"
  | "StandingTackle"
  | "Block"
  | "Interception"
  | "Receive"
  | "MovingReceive"
  | "FastReceive"
  | "Catch"
  | "KeeperDive"
  | "Recovery"
  | "PassRequest"
  | "Celebrate";

export type FutbahlPlayerAppearance = {
  playerId: string;
  team: "home" | "away";
  role: "field" | "keeper";
  number: number;
  index: number;
  shirt: string;
  trim: string;
  shorts: string;
  socks: string;
  boots: string;
};

export type FutbahlLocomotionDebugSnapshot = {
  state: FutbahlLocomotionState;
  direction: FutbahlLocomotionDirection;
  directionYaw: number;
  animationState: FutbahlAnimationState;
  clip: string;
  totalSpeed: number;
  localForwardSpeed: number;
  localLateralSpeed: number;
  acceleration: number;
  angularVelocity: number;
  turnRate: number;
  playbackSpeed: number;
  playerIndex: number;
  possessionState: string;
  distanceToBall: number;
  controlTargetDistance: number;
};

export type FutbahlMotionSample = {
  velocity: THREE.Vector3;
  visualSpeed?: number;
  heading: number;
  turnRate: number;
  dt: number;
  distanceToCamera?: number;
  kickTimer?: number;
  kickStyle?: string | null;
  kickDuration?: number;
  kickContactAfter?: number;
  preferredFoot?: "left" | "right";
  headerTimer?: number;
  catchTimer?: number;
  diveTimer?: number;
  diveSide?: number;
  passRequestTimer?: number;
  celebrateTimer?: number;
  tackleTimer?: number;
  recoveryTimer?: number;
  blockTimer?: number;
  firstTouchTimer?: number;
  firstTouchType?: "foot" | "thigh" | "chest" | null;
  receiveIncomingSpeed?: number;
  carryingBall?: boolean;
  closeControl?: boolean;
  standingTackle?: boolean;
  interception?: boolean;
  isKeeper?: boolean;
  defensive?: boolean;
  keeperAction?: string;
  playerIndex?: number;
  possessionState?: string;
  distanceToBall?: number;
  controlTargetDistance?: number;
};

export const LOCOMOTION_CLIPS: Record<FutbahlLocomotionState, string> = {
  Idle: "Idle_Loop",
  Walk: "Walk_Loop",
  Jog: "Jog_Fwd_Loop",
  Run: "Jog_Fwd_Loop",
  Sprint: "Sprint_Loop",
  Accelerate: "Jog_Fwd_Loop",
  Decelerate: "Jog_Fwd_Loop",
  ForwardLeft: "Walk_Loop",
  ForwardRight: "Walk_Loop",
  BackwardLeft: "Walk_Loop",
  BackwardRight: "Walk_Loop",
  StrafeLeft: "Walk_Loop",
  StrafeRight: "Walk_Loop",
  Backpedal: "Walk_Loop",
  TurnLeft: "Walk_Loop",
  TurnRight: "Walk_Loop",
  SharpTurnLeft: "Jog_Fwd_Loop",
  SharpTurnRight: "Jog_Fwd_Loop",
  TurnAround: "Jog_Fwd_Loop",
  Stop: "Idle_Loop",
};

export const QUATERNIUS_CLIP_INVENTORY = [
  "A_TPose", "Crouch_Fwd_Loop", "Crouch_Idle_Loop", "Dance_Loop", "Death01",
  "Driving_Loop", "Fixing_Kneeling", "Hit_Chest", "Hit_Head", "Idle_Loop",
  "Idle_Talking_Loop", "Idle_Torch_Loop", "Interact", "Jog_Fwd_Loop", "Jump_Land",
  "Jump_Loop", "Jump_Start", "PickUp_Table", "Pistol_Aim_Down", "Pistol_Aim_Neutral",
  "Pistol_Aim_Up", "Pistol_Idle_Loop", "Pistol_Reload", "Pistol_Shoot", "Punch_Cross",
  "Punch_Enter", "Punch_Jab", "Push_Loop", "Roll", "Roll_RM", "Sitting_Enter",
  "Sitting_Exit", "Sitting_Idle_Loop", "Sitting_Talking_Loop", "Spell_Simple_Enter",
  "Spell_Simple_Exit", "Spell_Simple_Idle_Loop", "Spell_Simple_Shoot", "Sprint_Loop",
  "Swim_Fwd_Loop", "Swim_Idle_Loop", "Sword_Attack", "Sword_Attack_RM", "Sword_Idle",
  "Walk_Formal_Loop", "Walk_Loop",
] as const;

export const QUATERNIUS_UAL2_CLIP_INVENTORY = [
  "A_TPose", "Chest_Open", "ClimbUp_1m", "Consume", "Farm_Harvest", "Farm_PlantSeed",
  "Farm_Watering", "Hit_Knockback", "Idle_FoldArms_Loop", "Idle_Lantern_Loop",
  "Idle_No_Loop", "Idle_Rail_Call", "Idle_Rail_Loop", "Idle_Shield_Break",
  "Idle_Shield_Loop", "Idle_TalkingPhone_Loop", "LayToIdle", "Melee_Hook",
  "Melee_Hook_Rec", "NinjaJump_Idle_Loop", "NinjaJump_Land", "NinjaJump_Start",
  "OverhandThrow", "Shield_Dash", "Shield_OneShot", "Slide_Exit", "Slide_Loop",
  "Slide_Start", "Sword_Block", "Sword_Dash", "Sword_Heavy_Combo", "Sword_Regular_A",
  "Sword_Regular_A_Rec", "Sword_Regular_B", "Sword_Regular_B_Rec", "Sword_Regular_C",
  "Sword_Regular_Combo", "TreeChopping_Loop", "Walk_Carry_Loop", "Yes",
  "Zombie_Idle_Loop", "Zombie_Scratch", "Zombie_Walk_Fwd_Loop",
] as const;

export const FOOTBALL_ANIMATION_MAP = {
  idle: ["Idle_Loop", "Idle_Talking_Loop"],
  walk: ["Walk_Loop", "Walk_Formal_Loop"],
  jogRun: ["Jog_Fwd_Loop"],
  sprint: ["Sprint_Loop"],
  defensiveReady: ["Crouch_Idle_Loop"],
  defensiveMove: ["Crouch_Fwd_Loop"],
  jumpHeader: ["Jump_Start", "Jump_Loop", "Jump_Land"],
  contactReaction: ["Hit_Chest", "Hit_Head"],
  passRequest: ["Interact"],
  celebration: ["Dance_Loop"],
  benchOnly: ["Sitting_Enter", "Sitting_Idle_Loop", "Sitting_Exit"],
  proceduralFallbacks: ["Pass", "Shot", "SlideTackle", "Block", "Catch", "KeeperDive", "Shield"],
} as const;

export const FUTBAHL_CHARACTER_ASSETS = {
  animation: "/models/futbahl-locomotion-prototype.glb",
  animationLibrary2: "/models/quaternius-ual2-standard.glb",
  male: "/models/futbahl-base-male.glb",
  wordmark: "/branding/futbahl-wordmark-white.png",
  hair: [
    "/models/quaternius-hair/Hair_Buzzed.glb",
    "/models/quaternius-hair/Hair_SimpleParted.glb",
  ],
  characterLicense: "/models/futbahl-base-characters.LICENSE.txt",
  animationLicense: "/models/futbahl-locomotion-prototype.LICENSE.txt",
  animationLibrary2License: "/models/quaternius-ual2-standard.LICENSE.txt",
  source: "Quaternius Universal Base Characters, Universal Animation Library, and Universal Animation Library 2",
  license: "CC0 1.0",
} as const;

const FALLBACK_CLIPS: Record<FutbahlLocomotionState, string[]> = {
  Idle: ["Idle_Loop"],
  Walk: ["Walk_Loop", "Jog_Fwd_Loop"],
  Jog: ["Jog_Fwd_Loop", "Walk_Loop"],
  Run: ["Jog_Fwd_Loop", "Sprint_Loop"],
  Sprint: ["Sprint_Loop", "Jog_Fwd_Loop"],
  Accelerate: ["Jog_Fwd_Loop", "Sprint_Loop"],
  Decelerate: ["Jog_Fwd_Loop", "Walk_Loop"],
  ForwardLeft: ["Walk_Loop", "Jog_Fwd_Loop"],
  ForwardRight: ["Walk_Loop", "Jog_Fwd_Loop"],
  BackwardLeft: ["Walk_Loop", "Jog_Fwd_Loop"],
  BackwardRight: ["Walk_Loop", "Jog_Fwd_Loop"],
  StrafeLeft: ["Walk_Loop", "Jog_Fwd_Loop"],
  StrafeRight: ["Walk_Loop", "Jog_Fwd_Loop"],
  Backpedal: ["Walk_Loop", "Jog_Fwd_Loop"],
  TurnLeft: ["Walk_Loop", "Idle_Loop"],
  TurnRight: ["Walk_Loop", "Idle_Loop"],
  SharpTurnLeft: ["Jog_Fwd_Loop", "Walk_Loop"],
  SharpTurnRight: ["Jog_Fwd_Loop", "Walk_Loop"],
  TurnAround: ["Jog_Fwd_Loop", "Walk_Loop"],
  Stop: ["Idle_Loop", "Walk_Loop"],
};

const TARGET_TO_SOURCE_BONES: Record<string, string> = {
  Head: "DEF-head",
  neck_01: "DEF-neck",
  hand_l: "DEF-hand.L",
  hand_r: "DEF-hand.R",
  lowerarm_l: "DEF-forearm.L",
  lowerarm_r: "DEF-forearm.R",
  upperarm_l: "DEF-upper_arm.L",
  upperarm_r: "DEF-upper_arm.R",
  clavicle_l: "DEF-shoulder.L",
  clavicle_r: "DEF-shoulder.R",
  spine_03: "DEF-spine.003",
  spine_02: "DEF-spine.002",
  spine_01: "DEF-spine.001",
  ball_l: "DEF-toe.L",
  ball_r: "DEF-toe.R",
  foot_l: "DEF-foot.L",
  foot_r: "DEF-foot.R",
  calf_l: "DEF-shin.L",
  calf_r: "DEF-shin.R",
  thigh_l: "DEF-thigh.L",
  thigh_r: "DEF-thigh.R",
  pelvis: "DEF-hips",
  root: "root",
};

type SharedCharacterAsset = {
  scene: THREE.Group;
  clips: THREE.AnimationClip[];
};

type SharedCharacterAssets = {
  male: SharedCharacterAsset;
  hair: Array<THREE.Group | null>;
  wordmark: THREE.Texture | null;
};

const loader = new GLTFLoader();
const warned = new Set<string>();
const bodyMaterialCache = new Map<string, THREE.Material>();
const clothingMaterialCache = new Map<string, THREE.MeshStandardMaterial>();
const hairMaterialCache = new Map<string, THREE.Material | THREE.Material[]>();
const uniformDecalMaterialCache = new Map<string, THREE.MeshBasicMaterial>();
let sharedAssetsPromise: Promise<SharedCharacterAssets> | null = null;

const KIT_GEOMETRY = {
  boot: new THREE.SphereGeometry(0.11, 8, 5),
} as const;

function warnOnce(key: string, message: string, error?: unknown) {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(message, error ?? "");
}

function firstSkinnedMesh(root: THREE.Object3D): THREE.SkinnedMesh | null {
  let result: THREE.SkinnedMesh | null = null;
  root.traverse((object) => {
    if (!result && object instanceof THREE.SkinnedMesh) result = object;
  });
  return result;
}

function normalizedBoneName(name: string) {
  return name.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

const TARGET_BONE_BY_SOURCE = new Map(
  Object.entries(TARGET_TO_SOURCE_BONES).map(([target, source]) => [
    normalizedBoneName(source),
    target,
  ]),
);
const TARGET_BONE_NAMES = new Map(
  Object.keys(TARGET_TO_SOURCE_BONES).map((target) => [normalizedBoneName(target), target]),
);

function makeRetargetedAsset(base: GLTF, animation: GLTF): SharedCharacterAsset {
  const target = firstSkinnedMesh(base.scene);
  const source = firstSkinnedMesh(animation.scene);
  if (!target || !source) {
    throw new Error("The licensed character or animation GLB does not contain a skinned mesh.");
  }
  const sourceHip = source.skeleton.getBoneByName("DEF-hips") ?? source.skeleton.getBoneByName("pelvis");
  const targetHip = target.skeleton.getBoneByName("pelvis");
  const clips = animation.animations.map((clip) => {
    const tracks = clip.tracks.flatMap((track) => {
      const propertySeparator = track.name.lastIndexOf(".");
      if (propertySeparator < 0) return [];
      const sourceName = track.name.slice(0, propertySeparator);
      const propertyName = track.name.slice(propertySeparator + 1);
      const normalizedSourceName = normalizedBoneName(sourceName);
      const targetName = TARGET_BONE_BY_SOURCE.get(normalizedSourceName)
        ?? TARGET_BONE_NAMES.get(normalizedSourceName);
      if (!targetName || targetName === "root" || propertyName === "scale") return [];
      if (propertyName === "position" && targetName !== "pelvis") return [];

      const remapped = track.clone();
      remapped.name = `${targetName}.${propertyName}`;
      if (
        propertyName === "position"
        && targetName === "pelvis"
        && sourceHip
        && targetHip
      ) {
        const values = remapped.values as Float32Array;
        const heightOffset = targetHip.position.z - sourceHip.position.z;
        for (let index = 0; index < values.length; index += 3) {
          values[index] = targetHip.position.x;
          values[index + 1] = targetHip.position.y;
          values[index + 2] += heightOffset;
        }
      }
      return [remapped];
    });
    return new THREE.AnimationClip(clip.name, clip.duration, tracks).optimize();
  });
  return { scene: base.scene as THREE.Group, clips };
}

function loadSharedAssets() {
  sharedAssetsPromise ??= Promise.all([
    loader.loadAsync(FUTBAHL_CHARACTER_ASSETS.animation),
    loader.loadAsync(FUTBAHL_CHARACTER_ASSETS.animationLibrary2),
    loader.loadAsync(FUTBAHL_CHARACTER_ASSETS.male),
    new THREE.TextureLoader().loadAsync(FUTBAHL_CHARACTER_ASSETS.wordmark).catch((error) => {
      warnOnce("wordmark", "[Futbahl player] Uniform wordmark failed to load; continuing without it.", error);
      return null;
    }),
    Promise.all(FUTBAHL_CHARACTER_ASSETS.hair.map((path) => loader.loadAsync(path)
      .then((gltf) => gltf.scene as THREE.Group)
      .catch((error) => {
        warnOnce(`hair:${path}`, `[Futbahl player] Licensed hairstyle "${path}" failed to load; using the base hairstyle.`, error);
        return null;
      }))),
  ]).then(([animation, animationLibrary2, male, wordmark, hair]) => {
    if (wordmark) {
      wordmark.colorSpace = THREE.SRGBColorSpace;
      wordmark.generateMipmaps = false;
      wordmark.minFilter = THREE.LinearFilter;
      wordmark.magFilter = THREE.LinearFilter;
    }
    const primary = makeRetargetedAsset(male, animation);
    const secondary = makeRetargetedAsset(male, animationLibrary2);
    const clipsByName = new Map(primary.clips.map((clip) => [clip.name, clip]));
    secondary.clips.forEach((clip) => clipsByName.set(clip.name, clip));
    return {
      male: { scene: primary.scene, clips: [...clipsByName.values()] },
      hair,
      wordmark,
    };
  });
  return sharedAssetsPromise;
}

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function makeBodyMaterial(
  original: THREE.MeshStandardMaterial,
  appearance: FutbahlPlayerAppearance,
  skinTone: string,
) {
  const key = [
    original.uuid,
    appearance.shirt,
    appearance.trim,
    appearance.shorts,
    appearance.socks,
    appearance.boots,
    skinTone,
  ].join("|");
  const cached = bodyMaterialCache.get(key);
  if (cached) return cached;

  const material = original.clone();
  material.roughness = 0.82;
  material.metalness = 0;
  const skin = new THREE.Color(skinTone);
  const shirt = new THREE.Color(appearance.shirt);
  const trim = new THREE.Color(appearance.trim);
  const shorts = new THREE.Color(appearance.shorts);
  const socks = new THREE.Color(appearance.socks);
  const boots = new THREE.Color(appearance.boots);
  material.onBeforeCompile = (shader) => {
    shader.uniforms.futbahlSkin = { value: skin };
    shader.uniforms.futbahlShirt = { value: shirt };
    shader.uniforms.futbahlTrim = { value: trim };
    shader.uniforms.futbahlShorts = { value: shorts };
    shader.uniforms.futbahlSocks = { value: socks };
    shader.uniforms.futbahlBoots = { value: boots };
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec2 vFutbahlBindXY;",
      )
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvFutbahlBindXY = position.xy;",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        [
          "#include <common>",
          "varying vec2 vFutbahlBindXY;",
          "uniform vec3 futbahlSkin;",
          "uniform vec3 futbahlShirt;",
          "uniform vec3 futbahlTrim;",
          "uniform vec3 futbahlShorts;",
          "uniform vec3 futbahlSocks;",
          "uniform vec3 futbahlBoots;",
        ].join("\n"),
      )
      .replace(
        "#include <map_fragment>",
        [
          "#include <map_fragment>",
          "float sourceLuma = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));",
          "float skinMask = smoothstep(0.24, 0.48, sourceLuma);",
          "vec3 skinDetail = diffuseColor.rgb / max(sourceLuma, 0.12);",
          "diffuseColor.rgb = mix(diffuseColor.rgb, skinDetail * futbahlSkin, skinMask);",
          "float bindX = abs(vFutbahlBindXY.x);",
          "float bindY = vFutbahlBindXY.y;",
          "float torsoWidth = 1.0 - smoothstep(0.29, 0.39, bindX);",
          "float shirtHeight = smoothstep(1.00, 1.055, bindY) * (1.0 - smoothstep(1.54, 1.59, bindY));",
          "float shirtMask = torsoWidth * shirtHeight;",
          "float collarMask = torsoWidth * smoothstep(1.47, 1.51, bindY) * (1.0 - smoothstep(1.55, 1.59, bindY));",
          "float shortsWidth = 1.0 - smoothstep(0.20, 0.31, bindX);",
          "float shortsMask = shortsWidth * smoothstep(0.69, 0.75, bindY) * (1.0 - smoothstep(1.03, 1.08, bindY));",
          "float socksMask = smoothstep(0.17, 0.22, bindY) * (1.0 - smoothstep(0.62, 0.69, bindY));",
          "float sockTrimMask = smoothstep(0.57, 0.6, bindY) * (1.0 - smoothstep(0.65, 0.69, bindY));",
          "float bootsMask = 1.0 - smoothstep(0.18, 0.23, bindY);",
          "diffuseColor.rgb = mix(diffuseColor.rgb, futbahlShirt, shirtMask);",
          "diffuseColor.rgb = mix(diffuseColor.rgb, futbahlTrim, collarMask);",
          "diffuseColor.rgb = mix(diffuseColor.rgb, futbahlShorts, shortsMask);",
          "diffuseColor.rgb = mix(diffuseColor.rgb, futbahlSocks, socksMask);",
          "diffuseColor.rgb = mix(diffuseColor.rgb, futbahlTrim, sockTrimMask);",
          "diffuseColor.rgb = mix(diffuseColor.rgb, futbahlBoots, bootsMask);",
        ].join("\n"),
      );
  };
  material.customProgramCacheKey = () => `futbahl-kit-surface-v1-${key}`;
  material.needsUpdate = true;
  bodyMaterialCache.set(key, material);
  return material;
}

function makeClothingMaterial(color: string, part: string) {
  const key = `${part}|${color}`;
  const cached = clothingMaterialCache.get(key);
  if (cached) return cached;
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: part === "boots" ? 0.62 : 0.88,
    metalness: 0,
  });
  clothingMaterialCache.set(key, material);
  return material;
}

function attachRootSpaceObject(
  root: THREE.Group,
  boneName: string,
  object: THREE.Object3D,
) {
  const bone = root.getObjectByName(boneName);
  if (!bone) {
    root.add(object);
    return;
  }
  root.add(object);
  root.updateMatrixWorld(true);
  bone.attach(object);
}

function addUniformBranding(root: THREE.Group, wordmark: THREE.Texture | null) {
  if (wordmark) {
    let logoMaterial = uniformDecalMaterialCache.get("wordmark");
    if (!logoMaterial) {
      logoMaterial = new THREE.MeshBasicMaterial({
        map: wordmark,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      });
      uniformDecalMaterialCache.set("wordmark", logoMaterial);
    }
    const chest = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.078), logoMaterial);
    chest.name = "futbahl-uniform-wordmark";
    chest.position.set(0, 1.32, -0.154);
    chest.rotation.y = Math.PI;
    attachRootSpaceObject(root, "spine_02", chest);
  }
}

function addOriginalFootballKit(
  root: THREE.Group,
  appearance: FutbahlPlayerAppearance,
  wordmark: THREE.Texture | null,
) {
  for (const side of ["l", "r"] as const) {
    const foot = root.getObjectByName(`foot_${side}`);
    if (!foot) continue;
    const boot = new THREE.Mesh(
      KIT_GEOMETRY.boot,
      makeClothingMaterial(appearance.boots, "boots"),
    );
    boot.name = `futbahl-football-boot-${side}`;
    boot.position.set(0, 0.055, 0.085);
    boot.scale.set(0.82, 0.58, 1.55);
    boot.castShadow = true;
    foot.add(boot);
  }

  addUniformBranding(root, wordmark);
}

function attachLicensedHair(
  root: THREE.Group,
  source: THREE.Group | null,
  color: string,
) {
  if (!source) return;
  const head = root.getObjectByName("Head");
  if (!head) return;
  root.updateMatrixWorld(true);
  source.updateMatrixWorld(true);
  const targetHeadInRoot = root.matrixWorld.clone().invert().multiply(head.matrixWorld);
  const inverseTargetHeadInRoot = targetHeadInRoot.invert();
  const inverseSourceRoot = source.matrixWorld.clone().invert();
  source.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    const key = `${object.uuid}|${color}`;
    const cachedMaterial = hairMaterialCache.get(key);
    let material: THREE.Material | THREE.Material[];
    if (cachedMaterial) {
      material = cachedMaterial;
    } else {
      material = Array.isArray(object.material)
        ? object.material.map((entry) => entry.clone())
        : object.material.clone();
      const materials = Array.isArray(material) ? material : [material];
      materials.forEach((entry) => {
        if (entry instanceof THREE.MeshStandardMaterial) {
          entry.color.set(color);
          entry.roughness = 0.9;
          entry.metalness = 0;
        }
      });
      hairMaterialCache.set(key, material);
    }
    const hairMesh = new THREE.Mesh(object.geometry, material);
    hairMesh.name = "futbahl-licensed-hair";
    hairMesh.castShadow = true;
    const sourceObjectInRoot = inverseSourceRoot.clone().multiply(object.matrixWorld);
    const localMatrix = inverseTargetHeadInRoot.clone().multiply(sourceObjectInRoot);
    localMatrix.decompose(hairMesh.position, hairMesh.quaternion, hairMesh.scale);
    head.add(hairMesh);
  });
}

function shortestAngleDelta(from: number, to: number) {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

function damp(current: number, target: number, smoothing: number, dt: number) {
  return THREE.MathUtils.lerp(current, target, 1 - Math.exp(-smoothing * dt));
}

const LOCOMOTION_DIRECTION_ORDER: readonly FutbahlLocomotionDirection[] = [
  "Forward",
  "ForwardRight",
  "Right",
  "BackwardRight",
  "Backward",
  "BackwardLeft",
  "Left",
  "ForwardLeft",
];

const LOCOMOTION_DIRECTION_ANGLE: Record<FutbahlLocomotionDirection, number> = {
  Forward: 0,
  ForwardRight: Math.PI / 4,
  Right: Math.PI / 2,
  BackwardRight: Math.PI * 3 / 4,
  Backward: Math.PI,
  BackwardLeft: -Math.PI * 3 / 4,
  Left: -Math.PI / 2,
  ForwardLeft: -Math.PI / 4,
};

const DIRECTIONAL_LOCOMOTION_STATES = new Set<FutbahlLocomotionState>([
  "ForwardLeft",
  "ForwardRight",
  "BackwardLeft",
  "BackwardRight",
  "StrafeLeft",
  "StrafeRight",
  "Backpedal",
]);

const REVERSE_LOCOMOTION_STATES = new Set<FutbahlLocomotionState>([
  "BackwardLeft",
  "BackwardRight",
  "Backpedal",
]);

export type FutbahlLocomotionDirectionInput = {
  speed: number;
  localForward: number;
  localLateral: number;
  previousDirection?: FutbahlLocomotionDirection;
  hysteresisRadians?: number;
};

/**
 * Quantizes local velocity into an eight-way blend-space sector. The small
 * angular hysteresis prevents left/right foot cycles from flickering when a
 * player runs close to a 22.5-degree sector boundary.
 */
export function selectFutbahlLocomotionDirection({
  speed,
  localForward,
  localLateral,
  previousDirection = "Forward",
  hysteresisRadians = 0.07,
}: FutbahlLocomotionDirectionInput): FutbahlLocomotionDirection {
  if (speed < 0.14 || Math.hypot(localForward, localLateral) < 0.08) return previousDirection;
  const angle = Math.atan2(localLateral, localForward);
  const previousAngle = LOCOMOTION_DIRECTION_ANGLE[previousDirection];
  if (Math.abs(shortestAngleDelta(previousAngle, angle)) <= Math.PI / 8 + hysteresisRadians) {
    return previousDirection;
  }
  const sector = (Math.round(angle / (Math.PI / 4)) + LOCOMOTION_DIRECTION_ORDER.length)
    % LOCOMOTION_DIRECTION_ORDER.length;
  return LOCOMOTION_DIRECTION_ORDER[sector];
}

function directionFromLocomotionState(state: FutbahlLocomotionState): FutbahlLocomotionDirection {
  if (state === "ForwardLeft") return "ForwardLeft";
  if (state === "ForwardRight") return "ForwardRight";
  if (state === "BackwardLeft") return "BackwardLeft";
  if (state === "BackwardRight") return "BackwardRight";
  if (state === "StrafeLeft") return "Left";
  if (state === "StrafeRight") return "Right";
  if (state === "Backpedal" || state === "TurnAround") return "Backward";
  return "Forward";
}

function directionalState(direction: FutbahlLocomotionDirection): FutbahlLocomotionState | null {
  if (direction === "ForwardLeft") return "ForwardLeft";
  if (direction === "ForwardRight") return "ForwardRight";
  if (direction === "BackwardLeft") return "BackwardLeft";
  if (direction === "BackwardRight") return "BackwardRight";
  if (direction === "Left") return "StrafeLeft";
  if (direction === "Right") return "StrafeRight";
  if (direction === "Backward") return "Backpedal";
  return null;
}

/**
 * The bundled Standard library supplies synchronized in-place Quaternius walk,
 * jog and sprint cycles. This chooses the matching gait without restarting the
 * cycle merely because its eight-way direction changed.
 */
export function locomotionClipForMotion(state: FutbahlLocomotionState, speed: number) {
  if (!DIRECTIONAL_LOCOMOTION_STATES.has(state)) return LOCOMOTION_CLIPS[state];
  if (speed >= 7.8) return "Sprint_Loop";
  if (speed >= 2.2) return "Jog_Fwd_Loop";
  return "Walk_Loop";
}

/**
 * Rotates the lower-body gait toward travel while backward sectors reverse the
 * synchronized cycle. The upper body is counter-rotated after mixer sampling.
 */
export function locomotionDirectionYaw(direction: FutbahlLocomotionDirection) {
  if (direction === "ForwardRight" || direction === "BackwardLeft") return Math.PI / 4;
  if (direction === "ForwardLeft" || direction === "BackwardRight") return -Math.PI / 4;
  if (direction === "Right") return Math.PI / 2;
  if (direction === "Left") return -Math.PI / 2;
  return 0;
}

export type FutbahlLocomotionSelectionInput = {
  speed: number;
  localForward: number;
  localLateral: number;
  acceleration: number;
  angularVelocity: number;
  previousSpeed: number;
  previousState: FutbahlLocomotionState;
  defensive: boolean;
  direction?: FutbahlLocomotionDirection;
};

function speedBandState(speed: number, previousState: FutbahlLocomotionState): FutbahlLocomotionState {
  // Separate enter/exit thresholds prevent Walk/Jog/Run/Sprint from flickering
  // when a player hovers around a boundary for several frames.
  if (previousState === "Sprint" && speed >= 7.55) return "Sprint";
  if ((previousState === "Run" || previousState === "Accelerate") && speed >= 4.75 && speed < 8.45) return "Run";
  if ((previousState === "Jog" || previousState === "Decelerate") && speed >= 1.82 && speed < 5.55) return "Jog";
  if (previousState === "Walk" && speed >= 0.12 && speed < 2.3) return "Walk";
  if (speed < 0.18) return "Idle";
  if (speed < 2.12) return "Walk";
  if (speed < 5.18) return "Jog";
  if (speed < 8.08) return "Run";
  return "Sprint";
}

export function selectFutbahlLocomotionState({
  speed,
  localForward,
  localLateral,
  acceleration,
  angularVelocity,
  previousSpeed,
  previousState,
  direction,
}: FutbahlLocomotionSelectionInput): FutbahlLocomotionState {
  if (speed < 0.14) {
    if (previousSpeed > 0.78 && acceleration < -1.35) return "Stop";
    if (angularVelocity > 0.48) return "TurnLeft";
    if (angularVelocity < -0.48) return "TurnRight";
    return "Idle";
  }

  const movementDirection = direction ?? selectFutbahlLocomotionDirection({
    speed,
    localForward,
    localLateral,
    previousDirection: directionFromLocomotionState(previousState),
  });
  const eightWayState = directionalState(movementDirection);
  if (eightWayState) return eightWayState;

  if (speed > 1.05 && Math.abs(angularVelocity) > 2.35) {
    return angularVelocity > 0 ? "SharpTurnLeft" : "SharpTurnRight";
  }
  if (acceleration > 3.25 && speed > 0.65 && speed < 8.35) return "Accelerate";
  if (acceleration < -3.15 && speed > 0.5 && previousSpeed > speed) return "Decelerate";
  return speedBandState(speed, previousState);
}

export function locomotionPlaybackRate(state: FutbahlLocomotionState, speed: number) {
  if (state === "Sprint") return THREE.MathUtils.clamp(speed / 9.2, 0.76, 1.34);
  if (state === "Walk" || state === "TurnLeft" || state === "TurnRight" || state === "Stop") {
    return THREE.MathUtils.clamp(Math.max(speed, 0.72) / 1.85, 0.56, 1.24);
  }
  if (DIRECTIONAL_LOCOMOTION_STATES.has(state)) {
    const gaitRate = speed >= 7.8
      ? THREE.MathUtils.clamp(speed / 9.2, 0.76, 1.34)
      : speed >= 2.2
        ? THREE.MathUtils.clamp(speed / 4.85, 0.64, 1.48)
        : THREE.MathUtils.clamp(Math.max(speed, 0.72) / 1.85, 0.56, 1.24);
    return REVERSE_LOCOMOTION_STATES.has(state) ? -gaitRate : gaitRate;
  }
  if (state === "Accelerate") return THREE.MathUtils.clamp(speed / 4.65, 0.72, 1.48);
  if (state === "Decelerate") return THREE.MathUtils.clamp(speed / 4.85, 0.58, 1.3);
  if (state === "SharpTurnLeft" || state === "SharpTurnRight" || state === "TurnAround") {
    return THREE.MathUtils.clamp(speed / 4.7, 0.7, 1.38);
  }
  return THREE.MathUtils.clamp(speed / 4.85, 0.64, state === "Run" ? 1.58 : 1.42);
}

const ACTION_TRANSITION_STATES = new Set<FutbahlAnimationState>([
  "ShortPass", "FirmPass", "LongPass", "ThroughPass", "Shot", "PowerShot",
  "Header", "SlideTackle", "StandingTackle", "Block", "Interception", "Receive",
  "MovingReceive", "FastReceive", "Catch", "KeeperDive", "Recovery",
]);

function transitionDuration(from: FutbahlAnimationState, to: FutbahlAnimationState) {
  if (from === to) return 0;
  if (ACTION_TRANSITION_STATES.has(to)) return 0.065;
  if (ACTION_TRANSITION_STATES.has(from)) return 0.14;
  if (to === "Sprint" || from === "Sprint") return 0.14;
  if (to === "Idle" || from === "Idle") return 0.18;
  if (to.startsWith("SharpTurn") || to === "TurnAround") return 0.09;
  return 0.12;
}

export class FutbahlLocomotionController {
  readonly root: THREE.Group;
  readonly missingClips: string[];

  private readonly host: THREE.Group;
  private readonly visualRoot: THREE.Group;
  private readonly fallbackBody: THREE.Object3D | null;
  private readonly mixerRoot: THREE.Object3D;
  private readonly mixer: THREE.AnimationMixer;
  private readonly actions = new Map<string, THREE.AnimationAction>();
  private readonly availableClips: Map<string, THREE.AnimationClip>;
  private readonly debugElement: HTMLDivElement | null;
  private readonly forward = new THREE.Vector3();
  private readonly right = new THREE.Vector3();
  private readonly effectiveVelocity = new THREE.Vector3();
  private readonly bones: Record<string, THREE.Object3D | null>;
  private readonly role: FutbahlPlayerAppearance["role"];
  private readonly idleVariant: string;
  private readonly idlePhase: number;
  private readonly playbackVariation: number;
  private readonly celebrationVariant: number;
  private state: FutbahlLocomotionState = "Idle";
  private direction: FutbahlLocomotionDirection = "Forward";
  private animationState: FutbahlAnimationState = "Idle";
  private currentAction: THREE.AnimationAction | null = null;
  private currentClip = "";
  private previousSpeed = 0;
  private previousHeading = 0;
  private smoothedAcceleration = 0;
  private directionYaw = 0;
  private stateAge = 0;
  private debugTimer = 0;
  private mixerAccumulator = 0;
  private disposed = false;

  private constructor(
    host: THREE.Group,
    root: THREE.Group,
    animations: THREE.AnimationClip[],
    appearance: FutbahlPlayerAppearance,
    wordmark: THREE.Texture | null,
    hairSource: THREE.Group | null,
    debugElement: HTMLDivElement | null,
  ) {
    this.host = host;
    this.root = root;
    this.debugElement = debugElement;
    this.fallbackBody = host.getObjectByName("body-root") ?? null;
    this.visualRoot = new THREE.Group();
    this.visualRoot.name = `futbahl-player-${appearance.playerId}`;
    this.visualRoot.add(root);
    this.host.add(this.visualRoot);

    const seed = stableHash(`${appearance.team}:${appearance.number}:${appearance.index}`);
    this.role = appearance.role;
    this.idleVariant = seed % 4 === 0 ? "Idle_Talking_Loop" : "Idle_Loop";
    this.idlePhase = ((seed >>> 17) % 1000) / 1000;
    this.playbackVariation = 0.96 + ((seed >>> 21) % 9) * 0.01;
    this.celebrationVariant = (seed >>> 25) % 3;
    const skinTones = ["#f3c7a6", "#d79b73", "#a86643", "#6f412d"];
    const skinTone = skinTones[seed % skinTones.length];
    const height = 0.96 + ((seed >>> 5) % 9) * 0.01;
    const width = 0.88 + ((seed >>> 9) % 7) * 0.01;
    root.scale.set(1.39 * width, 1.39 * height, 1.39 * width);
    const hairColors = ["#1e1511", "#4a2d1f", "#151515", "#6a4330"];
    root.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = true;
      object.receiveShadow = false;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      const nextMaterials = materials.map((material) => {
        if (
          material instanceof THREE.MeshStandardMaterial
          && (
            object.name.toLowerCase().includes("superhero")
            || material.name.toLowerCase().includes("superhero")
          )
        ) {
          return makeBodyMaterial(material, appearance, skinTone);
        }
        return material;
      });
      object.material = Array.isArray(object.material) ? nextMaterials : nextMaterials[0];
    });
    attachLicensedHair(root, hairSource, hairColors[(seed >>> 13) % hairColors.length]);
    addOriginalFootballKit(root, appearance, wordmark);
    if (this.fallbackBody) this.fallbackBody.visible = false;

    this.mixerRoot = firstSkinnedMesh(root) ?? root;
    this.mixer = new THREE.AnimationMixer(this.mixerRoot);
    this.availableClips = new Map(animations.map((clip) => [clip.name, clip]));
    this.missingClips = (Object.keys(LOCOMOTION_CLIPS) as FutbahlLocomotionState[])
      .filter((state) => !this.resolveClip(state))
      .map((state) => LOCOMOTION_CLIPS[state]);
    this.missingClips.forEach((clipName) => {
      warnOnce(`clip:${clipName}`, `[Futbahl locomotion] Missing clip "${clipName}". A safe skeletal fallback will be used.`);
    });
    this.bones = {
      spine: root.getObjectByName("spine_03") ?? null,
      leftArm: root.getObjectByName("upperarm_l") ?? null,
      rightArm: root.getObjectByName("upperarm_r") ?? null,
      leftLeg: root.getObjectByName("thigh_l") ?? null,
      rightLeg: root.getObjectByName("thigh_r") ?? null,
      head: root.getObjectByName("Head") ?? null,
    };
    this.transitionTo("Idle", 0, this.idleVariant);
  }

  static async create(
    host: THREE.Group,
    debugElement: HTMLDivElement | null,
    appearance: FutbahlPlayerAppearance,
  ): Promise<FutbahlLocomotionController> {
    const assets = await loadSharedAssets();
    const clonedRoot = cloneSkeleton(assets.male.scene) as THREE.Group;
    return new FutbahlLocomotionController(
      host,
      clonedRoot,
      assets.male.clips,
      appearance,
      assets.wordmark,
      assets.hair[stableHash(`${appearance.playerId}:hair`) % assets.hair.length],
      debugElement,
    );
  }

  get activeState() {
    return this.animationState;
  }

  get activeClip() {
    return this.currentClip;
  }

  get activeDirection() {
    return this.direction;
  }

  get activeLocomotionState() {
    return this.state;
  }

  get activePlaybackRate() {
    return this.currentAction?.timeScale ?? 0;
  }

  update(sample: FutbahlMotionSample) {
    if (this.disposed) return;
    const safeDt = THREE.MathUtils.clamp(sample.dt, 1 / 240, 0.05);
    this.forward.set(Math.sin(sample.heading), 0, Math.cos(sample.heading));
    this.right.set(Math.cos(sample.heading), 0, -Math.sin(sample.heading));
    const measuredSpeed = Math.hypot(sample.velocity.x, sample.velocity.z);
    const speed = Math.max(measuredSpeed, sample.visualSpeed ?? 0);
    this.effectiveVelocity.copy(sample.velocity).setY(0);
    if (measuredSpeed < 0.08 && speed > 0.14) this.effectiveVelocity.copy(this.forward).multiplyScalar(speed);
    const localForward = this.effectiveVelocity.dot(this.forward);
    const localLateral = this.effectiveVelocity.dot(this.right);
    const rawAcceleration = (speed - this.previousSpeed) / safeDt;
    this.smoothedAcceleration = damp(this.smoothedAcceleration, rawAcceleration, 10.5, safeDt);
    const acceleration = this.smoothedAcceleration;
    const angularVelocity = shortestAngleDelta(this.previousHeading, sample.heading) / safeDt;
    this.direction = selectFutbahlLocomotionDirection({
      speed,
      localForward,
      localLateral,
      previousDirection: this.direction,
    });
    this.stateAge += safeDt;
    let nextState = selectFutbahlLocomotionState({
      speed,
      localForward,
      localLateral,
      acceleration,
      angularVelocity,
      previousSpeed: this.previousSpeed,
      previousState: this.state,
      defensive: Boolean(sample.defensive),
      direction: this.direction,
    });
    const criticalState = this.resolveCriticalState(sample);
    if (!criticalState && speed < 0.38 && (sample.isKeeper || this.role === "keeper")) {
      nextState = "Idle";
    }
    if (nextState !== this.state && (this.stateAge >= 0.075 || nextState === "Idle" || nextState === "Stop")) {
      this.transitionTo(
        nextState,
        transitionDuration(this.animationState, nextState),
        this.resolveClip(nextState, speed),
      );
      this.stateAge = 0;
    } else {
      nextState = this.state;
    }

    const previousAnimationState = this.animationState;
    this.animationState = criticalState
      ?? ((sample.isKeeper || this.role === "keeper") && speed < 0.42 ? "KeeperReady"
        : sample.defensive && speed < 0.42 ? "DefensiveReady"
          : sample.carryingBall && speed < 3.15 ? "CloseControl"
            : sample.carryingBall ? "Dribble"
          : nextState);
    const contextualClip = this.contextualClip(this.animationState, speed);
    if (contextualClip && contextualClip !== this.currentClip) {
      const contextualLoops = this.animationState === "Celebrate"
        || this.animationState === "KeeperReady"
        || this.animationState === "DefensiveReady";
      this.transitionTo(
        nextState,
        transitionDuration(previousAnimationState, this.animationState),
        contextualClip,
        contextualLoops,
      );
    } else if (!contextualClip && this.currentClip !== this.resolveClip(nextState, speed)) {
      const idleClip = nextState === "Idle" ? this.idleVariant : "";
      this.transitionTo(
        nextState,
        transitionDuration(previousAnimationState, this.animationState),
        idleClip || this.resolveClip(nextState, speed),
      );
    }

    let playbackSpeed = locomotionPlaybackRate(this.state, speed) * this.playbackVariation;
    if (this.currentClip === "Jump_Start") playbackSpeed = 2.25;
    else if (this.currentClip === "Slide_Start") playbackSpeed = 1.42;
    else if (this.currentClip === "Slide_Exit") playbackSpeed = 0.92;
    else if (this.currentClip === "Dance_Loop") playbackSpeed = 0.9 * this.playbackVariation;
    if (this.currentAction) {
      if (playbackSpeed < 0 && this.currentAction.time <= 0.025) {
        this.currentAction.time = Math.max(0.03, this.currentAction.getClip().duration - 0.025);
      }
      this.currentAction.timeScale = playbackSpeed;
    }
    const forwardLean = THREE.MathUtils.clamp(-acceleration * 0.0065, -0.13, 0.09);
    const lateralLean = THREE.MathUtils.clamp(-localLateral * 0.014, -0.1, 0.1);
    const targetDirectionYaw = criticalState || speed < 0.14
      ? 0
      : locomotionDirectionYaw(this.direction);
    this.directionYaw = damp(
      this.directionYaw,
      targetDirectionYaw,
      criticalState ? 15 : speed > 6.5 ? 11.5 : 9.25,
      safeDt,
    );
    const diveTimer = sample.diveTimer ?? 0;
    const divePose = diveTimer > 0
      ? Math.sin((1 - THREE.MathUtils.clamp(diveTimer / 0.62, 0, 1)) * Math.PI)
      : 0;
    const diveLean = (sample.diveSide ?? 0) * 0.62 * divePose;
    this.visualRoot.rotation.x = damp(this.visualRoot.rotation.x, forwardLean, 8.5, safeDt);
    this.visualRoot.rotation.y = this.directionYaw;
    this.visualRoot.rotation.z = damp(
      this.visualRoot.rotation.z,
      lateralLean + diveLean,
      diveTimer > 0 ? 13 : 7.5,
      safeDt,
    );

    this.mixerAccumulator += safeDt;
    const updateInterval = (sample.distanceToCamera ?? 0) > 92 ? 1 / 30 : 0;
    if (updateInterval === 0 || this.mixerAccumulator >= updateInterval) {
      this.mixer.update(this.mixerAccumulator);
      this.applyDirectionalUpperBodyPose(speed, criticalState !== null);
      this.applyActionOverlay(sample, speed, safeDt);
      this.mixerAccumulator = 0;
    }

    this.previousSpeed = speed;
    this.previousHeading = sample.heading;
    this.debugTimer -= safeDt;
    if (this.debugElement && this.debugTimer <= 0) {
      this.debugTimer = 0.1;
      this.renderDebug({
        state: this.state,
        direction: this.direction,
        directionYaw: this.directionYaw,
        animationState: this.animationState,
        clip: this.currentClip,
        totalSpeed: speed,
        localForwardSpeed: localForward,
        localLateralSpeed: localLateral,
        acceleration,
        angularVelocity,
        turnRate: sample.turnRate,
        playbackSpeed,
        playerIndex: sample.playerIndex ?? -1,
        possessionState: sample.possessionState ?? "unknown",
        distanceToBall: sample.distanceToBall ?? 0,
        controlTargetDistance: sample.controlTargetDistance ?? 0,
      });
    }
  }

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.mixerRoot);
    this.host.remove(this.visualRoot);
    if (this.fallbackBody) this.fallbackBody.visible = true;
  }

  resetActionPose() {
    if (this.disposed) return;
    this.visualRoot.position.set(0, 0, 0);
    this.visualRoot.rotation.set(0, 0, 0);
    this.previousSpeed = 0;
    this.smoothedAcceleration = 0;
    this.direction = "Forward";
    this.directionYaw = 0;
    this.stateAge = 0;
  }

  private resolveCriticalState(sample: FutbahlMotionSample): FutbahlAnimationState | null {
    if ((sample.diveTimer ?? 0) > 0) return "KeeperDive";
    if ((sample.tackleTimer ?? 0) > 0) return "SlideTackle";
    if ((sample.recoveryTimer ?? 0) > 0) return "Recovery";
    if ((sample.headerTimer ?? 0) > 0) return "Header";
    if ((sample.kickTimer ?? 0) > 0) {
      if (sample.kickStyle === "short") return "ShortPass";
      if (sample.kickStyle === "low-through") return "FirmPass";
      if (sample.kickStyle === "through") return "ThroughPass";
      if (sample.kickStyle === "long" || sample.kickStyle === "chip") return "LongPass";
      if (sample.kickStyle === "driven" || sample.kickStyle === "finesse") return "PowerShot";
      return sample.kickStyle === "shot" ? "Shot" : "Pass";
    }
    if ((sample.catchTimer ?? 0) > 0) return "Catch";
    if (sample.standingTackle) return "StandingTackle";
    if (sample.interception) return "Interception";
    if ((sample.firstTouchTimer ?? 0) > 0) {
      if ((sample.receiveIncomingSpeed ?? 0) > 21) return "FastReceive";
      if ((sample.visualSpeed ?? 0) > 2.2) return "MovingReceive";
      return "Receive";
    }
    if ((sample.blockTimer ?? 0) > 0) return "Block";
    if ((sample.celebrateTimer ?? 0) > 0) return "Celebrate";
    if ((sample.passRequestTimer ?? 0) > 0) return "PassRequest";
    return null;
  }

  private contextualClip(state: FutbahlAnimationState, speed: number) {
    if (state === "SlideTackle" && this.availableClips.has("Slide_Start")) return "Slide_Start";
    if (state === "Recovery" && this.availableClips.has("Slide_Exit")) return "Slide_Exit";
    if (state === "Header" && this.availableClips.has("Jump_Start")) return "Jump_Start";
    if (state === "Celebrate" && this.availableClips.has("Dance_Loop")) return "Dance_Loop";
    if ((state === "KeeperReady" || state === "DefensiveReady") && this.availableClips.has("Crouch_Idle_Loop")) {
      return "Crouch_Idle_Loop";
    }
    if (state === "PassRequest" && speed < 0.35 && this.availableClips.has("Interact")) return "Interact";
    return "";
  }

  private applyDirectionalUpperBodyPose(speed: number, actionLocked: boolean) {
    if (actionLocked || speed < 0.14 || Math.abs(this.directionYaw) < 0.004) return;
    const speedBlend = THREE.MathUtils.smoothstep(speed, 0.14, 3.2);
    const counterYaw = -this.directionYaw * THREE.MathUtils.lerp(0.5, 0.6, speedBlend);
    if (this.bones.spine) this.bones.spine.rotation.y += counterYaw;
    if (this.bones.head) this.bones.head.rotation.y += -this.directionYaw * 0.14;
  }

  private applyActionOverlay(sample: FutbahlMotionSample, speed: number, dt: number) {
    const kickTimer = sample.kickTimer ?? 0;
    const kickDuration = sample.kickDuration ?? 0.44;
    const kickContactAfter = sample.kickContactAfter ?? 0.105;
    const kickElapsed = THREE.MathUtils.clamp(kickDuration - kickTimer, 0, kickDuration);
    const kickProgress = kickDuration > 0 ? THREE.MathUtils.clamp(kickElapsed / kickDuration, 0, 1) : 0;
    const contactProgress = kickContactAfter > 0 ? THREE.MathUtils.clamp(kickElapsed / kickContactAfter, 0, 1.4) : 0;
    const kickBackswing = kickTimer > 0 && contactProgress < 0.72
      ? Math.sin(THREE.MathUtils.clamp(contactProgress / 0.72, 0, 1) * Math.PI * 0.5)
      : 0;
    const kickFollowThrough = kickTimer > 0 && contactProgress >= 0.58
      ? Math.sin(THREE.MathUtils.clamp((kickProgress - kickContactAfter / kickDuration * 0.58) / 0.78, 0, 1) * Math.PI)
      : 0;
    const header = THREE.MathUtils.clamp((sample.headerTimer ?? 0) / 0.55, 0, 1);
    const catchAmount = THREE.MathUtils.clamp((sample.catchTimer ?? 0) / 0.62, 0, 1);
    const receiveAmount = THREE.MathUtils.clamp((sample.firstTouchTimer ?? 0) / 0.42, 0, 1);
    const tackleAmount = THREE.MathUtils.clamp((sample.tackleTimer ?? 0) / 0.58, 0, 1);
    const recoveryAmount = THREE.MathUtils.clamp((sample.recoveryTimer ?? 0) / 0.72, 0, 1);
    const blockAmount = THREE.MathUtils.clamp((sample.blockTimer ?? 0) / 0.5, 0, 1);
    const diveAmount = THREE.MathUtils.clamp((sample.diveTimer ?? 0) / 0.62, 0, 1);
    const celebrate = THREE.MathUtils.clamp((sample.celebrateTimer ?? 0) / 2.2, 0, 1);
    const request = sample.passRequestTimer ?? 0;
    const shotAction = sample.kickStyle === "shot"
      || sample.kickStyle === "driven"
      || sample.kickStyle === "finesse"
      || sample.kickStyle === "chip";
    const kickingLeg = sample.preferredFoot === "left" ? this.bones.leftLeg : this.bones.rightLeg;
    const plantLeg = sample.preferredFoot === "left" ? this.bones.rightLeg : this.bones.leftLeg;
    if ((kickBackswing > 0 || kickFollowThrough > 0) && kickingLeg) {
      const followAmplitude = shotAction ? 1.34 : sample.kickStyle === "long" ? 1.18 : 0.96;
      const backswingAmplitude = shotAction ? 0.62 : 0.44;
      kickingLeg.rotation.x += kickFollowThrough * followAmplitude - kickBackswing * backswingAmplitude;
      if (plantLeg) plantLeg.rotation.x -= kickFollowThrough * (shotAction ? 0.22 : 0.14);
      if (this.bones.spine) {
        this.bones.spine.rotation.x -= kickFollowThrough * (shotAction ? 0.2 : 0.11);
        this.bones.spine.rotation.y += (sample.preferredFoot === "left" ? -1 : 1) * kickFollowThrough * 0.1;
      }
    }
    if (diveAmount > 0) {
      const dive = Math.sin((1 - diveAmount) * Math.PI);
      const side = Math.sign(sample.diveSide ?? 0) || 1;
      if (this.bones.leftArm) {
        this.bones.leftArm.rotation.x -= 1.04 * dive;
        this.bones.leftArm.rotation.z += side * 0.5 * dive;
      }
      if (this.bones.rightArm) {
        this.bones.rightArm.rotation.x -= 1.04 * dive;
        this.bones.rightArm.rotation.z += side * 0.5 * dive;
      }
      if (this.bones.spine) this.bones.spine.rotation.z += side * 0.36 * dive;
      this.visualRoot.position.y = 0.1 * dive;
    }
    if (header > 0 && this.bones.spine) {
      this.bones.spine.rotation.x += Math.sin(header * Math.PI * 2) * 0.28;
    }
    if (diveAmount > 0) {
      // Keeper dive pose above has priority over every lower-body contextual pose.
    } else if (tackleAmount > 0) {
      const lunge = Math.sin((1 - tackleAmount) * Math.PI);
      if (this.bones.rightLeg) this.bones.rightLeg.rotation.x += 1.25 * lunge;
      if (this.bones.leftLeg) this.bones.leftLeg.rotation.x -= 0.48 * lunge;
      if (this.bones.spine) this.bones.spine.rotation.x -= 0.42 * lunge;
      this.visualRoot.position.y = -0.16 * lunge;
      this.visualRoot.rotation.x = damp(this.visualRoot.rotation.x, -0.34 * lunge, 14, dt);
    } else if (recoveryAmount > 0) {
      const recover = Math.sin(recoveryAmount * Math.PI);
      if (this.bones.spine) this.bones.spine.rotation.x -= 0.22 * recover;
      this.visualRoot.position.y = -0.08 * recover;
    } else if (catchAmount > 0) {
      const armRaise = -1.1 * Math.sin(catchAmount * Math.PI);
      if (this.bones.leftArm) this.bones.leftArm.rotation.x += armRaise;
      if (this.bones.rightArm) this.bones.rightArm.rotation.x += armRaise;
    } else if (receiveAmount > 0) {
      const cushion = Math.sin(receiveAmount * Math.PI);
      const contactLeg = sample.preferredFoot === "left" ? this.bones.leftLeg : this.bones.rightLeg;
      const supportLeg = sample.preferredFoot === "left" ? this.bones.rightLeg : this.bones.leftLeg;
      if (sample.firstTouchType === "chest") {
        if (this.bones.spine) this.bones.spine.rotation.x += 0.2 * cushion;
        if (this.bones.leftArm) this.bones.leftArm.rotation.z -= 0.28 * cushion;
        if (this.bones.rightArm) this.bones.rightArm.rotation.z += 0.28 * cushion;
      } else {
        if (contactLeg) contactLeg.rotation.x += (sample.firstTouchType === "thigh" ? 0.78 : 0.46) * cushion;
        if (supportLeg) supportLeg.rotation.x -= 0.12 * cushion;
        if (this.bones.spine) this.bones.spine.rotation.x -= (sample.firstTouchType === "thigh" ? 0.14 : 0.08) * cushion;
      }
    } else if (blockAmount > 0) {
      const block = Math.sin(blockAmount * Math.PI);
      if (this.bones.leftLeg) this.bones.leftLeg.rotation.x += 0.62 * block;
      if (this.bones.rightArm) this.bones.rightArm.rotation.z -= 0.46 * block;
    } else if (request > 0 && speed < 7.2 && this.bones.rightArm) {
      this.bones.rightArm.rotation.z -= 1.18;
    }
    if (celebrate > 0) {
      const pulse = Math.sin(celebrate * Math.PI * (this.celebrationVariant === 1 ? 6 : 4));
      if (this.celebrationVariant === 0) {
        if (this.bones.leftArm) this.bones.leftArm.rotation.z += 1.08;
        if (this.bones.rightArm) this.bones.rightArm.rotation.z -= 1.08;
      } else if (this.celebrationVariant === 1) {
        if (this.bones.leftArm) this.bones.leftArm.rotation.x -= 0.72 + pulse * 0.18;
        if (this.bones.rightArm) this.bones.rightArm.rotation.x -= 0.72 - pulse * 0.18;
      } else {
        if (this.bones.leftArm) this.bones.leftArm.rotation.z += 0.72;
        if (this.bones.rightArm) this.bones.rightArm.rotation.x -= 0.8;
        if (this.bones.spine) this.bones.spine.rotation.y += pulse * 0.16;
      }
      this.visualRoot.position.y = Math.max(0, pulse) * (this.celebrationVariant === 1 ? 0.12 : 0.06);
    } else if (diveAmount <= 0 && tackleAmount <= 0 && recoveryAmount <= 0) {
      this.visualRoot.position.y = 0;
    }
  }

  private resolveClip(state: FutbahlLocomotionState, speed = this.previousSpeed) {
    const expected = locomotionClipForMotion(state, speed);
    if (this.availableClips.has(expected)) return expected;
    return FALLBACK_CLIPS[state].find((clipName) => this.availableClips.has(clipName)) ?? "";
  }

  private transitionTo(
    state: FutbahlLocomotionState,
    fadeDuration: number,
    forcedClip = "",
    loop = true,
  ) {
    const clipName = forcedClip && this.availableClips.has(forcedClip) ? forcedClip : this.resolveClip(state);
    const clip = this.availableClips.get(clipName);
    if (!clip) return;
    let nextAction = this.actions.get(clipName);
    if (!nextAction) {
      nextAction = this.mixer.clipAction(clip);
      this.actions.set(clipName, nextAction);
    }
    nextAction.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Number.POSITIVE_INFINITY : 1);
    nextAction.clampWhenFinished = !loop;
    if (nextAction !== this.currentAction) {
      nextAction.reset().fadeIn(fadeDuration).play();
      if (loop && state === "Idle") nextAction.time = clip.duration * this.idlePhase;
      this.currentAction?.fadeOut(fadeDuration);
      this.currentAction = nextAction;
    }
    this.state = state;
    this.currentClip = clipName;
  }

  private renderDebug(snapshot: FutbahlLocomotionDebugSnapshot) {
    if (!this.debugElement) return;
    this.debugElement.textContent = [
      "Futbahl player debug",
      `player index: ${snapshot.playerIndex}`,
      `state: ${snapshot.state}`,
      `direction: ${snapshot.direction}`,
      `direction yaw: ${THREE.MathUtils.radToDeg(snapshot.directionYaw).toFixed(1)} deg`,
      `action: ${snapshot.animationState}`,
      `clip: ${snapshot.clip}`,
      `speed: ${snapshot.totalSpeed.toFixed(2)}`,
      `forward: ${snapshot.localForwardSpeed.toFixed(2)}`,
      `lateral: ${snapshot.localLateralSpeed.toFixed(2)}`,
      `accel: ${snapshot.acceleration.toFixed(2)}`,
      `angular: ${snapshot.angularVelocity.toFixed(2)}`,
      `turn rate: ${snapshot.turnRate.toFixed(2)}`,
      `playback: ${snapshot.playbackSpeed.toFixed(2)}`,
      `possession: ${snapshot.possessionState}`,
      `distance to ball: ${snapshot.distanceToBall.toFixed(2)}`,
      `control target: ${snapshot.controlTargetDistance.toFixed(2)}`,
    ].join("\n");
  }
}
