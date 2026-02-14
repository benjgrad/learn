"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, CheckCircle2, Circle } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { isModuleComplete } from "@/lib/store/progress";
import curriculumData from "../../../content/curriculum.json";
import type { LevelInfo, ModuleMeta } from "@/types/content";

const curriculum = curriculumData as { levels: LevelInfo[]; modules: Record<string, ModuleMeta[]> };

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

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [, setTick] = useState(0);

  // Re-render when localStorage changes (progress updates)
  useEffect(() => {
    const handleStorage = () => setTick((t) => t + 1);
    window.addEventListener("storage", handleStorage);
    // Also poll for same-tab changes
    const interval = setInterval(handleStorage, 2000);
    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, []);

  // Determine which level is currently active
  const activeLevel = LEVEL_ORDER.find((l) =>
    pathname.startsWith(`/learn/${l}`)
  );

  return (
    <nav className="h-full overflow-y-auto py-4 px-3">
      <div className="mb-4 px-2">
        <Link
          href="/curriculum"
          className="text-sm font-semibold text-muted-foreground hover:text-foreground"
          onClick={onNavigate}
        >
          Curriculum Overview
        </Link>
      </div>
      <div className="space-y-1">
        {LEVEL_ORDER.map((levelSlug) => {
          const levelNum =
            levelSlug === "foundations"
              ? 0
              : parseInt(levelSlug.replace("level-", ""));
          const levelInfo = curriculum.levels.find(
            (l) => l.level === levelNum
          );
          const modules = curriculum.modules[levelSlug]?.filter(
            (m) => !m.isIndex
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
                    : `L${levelNum}: ${levelInfo?.title || levelSlug}`}
                </span>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="ml-6 mt-1 space-y-0.5">
                  {modules.map((mod) => {
                    const href = `/learn/${mod.level}/${mod.slug}`;
                    const isCurrent = pathname === href;
                    const completed = isModuleComplete(
                      `${mod.level}/${mod.slug}`
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
