"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getStreakState } from "@/lib/sparks/streak";
import { getAllProgress } from "@/lib/store/progress";
import { selectQuestions } from "@/lib/store/quiz-history";
import { DailyQuizModal } from "@/components/review/DailyQuizModal";
import type { ReviewQuestion } from "@/types/review";

export function DailyReviewCard() {
  const [completedToday, setCompletedToday] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [quizOpen, setQuizOpen] = useState(false);
  const [questions, setQuestions] = useState<ReviewQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const streak = getStreakState();
    setCurrentStreak(streak.currentStreak);
    const today = new Date().toISOString().slice(0, 10);
    if (streak.lastActivityDate === today) {
      setCompletedToday(true);
    }
  }, []);

  const handleStartReview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/review-questions.json");
      const allQuestions: ReviewQuestion[] = await res.json();

      const progress = getAllProgress();
      const completedModulePaths = new Set(
        Object.entries(progress.modules)
          .filter(([, m]) => m.completed)
          .map(([key]) => key)
      );

      const eligible = allQuestions.filter((q) =>
        completedModulePaths.has(q.modulePath)
      );

      const selected = selectQuestions(eligible, 5);

      if (selected.length > 0) {
        setQuestions(selected);
        setQuizOpen(true);
      }
    } catch {
      // Failed to load questions
    } finally {
      setLoading(false);
    }
  }, []);

  const handleQuizClose = useCallback(() => {
    setQuizOpen(false);
    setQuestions([]);
    // Refresh streak state
    const streak = getStreakState();
    setCurrentStreak(streak.currentStreak);
    const today = new Date().toISOString().slice(0, 10);
    if (streak.lastActivityDate === today) {
      setCompletedToday(true);
    }
  }, []);

  if (!mounted) {
    return (
      <Card className="py-4">
        <CardHeader>
          <CardTitle className="text-base">Daily Review</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="py-4">
        <CardHeader>
          <CardTitle className="text-base">
            {"\u{1F525}"} Daily Review
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3">
          <span className="text-2xl font-bold">
            {currentStreak} day{currentStreak !== 1 ? "s" : ""}
          </span>
          <p className="text-xs text-muted-foreground">Current Streak</p>

          {completedToday && (
            <p className="text-sm text-green-600 dark:text-green-400 font-medium mb-1">
              {"\u2713"} Completed today!
            </p>
          )}
          <Button
            onClick={handleStartReview}
            disabled={loading}
            variant={completedToday ? "outline" : "default"}
            className="w-full"
          >
            {loading
              ? "Loading..."
              : completedToday
                ? "Practice More"
                : "Start Daily Review"}
          </Button>
        </CardContent>
      </Card>

      {questions.length > 0 && (
        <DailyQuizModal
          open={quizOpen}
          onClose={handleQuizClose}
          questions={questions}
        />
      )}
    </>
  );
}
