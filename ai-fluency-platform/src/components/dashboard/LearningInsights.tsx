"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getStreakState } from "@/lib/sparks/streak";
import { getBalance } from "@/lib/sparks/store";
import type { ProgressStore } from "@/types/progress";
import type { CurriculumData, ModuleMeta } from "@/types/content";

interface CourseProgress {
  id: string;
  title: string;
  color: string;
  completed: number;
  total: number;
}

interface LearningInsightsProps {
  progress: ProgressStore;
  courses: { id: string; title: string; color: string }[];
  curricula: Record<string, CurriculumData>;
}

export function LearningInsights({
  progress,
  courses,
  curricula,
}: LearningInsightsProps) {
  const [lessonsCompleted, setLessonsCompleted] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [sparksBalance, setSparksBalance] = useState(0);
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);

  useEffect(() => {
    const modules = Object.values(progress.modules);
    const completed = modules.filter((m) => m.completed).length;
    setLessonsCompleted(completed);
    setCurrentStreak(getStreakState().currentStreak);
    setSparksBalance(getBalance());

    // Compute per-course progress
    const cp: CourseProgress[] = [];
    for (const course of courses) {
      const curriculum = curricula[course.id];
      if (!curriculum) continue;
      let total = 0;
      let done = 0;
      for (const levelSlug of Object.keys(curriculum.modules)) {
        const mods = (curriculum.modules[levelSlug] || []).filter(
          (m: ModuleMeta) => !m.isIndex
        );
        total += mods.length;
        for (const m of mods) {
          if (
            progress.modules[`${course.id}/${m.level}/${m.slug}`]?.completed
          ) {
            done++;
          }
        }
      }
      if (done > 0) {
        cp.push({
          id: course.id,
          title: course.title,
          color: course.color,
          completed: done,
          total,
        });
      }
    }
    setCourseProgress(cp);
  }, [progress, courses, curricula]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {/* Radial course progress chart */}
      <Card className="py-4 row-span-2 col-span-2 sm:col-span-1">
        <CardContent className="flex flex-col items-center justify-center h-full gap-2">
          <CourseRadialChart courses={courseProgress} />
          <span className="text-xs text-muted-foreground">Course Progress</span>
        </CardContent>
      </Card>

      {/* Stats */}
      <Card className="py-4">
        <CardContent className="flex flex-col items-center gap-1 text-center">
          <span className="text-2xl">{"\u{1F4DA}"}</span>
          <span className="text-xl font-bold">{lessonsCompleted}</span>
          <span className="text-xs text-muted-foreground">Lessons Done</span>
        </CardContent>
      </Card>
      <Card className="py-4">
        <CardContent className="flex flex-col items-center gap-1 text-center">
          <span className="text-2xl">{"\u{1F525}"}</span>
          <span className="text-xl font-bold">{currentStreak}</span>
          <span className="text-xs text-muted-foreground">Day Streak</span>
        </CardContent>
      </Card>
      <Card className="py-4">
        <CardContent className="flex flex-col items-center gap-1 text-center">
          <span className="text-2xl">{"\u26A1"}</span>
          <span className="text-xl font-bold">
            {sparksBalance.toLocaleString()}
          </span>
          <span className="text-xs text-muted-foreground">Sparks</span>
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Radial chart (pure SVG, no dependencies) ── */

function CourseRadialChart({ courses }: { courses: CourseProgress[] }) {
  if (courses.length === 0) {
    return (
      <div className="w-28 h-28 rounded-full border-4 border-dashed border-muted flex items-center justify-center">
        <span className="text-xs text-muted-foreground text-center px-2">
          Start a course!
        </span>
      </div>
    );
  }

  const size = 120;
  const center = size / 2;
  const strokeWidth = 8;
  const gap = 4;
  const baseRadius = (size - strokeWidth) / 2;

  return (
    <svg width={size} height={size} className="shrink-0">
      {courses.map((course, i) => {
        const radius = baseRadius - i * (strokeWidth + gap);
        if (radius < 10) return null;
        const circumference = 2 * Math.PI * radius;
        const pct = course.total > 0 ? course.completed / course.total : 0;
        const dashLength = circumference * pct;

        return (
          <g key={course.id}>
            {/* Track */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="currentColor"
              className="text-muted/30"
              strokeWidth={strokeWidth}
            />
            {/* Progress */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={course.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
              strokeDashoffset={circumference * 0.25}
              strokeLinecap="round"
              className="transition-all duration-700"
            />
          </g>
        );
      })}
      {/* Center text */}
      <text
        x={center}
        y={center - 6}
        textAnchor="middle"
        className="fill-foreground text-lg font-bold"
        fontSize="18"
      >
        {courses.reduce((s, c) => s + c.completed, 0)}
      </text>
      <text
        x={center}
        y={center + 10}
        textAnchor="middle"
        className="fill-muted-foreground"
        fontSize="9"
      >
        lessons
      </text>
    </svg>
  );
}
