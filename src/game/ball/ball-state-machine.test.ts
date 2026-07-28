import { describe, expect, it } from "vitest";
import {
  createBallStateMachine,
  ownerIdForBallState,
  transitionBall,
} from "./ball-state-machine";

describe("ball interaction state machine", () => {
  it("moves from loose contact through first touch to control", () => {
    const machine = createBallStateMachine();
    transitionBall(machine, { type: "contact", playerId: "home-9", intendedReceiver: false });
    transitionBall(machine, { type: "control", playerId: "home-9" });
    expect(machine.state).toEqual({ kind: "Controlled", ownerId: "home-9" });
    expect(ownerIdForBallState(machine.state)).toBe("home-9");
  });

  it("tracks an intended pass without assigning premature ownership", () => {
    const machine = createBallStateMachine({ kind: "Controlled", ownerId: "home-6" });
    transitionBall(machine, { type: "kick", kickerId: "home-6", receiverId: "home-9" });
    expect(machine.state.kind).toBe("IncomingPass");
    expect(ownerIdForBallState(machine.state)).toBeNull();
  });

  it("turns a tackle contact into a deflection before control", () => {
    const machine = createBallStateMachine({ kind: "Controlled", ownerId: "away-9" });
    transitionBall(machine, { type: "deflect", playerId: "home-4" });
    expect(machine.state).toEqual({ kind: "Deflected", sourcePlayerId: "home-4", elapsed: 0 });
    expect(ownerIdForBallState(machine.state)).toBeNull();
  });

  it("supports a legal keeper catch and release", () => {
    const machine = createBallStateMachine({ kind: "Kicked", kickerId: "away-9", intendedReceiverId: null, elapsed: 0 });
    transitionBall(machine, { type: "keeper-catch", keeperId: "home-1" });
    expect(ownerIdForBallState(machine.state)).toBe("home-1");
    transitionBall(machine, { type: "release", playerId: "home-1" });
    expect(machine.state.kind).toBe("Loose");
  });

  it("rejects contradictory ownership transitions", () => {
    const machine = createBallStateMachine();
    expect(() => transitionBall(machine, { type: "control", playerId: "home-9" })).toThrow();
    expect(machine.invalidTransitions).toBe(1);
  });

  it("locks and releases restarts through an explicit actor", () => {
    const machine = createBallStateMachine();
    transitionBall(machine, { type: "restart-lock", teamId: "home", actorId: "home-1", restart: "goal-kick" });
    transitionBall(machine, { type: "restart-kick", actorId: "home-1", receiverId: "home-4" });
    expect(machine.state.kind).toBe("IncomingPass");
  });
});

