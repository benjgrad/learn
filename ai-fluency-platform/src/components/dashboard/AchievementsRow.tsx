"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { getEarnedAchievements, ACHIEVEMENT_LIST } from "@/lib/sparks/achievements";
import type { UserAchievement } from "@/types/sparks";
import Link from "next/link";

export function AchievementsRow() {
  const [earned, setEarned] = useState<UserAchievement[]>([]);

  useEffect(() => {
    setEarned(getEarnedAchievements());
  }, []);

  const achievementMap = new Map(
    ACHIEVEMENT_LIST.map((a) => [a.id, { name: a.name, sparkReward: a.sparkReward }])
  );

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold mb-3">Achievements</h2>
      {earned.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Complete lessons to earn your first achievement!
        </p>
      ) : (
        <div className="overflow-x-auto flex gap-3 pb-2">
          {earned.map((a) => {
            const def = achievementMap.get(a.achievementId);
            return (
              <Badge
                key={a.achievementId}
                variant="secondary"
                className="whitespace-nowrap shrink-0 text-sm py-1 px-3"
              >
                {def?.name ?? a.achievementId}
                {def && (
                  <span className="ml-1 text-amber-500">+{def.sparkReward}</span>
                )}
              </Badge>
            );
          })}
          <Link
            href="/achievements"
            className="text-sm text-primary hover:underline whitespace-nowrap self-center shrink-0"
          >
            View all &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}
