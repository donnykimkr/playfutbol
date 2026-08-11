import * as THREE from "three";
import type { TutorialLessonDefinition } from "@/lib/futbahl-match-types";

export const FIELD_SCALE = 1.5;
export const FIELD_W = 64 * FIELD_SCALE;
export const FIELD_L = 96 * FIELD_SCALE;
export const WORLD_UNITS_PER_METER = ((FIELD_L / 105) + (FIELD_W / 68)) / 2;
export const FORMATION_SCALE = 1.42;
export const GOAL_W = 7.32 * WORLD_UNITS_PER_METER;
export const GOAL_H = 2.44 * WORLD_UNITS_PER_METER;
export const PLAYER_RADIUS = 1.08;
export const BALL_RADIUS = 0.11 * WORLD_UNITS_PER_METER;
export const BALL_MASS_KG = 0.43;
export const CLOCK_SPEED = 18;
export const HALF_TIME_SECONDS = 45 * 60;
export const FULL_TIME_SECONDS = 90 * 60;
export const BALL_MAX_SPEED = 42 * WORLD_UNITS_PER_METER;
export const BALL_ROLLING_FRICTION = 0.7;
export const BALL_SLIDING_FRICTION = 2.7;
export const BALL_AIR_DRAG = 0.018;
export const BALL_SPIN_DAMPING = 0.36;
export const BALL_MAGNUS = 0.0018;
export const BALL_STOP_SPEED = 0.035;
export const BALL_GRAVITY = 9.81 * WORLD_UNITS_PER_METER;
export const BALL_BOUNCE = 0.46;
export const BALL_PHYSICS_STEP = 1 / 120;
export const BALL_MAX_SUBSTEPS = 5;
export const BALL_ENTER_GROUNDED_THRESHOLD = BALL_RADIUS + 0.035;
export const BALL_LEAVE_GROUNDED_THRESHOLD = BALL_RADIUS + 0.11;
export const SHARED_BALL_PHYSICS = {
  radius: BALL_RADIUS,
  gravity: BALL_GRAVITY,
  airDrag: BALL_AIR_DRAG,
  magnus: BALL_MAGNUS,
  bounce: BALL_BOUNCE,
  rollingFriction: BALL_ROLLING_FRICTION,
  slidingFriction: BALL_SLIDING_FRICTION,
  spinDamping: BALL_SPIN_DAMPING,
  maxHorizontalSpeed: BALL_MAX_SPEED,
  enterGroundedThreshold: BALL_ENTER_GROUNDED_THRESHOLD,
  leaveGroundedThreshold: BALL_LEAVE_GROUNDED_THRESHOLD,
} as const;

export const PERSONAL_SPACE = 1.75;
export const DRIBBLE_DISTANCE = PLAYER_RADIUS + BALL_RADIUS + 0.06;
export const CONTROL_TOUCH_DISTANCE = PLAYER_RADIUS + BALL_RADIUS + 0.26;
export const ACTION_COOLDOWN = 0.22;
export const GOAL_KICK_CURSOR_SPEED = 24;
export const CAMERA_FOLLOW_DAMPING = 4.25;
export const CAMERA_TOUCHLINE_DAMPING = 5.2;
export const SHOT_VERTICAL_POWER_MULTIPLIER = 1.34;
export const PLAYER_NORMAL_SPEED = 12.1;
export const SPRINT_SPEED = 15.5;
export const STAMINA_DRAIN_RATE = 0.34;
export const STAMINA_RECOVERY_RATE = 0.22;
export const STAMINA_RECOVERY_THRESHOLD = 0.22;
export const SHOT_INPUT_LOCK_SECONDS = 0.32;
export const DEFENSIVE_PRESSING_DISTANCE = 18;
export const DEFENSIVE_REACTION_DELAY = 0.08;
export const DEFENSIVE_MARKING_DISTANCE = 3.6;
export const DEFENSIVE_TACKLE_AGGRESSION = 0.68;
export const DEFENSIVE_INTERCEPTION_RANGE = 5.2;
export const DEFENSIVE_RECOVERY_SPEED = 1.08;
export const TOUCHLINE_RUNOFF = 6.1;
export const GOAL_LINE_RUNOFF = 8.2;
export const PENALTY_AREA_HALF_WIDTH = 22;
export const PENALTY_AREA_DEPTH = 18;
export const OUT_OF_PLAY_DELAY = 1.75;
export const FIELD_PLAYER_BALL_RADIUS = 0.7;

export const GOAL_DEPTH = 4.8;
export const GOAL_POST_THICKNESS = 0.18;
export const GOAL_POST_CENTER_X = GOAL_W / 2 + GOAL_POST_THICKNESS / 2;
export const GOAL_FRAME_OUTER_W = GOAL_W + GOAL_POST_THICKNESS * 2;
export const GOAL_FRONT_Z = FIELD_L / 2;
// A goal is only awarded after the whole ball has crossed the goal line.
export const GOAL_SCORE_Z = GOAL_FRONT_Z + BALL_RADIUS;
export const GOAL_BACK_Z = GOAL_FRONT_Z + GOAL_DEPTH;
export const GOAL_SIDE_POST_INSET = 0.26;

export const ADAPTIVE_TOUCHLINE_CAMERA = {
  normalCameraDistance: 10,
  nearTouchlineMaximumOutwardDistance: 28,
  normalCameraHeight: 22,
  maximumAdditionalHeight: 4,
  lookAtLateralFollowStrength: 0.64,
  nearTouchlineActivationThreshold: 22,
  nearTouchlineFullEffectDistance: 4,
  nearTouchlineDeadZone: 2,
  interpolationSpeed: -Math.log(0.0008),
  viewportBottomSafeMargin: 0.28,
} as const;
export const BROADCAST_CAMERA_X = -FIELD_W / 2 - ADAPTIVE_TOUCHLINE_CAMERA.normalCameraDistance;
export const BROADCAST_CAMERA_Y = ADAPTIVE_TOUCHLINE_CAMERA.normalCameraHeight;
export const BROADCAST_CAMERA_Z = 8;
export const BROADCAST_CAMERA_Z_OFFSET = 9;
export const BROADCAST_LOOK_AT_X = 0;
export const BROADCAST_LOOK_AT_Y = 1.05;
export const BROADCAST_LOOK_AT_Z = 0;

export function cameraSideTouchlineBlend(worldX: number) {
  const distanceFromNearTouchline = Math.max(0, worldX + FIELD_W / 2);
  const activationDistance = Math.max(
    ADAPTIVE_TOUCHLINE_CAMERA.nearTouchlineFullEffectDistance + 0.01,
    ADAPTIVE_TOUCHLINE_CAMERA.nearTouchlineActivationThreshold
      - ADAPTIVE_TOUCHLINE_CAMERA.nearTouchlineDeadZone,
  );
  return 1 - THREE.MathUtils.smoothstep(
    distanceFromNearTouchline,
    ADAPTIVE_TOUCHLINE_CAMERA.nearTouchlineFullEffectDistance,
    activationDistance,
  );
}

export function projectedViewportY(
  worldX: number,
  worldY: number,
  worldZ: number,
  cameraX: number,
  cameraY: number,
  cameraZ: number,
  lookAtX: number,
  lookAtY: number,
  lookAtZ: number,
  verticalFovDegrees: number,
) {
  const forwardLength = Math.hypot(
    lookAtX - cameraX,
    lookAtY - cameraY,
    lookAtZ - cameraZ,
  ) || 1;
  const forwardX = (lookAtX - cameraX) / forwardLength;
  const forwardY = (lookAtY - cameraY) / forwardLength;
  const forwardZ = (lookAtZ - cameraZ) / forwardLength;
  const rightLength = Math.hypot(forwardX, forwardZ) || 1;
  const rightX = -forwardZ / rightLength;
  const rightZ = forwardX / rightLength;
  const cameraUpX = -rightZ * forwardY;
  const cameraUpY = rightZ * forwardX - rightX * forwardZ;
  const cameraUpZ = rightX * forwardY;
  const relativeX = worldX - cameraX;
  const relativeY = worldY - cameraY;
  const relativeZ = worldZ - cameraZ;
  const depth = relativeX * forwardX + relativeY * forwardY + relativeZ * forwardZ;
  if (depth <= 0.01) return 0.5;
  const halfHeightAtDepth = depth * Math.tan(THREE.MathUtils.degToRad(verticalFovDegrees) / 2);
  const verticalPosition = relativeX * cameraUpX
    + relativeY * cameraUpY
    + relativeZ * cameraUpZ;
  const ndcY = halfHeightAtDepth > 0.001 ? verticalPosition / halfHeightAtDepth : 0;
  return (1 - ndcY) / 2;
}

export function fitDirectionalShadowCameraToPitch(light: THREE.DirectionalLight) {
  const camera = light.shadow.camera as THREE.OrthographicCamera;
  const target = light.target.position;
  const forward = target.clone().sub(light.position).normalize();
  const right = forward.clone().cross(new THREE.Vector3(0, 1, 0)).normalize();
  const up = right.clone().cross(forward).normalize();
  const halfWidth = FIELD_W / 2 + TOUCHLINE_RUNOFF + 2;
  const halfLength = FIELD_L / 2 + GOAL_LINE_RUNOFF + GOAL_DEPTH + 2;
  const corners = [-1, 1].flatMap((xSign) => [-1, 1].flatMap((zSign) => [0, 4.5].map((y) => (
    new THREE.Vector3(xSign * halfWidth, y, zSign * halfLength)
  ))));
  let left = Number.POSITIVE_INFINITY;
  let rightEdge = Number.NEGATIVE_INFINITY;
  let bottom = Number.POSITIVE_INFINITY;
  let top = Number.NEGATIVE_INFINITY;
  let near = Number.POSITIVE_INFINITY;
  let far = Number.NEGATIVE_INFINITY;
  corners.forEach((corner) => {
    const relative = corner.sub(light.position);
    const horizontal = relative.dot(right);
    const vertical = relative.dot(up);
    const depth = relative.dot(forward);
    left = Math.min(left, horizontal);
    rightEdge = Math.max(rightEdge, horizontal);
    bottom = Math.min(bottom, vertical);
    top = Math.max(top, vertical);
    near = Math.min(near, depth);
    far = Math.max(far, depth);
  });
  const sidePadding = 3;
  const depthPadding = 8;
  camera.left = left - sidePadding;
  camera.right = rightEdge + sidePadding;
  camera.bottom = bottom - sidePadding;
  camera.top = top + sidePadding;
  camera.near = Math.max(0.1, near - depthPadding);
  camera.far = far + depthPadding;
  camera.updateProjectionMatrix();
}

export const VISITOR_STORAGE_KEY = "futbahl_visitor_id";
export const SETTINGS_STORAGE_KEY = "futbahl_offline_settings";
export const AD_BOARD_INNER_X = FIELD_W / 2 + TOUCHLINE_RUNOFF;
export const AD_BOARD_INNER_Z = FIELD_L / 2 + GOAL_LINE_RUNOFF;
export const AD_BOARD_HEIGHT = 2.25;
export const AD_BOARD_BASE_Y = 0.12;
export const AD_BOARD_THICKNESS = 0.2;
export const AD_BOARD_FACE_OFFSET = 0.05;
export const AD_BOARD_DISPLAY_HEIGHT = AD_BOARD_HEIGHT;
export const AD_BOARD_DISPLAY_Y = AD_BOARD_BASE_Y + AD_BOARD_HEIGHT / 2;
export const AD_BOARD_DISPLAY_RENDER_ORDER = 4;
export const AD_BOARD_COLLISION_TOP = AD_BOARD_BASE_Y + AD_BOARD_HEIGHT + BALL_RADIUS;
export const AD_BOARD_CORNER_RADIUS = 3.2;
export const AD_BOARD_CORNER_SEGMENTS = 20;
export const AD_BOARD_TEXTURE_REPEATS = 7;
export const AD_BOARD_SCROLL_SPEED = 0.075;
export const AD_BOARD_BRAND_DURATION = 30;
export const AD_BOARD_TRANSITION_DURATION = 1.2;
export const AD_BOARD_TEXTURE_WIDTH = 2048;
export const AD_BOARD_TEXTURE_HEIGHT = 64;
export const GRASS_DARK_COLOR = "#1d6f3d";
export const GRASS_LIGHT_COLOR = "#2b824a";
export const OUTER_GRASS_COLOR = "#155531";
export const GRASS_STRIPE_WIDTH = 8;
export const FLOOR_LAYER_MIN_SEPARATION = 0.05;
export const STADIUM_BASE_TOP_Y = -0.055;
export const PITCH_SURFACE_Y = 0;
export const BLOB_SHADOW_Y = 0.055;
export const FIELD_MARKINGS_Y = 0.11;
export const LANDING_MARKER_Y = 0.135;
export const RECORDED_CROWD_AMBIENT_PATH = "/audio/stadium-ambience.m4a";
export const RECORDED_CROWD_SWELL_PATH = "/audio/stadium-swell.m4a";
export const RECORDED_CROWD_GOAL_PATH = "/audio/stadium-goal-roar.m4a";
export const RECORDED_REFEREE_WHISTLE_PATH = "/audio/referee-whistle-cc0.mp3";
export const CROWD_AMBIENCE_CROSSFADE_SECONDS = 4;
export const CROWD_AMBIENCE_LAYER_GAIN = 0.92;
export const CROWD_MASTER_GAIN = 0.24;
export const CROWD_SWELL_COOLDOWN_MS = 3200;
export const CROWD_GOAL_COOLDOWN_MS = 5000;
export const FLOOR_LAYER_NAMES = ["stadium-base-floor", "grass-surface", "field-markings"] as const;
export const HEAD_COLLIDER_RADIUS = 0.3;
export const LOCOMOTION_STRIDE_LENGTHS = {
  walk: 2,
  jog: 3.4,
  run: 4.8,
  sprint: 6,
} as const;
export const LOCOMOTION_REFERENCE_SPEEDS = {
  walk: 1.6,
  jog: 3.8,
  run: 6.8,
  sprint: 9.5,
} as const;
export const ADVERTISING_BRANDS = [
  { name: "FUTBAHL", background: "#15962f", accent: "#ffffff" },
  { name: "NOVA STRIDE", background: "#0b1833", accent: "#4de8ff" },
  { name: "PULSE+", background: "#4b1021", accent: "#ffcf4d" },
  { name: "ORBIT MOBILE", background: "#102a43", accent: "#7dd3fc" },
  { name: "CIRRUS PAY", background: "#123528", accent: "#86efac" },
  { name: "AEROLINE", background: "#2b1b52", accent: "#c4b5fd" },
  { name: "MATCHWAVE", background: "#451a03", accent: "#fdba74" },
] as const;

export const AWAY_COLOR = "#dc2626";
export const AWAY_TRIM = "#f8fafc";
export const AWAY_SHORTS = "#f8fafc";
export const AWAY_KEEPER_COLOR = "#16a34a";

export const HOME_KIT = {
  name: "Futbahl",
  primary: "#38bdf8",
  secondary: "#eff6ff",
  accent: "#0f172a",
  shorts: "#f8fafc",
  socks: "#e0f2fe",
  keeper: "#facc15",
};

export const TUTORIAL_LESSONS: TutorialLessonDefinition[] = [
  { title: "Movement & Facing", instruction: "Use the arrow keys to move into the highlighted zone.", key: "Arrow Keys" },
  { title: "Pass", instruction: "Face the highlighted teammate and press S for a clean pass.", key: "S" },
  { title: "Pass Power", instruction: "Hold S to charge past halfway, then release toward your teammate.", key: "Hold S" },
  { title: "Receive", instruction: "Move toward the incoming pass and bring it under control.", key: "Arrow Keys" },
  { title: "Shoot", instruction: "Aim with the arrows, hold D for power, then score.", key: "Hold D" },
  { title: "Lofted Pass", instruction: "Face a teammate, hold A, and release to lift the ball over a blocked lane.", key: "Hold A" },
  { title: "Player Switch", instruction: "While defending, press S to switch to the best same-team defender.", key: "S" },
  { title: "Defend", instruction: "Stay between the attacker and your goal for two seconds.", key: "Arrow Keys" },
  { title: "Tackle & Intercept", instruction: "Approach from the front or side and press Space to challenge for the ball.", key: "Space" },
  { title: "Through Pass", instruction: "Aim ahead of the runner and press W into the highlighted space.", key: "W" },
];
