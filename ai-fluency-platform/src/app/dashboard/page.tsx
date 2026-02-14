"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { getAllProgress } from "@/lib/store/progress";
import type { ProgressStore } from "@/types/progress";
import curriculumData from "../../../content/curriculum.json";
import type { LevelInfo, ModuleMeta } from "@/types/content";
import Link from "next/link";

const curriculum = curriculumData as {
  levels: LevelInfo[];
  modules: Record<string, ModuleMeta[]>;
};

const LEVEL_ORDER = [
  "foundations",
  "level-1",
  "level-2",
  "level-3",
  "level-4",
  "level-5",
  "level-6",
  "level-7",
];

export default function DashboardPage() {
  const [progress, setProgress] = useState<ProgressStore>({ modules: {} });

  useEffect(() => {
    setProgress(getAllProgress());
  }, []);

  const levelStats = LEVEL_ORDER.map((levelSlug) => {
    const levelNum =
      levelSlug === "foundations"
        ? 0
        : parseInt(levelSlug.replace("level-", ""));
    const levelInfo = curriculum.levels.find((l) => l.level === levelNum);
    const modules = (curriculum.modules[levelSlug] || []).filter(
      (m) => !m.isIndex
    );
    const completed = modules.filter(
      (m) => progress.modules[`${m.level}/${m.slug}`]?.completed
    ).length;

    return {
      levelSlug,
      levelInfo,
      modules,
      completed,
      total: modules.length,
      percentage: modules.length > 0 ? (completed / modules.length) * 100 : 0,
    };
  });

  const totalModules = levelStats.reduce((sum, l) => sum + l.total, 0);
  const totalCompleted = levelStats.reduce((sum, l) => sum + l.completed, 0);
  const overallPercentage =
    totalModules > 0 ? (totalCompleted / totalModules) * 100 : 0;

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* Overall Progress */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Overall Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-2">
            <Progress value={overallPercentage} className="flex-1" />
            <span className="text-sm font-medium whitespace-nowrap">
              {totalCompleted} / {totalModules} modules
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {Math.round(overallPercentage)}% complete
          </p>
        </CardContent>
      </Card>

      {/* Level Progress */}
      <div className="space-y-4">
        {levelStats.map((stat) => (
          <Card key={stat.levelSlug}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-6 h-6 rounded-full shrink-0"
                  style={{
                    backgroundColor: stat.levelInfo?.color || "#6b7280",
                  }}
                />
                <h3 className="font-semibold">
                  {stat.levelSlug === "foundations"
                    ? "Foundations"
                    : `Level ${stat.levelInfo?.level}: ${stat.levelInfo?.title}`}
                </h3>
                {stat.percentage === 100 && (
                  <Badge variant="secondary" className="ml-auto">
                    Complete
                  </Badge>
                )}
              </div>
              <Progress value={stat.percentage} className="mb-2" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>
                  {stat.completed} / {stat.total} modules
                </span>
                <span>{Math.round(stat.percentage)}%</span>
              </div>
              {/* Module list */}
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1">
                {stat.modules.map((mod) => {
                  const isComplete =
                    progress.modules[`${mod.level}/${mod.slug}`]?.completed;
                  return (
                    <Link
                      key={mod.slug}
                      href={`/learn/${mod.level}/${mod.slug}`}
                      className={`text-sm px-2 py-1 rounded hover:bg-accent transition-colors ${
                        isComplete
                          ? "text-green-600 dark:text-green-400"
                          : "text-muted-foreground"
                      }`}
                    >
                      {isComplete ? "✓ " : "○ "}
                      {mod.title}
                    </Link>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </main>
  );
}
