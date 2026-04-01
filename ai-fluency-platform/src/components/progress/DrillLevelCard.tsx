"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { isModuleComplete, getMasteryLevel } from "@/lib/store/progress";
import { getMasteryLabel, getMasteryColor, type MasteryLevel } from "@/lib/poker/messages";
import Link from "next/link";
import type { LevelInfo, ModuleMeta } from "@/types/content";
import { Lock, Star, Sparkles } from "lucide-react";

function MasteryDot({ level }: { level: MasteryLevel }) {
  const color = getMasteryColor(level);
  const fills: Record<MasteryLevel, string> = {
    "not-started": "transparent",
    "practicing": color,
    "almost-ready": color,
    "mastered": color,
  };
  const opacity: Record<MasteryLevel, number> = {
    "not-started": 0.2,
    "practicing": 0.4,
    "almost-ready": 0.7,
    "mastered": 1,
  };

  return (
    <div
      className="w-3.5 h-3.5 rounded-full border-2 shrink-0"
      style={{
        borderColor: color,
        backgroundColor: fills[level],
        opacity: opacity[level],
      }}
    />
  );
}

export function DrillLevelCard({
  level,
  levelSlug,
  modules,
  course,
  isLocked,
}: {
  level: LevelInfo;
  levelSlug: string;
  modules: ModuleMeta[];
  course: string;
  isLocked: boolean;
}) {
  const [masteredCount, setMasteredCount] = useState(0);

  useEffect(() => {
    const count = modules.filter((m) =>
      isModuleComplete(`${course}/${m.level}/${m.slug}`)
    ).length;
    setMasteredCount(count);
  }, [modules, course]);

  const percentage = modules.length > 0 ? (masteredCount / modules.length) * 100 : 0;
  const allMastered = percentage === 100;

  // Derive level mastery summary
  let levelLabel = "Getting Started";
  if (allMastered) levelLabel = "Mastered";
  else if (masteredCount > 0) levelLabel = "In Progress";

  return (
    <Card className={`overflow-hidden ${isLocked ? "opacity-60" : ""}`}>
      <div className="h-1" style={{ backgroundColor: level.color }} />
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: level.color }}
              >
                {isLocked ? <Lock className="h-3 w-3" /> : level.level}
              </div>
              <CardTitle className="text-lg">{level.title}</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">{level.subtitle}</p>
          </div>
          {allMastered && (
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
              <Star className="h-3 w-3 mr-1" />
              Mastered
            </Badge>
          )}
          {isLocked && (
            <Badge variant="secondary">
              <Lock className="h-3 w-3 mr-1" />
              Locked
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          {level.description.slice(0, 150)}...
        </p>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-muted rounded-full mb-4 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${percentage}%`,
              backgroundColor: level.color,
            }}
          />
        </div>
        <div className="text-xs text-muted-foreground mb-3">
          {levelLabel}
          {!isLocked && !allMastered && masteredCount > 0 && ` — ${masteredCount}/${modules.length} drills mastered`}
        </div>

        {/* Module list */}
        <div className="space-y-1">
          {modules.map((mod) => {
            if (isLocked) {
              return (
                <div
                  key={mod.slug}
                  className="flex items-center gap-2 text-sm py-1 text-muted-foreground opacity-50"
                >
                  <MasteryDot level="not-started" />
                  <span className="truncate">{mod.title}</span>
                </div>
              );
            }

            const modPath = `${course}/${mod.level}/${mod.slug}`;
            const mastery = getMasteryLevel(modPath, "drillSet-0");

            return (
              <Link
                key={mod.slug}
                href={`/learn/${course}/${mod.level}/${mod.slug}`}
                className="flex items-center gap-2 text-sm py-1 hover:text-foreground transition-colors text-muted-foreground"
              >
                <MasteryDot level={mastery} />
                <span className="truncate">{mod.title}</span>
              </Link>
            );
          })}
        </div>

        {/* Start button */}
        {!isLocked && (
          <Link
            href={`/learn/${course}/${levelSlug}/index`}
            className="mt-4 inline-block text-sm font-medium hover:underline"
            style={{ color: level.color }}
          >
            {masteredCount > 0 ? "Continue" : "Start"} Level →
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
