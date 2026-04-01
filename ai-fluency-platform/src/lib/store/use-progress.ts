"use client";

import { useState, useCallback, useEffect } from "react";
import type { InteractionState, DrillAttempt } from "@/types/progress";
import {
  getModuleProgress,
  getInteraction,
  markInteraction as storeMarkInteraction,
  markModuleComplete as storeMarkModuleComplete,
  isModuleComplete as storeIsModuleComplete,
  getCompletedInteractionCount,
  markDrillPassed as storeMarkDrillPassed,
  storeDrillAttempt as storeStoreDrillAttempt,
  isDrillPassed as storeIsDrillPassed,
  getDrillAttempts as storeGetDrillAttempts,
  incrementPracticeSession as storeIncrementPractice,
  getPracticeSessionCount as storeGetPracticeCount,
  isTestUnlocked as storeIsTestUnlocked,
  getMasteryLevel as storeGetMasteryLevel,
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

  const getInteractionData = useCallback(
    (interactionKey: string): InteractionState | null => {
      return getInteraction(modulePath, interactionKey);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [modulePath, completedCount]
  );

  const markDrillPassed = useCallback(
    (drillKey: string, attempt: DrillAttempt, allDrillKeys: string[]) => {
      storeMarkDrillPassed(modulePath, levelId, drillKey, attempt, allDrillKeys);
      setCompletedCount(getCompletedInteractionCount(modulePath));
      setModuleComplete(storeIsModuleComplete(modulePath));
      setTick((t) => t + 1);
    },
    [modulePath, levelId]
  );

  const storeDrillAttempt = useCallback(
    (drillKey: string, attempt: DrillAttempt) => {
      storeStoreDrillAttempt(modulePath, levelId, drillKey, attempt);
    },
    [modulePath, levelId]
  );

  const isDrillPassedCheck = useCallback(
    (drillKey: string) => storeIsDrillPassed(modulePath, drillKey),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [modulePath, completedCount]
  );

  const getDrillAttempts = useCallback(
    (drillKey: string) => storeGetDrillAttempts(modulePath, drillKey),
    [modulePath]
  );

  const incrementPracticeSession = useCallback(
    (drillKey: string) => {
      storeIncrementPractice(modulePath, levelId, drillKey);
      setTick((t) => t + 1);
    },
    [modulePath, levelId]
  );

  const getPracticeCount = useCallback(
    (drillKey: string) => storeGetPracticeCount(modulePath, drillKey),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [modulePath, completedCount]
  );

  const isTestUnlockedCheck = useCallback(
    (drillKey: string) => storeIsTestUnlocked(modulePath, drillKey),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [modulePath, completedCount]
  );

  const getMastery = useCallback(
    (drillKey: string) => storeGetMasteryLevel(modulePath, drillKey),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [modulePath, completedCount]
  );

  return {
    completedCount,
    moduleComplete,
    markInteraction,
    markModuleComplete,
    isInteractionComplete,
    getInteractionData,
    markDrillPassed,
    storeDrillAttempt,
    isDrillPassed: isDrillPassedCheck,
    getDrillAttempts,
    incrementPracticeSession,
    getPracticeCount,
    isTestUnlocked: isTestUnlockedCheck,
    getMasteryLevel: getMastery,
  };
}
