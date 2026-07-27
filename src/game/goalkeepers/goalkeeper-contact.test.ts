import { describe, expect, it } from "vitest";
import {
  goalkeeperContactDecision,
  keeperMayCatch,
  parrySpeed,
} from "./goalkeeper-contact";

describe("goalkeeper contact rules", () => {
  it("allows a stable legal two-hand catch", () => {
    expect(keeperMayCatch({
      insidePenaltyArea: true,
      deliberateTeammateFootPass: false,
      ballSpeed: 21,
      handContactCount: 2,
      bodyStable: true,
    })).toBe(true);
  });

  it("forbids hand use on a deliberate teammate foot pass", () => {
    expect(keeperMayCatch({
      insidePenaltyArea: true,
      deliberateTeammateFootPass: true,
      ballSpeed: 8,
      handContactCount: 2,
      bodyStable: true,
    })).toBe(false);
  });

  it("parries a fast one-hand contact instead of catching", () => {
    expect(goalkeeperContactDecision({
      insidePenaltyArea: true,
      deliberateTeammateFootPass: false,
      ballSpeed: 29,
      handContactCount: 1,
      bodyContact: false,
      bodyStable: false,
    })).toBe("parry");
    expect(parrySpeed(29, false)).toBeLessThan(8);
  });
});

