"use client";

import { useEffect, useState } from "react";
import { celebrateLevel } from "@/lib/celebrations";

interface QuizSummaryProps {
  sparksEarned: number;
  totalSparks: number;
  streak: number;
  correctCount: number;
  totalQuestions: number;
}

export function QuizSummary({
  sparksEarned,
  totalSparks,
  streak,
  correctCount,
  totalQuestions,
}: QuizSummaryProps) {
  const [displaySparks, setDisplaySparks] = useState(0);

  // Animated spark counter
  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const increment = sparksEarned / steps;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      setDisplaySparks(Math.min(sparksEarned, Math.round(increment * step)));
      if (step >= steps) clearInterval(interval);
    }, duration / steps);

    return () => clearInterval(interval);
  }, [sparksEarned]);

  // Celebrate on mount
  useEffect(() => {
    if (correctCount === totalQuestions) {
      const timer = setTimeout(() => celebrateLevel(), 500);
      return () => clearTimeout(timer);
    }
  }, [correctCount, totalQuestions]);

  return (
    <div className="flex flex-col items-center gap-6 py-2">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-2xl font-bold mb-1">Great job today!</h3>
        <p className="text-muted-foreground text-sm">
          {correctCount}/{totalQuestions} correct
        </p>
      </div>

      {/* Sparks earned */}
      <div className="text-center">
        <div className="text-5xl font-bold text-amber-500 tabular-nums">
          +{displaySparks}
        </div>
        <p className="text-sm text-muted-foreground mt-1">Sparks earned</p>
      </div>

      {/* Balance */}
      <div className="w-full text-center">
        <p className="text-sm text-muted-foreground">
          Total balance: <span className="font-semibold text-foreground">{totalSparks.toLocaleString()} &#9889;</span>
        </p>
      </div>

      {/* Streak */}
      {streak > 0 && (
        <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-950/30 rounded-full px-4 py-2">
          <span className="text-lg">{"\ud83d\udd25"}</span>
          <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
            {streak} day streak!
          </span>
        </div>
      )}

      {/* Perfect score callout */}
      {correctCount === totalQuestions && (
        <div className="text-center animate-in fade-in zoom-in-50 duration-500 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-2xl px-6 py-4 w-full">
          <p className="text-xs font-medium text-amber-600 uppercase tracking-wide mb-1">
            Perfect Score!
          </p>
          <p className="text-lg font-bold">
            +{SPARK_PERFECT_LABEL} bonus Sparks
          </p>
        </div>
      )}
    </div>
  );
}

const SPARK_PERFECT_LABEL = 5;
