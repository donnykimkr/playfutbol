export type KickAnimationProfile = {
  duration: number;
  contactAfter: number;
};

export function kickAnimationProfile(style: string): KickAnimationProfile {
  if (style === "long" || style === "chip") return { duration: 0.54, contactAfter: 0.14 };
  if (style === "shot" || style === "finesse" || style === "driven") {
    return { duration: 0.5, contactAfter: 0.13 };
  }
  return { duration: 0.44, contactAfter: 0.105 };
}

export function kickAnimationPhase(elapsed: number, profile: KickAnimationProfile) {
  const safeElapsed = Math.max(0, elapsed);
  if (safeElapsed < profile.contactAfter * 0.38) return "preparation" as const;
  if (safeElapsed < profile.contactAfter * 0.82) return "backswing" as const;
  if (safeElapsed < profile.contactAfter) return "plant" as const;
  if (safeElapsed < profile.contactAfter + 0.035) return "contact" as const;
  return "follow-through" as const;
}
