"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { ChevronDown, ChevronRight, CheckCircle2, Circle, Lock } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { isModuleComplete, isLevelFullyPassed, getMasteryLevel, getAllProgress } from "@/lib/store/progress";
import { getMasteryColor, type MasteryLevel } from "@/lib/poker/messages";
import type { LevelInfo, ModuleMeta, CurriculumData } from "@/types/content";

import aiFlCurriculum from "../../../content/ai-fluency/curriculum.json";
import cfa1Curriculum from "../../../content/cfa-1/curriculum.json";
import cfa2Curriculum from "../../../content/cfa-2/curriculum.json";
import cfa3Curriculum from "../../../content/cfa-3/curriculum.json";
import claudeCodeCurriculum from "../../../content/claude-code/curriculum.json";
import systemDesignCurriculum from "../../../content/system-design/curriculum.json";
import webFundamentalsCurriculum from "../../../content/web-fundamentals/curriculum.json";
import reactLiteracyCurriculum from "../../../content/react-literacy/curriculum.json";
import texasHoldemCurriculum from "../../../content/texas-holdem/curriculum.json";
import coursesData from "../../../content/courses.json";
import type { CourseInfo } from "@/types/content";

const courses = coursesData as CourseInfo[];
const curricula: Record<string, CurriculumData> = {
  "ai-fluency": aiFlCurriculum as CurriculumData,
  "cfa-1": cfa1Curriculum as CurriculumData,
  "cfa-2": cfa2Curriculum as CurriculumData,
  "cfa-3": cfa3Curriculum as CurriculumData,
  "claude-code": claudeCodeCurriculum as CurriculumData,
  "system-design": systemDesignCurriculum as CurriculumData,
  "web-fundamentals": webFundamentalsCurriculum as CurriculumData,
  "react-literacy": reactLiteracyCurriculum as CurriculumData,
  "texas-holdem": texasHoldemCurriculum as CurriculumData,
};

function getLevelOrder(curriculum: CurriculumData): string[] {
  return curriculum.levels.map((l) =>
    l.level === 0 ? "foundations" : `level-${l.level}`
  );
}

function MasteryDotSidebar({ modulePath }: { modulePath: string }) {
  const mastery = getMasteryLevel(modulePath, "drillSet-0");
  const color = getMasteryColor(mastery);
  const opacity: Record<MasteryLevel, number> = {
    "not-started": 0.2,
    "practicing": 0.5,
    "almost-ready": 0.75,
    "mastered": 1,
  };
  return (
    <div
      className="w-3.5 h-3.5 rounded-full border-2 shrink-0"
      style={{
        borderColor: color,
        backgroundColor: mastery === "not-started" ? "transparent" : color,
        opacity: opacity[mastery],
      }}
    />
  );
}

export function Sidebar({
  course: courseProp,
  onNavigate,
}: {
  course?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const [, setTick] = useState(0);

  // Derive course from prop, URL, or most recent activity
  const courseFromUrl = pathname.startsWith("/learn/") ? pathname.split("/")[2] : undefined;
  const recentCourse = useMemo(() => {
    if (courseProp || courseFromUrl) return courseProp || courseFromUrl || "ai-fluency";
    const progress = getAllProgress();
    let latest = "ai-fluency";
    let latestTime = "";
    for (const [key, state] of Object.entries(progress.modules)) {
      const t = (state as any).completedAt || "";
      if (t > latestTime) { latestTime = t; latest = key.split("/")[0]; }
    }
    return latest;
  }, [courseProp, courseFromUrl]);
  const course = recentCourse;
  const curriculum = curricula[course] || curricula["ai-fluency"];
  const levelOrder = getLevelOrder(curriculum);
  const courseInfo = courses.find((c) => c.id === course);
  const isDrill = courseInfo?.isDrillCourse;

  // Re-render when localStorage changes (progress updates)
  useEffect(() => {
    const handleStorage = () => setTick((t) => t + 1);
    window.addEventListener("storage", handleStorage);
    const interval = setInterval(handleStorage, 2000);
    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, []);

  // Determine which level is currently active
  const activeLevel = levelOrder.find((l) =>
    pathname.startsWith(`/learn/${course}/${l}`)
  );

  return (
    <nav className="h-full overflow-y-auto py-4 px-3">
      <div className="mb-4 px-2">
        <Link
          href={`/curriculum/${course}`}
          className="text-sm font-semibold text-muted-foreground hover:text-foreground"
          onClick={onNavigate}
        >
          {curriculum.levels.length > 0
            ? `${courses.find(c => c.id === course)?.title || course} Curriculum`
            : "Curriculum Overview"}
        </Link>
      </div>
      <div className="space-y-1">
        {levelOrder.map((levelSlug, levelIndex) => {
          const levelNum =
            levelSlug === "foundations"
              ? 0
              : parseInt(levelSlug.replace("level-", ""));
          const levelInfo = curriculum.levels.find(
            (l: LevelInfo) => l.level === levelNum
          );
          const modules = curriculum.modules[levelSlug]?.filter(
            (m: ModuleMeta) => !m.isIndex
          ) || [];
          const hasIndex = (curriculum.modules[levelSlug] || []).some((m: ModuleMeta) => m.isIndex);
          const isActive = activeLevel === levelSlug;

          // TODO: TEMPORARY - all levels unlocked for testing. Revert this!
          const isLevelLocked = false;
          // if (isDrill && levelIndex > 0) {
          //   const prevSlug = levelOrder[levelIndex - 1];
          //   const prevModules = curriculum.modules[prevSlug] || [];
          //   isLevelLocked = !isLevelFullyPassed(course, prevSlug, prevModules);
          // }

          return (
            <Collapsible key={levelSlug} defaultOpen={isActive}>
              <div className="flex items-center gap-2 w-full px-2 py-1.5 text-sm font-medium rounded-md hover:bg-accent transition-colors">
                <CollapsibleTrigger asChild>
                  <button className="shrink-0">
                    {isActive ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                </CollapsibleTrigger>
                {isDrill && isLevelLocked ? (
                  <Lock className="h-3 w-3 shrink-0 text-muted-foreground" />
                ) : (
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: levelInfo?.color || "#6b7280" }}
                  />
                )}
                {hasIndex ? (
                  <Link
                    href={`/learn/${course}/${levelSlug}/index`}
                    onClick={onNavigate}
                    className={`truncate text-left flex-1 ${isLevelLocked ? "opacity-50 pointer-events-none" : "hover:underline"}`}
                  >
                    {levelSlug === "foundations"
                      ? "Foundations"
                      : `${(levelInfo?.levelLabel || "Level")[0]}${levelNum}: ${levelInfo?.title || levelSlug}`}
                  </Link>
                ) : (
                  <span className={`truncate text-left flex-1 ${isLevelLocked ? "opacity-50" : ""}`}>
                    {levelSlug === "foundations"
                      ? "Foundations"
                      : `${(levelInfo?.levelLabel || "Level")[0]}${levelNum}: ${levelInfo?.title || levelSlug}`}
                  </span>
                )}
              </div>
              <CollapsibleContent>
                <div className="ml-6 mt-1 space-y-0.5">
                  {modules.map((mod: ModuleMeta) => {
                    const href = `/learn/${course}/${mod.level}/${mod.slug}`;
                    const isCurrent = pathname === href;
                    const completed = isModuleComplete(
                      `${course}/${mod.level}/${mod.slug}`
                    );

                    if (isLevelLocked) {
                      return (
                        <div
                          key={mod.slug}
                          className="flex items-center gap-2 px-2 py-1 text-sm text-muted-foreground opacity-40"
                        >
                          <Circle className="h-3.5 w-3.5 shrink-0 opacity-30" />
                          <span className="truncate">{mod.title}</span>
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={mod.slug}
                        href={href}
                        onClick={onNavigate}
                        className={`flex items-center gap-2 px-2 py-1 text-sm rounded-md transition-colors ${
                          isCurrent
                            ? "bg-accent font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                        }`}
                      >
                        {isDrill ? (
                          <MasteryDotSidebar modulePath={`${course}/${mod.level}/${mod.slug}`} />
                        ) : completed ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
                        ) : (
                          <Circle className="h-3.5 w-3.5 shrink-0 opacity-30" />
                        )}
                        <span className="truncate">{mod.title}</span>
                      </Link>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>

      {/* Decision Trainer link for drill courses */}
      {isDrill && (
        <div className="mt-4 px-2 pt-3 border-t">
          <Link
            href={`/play/${course}`}
            onClick={onNavigate}
            className={`flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors ${
              pathname === `/play/${course}`
                ? "bg-accent font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            }`}
          >
            <span className="text-base">🎯</span>
            <span>Decision Trainer</span>
          </Link>
        </div>
      )}
    </nav>
  );
}
