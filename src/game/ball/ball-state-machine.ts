export type BallInteractionState =
  | { kind: "Loose"; lastTouchPlayerId: string | null }
  | { kind: "IncomingPass"; passerId: string; receiverId: string; elapsed: number }
  | { kind: "FirstTouch"; playerId: string; elapsed: number }
  | { kind: "Controlled"; ownerId: string }
  | { kind: "Kicked"; kickerId: string; intendedReceiverId: string | null; elapsed: number }
  | { kind: "Deflected"; sourcePlayerId: string; elapsed: number }
  | { kind: "KeeperHeld"; keeperId: string; elapsed: number }
  | { kind: "RestartLocked"; teamId: "home" | "away"; actorId: string | null; restart: string };

export type BallTransitionEvent =
  | { type: "kick"; kickerId: string; receiverId?: string }
  | { type: "contact"; playerId: string; intendedReceiver: boolean }
  | { type: "control"; playerId: string }
  | { type: "deflect"; playerId: string }
  | { type: "keeper-catch"; keeperId: string }
  | { type: "release"; playerId?: string }
  | { type: "restart-lock"; teamId: "home" | "away"; actorId?: string; restart: string }
  | { type: "restart-kick"; actorId: string; receiverId?: string };

export type BallStateMachine = {
  state: BallInteractionState;
  transitions: number;
  invalidTransitions: number;
};

export function createBallStateMachine(initial?: BallInteractionState): BallStateMachine {
  return {
    state: initial ?? { kind: "Loose", lastTouchPlayerId: null },
    transitions: 0,
    invalidTransitions: 0,
  };
}

function invalid(machine: BallStateMachine, event: BallTransitionEvent): never {
  machine.invalidTransitions += 1;
  throw new Error(`Invalid ball transition: ${machine.state.kind} -> ${event.type}`);
}

export function transitionBall(machine: BallStateMachine, event: BallTransitionEvent) {
  const current = machine.state;
  let next: BallInteractionState;

  switch (event.type) {
    case "kick":
      if (current.kind !== "Controlled" || current.ownerId !== event.kickerId) return invalid(machine, event);
      next = event.receiverId
        ? { kind: "IncomingPass", passerId: event.kickerId, receiverId: event.receiverId, elapsed: 0 }
        : { kind: "Kicked", kickerId: event.kickerId, intendedReceiverId: null, elapsed: 0 };
      break;
    case "contact":
      if (!["Loose", "IncomingPass", "Kicked", "Deflected"].includes(current.kind)) return invalid(machine, event);
      next = { kind: "FirstTouch", playerId: event.playerId, elapsed: 0 };
      break;
    case "control":
      if (current.kind !== "FirstTouch" || current.playerId !== event.playerId) return invalid(machine, event);
      next = { kind: "Controlled", ownerId: event.playerId };
      break;
    case "deflect":
      next = { kind: "Deflected", sourcePlayerId: event.playerId, elapsed: 0 };
      break;
    case "keeper-catch":
      if (!["Loose", "IncomingPass", "Kicked", "Deflected", "FirstTouch"].includes(current.kind)) return invalid(machine, event);
      next = { kind: "KeeperHeld", keeperId: event.keeperId, elapsed: 0 };
      break;
    case "release":
      if (current.kind === "Loose") return invalid(machine, event);
      next = { kind: "Loose", lastTouchPlayerId: event.playerId ?? null };
      break;
    case "restart-lock":
      next = {
        kind: "RestartLocked",
        teamId: event.teamId,
        actorId: event.actorId ?? null,
        restart: event.restart,
      };
      break;
    case "restart-kick":
      if (current.kind !== "RestartLocked" || current.actorId !== event.actorId) return invalid(machine, event);
      next = {
        kind: event.receiverId ? "IncomingPass" : "Kicked",
        ...(event.receiverId
          ? { passerId: event.actorId, receiverId: event.receiverId, elapsed: 0 }
          : { kickerId: event.actorId, intendedReceiverId: null, elapsed: 0 }),
      } as BallInteractionState;
      break;
  }

  machine.state = next;
  machine.transitions += 1;
  return next;
}

export function ownerIdForBallState(state: BallInteractionState) {
  if (state.kind === "Controlled") return state.ownerId;
  if (state.kind === "KeeperHeld") return state.keeperId;
  return null;
}

export function tickBallState(machine: BallStateMachine, dt: number) {
  if ("elapsed" in machine.state) machine.state.elapsed += Math.max(0, dt);
}

