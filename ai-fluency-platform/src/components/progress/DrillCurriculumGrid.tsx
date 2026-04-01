"use client";

import { useState, useEffect } from "react";
import { DrillLevelCard } from "./DrillLevelCard";
import { isLevelFullyPassed } from "@/lib/store/progress";
import type { CurriculumData } from "@/types/content";

interface DrillCurriculumGridProps {
  curriculum: CurriculumData;
  course: string;
}

export function DrillCurriculumGrid({ curriculum, course }: DrillCurriculumGridProps) {
  const [, setTick] = useState(0);

  // Re-render when localStorage changes
  useEffect(() => {
    const handleStorage = () => setTick((t) => t + 1);
    window.addEventListener("storage", handleStorage);
    const interval = setInterval(handleStorage, 2000);
    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, []);

  const levelSlugs = curriculum.levels.map((l) =>
    l.level === 0 ? "foundations" : `level-${l.level}`
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {curriculum.levels.map((level, index) => {
        const levelSlug = levelSlugs[index];
        const modules = (curriculum.modules[levelSlug] || []).filter(
          (m) => !m.isIndex
        );

        // TODO: TEMPORARY - all levels unlocked for testing. Revert this!
        // First level is always unlocked; others require previous level fully passed
        const isLocked = false;
        // if (index > 0) {
        //   const prevLevelSlug = levelSlugs[index - 1];
        //   const prevModules = curriculum.modules[prevLevelSlug] || [];
        //   isLocked = !isLevelFullyPassed(course, prevLevelSlug, prevModules);
        // }

        return (
          <DrillLevelCard
            key={level.level}
            level={level}
            levelSlug={levelSlug}
            modules={modules}
            course={course}
            isLocked={isLocked}
          />
        );
      })}
    </div>
  );
}
