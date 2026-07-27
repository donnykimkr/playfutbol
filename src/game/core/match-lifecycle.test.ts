import { describe, expect, it } from "vitest";
import { createMatchLifecycle, resetMatchLifecycle } from "./match-lifecycle";

describe("match lifecycle", () => {
  it("resets full-time state without duplicating a runtime", () => {
    const lifecycle = createMatchLifecycle();
    lifecycle.running = true;
    lifecycle.score.home = 3;
    lifecycle.clock = 5400;
    lifecycle.timers = 4;
    lifecycle.replayFrames = 120;
    const reset = resetMatchLifecycle(lifecycle);
    expect(reset).toBe(lifecycle);
    expect(reset).toMatchObject({
      generation: 2,
      running: false,
      score: { home: 0, away: 0 },
      clock: 0,
      timers: 0,
      replayFrames: 0,
    });
  });

  it("remains clean across repeated exit-and-restart cycles", () => {
    const lifecycle = createMatchLifecycle();
    for (let index = 0; index < 5; index += 1) resetMatchLifecycle(lifecycle);
    expect(lifecycle.generation).toBe(6);
    expect(lifecycle.timers).toBe(0);
    expect(lifecycle.replayFrames).toBe(0);
  });
});

