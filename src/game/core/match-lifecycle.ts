export type MatchLifecycle = {
  generation: number;
  running: boolean;
  score: { home: number; away: number };
  clock: number;
  timers: number;
  replayFrames: number;
};

export function createMatchLifecycle(): MatchLifecycle {
  return {
    generation: 1,
    running: false,
    score: { home: 0, away: 0 },
    clock: 0,
    timers: 0,
    replayFrames: 0,
  };
}

export function resetMatchLifecycle(lifecycle: MatchLifecycle) {
  lifecycle.generation += 1;
  lifecycle.running = false;
  lifecycle.score.home = 0;
  lifecycle.score.away = 0;
  lifecycle.clock = 0;
  lifecycle.timers = 0;
  lifecycle.replayFrames = 0;
  return lifecycle;
}

