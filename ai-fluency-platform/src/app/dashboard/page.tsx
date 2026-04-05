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

export default function DashboardPage() {
  const [progress, setProgress] = useState<ProgressStore>({ modules: {} });

  useEffect(() => {
    setProgress(getAllProgress());
  }, []);

  // Split courses into enrolled and unenrolled
  const enrolledCourses = courses
    .filter((c) => curricula[c.id] && isEnrolled(c.id, progress))
    .sort((a, b) => {
      const aTime = getMostRecentActivity(a.id, progress) ?? "";
      const bTime = getMostRecentActivity(b.id, progress) ?? "";
      return bTime.localeCompare(aTime);
    });

  const unenrolledCourses = courses.filter(
    (c) => curricula[c.id] && !isEnrolled(c.id, progress)
  );

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <LearningInsights progress={progress} courses={courses} curricula={curricula} />

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
                curriculum={curricula[course.id]}
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
                curriculum={curricula[course.id]}
                progress={progress}
              />
            ))}
          </div>
        </>
      )}
    </main>
  );
}
