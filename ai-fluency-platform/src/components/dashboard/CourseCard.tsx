"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { ProgressStore } from "@/types/progress";
import type { CurriculumData, LevelInfo, ModuleMeta } from "@/types/content";

interface CourseCardProps {
  course: { id: string; title: string; description: string; color: string };
  curriculum: CurriculumData;
  progress: ProgressStore;
}

function getLevelOrder(curriculum: CurriculumData): string[] {
  return curriculum.levels.map((l) =>
    l.level === 0 ? "foundations" : `level-${l.level}`
  );
}

function findNextIncompleteModule(
  courseId: string,
  curriculum: CurriculumData,
  progress: ProgressStore
): string | null {
  const levelOrder = getLevelOrder(curriculum);
  for (const levelSlug of levelOrder) {
    const modules = (curriculum.modules[levelSlug] || []).filter(
      (m: ModuleMeta) => !m.isIndex
    );
    for (const mod of modules) {
      const key = `${courseId}/${mod.level}/${mod.slug}`;
      if (!progress.modules[key]?.completed) {
        return `/learn/${courseId}/${mod.level}/${mod.slug}`;
      }
    }
  }
  return null;
}

function getFirstModulePath(
  courseId: string,
  curriculum: CurriculumData
): string {
  const levelOrder = getLevelOrder(curriculum);
  const firstLevel = levelOrder[0];
  if (firstLevel) {
    // Link to the level index page
    return `/curriculum/${courseId}`;
  }
  return `/curriculum/${courseId}`;
}

export function CourseCard({ course, curriculum, progress }: CourseCardProps) {
  const levelOrder = getLevelOrder(curriculum);

  // Check if enrolled (has any completed module)
  const hasProgress = Object.keys(progress.modules).some(
    (key) => key.startsWith(course.id + "/") && progress.modules[key]?.completed
  );

  if (!hasProgress) {
    // Unenrolled card
    return (
      <Card className="py-4">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: course.color }}
            />
            <CardTitle className="text-base">{course.title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">{course.description}</p>
          <Button asChild variant="outline" className="w-full">
            <Link href={getFirstModulePath(course.id, curriculum)}>
              Start Course
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Enrolled card with progress
  const levelStats = levelOrder.map((levelSlug) => {
    const levelNum =
      levelSlug === "foundations"
        ? 0
        : parseInt(levelSlug.replace("level-", ""));
    const levelInfo = curriculum.levels.find(
      (l: LevelInfo) => l.level === levelNum
    );
    const modules = (curriculum.modules[levelSlug] || []).filter(
      (m: ModuleMeta) => !m.isIndex
    );
    const completed = modules.filter(
      (m: ModuleMeta) =>
        progress.modules[`${course.id}/${m.level}/${m.slug}`]?.completed
    ).length;

    return {
      levelSlug,
      levelInfo,
      completed,
      total: modules.length,
      percentage: modules.length > 0 ? (completed / modules.length) * 100 : 0,
    };
  });

  const totalModules = levelStats.reduce((sum, l) => sum + l.total, 0);
  const totalCompleted = levelStats.reduce((sum, l) => sum + l.completed, 0);
  const overallPercentage =
    totalModules > 0 ? (totalCompleted / totalModules) * 100 : 0;

  const nextModulePath = findNextIncompleteModule(
    course.id,
    curriculum,
    progress
  );

  return (
    <Card className="py-4">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full shrink-0"
            style={{ backgroundColor: course.color }}
          />
          <CardTitle className="text-base">{course.title}</CardTitle>
          {overallPercentage === 100 && (
            <Badge variant="secondary" className="ml-auto">
              Complete
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Progress value={overallPercentage} className="flex-1" />
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {totalCompleted}/{totalModules}
          </span>
        </div>

        {/* Level breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {levelStats.map((stat) => (
            <div key={stat.levelSlug} className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  backgroundColor: stat.levelInfo?.color || "#6b7280",
                }}
              />
              <span className="text-xs text-muted-foreground truncate">
                {stat.levelSlug === "foundations"
                  ? "Foundations"
                  : `L${stat.levelInfo?.level}`}
              </span>
              <span className="text-xs font-medium ml-auto">
                {stat.completed}/{stat.total}
              </span>
            </div>
          ))}
        </div>

        {nextModulePath ? (
          <Button asChild className="w-full">
            <Link href={nextModulePath}>Continue Learning</Link>
          </Button>
        ) : (
          <Button asChild variant="outline" className="w-full">
            <Link href={`/curriculum/${course.id}`}>Review Course</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
