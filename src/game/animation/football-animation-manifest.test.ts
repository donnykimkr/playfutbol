import { describe, expect, it } from "vitest";
import {
  FOOTBALL_ANIMATION_CLIPS,
  FOOTBALL_ANIMATION_CLIP_IDS,
  FOOTBALL_LOCOMOTION_CLIP_PRIORITY,
} from "./football-animation-manifest";

describe("football animation manifest", () => {
  it("contains unique, selected browser clips rather than a complete motion pack", () => {
    expect(FOOTBALL_ANIMATION_CLIP_IDS.size).toBe(FOOTBALL_ANIMATION_CLIPS.length);
    expect(FOOTBALL_ANIMATION_CLIPS.length).toBeLessThan(64);
    expect(FOOTBALL_ANIMATION_CLIPS.filter((clip) => clip.category === "celebration")).toHaveLength(4);
  });

  it("covers every runtime locomotion state with a football-specific preference", () => {
    expect(Object.keys(FOOTBALL_LOCOMOTION_CLIP_PRIORITY).sort()).toEqual([
      "Backpedal",
      "Idle",
      "Jog",
      "Sprint",
      "Stop",
      "StrafeLeft",
      "StrafeRight",
      "TurnLeft",
      "TurnRight",
    ].sort());
    Object.values(FOOTBALL_LOCOMOTION_CLIP_PRIORITY).forEach((clips) => {
      expect(clips.length).toBeGreaterThan(0);
      clips.forEach((clip) => expect(FOOTBALL_ANIMATION_CLIP_IDS.has(clip)).toBe(true));
    });
  });
});
