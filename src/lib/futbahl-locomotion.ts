import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";

export type FutbahlLocomotionState =
  | "Idle"
  | "Walk"
  | "Jog"
  | "Run"
  | "Sprint"
  | "ForwardLeft"
  | "ForwardRight"
  | "BackwardLeft"
  | "BackwardRight"
  | "StrafeLeft"
  | "StrafeRight"
  | "Backpedal"
  | "TurnLeft"
  | "TurnRight"
  | "Stop";

export type FutbahlAnimationState =
  | FutbahlLocomotionState
  | "DefensiveReady"
  | "KeeperReady"
  | "Pass"
  | "Shot"
  | "Header"
  | "SlideTackle"
  | "Block"
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
  heading: number;
  turnRate: number;
  dt: number;
  distanceToCamera?: number;
  kickTimer?: number;
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
  ForwardLeft: "Jog_Fwd_Loop",
  ForwardRight: "Jog_Fwd_Loop",
  BackwardLeft: "Walk_Loop",
  BackwardRight: "Walk_Loop",
  StrafeLeft: "Strafe_Left_Loop",
  StrafeRight: "Strafe_Right_Loop",
  Backpedal: "Jog_Back_Loop",
  TurnLeft: "Turn_Left",
  TurnRight: "Turn_Right",
  Stop: "Stop",
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
  ForwardLeft: ["Jog_Fwd_Loop", "Walk_Loop"],
  ForwardRight: ["Jog_Fwd_Loop", "Walk_Loop"],
  BackwardLeft: ["Walk_Loop", "Jog_Fwd_Loop"],
  BackwardRight: ["Walk_Loop", "Jog_Fwd_Loop"],
  StrafeLeft: ["Jog_Fwd_Loop", "Walk_Loop"],
  StrafeRight: ["Jog_Fwd_Loop", "Walk_Loop"],
  Backpedal: ["Walk_Loop", "Jog_Fwd_Loop"],
  TurnLeft: ["Walk_Loop", "Idle_Loop"],
  TurnRight: ["Walk_Loop", "Idle_Loop"],
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

function chooseState(
  speed: number,
  localForward: number,
  localLateral: number,
  acceleration: number,
  angularVelocity: number,
  previousSpeed: number,
): FutbahlLocomotionState {
  if (speed < 0.14) {
    if (previousSpeed > 0.85 && acceleration < -1.6) return "Stop";
    if (angularVelocity > 0.42) return "TurnLeft";
    if (angularVelocity < -0.42) return "TurnRight";
    return "Idle";
  }
  if (localForward < -0.55 && Math.abs(localLateral) > 0.48) {
    return localLateral < 0 ? "BackwardLeft" : "BackwardRight";
  }
  if (localForward < -0.55 && Math.abs(localForward) > Math.abs(localLateral) * 0.78) return "Backpedal";
  if (Math.abs(localLateral) > 0.72 && Math.abs(localLateral) > Math.abs(localForward) * 1.08) {
    return localLateral < 0 ? "StrafeLeft" : "StrafeRight";
  }
  if (localForward > 0.4 && Math.abs(localLateral) > 0.48) {
    return localLateral < 0 ? "ForwardLeft" : "ForwardRight";
  }
  if (speed < 2.15) return "Walk";
  if (speed < 5.25) return "Jog";
  if (speed < 8.15) return "Run";
  return "Sprint";
}

function actionPlaybackSpeed(state: FutbahlLocomotionState, speed: number) {
  if (state === "Sprint") return THREE.MathUtils.clamp(speed / 9.4, 0.72, 1.35);
  if (state === "Walk") return THREE.MathUtils.clamp(speed / 1.9, 0.55, 1.3);
  if (
    state === "Jog" || state === "Run"
    || state === "ForwardLeft" || state === "ForwardRight"
    || state === "BackwardLeft" || state === "BackwardRight"
    || state === "StrafeLeft" || state === "StrafeRight" || state === "Backpedal"
  ) {
    return THREE.MathUtils.clamp(speed / 4.8, 0.62, 1.42);
  }
  if (state === "TurnLeft" || state === "TurnRight") return 0.9;
  return 1;
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
  private readonly bones: Record<string, THREE.Object3D | null>;
  private readonly role: FutbahlPlayerAppearance["role"];
  private readonly idleVariant: string;
  private readonly idlePhase: number;
  private readonly playbackVariation: number;
  private readonly celebrationVariant: number;
  private state: FutbahlLocomotionState = "Idle";
  private animationState: FutbahlAnimationState = "Idle";
  private currentAction: THREE.AnimationAction | null = null;
  private currentClip = "";
  private previousSpeed = 0;
  private previousHeading = 0;
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

  update(sample: FutbahlMotionSample) {
    if (this.disposed) return;
    const safeDt = THREE.MathUtils.clamp(sample.dt, 1 / 240, 0.05);
    const speed = Math.hypot(sample.velocity.x, sample.velocity.z);
    this.forward.set(Math.sin(sample.heading), 0, Math.cos(sample.heading));
    this.right.set(Math.cos(sample.heading), 0, -Math.sin(sample.heading));
    const localForward = sample.velocity.dot(this.forward);
    const localLateral = sample.velocity.dot(this.right);
    const acceleration = (speed - this.previousSpeed) / safeDt;
    const angularVelocity = shortestAngleDelta(this.previousHeading, sample.heading) / safeDt;
    let nextState = chooseState(
      speed,
      localForward,
      localLateral,
      acceleration,
      angularVelocity,
      this.previousSpeed,
    );
    const criticalState = this.resolveCriticalState(sample);
    if (!criticalState && speed < 0.38 && (sample.isKeeper || this.role === "keeper")) {
      nextState = "Idle";
    }
    if (nextState !== this.state) this.transitionTo(nextState, 0.18);

    this.animationState = criticalState
      ?? ((sample.isKeeper || this.role === "keeper") && speed < 0.42 ? "KeeperReady"
        : sample.defensive && speed < 0.42 ? "DefensiveReady"
          : nextState);
    const contextualClip = this.contextualClip(this.animationState, speed);
    if (contextualClip && contextualClip !== this.currentClip) {
      const contextualLoops = this.animationState === "Celebrate"
        || this.animationState === "KeeperReady"
        || this.animationState === "DefensiveReady"
        || this.animationState === "SlideTackle";
      this.transitionTo(nextState, 0.16, contextualClip, contextualLoops);
    } else if (!contextualClip && this.currentClip !== this.resolveClip(nextState)) {
      const idleClip = nextState === "Idle" ? this.idleVariant : "";
      this.transitionTo(nextState, 0.18, idleClip);
    }

    const playbackSpeed = actionPlaybackSpeed(this.state, speed) * this.playbackVariation;
    if (this.currentAction) this.currentAction.timeScale = playbackSpeed;
    const forwardLean = THREE.MathUtils.clamp(-acceleration * 0.0065, -0.13, 0.09);
    const lateralLean = THREE.MathUtils.clamp(-localLateral * 0.014, -0.1, 0.1);
    const diveTimer = sample.diveTimer ?? 0;
    const divePose = diveTimer > 0
      ? Math.sin((1 - THREE.MathUtils.clamp(diveTimer / 0.62, 0, 1)) * Math.PI)
      : 0;
    const diveLean = (sample.diveSide ?? 0) * 0.62 * divePose;
    this.visualRoot.rotation.x = damp(this.visualRoot.rotation.x, forwardLean, 8.5, safeDt);
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
  }

  private resolveCriticalState(sample: FutbahlMotionSample): FutbahlAnimationState | null {
    if ((sample.diveTimer ?? 0) > 0) return "KeeperDive";
    if ((sample.tackleTimer ?? 0) > 0) return "SlideTackle";
    if ((sample.recoveryTimer ?? 0) > 0) return "Recovery";
    if ((sample.kickTimer ?? 0) > 0) return (sample.kickTimer ?? 0) > 0.46 ? "Shot" : "Pass";
    if ((sample.headerTimer ?? 0) > 0) return "Header";
    if ((sample.catchTimer ?? 0) > 0) return "Catch";
    if ((sample.blockTimer ?? 0) > 0) return "Block";
    if ((sample.celebrateTimer ?? 0) > 0) return "Celebrate";
    if ((sample.passRequestTimer ?? 0) > 0) return "PassRequest";
    return null;
  }

  private contextualClip(state: FutbahlAnimationState, speed: number) {
    if (state === "SlideTackle" && this.availableClips.has("Slide_Loop")) return "Slide_Loop";
    if (state === "Recovery" && this.availableClips.has("Slide_Exit")) return "Slide_Exit";
    if (state === "Header" && this.availableClips.has("Jump_Start")) return "Jump_Start";
    if (state === "Celebrate" && this.availableClips.has("Dance_Loop")) return "Dance_Loop";
    if ((state === "KeeperReady" || state === "DefensiveReady") && this.availableClips.has("Crouch_Idle_Loop")) {
      return "Crouch_Idle_Loop";
    }
    if (state === "PassRequest" && speed < 0.35 && this.availableClips.has("Interact")) return "Interact";
    return "";
  }

  private applyActionOverlay(sample: FutbahlMotionSample, speed: number, dt: number) {
    const kickTimer = sample.kickTimer ?? 0;
    const kickDuration = kickTimer > 0.46 ? 0.54 : 0.46;
    const kickProgress = THREE.MathUtils.clamp(1 - kickTimer / kickDuration, 0, 1);
    // Gameplay applies the impulse when kickTimer starts. Begin on the visible
    // contact pose and use the remaining timer for a clean follow-through so
    // the foot and ball never disagree about the contact frame.
    const kick = kickTimer > 0 ? Math.cos(kickProgress * Math.PI * 0.5) : 0;
    const header = THREE.MathUtils.clamp((sample.headerTimer ?? 0) / 0.55, 0, 1);
    const catchAmount = THREE.MathUtils.clamp((sample.catchTimer ?? 0) / 0.62, 0, 1);
    const tackleAmount = THREE.MathUtils.clamp((sample.tackleTimer ?? 0) / 0.58, 0, 1);
    const recoveryAmount = THREE.MathUtils.clamp((sample.recoveryTimer ?? 0) / 0.72, 0, 1);
    const blockAmount = THREE.MathUtils.clamp((sample.blockTimer ?? 0) / 0.5, 0, 1);
    const diveAmount = THREE.MathUtils.clamp((sample.diveTimer ?? 0) / 0.62, 0, 1);
    const celebrate = THREE.MathUtils.clamp((sample.celebrateTimer ?? 0) / 2.2, 0, 1);
    const request = sample.passRequestTimer ?? 0;
    if (kick > 0 && this.bones.rightLeg) {
      this.bones.rightLeg.rotation.x += kick * 1.05;
      if (this.bones.leftLeg) this.bones.leftLeg.rotation.x -= kick * 0.2;
      if (this.bones.spine) {
        this.bones.spine.rotation.x -= kick * 0.16;
        this.bones.spine.rotation.y += kick * 0.08;
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

  private resolveClip(state: FutbahlLocomotionState) {
    const expected = LOCOMOTION_CLIPS[state];
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
