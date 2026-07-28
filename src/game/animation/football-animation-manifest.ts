import type { FutbahlLocomotionState } from "@/lib/futbahl-locomotion";

export type FootballAnimationCategory = "locomotion" | "ball-action" | "goalkeeper" | "celebration";

export type FootballAnimationClipDefinition = {
  id: string;
  category: FootballAnimationCategory;
  sourceFile: string;
  loop: boolean;
  fallback?: string;
};
const locomotion = [
  ["football_ready_idle", "football-ready-idle.fbx", true, "Idle_Loop"],
  ["jog_forward", "jog-forward.fbx", true, "Jog_Fwd_Loop"],
  ["run_forward", "run-forward.fbx", true, "Jog_Fwd_Loop"],
  ["sprint", "sprint.fbx", true, "Sprint_Loop"],
  ["strafe_left", "strafe-left.fbx", true, "Jog_Fwd_Loop"],
  ["strafe_right", "strafe-right.fbx", true, "Jog_Fwd_Loop"],
  ["backpedal", "backpedal.fbx", true, "Jog_Back_Loop"],
  ["defensive_jockey", "defensive-jockey.fbx", true, "Walk_Loop"],
  ["turn_left", "turn-left.fbx", false, "Turn_Left"],
  ["turn_right", "turn-right.fbx", false, "Turn_Right"],
  ["acceleration", "acceleration.fbx", false, "Jog_Fwd_Loop"],
  ["deceleration", "deceleration.fbx", false, "Stop"],
  ["stop", "stop.fbx", false, "Stop"],
] as const;

const ballActions = [
  "short_pass_right",
  "short_pass_left",
  "long_pass_right",
  "long_pass_left",
  "cross_right",
  "cross_left",
  "normal_shot_right",
  "normal_shot_left",
  "driven_shot_right",
  "driven_shot_left",
  "first_touch_right",
  "first_touch_left",
  "chest_control",
  "header",
  "standing_tackle",
  "sliding_tackle",
  "stumble",
  "recovery",
] as const;

const goalkeeper = [
  "goalkeeper_ready_stance",
  "goalkeeper_side_step_left",
  "goalkeeper_side_step_right",
  "goalkeeper_forward_movement",
  "goalkeeper_low_dive_left",
  "goalkeeper_low_dive_right",
  "goalkeeper_high_dive_left",
  "goalkeeper_high_dive_right",
  "goalkeeper_central_save",
  "goalkeeper_catch",
  "goalkeeper_parry",
  "goalkeeper_smother",
  "goalkeeper_overarm_throw",
  "goalkeeper_underarm_roll",
  "goalkeeper_goal_kick",
  "goalkeeper_drop_kick",
] as const;

const celebrations = [
  "celebration_fist_pump",
  "celebration_knee_slide",
  "celebration_arms_up",
  "celebration_team_point",
] as const;

export const FOOTBALL_ANIMATION_CLIPS: readonly FootballAnimationClipDefinition[] = [
  ...locomotion.map(([id, sourceFile, loop, fallback]) => ({
    id,
    category: "locomotion" as const,
    sourceFile,
    loop,
    fallback,
  })),
  ...ballActions.map((id) => ({
    id,
    category: "ball-action" as const,
    sourceFile: `${id.replaceAll("_", "-")}.fbx`,
    loop: false,
  })),
  ...goalkeeper.map((id) => ({
    id,
    category: "goalkeeper" as const,
    sourceFile: `${id.replaceAll("_", "-")}.fbx`,
    loop: id.includes("ready") || id.includes("side_step") || id.includes("forward_movement"),
  })),
  ...celebrations.map((id) => ({
    id,
    category: "celebration" as const,
    sourceFile: `${id.replaceAll("_", "-")}.fbx`,
    loop: false,
  })),
];

export const FOOTBALL_ANIMATION_CLIP_IDS = new Set(FOOTBALL_ANIMATION_CLIPS.map((clip) => clip.id));

export const FOOTBALL_LOCOMOTION_CLIP_PRIORITY: Record<FutbahlLocomotionState, readonly string[]> = {
  Idle: ["football_ready_idle"],
  Jog: ["jog_forward", "run_forward"],
  Sprint: ["sprint"],
  StrafeLeft: ["strafe_left", "defensive_jockey"],
  StrafeRight: ["strafe_right", "defensive_jockey"],
  Backpedal: ["backpedal"],
  TurnLeft: ["turn_left"],
  TurnRight: ["turn_right"],
  Stop: ["stop", "deceleration"],
};
