"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, CheckCircle2, Circle } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { isModuleComplete } from "@/lib/store/progress";
import type { LevelInfo, ModuleMeta, CurriculumData } from "@/types/content";

import aiFlCurriculum from "../../../content/ai-fluency/curriculum.json";
import cfa1Curriculum from "../../../content/cfa-1/curriculum.json";
import cfa2Curriculum from "../../../content/cfa-2/curriculum.json";
import cfa3Curriculum from "../../../content/cfa-3/curriculum.json";
import coursesData from "../../../content/courses.json";
import type { CourseInfo } from "@/types/content";

const courses = coursesData as CourseInfo[];
const curricula: Record<string, CurriculumData> = {
  "ai-fluency": aiFlCurriculum as CurriculumData,
  "cfa-1": cfa1Curriculum as CurriculumData,
  "cfa-2": cfa2Curriculum as CurriculumData,
  "cfa-3": cfa3Curriculum as CurriculumData,
};

function getLevelOrder(curriculum: CurriculumData): string[] {
  return curriculum.levels.map((l) =>
    l.level === 0 ? "foundations" : `level-${l.level}`
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

  // Derive course from prop or URL
  const course = courseProp || pathname.split("/")[2] || "ai-fluency";
  const curriculum = curricula[course] || curricula["ai-fluency"];
  const levelOrder = getLevelOrder(curriculum);

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
        {levelOrder.map((levelSlug) => {
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
          const isActive = activeLevel === levelSlug;

          return (
            <Collapsible key={levelSlug} defaultOpen={isActive}>
              <CollapsibleTrigger className="flex items-center gap-2 w-full px-2 py-1.5 text-sm font-medium rounded-md hover:bg-accent transition-colors">
                {isActive ? (
                  <ChevronDown className="h-4 w-4 shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 shrink-0" />
                )}
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: levelInfo?.color || "#6b7280" }}
                />
                <span className="truncate text-left">
                  {levelSlug === "foundations"
                    ? "Foundations"
                    : `${(levelInfo?.levelLabel || "Level")[0]}${levelNum}: ${levelInfo?.title || levelSlug}`}
                </span>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="ml-6 mt-1 space-y-0.5">
                  {modules.map((mod: ModuleMeta) => {
                    const href = `/learn/${course}/${mod.level}/${mod.slug}`;
                    const isCurrent = pathname === href;
                    const completed = isModuleComplete(
                      `${course}/${mod.level}/${mod.slug}`
                    );

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
                        {completed ? (
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
    </nav>
  );
}
