export type ReceivePassReadinessInput = {
  incomingSpeed: number;
  receiverSpeed: number;
  ballHeight: number;
  contactDistance: number;
  targetFacingDot: number;
  redirectionDot: number;
  pressureDistance: number;
  passStyle: string;
};

export type ReceivePassReadiness = {
  requiredControlTime: number;
  oneTouchAllowed: boolean;
  controlQuality: number;
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}

/**
 * Converts the physical reception context into a short control window.
 * This intentionally remains independent of tactical pass selection: it only
 * answers whether the footballer is technically ready to strike the ball.
 */
export function receivePassReadiness(input: ReceivePassReadinessInput): ReceivePassReadiness {
  const groundPass = input.passStyle === "short" || input.passStyle === "low-through";
  const speedPenalty = clamp((input.incomingSpeed - 11) / 25, 0, 1) * 0.17;
  const movementPenalty = clamp((input.receiverSpeed - 3.4) / 6.2, 0, 1) * 0.13;
  const heightPenalty = clamp((input.ballHeight - 0.3) / 1.35, 0, 1) * 0.18;
  const contactPenalty = clamp((input.contactDistance - 0.72) / 0.62, 0, 1) * 0.1;
  const facingPenalty = clamp((0.48 - input.targetFacingDot) / 1.48, 0, 1) * 0.14;
  const redirectPenalty = clamp((0.12 - input.redirectionDot) / 1.12, 0, 1) * 0.13;
  const stylePenalty = groundPass ? 0 : 0.1;
  const requiredControlTime = clamp(
    0.075 + speedPenalty + movementPenalty + heightPenalty + contactPenalty + facingPenalty + redirectPenalty + stylePenalty,
    0.09,
    0.52,
  );

  const oneTouchAllowed = groundPass
    && input.incomingSpeed <= 28.5
    && input.receiverSpeed <= 6.25
    && input.ballHeight <= 0.68
    && input.contactDistance <= 1.18
    && input.targetFacingDot >= 0.16
    && input.redirectionDot >= -0.12
    && input.pressureDistance >= 1.25;

  const controlQuality = clamp(
    1
      - speedPenalty * 1.9
      - movementPenalty * 1.7
      - heightPenalty * 1.7
      - contactPenalty * 2
      - facingPenalty * 1.5
      - redirectPenalty * 1.35,
    0,
    1,
  );

  return { requiredControlTime, oneTouchAllowed, controlQuality };
}
