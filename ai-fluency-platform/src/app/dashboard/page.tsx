"use client";

import { useEffect, useState } from "react";
import { getAllProgress } from "@/lib/store/progress";
import type { ProgressStore } from "@/types/progress";
import type { CurriculumData } from "@/types/content";

import { LearningInsights } from "@/components/dashboard/LearningInsights";
import { DailyReviewCard } from "@/components/dashboard/DailyReviewCard";
import { DailySpinLottery } from "@/components/dashboard/DailySpinLottery";
import { AchievementsRow } from "@/components/dashboard/AchievementsRow";
import { CourseCard } from "@/components/dashboard/CourseCard";

import aiFlCurriculum from "../../../content/ai-fluency/curriculum.json";
import cfa1Curriculum from "../../../content/cfa-1/curriculum.json";
import cfa2Curriculum from "../../../content/cfa-2/curriculum.json";
import cfa3Curriculum from "../../../content/cfa-3/curriculum.json";
import claudeCodeCurriculum from "../../../content/claude-code/curriculum.json";
import systemDesignCurriculum from "../../../content/system-design/curriculum.json";
import webFundCurriculum from "../../../content/web-fundamentals/curriculum.json";
import reactLitCurriculum from "../../../content/react-literacy/curriculum.json";
import texasHoldemCurriculum from "../../../content/texas-holdem/curriculum.json";
import contractBridgeCurriculum from "../../../content/contract-bridge/curriculum.json";
import makePmCurriculum from "../../../content/make-pm/curriculum.json";
import coursesData from "../../../content/courses.json";

const courses = coursesData as {
  id: string;
  title: string;
  description: string;
  color: string;
}[];

const curricula: Record<string, CurriculumData> = {
  "ai-fluency": aiFlCurriculum as CurriculumData,
  "cfa-1": cfa1Curriculum as CurriculumData,
  "cfa-2": cfa2Curriculum as CurriculumData,
  "cfa-3": cfa3Curriculum as CurriculumData,
  "claude-code": claudeCodeCurriculum as CurriculumData,
  "system-design": systemDesignCurriculum as CurriculumData,
  "web-fundamentals": webFundCurriculum as CurriculumData,
  "react-literacy": reactLitCurriculum as CurriculumData,
  "texas-holdem": texasHoldemCurriculum as CurriculumData,
  "contract-bridge": contractBridgeCurriculum as CurriculumData,
  "make-pm": makePmCurriculum as CurriculumData,
};

function isEnrolled(courseId: string, progress: ProgressStore): boolean {
  return Object.keys(progress.modules).some(
    (key) => key.startsWith(courseId + "/") && progress.modules[key]?.completed
  );
}

function getMostRecentActivity(
  courseId: string,
  progress: ProgressStore
): string | null {
  let latest: string | null = null;
  for (const [key, mod] of Object.entries(progress.modules)) {
    if (!key.startsWith(courseId + "/")) continue;
    if (mod.completedAt && (!latest || mod.completedAt > latest)) {
      latest = mod.completedAt;
    }
  }
  return latest;
}

type DashboardCourse = (typeof courses)[number];

/**
 * Private courses are kept out of the static imports above, which ship in the
 * public bundle. The owner gets them from the gated APIs; everyone else gets an
 * empty list and the dashboard is unchanged.
 */
function usePrivateCourses() {
  const [loaded, setLoaded] = useState<{
    courses: DashboardCourse[];
    curricula: Record<string, CurriculumData>;
  }>({ courses: [], curricula: {} });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/courses/private");
      const list: DashboardCourse[] = res.ok ? await res.json() : [];
      const entries = await Promise.all(
        list.map(async (c) => {
          const r = await fetch(`/api/curriculum/${c.id}`);
          return r.ok ? ([c.id, (await r.json()) as CurriculumData] as const) : null;
        })
      );
      const loadedCurricula = Object.fromEntries(entries.filter((e) => e !== null));
      if (!cancelled) {
        setLoaded({ courses: list.filter((c) => loadedCurricula[c.id]), curricula: loadedCurricula });
      }
    })().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return loaded;
}

export default function DashboardPage() {
  const [progress, setProgress] = useState<ProgressStore>({ modules: {} });
  const privateCourses = usePrivateCourses();

  useEffect(() => {
    setProgress(getAllProgress());
  }, []);

  const allCourses = [...courses, ...privateCourses.courses];
  const allCurricula = { ...curricula, ...privateCourses.curricula };
  const privateIds = new Set(privateCourses.courses.map((c) => c.id));

  // Split courses into enrolled and unenrolled. A private course was made for
  // its owner, so it always sits under "Your Courses", even before it's started.
  const enrolledCourses = allCourses
    .filter((c) => allCurricula[c.id] && (privateIds.has(c.id) || isEnrolled(c.id, progress)))
    .sort((a, b) => {
      const aTime = getMostRecentActivity(a.id, progress) ?? "";
      const bTime = getMostRecentActivity(b.id, progress) ?? "";
      return bTime.localeCompare(aTime);
    });

  const unenrolledCourses = allCourses.filter(
    (c) => allCurricula[c.id] && !privateIds.has(c.id) && !isEnrolled(c.id, progress)
  );

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <LearningInsights progress={progress} courses={allCourses} curricula={allCurricula} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <DailyReviewCard />
        <DailySpinLottery />
      </div>

      <AchievementsRow />

      {enrolledCourses.length > 0 && (
        <>
          <h2 className="text-2xl font-bold mt-12 mb-4">Your Courses</h2>
          <div className="space-y-6">
            {enrolledCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                curriculum={allCurricula[course.id]}
                progress={progress}
              />
            ))}
          </div>
        </>
      )}

      {unenrolledCourses.length > 0 && (
        <>
          <h2 className="text-2xl font-bold mt-12 mb-4">Explore More</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {unenrolledCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                curriculum={allCurricula[course.id]}
                progress={progress}
              />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
