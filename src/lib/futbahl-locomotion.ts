import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";

export type FutbahlLocomotionState =
  | "Idle"
  | "Jog"
  | "Sprint"
  | "StrafeLeft"
  | "StrafeRight"
  | "Backpedal"
  | "TurnLeft"
  | "TurnRight"
  | "Stop";

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
  playerIndex?: number;
  possessionState?: string;
  distanceToBall?: number;
  controlTargetDistance?: number;
};

export const LOCOMOTION_CLIPS: Record<FutbahlLocomotionState, string> = {
  Idle: "Idle_Loop",
  Jog: "Jog_Fwd_Loop",
  Sprint: "Sprint_Loop",
  StrafeLeft: "Strafe_Left_Loop",
  StrafeRight: "Strafe_Right_Loop",
  Backpedal: "Jog_Back_Loop",
  TurnLeft: "Turn_Left",
  TurnRight: "Turn_Right",
  Stop: "Stop",
};

export const FUTBAHL_CHARACTER_ASSETS = {
  animation: "/models/futbahl-locomotion-prototype.glb",
  male: "/models/futbahl-base-male.glb",
  wordmark: "/branding/futbahl-wordmark-white.png",
  hair: [
    "/models/quaternius-hair/Hair_Buzzed.glb",
    "/models/quaternius-hair/Hair_SimpleParted.glb",
  ],
  characterLicense: "/models/futbahl-base-characters.LICENSE.txt",
  animationLicense: "/models/futbahl-locomotion-prototype.LICENSE.txt",
  source: "Quaternius Universal Base Characters and Universal Animation Library",
  license: "CC0 1.0",
} as const;

const FALLBACK_CLIPS: Record<FutbahlLocomotionState, string[]> = {
  Idle: ["Idle_Loop"],
  Jog: ["Jog_Fwd_Loop", "Walk_Loop"],
  Sprint: ["Sprint_Loop", "Jog_Fwd_Loop"],
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

function makeRetargetedAsset(base: GLTF, animation: GLTF): SharedCharacterAsset {
  const target = firstSkinnedMesh(base.scene);
  const source = firstSkinnedMesh(animation.scene);
  if (!target || !source) {
    throw new Error("The licensed character or animation GLB does not contain a skinned mesh.");
  }
  const sourceHip = source.skeleton.getBoneByName("DEF-hips");
  const targetHip = target.skeleton.getBoneByName("pelvis");
  const clips = animation.animations.map((clip) => {
    const tracks = clip.tracks.flatMap((track) => {
      const propertySeparator = track.name.lastIndexOf(".");
      if (propertySeparator < 0) return [];
      const sourceName = track.name.slice(0, propertySeparator);
      const propertyName = track.name.slice(propertySeparator + 1);
      const targetName = TARGET_BONE_BY_SOURCE.get(normalizedBoneName(sourceName));
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
  ]).then(([animation, male, wordmark, hair]) => {
    if (wordmark) {
      wordmark.colorSpace = THREE.SRGBColorSpace;
      wordmark.generateMipmaps = false;
      wordmark.minFilter = THREE.LinearFilter;
      wordmark.magFilter = THREE.LinearFilter;
    }
    return {
      male: makeRetargetedAsset(male, animation),
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
  if (localForward < -0.55 && Math.abs(localForward) > Math.abs(localLateral) * 0.78) return "Backpedal";
  if (Math.abs(localLateral) > 0.72 && Math.abs(localLateral) > Math.abs(localForward) * 1.08) {
    return localLateral < 0 ? "StrafeLeft" : "StrafeRight";
  }
  return speed >= 7.35 ? "Sprint" : "Jog";
}

function actionPlaybackSpeed(state: FutbahlLocomotionState, speed: number) {
  if (state === "Sprint") return THREE.MathUtils.clamp(speed / 9.4, 0.72, 1.35);
  if (state === "Jog" || state === "StrafeLeft" || state === "StrafeRight" || state === "Backpedal") {
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
  private state: FutbahlLocomotionState = "Idle";
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
    this.transitionTo("Idle", 0);
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
    const nextState = chooseState(
      speed,
      localForward,
      localLateral,
      acceleration,
      angularVelocity,
      this.previousSpeed,
    );
    if (nextState !== this.state) this.transitionTo(nextState, 0.18);

    const playbackSpeed = actionPlaybackSpeed(this.state, speed);
    if (this.currentAction) this.currentAction.timeScale = playbackSpeed;
    const forwardLean = THREE.MathUtils.clamp(-acceleration * 0.0065, -0.13, 0.09);
    const lateralLean = THREE.MathUtils.clamp(-localLateral * 0.014, -0.1, 0.1);
    this.visualRoot.rotation.x = damp(this.visualRoot.rotation.x, forwardLean, 8.5, safeDt);
    this.visualRoot.rotation.z = damp(this.visualRoot.rotation.z, lateralLean, 8.5, safeDt);

    this.mixerAccumulator += safeDt;
    const updateInterval = (sample.distanceToCamera ?? 0) > 92 ? 1 / 30 : 0;
    if (updateInterval === 0 || this.mixerAccumulator >= updateInterval) {
      this.mixer.update(this.mixerAccumulator);
      this.applyActionOverlay(sample);
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

  private applyActionOverlay(sample: FutbahlMotionSample) {
    const kick = THREE.MathUtils.clamp((sample.kickTimer ?? 0) / 0.34, 0, 1);
    const header = THREE.MathUtils.clamp((sample.headerTimer ?? 0) / 0.55, 0, 1);
    const catchAmount = THREE.MathUtils.clamp((sample.catchTimer ?? 0) / 0.62, 0, 1);
    const celebrate = THREE.MathUtils.clamp((sample.celebrateTimer ?? 0) / 2.2, 0, 1);
    const request = sample.passRequestTimer ?? 0;
    if (kick > 0 && this.bones.rightLeg) {
      this.bones.rightLeg.rotation.x += Math.sin(kick * Math.PI) * 0.9;
      if (this.bones.spine) this.bones.spine.rotation.x -= Math.sin(kick * Math.PI) * 0.13;
    }
    if (header > 0 && this.bones.spine) {
      this.bones.spine.rotation.x += Math.sin(header * Math.PI * 2) * 0.28;
    }
    if (catchAmount > 0) {
      const armRaise = -1.1 * Math.sin(catchAmount * Math.PI);
      if (this.bones.leftArm) this.bones.leftArm.rotation.x += armRaise;
      if (this.bones.rightArm) this.bones.rightArm.rotation.x += armRaise;
    } else if (request > 0 && this.bones.rightArm) {
      this.bones.rightArm.rotation.z -= 1.18;
    }
    if (celebrate > 0) {
      if (this.bones.leftArm) this.bones.leftArm.rotation.z += 1.08;
      if (this.bones.rightArm) this.bones.rightArm.rotation.z -= 1.08;
      this.visualRoot.position.y = Math.max(0, Math.sin(celebrate * Math.PI * 5)) * 0.08;
    } else {
      this.visualRoot.position.y = 0;
    }
    if ((sample.diveTimer ?? 0) > 0) {
      this.visualRoot.rotation.z += (sample.diveSide ?? 0) * 0.62;
    }
  }

  private resolveClip(state: FutbahlLocomotionState) {
    const expected = LOCOMOTION_CLIPS[state];
    if (this.availableClips.has(expected)) return expected;
    return FALLBACK_CLIPS[state].find((clipName) => this.availableClips.has(clipName)) ?? "";
  }

  private transitionTo(state: FutbahlLocomotionState, fadeDuration: number) {
    const clipName = this.resolveClip(state);
    const clip = this.availableClips.get(clipName);
    if (!clip) return;
    let nextAction = this.actions.get(clipName);
    if (!nextAction) {
      nextAction = this.mixer.clipAction(clip);
      nextAction.setLoop(THREE.LoopRepeat, Number.POSITIVE_INFINITY);
      this.actions.set(clipName, nextAction);
    }
    if (nextAction !== this.currentAction) {
      nextAction.reset().fadeIn(fadeDuration).play();
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
