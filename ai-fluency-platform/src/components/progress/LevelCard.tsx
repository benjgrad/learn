"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { isModuleComplete } from "@/lib/store/progress";
import Link from "next/link";
import type { LevelInfo, ModuleMeta } from "@/types/content";
import { CheckCircle2, Circle } from "lucide-react";

export function LevelCard({
  level,
  levelSlug,
  modules,
  course = "ai-fluency",
}: {
  level: LevelInfo;
  levelSlug: string;
  modules: ModuleMeta[];
  course?: string;
}) {
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    const count = modules.filter((m) =>
      isModuleComplete(`${course}/${m.level}/${m.slug}`)
    ).length;
    setCompletedCount(count);
  }, [modules]);

  const percentage = modules.length > 0 ? (completedCount / modules.length) * 100 : 0;

  return (
    <Card className="overflow-hidden">
      <div className="h-1" style={{ backgroundColor: level.color }} />
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: level.color }}
              >
                {level.level}
              </div>
              <CardTitle className="text-lg">{level.title}</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">{level.subtitle}</p>
          </div>
          {percentage === 100 && (
            <Badge variant="secondary">Complete</Badge>
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
          {completedCount}/{modules.length} modules complete
        </div>
        {/* Module list */}
        <div className="space-y-1">
          {modules.map((mod) => {
            const complete = isModuleComplete(`${mod.level}/${mod.slug}`);
            return (
              <Link
                key={mod.slug}
                href={`/learn/${course}/${mod.level}/${mod.slug}`}
                className="flex items-center gap-2 text-sm py-1 hover:text-foreground transition-colors text-muted-foreground"
              >
                {complete ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                ) : (
                  <Circle className="h-3.5 w-3.5 shrink-0 opacity-30" />
                )}
                <span className="truncate">{mod.title}</span>
              </Link>
            );
          })}
        </div>
        {/* Start button */}
        <Link
          href={`/learn/${course}/${levelSlug}/index`}
          className="mt-4 inline-block text-sm font-medium hover:underline"
          style={{ color: level.color }}
        >
          {completedCount > 0 ? "Continue" : "Start"} {level.levelLabel || "Level"} →
        </Link>
      </CardContent>
    </Card>
  );
}
