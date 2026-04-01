"use client";

import { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  Trophy,
  RotateCcw,
  ChevronRight,
  Sparkles,
  Lock,
  BookOpen,
  Target,
} from "lucide-react";
import { CardDisplay } from "@/components/poker/CardDisplay";
import type { DrillProblem } from "@/types/content";
import type { DrillAttempt } from "@/types/progress";
import { generateProblems, type GeneratorType } from "@/lib/poker/generators";
import {
  getTestResultMessage,
  getSpeedFeedback,
  getPracticeResultMessage,
  getPracticeProgressMessage,
  getDailyLimitMessage,
  getMasteryLabel,
  getMasteryColor,
  type MasteryLevel,
} from "@/lib/poker/messages";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface DrillSetProps {
  title: string;
  instructions?: string;
  problems?: DrillProblem[];
  generator?: string;
  problemCount?: number;
  passThreshold: number;
  timeLimitSeconds: number;
  interactionKey: string;
  onComplete?: (key: string, result: string) => void;
  onDrillPassed?: (key: string, attempt: DrillAttempt) => void;
  onDrillFailed?: (key: string, attempt: DrillAttempt) => void;
  onPracticeComplete?: (key: string) => void;
  isPassed?: boolean;
  previousAttempts?: DrillAttempt[];
  practiceSessionCount?: number;
  masteryLevel?: MasteryLevel;
  canPractice?: boolean;
  isTestUnlocked?: boolean;
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

type DrillPhase =
  | "intro"
  | "practice-active"
  | "practice-results"
  | "test-active"
  | "test-results";

export function DrillSet({
  title,
  instructions,
  problems: staticProblems,
  generator,
  problemCount = 10,
  passThreshold,
  timeLimitSeconds,
  interactionKey,
  onComplete,
  onDrillPassed,
  onDrillFailed,
  onPracticeComplete,
  isPassed,
  previousAttempts = [],
  practiceSessionCount = 0,
  masteryLevel = "not-started",
  canPractice = true,
  isTestUnlocked = false,
}: DrillSetProps) {
  const [phase, setPhase] = useState<DrillPhase>("intro");
  const [currentProblems, setCurrentProblems] = useState<DrillProblem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [startTime, setStartTime] = useState<number>(0);
  const [lastAttempt, setLastAttempt] = useState<DrillAttempt | null>(null);
  const [attemptCount, setAttemptCount] = useState(previousAttempts.length);
  const [reviewIndex, setReviewIndex] = useState<number | null>(null);
  // In practice mode, track which problems have been revealed
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  const getProblems = useCallback((): DrillProblem[] => {
    if (generator) {
      return generateProblems(generator as GeneratorType, problemCount);
    }
    return shuffleArray(staticProblems || []);
  }, [generator, problemCount, staticProblems]);

  const startPractice = useCallback(() => {
    const probs = getProblems();
    setCurrentProblems(probs);
    setCurrentIndex(0);
    setAnswers({});
    setRevealed({});
    setPhase("practice-active");
  }, [getProblems]);

  const startTest = useCallback(() => {
    const probs = getProblems();
    setCurrentProblems(probs);
    setCurrentIndex(0);
    setAnswers({});
    setStartTime(Date.now());
    setPhase("test-active");
  }, [getProblems]);

  const finishSession = useCallback(
    (mode: "practice" | "test") => {
      const timeUsed = mode === "test" ? (Date.now() - startTime) / 1000 : 0;
      const correctCount = currentProblems.filter((p, i) => {
        const selected = answers[i];
        if (!selected) return false;
        return selected === p.correctAnswer;
      }).length;
      const accuracy = correctCount / currentProblems.length;
      const passed = mode === "test" && accuracy >= passThreshold && timeUsed <= timeLimitSeconds;
      const newAttemptCount = attemptCount + 1;

      const attempt: DrillAttempt = {
        attemptNumber: newAttemptCount,
        startedAt: new Date(startTime || Date.now()).toISOString(),
        completedAt: new Date().toISOString(),
        totalProblems: currentProblems.length,
        correctCount,
        accuracy,
        timeUsedSeconds: Math.round(timeUsed),
        passed,
        mode,
      };

      setLastAttempt(attempt);
      setAttemptCount(newAttemptCount);

      if (mode === "practice") {
        setPhase("practice-results");
        onPracticeComplete?.(interactionKey);
      } else {
        setPhase("test-results");
        if (passed) {
          onDrillPassed?.(interactionKey, attempt);
          onComplete?.(interactionKey, `Mastered`);
        } else {
          onDrillFailed?.(interactionKey, attempt);
        }
      }
    },
    [currentProblems, answers, startTime, passThreshold, timeLimitSeconds, attemptCount, interactionKey, onComplete, onDrillPassed, onDrillFailed, onPracticeComplete]
  );

  const handleSelect = useCallback(
    (option: string, mode: "practice" | "test") => {
      const letter = option.match(/^([A-D])\)/)?.[1] || option;
      setAnswers((prev) => ({ ...prev, [currentIndex]: letter }));

      if (mode === "test") {
        // Auto-advance in test mode
        setTimeout(() => {
          if (currentIndex < currentProblems.length - 1) {
            setCurrentIndex((i) => i + 1);
          }
        }, 200);
      } else {
        // In practice mode, reveal answer
        setRevealed((prev) => ({ ...prev, [currentIndex]: true }));
      }
    },
    [currentIndex, currentProblems.length]
  );

  const answeredCount = Object.keys(answers).length;
  const mastery = isPassed ? "mastered" : masteryLevel;
  const masteryLabel = getMasteryLabel(mastery);
  const masteryColor = getMasteryColor(mastery);

  // ---- INTRO SCREEN ----
  if (phase === "intro") {
    return (
      <div className="my-6 rounded-lg border-l-4 bg-amber-50/50 dark:bg-amber-950/20 p-6" style={{ borderColor: masteryColor }}>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5" style={{ color: masteryColor }} />
          <h3 className="font-semibold">{title}</h3>
          <Badge
            variant="secondary"
            className="ml-auto text-xs"
            style={{ backgroundColor: `${masteryColor}20`, color: masteryColor }}
          >
            {masteryLabel}
          </Badge>
        </div>

        {instructions && (
          <p className="text-sm text-muted-foreground mb-4">{instructions}</p>
        )}

        {/* Practice progress */}
        {!isPassed && (
          <div className="mb-4 text-sm text-muted-foreground">
            <p>{getPracticeProgressMessage(practiceSessionCount, 5)}</p>
          </div>
        )}

        <div className="space-y-2">
          {/* Practice button */}
          {canPractice ? (
            <Button
              onClick={startPractice}
              variant="outline"
              className="w-full gap-2"
            >
              <BookOpen className="h-4 w-4" />
              {isPassed ? "Practice Again" : "Practice"}
            </Button>
          ) : (
            <div className="w-full p-3 rounded-md bg-muted/50 text-center text-sm text-muted-foreground">
              {getDailyLimitMessage()}
            </div>
          )}

          {/* Test button */}
          {!isPassed && (
            isTestUnlocked ? (
              <Button
                onClick={startTest}
                className="w-full gap-2"
              >
                <Target className="h-4 w-4" />
                Ready to Test
              </Button>
            ) : (
              <div className="w-full p-3 rounded-md bg-muted/30 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                <Lock className="h-4 w-4" />
                Complete {5 - practiceSessionCount} more practice session{5 - practiceSessionCount !== 1 ? "s" : ""} to unlock
              </div>
            )
          )}
        </div>
      </div>
    );
  }

  // ---- PRACTICE ACTIVE ----
  if (phase === "practice-active") {
    const problem = currentProblems[currentIndex];
    const selectedAnswer = answers[currentIndex];
    const isRevealed = revealed[currentIndex];
    const allDone = Object.keys(revealed).length === currentProblems.length;

    return (
      <div className="my-6 rounded-lg border-l-4 border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 p-4">
        {/* Progress dots */}
        <div className="flex gap-1 mb-4 flex-wrap">
          {currentProblems.map((_, i) => {
            const answered = answers[i] !== undefined;
            const wasRevealed = revealed[i];
            const correct = wasRevealed && answers[i] === currentProblems[i].correctAnswer;
            return (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-6 h-6 rounded-full text-xs font-medium transition-colors ${
                  i === currentIndex
                    ? "bg-amber-500 text-white"
                    : wasRevealed && correct
                    ? "bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200"
                    : wasRevealed && !correct
                    ? "bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200"
                    : answered
                    ? "bg-amber-200 dark:bg-amber-900"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>

        <div className="text-xs text-muted-foreground mb-2">
          Problem {currentIndex + 1} of {currentProblems.length}
        </div>

        <div className="mb-3 prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {problem.question}
          </ReactMarkdown>
        </div>

        {problem.cards && (
          <CardDisplay
            hand={problem.cards.hand}
            board={problem.cards.board}
            displayAs={problem.cards.displayAs}
            size="sm"
          />
        )}

        {/* Options */}
        <div className="space-y-2 mb-4">
          {problem.options.map((option) => {
            const letter = option.match(/^([A-D])\)/)?.[1] || option;
            const isSelected = selectedAnswer === letter;
            const isCorrect = letter === problem.correctAnswer;

            let classes = "w-full text-left p-3 rounded-md border text-sm transition-colors ";
            if (isRevealed) {
              if (isCorrect) {
                classes += "border-green-500 bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-200";
              } else if (isSelected && !isCorrect) {
                classes += "border-red-500 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-200";
              } else {
                classes += "border-muted opacity-50";
              }
            } else if (isSelected) {
              classes += "border-amber-500 bg-amber-50 dark:bg-amber-950/30";
            } else {
              classes += "border-muted hover:border-amber-300 hover:bg-amber-50/50 dark:hover:bg-amber-950/10 cursor-pointer";
            }

            return (
              <button
                key={option}
                className={classes}
                onClick={() => !isRevealed && handleSelect(option, "practice")}
                disabled={isRevealed}
              >
                {option}
              </button>
            );
          })}
        </div>

        {/* Explanation after reveal */}
        {isRevealed && (
          <div className="mt-3 p-3 rounded bg-muted/50 prose prose-sm dark:prose-invert max-w-none">
            <div className="font-semibold mb-1 not-prose text-sm">
              {selectedAnswer === problem.correctAnswer ? (
                <span className="text-green-600 dark:text-green-400">Correct!</span>
              ) : (
                <span className="text-red-600 dark:text-red-400">
                  The answer is {problem.correctAnswer}
                </span>
              )}
            </div>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {problem.explanation}
            </ReactMarkdown>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center mt-4 pt-3 border-t border-amber-200 dark:border-amber-800">
          {!isRevealed && selectedAnswer ? (
            <Button
              size="sm"
              onClick={() => setRevealed((prev) => ({ ...prev, [currentIndex]: true }))}
            >
              Check Answer
            </Button>
          ) : isRevealed && currentIndex < currentProblems.length - 1 ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCurrentIndex((i) => i + 1)}
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : allDone ? (
            <Button size="sm" onClick={() => finishSession("practice")}>
              Finish Practice
            </Button>
          ) : (
            <div />
          )}
          {!isRevealed && !selectedAnswer && currentIndex < currentProblems.length - 1 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCurrentIndex((i) => i + 1)}
            >
              Skip <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ---- TEST ACTIVE ----
  if (phase === "test-active") {
    const problem = currentProblems[currentIndex];
    const selectedAnswer = answers[currentIndex];

    return (
      <div className="my-6 rounded-lg border-l-4 border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 p-4">
        {/* Progress dots */}
        <div className="flex gap-1 mb-4 flex-wrap">
          {currentProblems.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`w-6 h-6 rounded-full text-xs font-medium transition-colors ${
                i === currentIndex
                  ? "bg-blue-600 text-white"
                  : answers[i] !== undefined
                  ? "bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <div className="text-xs text-muted-foreground mb-2">
          Problem {currentIndex + 1} of {currentProblems.length}
        </div>

        <div className="mb-3 prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {problem.question}
          </ReactMarkdown>
        </div>

        {problem.cards && (
          <CardDisplay
            hand={problem.cards.hand}
            board={problem.cards.board}
            displayAs={problem.cards.displayAs}
            size="sm"
          />
        )}

        <div className="space-y-2 mb-4">
          {problem.options.map((option) => {
            const letter = option.match(/^([A-D])\)/)?.[1] || option;
            const isSelected = selectedAnswer === letter;

            return (
              <button
                key={option}
                className={`w-full text-left p-3 rounded-md border text-sm transition-colors ${
                  isSelected
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                    : "border-muted hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-950/10 cursor-pointer"
                }`}
                onClick={() => handleSelect(option, "test")}
              >
                {option}
              </button>
            );
          })}
        </div>

        <div className="flex justify-between items-center pt-3 border-t border-blue-200 dark:border-blue-800">
          <div className="text-sm text-muted-foreground">
            {answeredCount}/{currentProblems.length} answered
          </div>
          {currentIndex < currentProblems.length - 1 ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCurrentIndex((i) => i + 1)}
            >
              {selectedAnswer ? "Next" : "Skip"} <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => finishSession("test")}
            >
              Submit ({answeredCount}/{currentProblems.length})
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ---- REVIEW MODE (shared) ----
  if (reviewIndex !== null) {
    const problem = currentProblems[reviewIndex];
    const userAnswer = answers[reviewIndex];
    const isCorrect = userAnswer === problem.correctAnswer;

    return (
      <div className="my-6 rounded-lg border-l-4 border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm">
            Review — Problem {reviewIndex + 1} of {currentProblems.length}
          </h3>
          <Button size="sm" variant="ghost" onClick={() => setReviewIndex(null)}>
            Back to Results
          </Button>
        </div>

        <div className="mb-3 prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{problem.question}</ReactMarkdown>
        </div>

        {problem.cards && (
          <CardDisplay
            hand={problem.cards.hand}
            board={problem.cards.board}
            displayAs={problem.cards.displayAs}
            size="sm"
          />
        )}

        <div className="space-y-2 mb-4">
          {problem.options.map((option) => {
            const letter = option.match(/^([A-D])\)/)?.[1] || option;
            const isUserAnswer = userAnswer === letter;
            const isCorrectAnswer = letter === problem.correctAnswer;

            let classes = "w-full text-left p-3 rounded-md border text-sm ";
            if (isCorrectAnswer) {
              classes += "border-green-500 bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-200";
            } else if (isUserAnswer) {
              classes += "border-red-500 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-200";
            } else {
              classes += "border-muted opacity-50";
            }

            return <div key={option} className={classes}>{option}</div>;
          })}
        </div>

        <div className="p-3 rounded bg-muted/50 prose prose-sm dark:prose-invert max-w-none">
          <div className="font-semibold mb-1 not-prose text-sm">
            {isCorrect ? (
              <span className="text-green-600 dark:text-green-400">Correct!</span>
            ) : (
              <span className="text-red-600 dark:text-red-400">
                {userAnswer ? `The answer is ${problem.correctAnswer}` : "Not answered"}
              </span>
            )}
          </div>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{problem.explanation}</ReactMarkdown>
        </div>

        <div className="flex justify-between mt-4 pt-3 border-t">
          <Button size="sm" variant="ghost" disabled={reviewIndex === 0} onClick={() => setReviewIndex((i) => (i ?? 1) - 1)}>
            Previous
          </Button>
          <Button size="sm" variant="ghost" disabled={reviewIndex === currentProblems.length - 1} onClick={() => setReviewIndex((i) => (i ?? 0) + 1)}>
            Next
          </Button>
        </div>
      </div>
    );
  }

  // ---- PRACTICE RESULTS ----
  if (phase === "practice-results") {
    const correctCount = lastAttempt?.correctCount ?? 0;
    const total = lastAttempt?.totalProblems ?? currentProblems.length;

    return (
      <div className="my-6 rounded-lg border-l-4 border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 p-6">
        <div className="text-center mb-4">
          <Sparkles className="h-10 w-10 mx-auto text-amber-500 mb-2" />
          <h3 className="text-lg font-bold text-amber-700 dark:text-amber-400">
            Practice Complete!
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            {getPracticeResultMessage(correctCount, total)}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {getPracticeProgressMessage(practiceSessionCount + 1, 5)}
          </p>
        </div>

        {/* Problem summary */}
        <div className="space-y-1 mb-4">
          {currentProblems.map((p, i) => {
            const userAnswer = answers[i];
            const isCorrect = userAnswer === p.correctAnswer;
            return (
              <button
                key={i}
                onClick={() => setReviewIndex(i)}
                className={`w-full text-left flex items-center gap-2 p-2 rounded text-sm transition-colors hover:bg-muted/50 ${
                  isCorrect ? "text-green-700 dark:text-green-400" : "text-amber-700 dark:text-amber-400"
                }`}
              >
                {isCorrect ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 shrink-0" />
                )}
                <span className="truncate">
                  {i + 1}. {p.question.slice(0, 60)}{p.question.length > 60 ? "..." : ""}
                </span>
              </button>
            );
          })}
        </div>

        <Button onClick={() => setPhase("intro")} variant="outline" className="w-full gap-2">
          <RotateCcw className="h-4 w-4" />
          Back to Overview
        </Button>
      </div>
    );
  }

  // ---- TEST RESULTS ----
  const passed = isPassed || lastAttempt?.passed;
  const correctCount = lastAttempt?.correctCount ?? 0;
  const accuracy = lastAttempt?.accuracy ?? 0;
  const timeUsed = lastAttempt?.timeUsedSeconds ?? 0;

  const resultMessage = getTestResultMessage(accuracy, passThreshold);
  const speedFeedback = getSpeedFeedback(timeUsed, timeLimitSeconds, accuracy, passThreshold);

  return (
    <div className="my-6 rounded-lg border-l-4 bg-blue-50/50 dark:bg-blue-950/20 p-6" style={{ borderColor: passed ? "#10b981" : "#3b82f6" }}>
      <div className="text-center mb-4">
        {passed ? (
          <>
            <Trophy className="h-12 w-12 mx-auto text-amber-500 mb-2" />
            <h3 className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
              {resultMessage}
            </h3>
          </>
        ) : (
          <>
            <Sparkles className="h-12 w-12 mx-auto text-blue-500 mb-2" />
            <h3 className="text-lg font-bold text-blue-700 dark:text-blue-400">
              {resultMessage}
            </h3>
          </>
        )}
        <p className="text-2xl font-bold mt-2">
          {correctCount}/{currentProblems.length}
        </p>
        {speedFeedback && (
          <p className="text-sm text-muted-foreground mt-2">{speedFeedback}</p>
        )}
      </div>

      {/* Problem review list */}
      <div className="space-y-1 mb-4">
        {currentProblems.map((p, i) => {
          const userAnswer = answers[i];
          const isCorrect = userAnswer === p.correctAnswer;
          return (
            <button
              key={i}
              onClick={() => setReviewIndex(i)}
              className={`w-full text-left flex items-center gap-2 p-2 rounded text-sm transition-colors hover:bg-muted/50 ${
                isCorrect ? "text-green-700 dark:text-green-400" : "text-blue-700 dark:text-blue-400"
              }`}
            >
              {isCorrect ? (
                <CheckCircle2 className="h-4 w-4 shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 shrink-0" />
              )}
              <span className="truncate">
                {i + 1}. {p.question.slice(0, 60)}{p.question.length > 60 ? "..." : ""}
              </span>
            </button>
          );
        })}
      </div>

      <Button onClick={() => setPhase("intro")} variant="outline" className="w-full gap-2">
        <RotateCcw className="h-4 w-4" />
        Back to Overview
      </Button>
    </div>
  );
}
