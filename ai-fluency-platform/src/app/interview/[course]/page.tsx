"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { InterviewSetup } from "@/components/interview/InterviewSetup";
import { InterviewChat } from "@/components/interview/InterviewChat";
import { getAllProgress } from "@/lib/store/progress";
import { useAuth } from "@/lib/auth-context";
import { isSparkGatingEnabled } from "@/lib/sparks/feature-flags";
import { spendSparks, getBalance } from "@/lib/sparks/store";
import { syncSparkSpend } from "@/lib/sparks/db-sync";
import { generateIdempotencyKey } from "@/lib/sparks/idempotency";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface StudiedTopic {
  levelTitle: string;
  moduleTitle: string;
  completed: boolean;
}

interface CurriculumLevel {
  level: number;
  title: string;
}

interface CurriculumModule {
  title: string;
  level: string;
  slug: string;
  isIndex: boolean;
  isCheckpoint: boolean;
}

interface CurriculumData {
  levels: CurriculumLevel[];
  modules: Record<string, CurriculumModule[]>;
}

interface CourseInfo {
  id: string;
  title: string;
  description: string;
  color: string;
}

const INTERVIEW_COST = 100;

export default function InterviewCoursePage() {
  const params = useParams();
  const courseId = params.course as string;
  const { user } = useAuth();
  const gated = isSparkGatingEnabled(user?.email);

  const [phase, setPhase] = useState<"loading" | "setup" | "interview">(
    "loading"
  );
  const [courseName, setCourseName] = useState("");
  const [studiedTopics, setStudiedTopics] = useState<StudiedTopic[]>([]);
  const [difficulty, setDifficulty] = useState("intermediate");
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [sparkBalance, setSparkBalance] = useState(0);
  const [sparkError, setSparkError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch course info
        const coursesRes = await fetch("/api/courses");
        const courses: CourseInfo[] = await coursesRes.json();
        const course = courses.find((c) => c.id === courseId);
        if (course) setCourseName(course.title);

        // Fetch curriculum
        const currRes = await fetch(`/api/curriculum/${courseId}`);
        const curriculum: CurriculumData = await currRes.json();

        const progress = getAllProgress();

        // Build studied topics list
        const topics: StudiedTopic[] = [];
        for (const level of curriculum.levels) {
          const levelSlug =
            level.level === 0 ? "foundations" : `level-${level.level}`;
          const mods = curriculum.modules[levelSlug] || [];

          for (const mod of mods) {
            if (mod.isIndex || mod.isCheckpoint) continue;

            const progressKey = `${courseId}/${mod.level}/${mod.slug}`;
            const isCompleted =
              progress.modules[progressKey]?.completed || false;

            topics.push({
              levelTitle: level.title,
              moduleTitle: mod.title,
              completed: isCompleted,
            });
          }
        }

        setStudiedTopics(topics);
        setSparkBalance(getBalance());
        setPhase("setup");
      } catch {
        setPhase("setup");
      }
    }

    loadData();
  }, [courseId]);

  const handleStart = (diff: string, focus: string[]) => {
    if (gated) {
      const key = generateIdempotencyKey(
        user?.id || "anon",
        "cooldown_skip",
        `interview:${courseId}:${Date.now()}`
      );
      const result = spendSparks(INTERVIEW_COST, "cooldown_skip", key, {
        type: "interview_session",
        courseId,
      });
      if (!result.success) {
        setSparkError(
          `Not enough Sparks. You need ${INTERVIEW_COST} but have ${result.newBalance}.`
        );
        return;
      }
      syncSparkSpend("cooldown_skip", INTERVIEW_COST, key, {
        type: "interview_session",
        courseId,
      });
      setSparkBalance(result.newBalance);
    }
    setSparkError("");
    setDifficulty(diff);
    setFocusAreas(focus);
    setPhase("interview");
  };

  const handleBack = () => {
    setPhase("setup");
  };

  if (phase === "loading") {
    return (
      <div className="text-center text-muted-foreground py-24">
        Loading...
      </div>
    );
  }

  if (phase === "setup") {
    const completedCount = studiedTopics.filter((t) => t.completed).length;

    if (completedCount === 0) {
      return (
        <div className="max-w-md mx-auto px-4 py-24 text-center">
          <h2 className="text-xl font-bold mb-2">No topics studied yet</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Complete some modules in this course before starting an interview.
          </p>
          <Link href="/interview">
            <Button variant="outline" className="gap-1.5">
              <ArrowLeft className="h-4 w-4" />
              Back to Courses
            </Button>
          </Link>
        </div>
      );
    }

    return (
      <div>
        <InterviewSetup courseName={courseName} studiedTopics={studiedTopics} onStart={handleStart} />
        {gated && (
          <div className="max-w-md mx-auto px-4 mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Each interview session costs <span className="font-semibold">{INTERVIEW_COST} &#9889;</span> Sparks.
              You have <span className="font-semibold">{sparkBalance.toLocaleString()} &#9889;</span>.
            </p>
            {sparkError && (
              <p className="text-sm text-red-500 mt-1">{sparkError}</p>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <InterviewChat
      courseId={courseId}
      courseName={courseName}
      studiedTopics={studiedTopics}
      difficulty={difficulty}
      focusAreas={focusAreas}
      onBack={handleBack}
    />
  );
}
