export type KeeperContactDecision = "catch" | "parry" | "miss";

export function keeperMayCatch(input: {
  insidePenaltyArea: boolean;
  deliberateTeammateFootPass: boolean;
  ballSpeed: number;
  handContactCount: number;
  bodyStable: boolean;
}) {
  if (!input.insidePenaltyArea || input.deliberateTeammateFootPass) return false;
  if (input.handContactCount >= 2 && input.ballSpeed <= 25) return true;
  return input.handContactCount >= 1 && input.bodyStable && input.ballSpeed <= 18;
}

export function goalkeeperContactDecision(input: {
  insidePenaltyArea: boolean;
  deliberateTeammateFootPass: boolean;
  ballSpeed: number;
  handContactCount: number;
  bodyContact: boolean;
  bodyStable: boolean;
}): KeeperContactDecision {
  if (keeperMayCatch(input)) return "catch";
  if (input.handContactCount > 0 || input.bodyContact) return "parry";
  return "miss";
}

export function parrySpeed(incomingSpeed: number, stableContact: boolean) {
  const retained = incomingSpeed * (stableContact ? 0.16 : 0.24);
  return Math.max(1.6, Math.min(7.4, retained));
}

