"use client";

import { useEffect, useCallback } from "react";
import { celebrateInteraction, celebrateModule, celebrateLevel } from "@/lib/celebrations";

type CelebrationTier = "interaction" | "module" | "level" | null;

export function useCelebration() {
  const trigger = useCallback((tier: CelebrationTier, color?: string) => {
    if (!tier) return;

    switch (tier) {
      case "interaction":
        celebrateInteraction(color);
        break;
      case "module":
        celebrateModule(color);
        break;
      case "level":
        celebrateLevel();
        break;
    }
  }, []);

  return { trigger };
}

export function CelebrationOverlay({
  tier,
  color,
}: {
  tier: CelebrationTier;
  color?: string;
}) {
  const { trigger } = useCelebration();

  useEffect(() => {
    if (tier) {
      trigger(tier, color);
    }
  }, [tier, color, trigger]);

  return null;
}
