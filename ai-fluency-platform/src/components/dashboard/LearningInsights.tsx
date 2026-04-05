"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getStreakState } from "@/lib/sparks/streak";
import { getBalance } from "@/lib/sparks/store";
import type { ProgressStore } from "@/types/progress";

interface LearningInsightsProps {
  progress: ProgressStore;
}

interface Stats {
  lessonsCompleted: number;
  currentStreak: number;
  sparksBalance: number;
  mostActiveCourse: string;
  overallCompletion: number;
}

export function LearningInsights({ progress }: LearningInsightsProps) {
  const [stats, setStats] = useState<Stats>({
    lessonsCompleted: 0,
    currentStreak: 0,
    sparksBalance: 0,
    mostActiveCourse: "-",
    overallCompletion: 0,
  });

  useEffect(() => {
    const modules = Object.values(progress.modules);
    const completedModules = modules.filter((m) => m.completed);
    const lessonsCompleted = completedModules.length;

    // Most active course
    const courseCounts: Record<string, number> = {};
    for (const m of completedModules) {
      const courseId = m.modulePath.split("/")[0];
      courseCounts[courseId] = (courseCounts[courseId] || 0) + 1;
    }
    const mostActiveCourse =
      Object.entries(courseCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";

    // Overall completion approximation from progress data
    const totalModules = modules.length;
    const overallCompletion =
      totalModules > 0
        ? Math.round((lessonsCompleted / totalModules) * 100)
        : 0;

    setStats({
      lessonsCompleted,
      currentStreak: getStreakState().currentStreak,
      sparksBalance: getBalance(),
      mostActiveCourse,
      overallCompletion,
    });
  }, [progress]);

  const statItems = [
    { icon: "\u{1F4DA}", value: stats.lessonsCompleted, label: "Lessons Done" },
    { icon: "\u{1F525}", value: stats.currentStreak, label: "Day Streak" },
    { icon: "\u2728", value: stats.sparksBalance, label: "Sparks" },
    { icon: "\u{1F3AF}", value: stats.mostActiveCourse, label: "Top Course" },
    { icon: "\u{1F4C8}", value: `${stats.overallCompletion}%`, label: "Completion" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {statItems.map((item) => (
        <Card key={item.label} className="py-4">
          <CardContent className="flex flex-col items-center gap-1 text-center">
            <span className="text-2xl">{item.icon}</span>
            <span className="text-xl font-bold">{item.value}</span>
            <span className="text-xs text-muted-foreground">{item.label}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
