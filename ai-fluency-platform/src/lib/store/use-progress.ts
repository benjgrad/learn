"use client";

import { useState, useCallback, useEffect } from "react";
import type { InteractionState } from "@/types/progress";
import {
  getModuleProgress,
  markInteraction as storeMarkInteraction,
  markModuleComplete as storeMarkModuleComplete,
  isModuleComplete as storeIsModuleComplete,
  getCompletedInteractionCount,
} from "./progress";

export function useProgress(modulePath: string, levelId: string) {
  const [completedCount, setCompletedCount] = useState(0);
  const [moduleComplete, setModuleComplete] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    setCompletedCount(getCompletedInteractionCount(modulePath));
    setModuleComplete(storeIsModuleComplete(modulePath));
  }, [modulePath]);

  const markInteraction = useCallback(
    (interactionKey: string, data: Partial<InteractionState>) => {
      storeMarkInteraction(modulePath, levelId, interactionKey, data);
      setCompletedCount(getCompletedInteractionCount(modulePath));
      setTick((t) => t + 1);
    },
    [modulePath, levelId]
  );

  const markModuleComplete = useCallback(() => {
    storeMarkModuleComplete(modulePath, levelId);
    setModuleComplete(true);
  }, [modulePath, levelId]);

  const isInteractionComplete = useCallback(
    (interactionKey: string) => {
      const progress = getModuleProgress(modulePath);
      return progress?.interactions[interactionKey]?.completed || false;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [modulePath, completedCount]
  );

  return {
    completedCount,
    moduleComplete,
    markInteraction,
    markModuleComplete,
    isInteractionComplete,
  };
}
