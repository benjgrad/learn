"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QuizQuestion } from "./QuizQuestion";
import { QuizSummary } from "./QuizSummary";
import { recordAnswer } from "@/lib/store/quiz-history";
import { celebrateInteraction } from "@/lib/celebrations";
import { addSparks, getBalance } from "@/lib/sparks/store";
import { syncSparkEarn } from "@/lib/sparks/db-sync";
import { generateIdempotencyKey } from "@/lib/sparks/idempotency";
import { SPARK_CONFIG } from "@/lib/sparks/config";
import { updateStreak as updateSparkStreak, getStreakBonus } from "@/lib/sparks/streak";
import { dismissQuiz, recordQuiz } from "@/lib/store/xp";
import type { ReviewQuestion } from "@/types/review";

type QuizState = "intro" | "question" | "summary";

interface DailyQuizModalProps {
  open: boolean;
  onClose: () => void;
  questions: ReviewQuestion[];
}

export function DailyQuizModal({
  open,
  onClose,
  questions,
}: DailyQuizModalProps) {
  const [state, setState] = useState<QuizState>("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [sessionSparks, setSessionSparks] = useState(0);
  const [streak, setStreak] = useState(0);

  const handleStart = useCallback(() => {
    const result = updateSparkStreak();
    setStreak(result.newStreak);
    setState("question");
  }, []);

  const handleDismiss = useCallback(() => {
    dismissQuiz();
    onClose();
  }, [onClose]);

  const handleAnswer = useCallback(
    (correct: boolean) => {
      // Record answer for spaced repetition scheduling
      const currentQuestion = questions[currentIndex];
      if (currentQuestion) {
        recordAnswer(currentQuestion.id, correct);
      }

      // Award sparks per answer
      const answerSparks = correct ? 5 : 1;
      const answerKey = generateIdempotencyKey(
        "anon",
        "quiz_completed",
        `answer:${new Date().toISOString().slice(0, 10)}:${currentIndex}`
      );
      addSparks(answerSparks, "quiz_completed", answerKey);
      syncSparkEarn("quiz_completed", answerSparks, answerKey);
      setSessionSparks((prev) => prev + answerSparks);

      if (correct) {
        setCorrectCount((prev) => prev + 1);
        celebrateInteraction("#f59e0b");
      }

      setTimeout(() => {
        if (currentIndex + 1 < questions.length) {
          setCurrentIndex((prev) => prev + 1);
        } else {
          // Quiz complete — completion bonus + streak bonus
          const finalCorrect = correctCount + (correct ? 1 : 0);
          const isPerfect = finalCorrect === questions.length;
          const completionSparks = SPARK_CONFIG.quizBaseReward +
            (isPerfect ? SPARK_CONFIG.quizPerfectBonus : 0);
          const streakBonus = getStreakBonus(streak);
          const bonusTotal = completionSparks + streakBonus;

          const bonusKey = generateIdempotencyKey(
            "anon",
            "quiz_completed",
            `bonus:${new Date().toISOString().slice(0, 10)}`
          );
          addSparks(bonusTotal, "quiz_completed", bonusKey, {
            correctCount: finalCorrect,
            totalQuestions: questions.length,
            isPerfect,
            streakBonus,
          });
          syncSparkEarn("quiz_completed", bonusTotal, bonusKey, {
            correctCount: finalCorrect,
            totalQuestions: questions.length,
            isPerfect,
            streakBonus,
          });
          setSessionSparks((prev) => prev + bonusTotal);

          recordQuiz({
            date: new Date().toISOString().slice(0, 10),
            questionsAnswered: questions.length,
            correctCount: finalCorrect,
            xpEarned: 0,
          });

          setState("summary");
        }
      }, 100);
    },
    [currentIndex, questions, streak, correctCount]
  );

  const handleFinish = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleDismiss()}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-md overflow-hidden"
      >
        {state === "intro" && (
          <div className="flex flex-col items-center gap-5 py-4 animate-in fade-in duration-300">
            <DialogHeader className="items-center">
              <div className="text-4xl mb-2">{"\ud83c\udf1f"}</div>
              <DialogTitle className="text-xl text-center">
                Welcome back!
              </DialogTitle>
              <p className="text-muted-foreground text-sm text-center">
                Ready for your daily review? Just {questions.length} quick
                questions to keep your knowledge fresh.
              </p>
            </DialogHeader>

            <div className="flex flex-col gap-3 w-full">
              <Button onClick={handleStart} className="w-full" size="lg">
                Let&apos;s Go!
              </Button>
              <Button
                onClick={handleDismiss}
                variant="ghost"
                className="w-full text-muted-foreground"
              >
                Not Now
              </Button>
            </div>
          </div>
        )}

        {state === "question" && questions[currentIndex] && (
          <div
            key={currentIndex}
            className="animate-in fade-in slide-in-from-right-4 duration-300"
          >
            <QuizQuestion
              question={questions[currentIndex]}
              questionNumber={currentIndex}
              totalQuestions={questions.length}
              onAnswer={handleAnswer}
            />
          </div>
        )}

        {state === "summary" && (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <QuizSummary
              sparksEarned={sessionSparks}
              totalSparks={getBalance()}
              streak={streak}
              correctCount={correctCount}
              totalQuestions={questions.length}
            />
            <Button
              onClick={handleFinish}
              className="w-full mt-6"
              size="lg"
            >
              See You Tomorrow!
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
