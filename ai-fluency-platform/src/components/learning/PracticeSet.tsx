"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { PracticeProblem } from "@/types/content";

interface PracticeSetProps {
  title: string;
  vignette?: string;
  problems: PracticeProblem[];
  interactionKey: string;
  onComplete?: (key: string, userInput: string) => void;
  isComplete?: boolean;
}

export function PracticeSet({
  title,
  vignette,
  problems,
  interactionKey,
  onComplete,
  isComplete,
}: PracticeSetProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});
  const [finished, setFinished] = useState(isComplete || false);

  const problem = problems[currentIndex];
  const selectedAnswer = answers[currentIndex];
  const isRevealed = revealed[currentIndex];

  const handleSelect = useCallback(
    (option: string) => {
      if (isRevealed) return;
      // Extract letter from "A) ..." format, or use full string
      const letter = option.match(/^([A-C])\)/)?.[1] || option;
      setAnswers((prev) => ({ ...prev, [currentIndex]: letter }));
    },
    [currentIndex, isRevealed]
  );

  const handleCheck = useCallback(() => {
    setRevealed((prev) => ({ ...prev, [currentIndex]: true }));
  }, [currentIndex]);

  const handleFinish = useCallback(() => {
    setFinished(true);
    const correct = problems.filter(
      (p, i) => answers[i] === p.correctAnswer
    ).length;
    const summary = `${correct}/${problems.length} correct`;
    onComplete?.(interactionKey, summary);
  }, [problems, answers, interactionKey, onComplete]);

  const correctCount = problems.filter(
    (p, i) => answers[i] === p.correctAnswer
  ).length;
  const answeredCount = Object.keys(answers).length;
  const allRevealed = problems.every((_, i) => revealed[i]);

  if (finished) {
    const byDifficulty = { basic: [0, 0], intermediate: [0, 0], advanced: [0, 0] } as Record<
      string,
      [number, number]
    >;
    problems.forEach((p, i) => {
      const d = p.difficulty || "basic";
      if (!byDifficulty[d]) byDifficulty[d] = [0, 0];
      byDifficulty[d][1]++;
      if (answers[i] === p.correctAnswer) byDifficulty[d][0]++;
    });

    return (
      <div className="my-6 rounded-lg border-l-4 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 p-4">
        <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
          <ClipboardList className="h-4 w-4" />
          {title} — Results
          <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />
        </div>
        <div className="text-2xl font-bold mb-2">
          {correctCount}/{problems.length} correct
        </div>
        <div className="space-y-1 text-sm mb-4">
          {Object.entries(byDifficulty)
            .filter(([, [, total]]) => total > 0)
            .map(([difficulty, [correct, total]]) => (
              <div key={difficulty} className="flex justify-between">
                <span className="capitalize">{difficulty}</span>
                <span>
                  {correct}/{total}
                </span>
              </div>
            ))}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setFinished(false);
            setCurrentIndex(0);
          }}
        >
          Review Problems
        </Button>
      </div>
    );
  }

  return (
    <div className="my-6 rounded-lg border-l-4 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 p-4">
      <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
        <ClipboardList className="h-4 w-4" />
        {title}
        {isComplete && (
          <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />
        )}
      </div>

      {/* Vignette */}
      {vignette && currentIndex === 0 && (
        <div className="mb-4 p-3 rounded bg-emerald-100/50 dark:bg-emerald-900/30 prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{vignette}</ReactMarkdown>
        </div>
      )}

      {/* Progress */}
      <div className="text-xs text-muted-foreground mb-3">
        Problem {currentIndex + 1} of {problems.length}
        {problem.difficulty && (
          <span className="ml-2 capitalize text-emerald-700 dark:text-emerald-400">
            ({problem.difficulty})
          </span>
        )}
      </div>

      {/* Question */}
      <div className="mb-4 prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {problem.question}
        </ReactMarkdown>
      </div>

      {/* Options */}
      <div className="space-y-2 mb-4">
        {problem.options.map((option) => {
          const letter = option.match(/^([A-C])\)/)?.[1] || option;
          const isSelected = selectedAnswer === letter;
          const isCorrect = letter === problem.correctAnswer;

          let classes =
            "w-full text-left p-3 rounded-md border text-sm transition-colors ";
          if (isRevealed) {
            if (isCorrect) {
              classes +=
                "border-green-500 bg-green-50 dark:bg-green-950/30 text-green-800 dark:text-green-200";
            } else if (isSelected && !isCorrect) {
              classes +=
                "border-red-500 bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-200";
            } else {
              classes += "border-muted opacity-50";
            }
          } else if (isSelected) {
            classes +=
              "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30";
          } else {
            classes +=
              "border-muted hover:border-emerald-300 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/10 cursor-pointer";
          }

          return (
            <button
              key={option}
              className={classes}
              onClick={() => handleSelect(option)}
              disabled={isRevealed}
            >
              {option}
            </button>
          );
        })}
      </div>

      {/* Check answer / Explanation */}
      {!isRevealed && (
        <Button
          size="sm"
          onClick={handleCheck}
          disabled={!selectedAnswer}
        >
          Check Answer
        </Button>
      )}

      {isRevealed && (
        <div className="mt-3 p-3 rounded bg-muted/50 prose prose-sm dark:prose-invert max-w-none">
          <div className="font-semibold mb-1 not-prose text-sm">
            {selectedAnswer === problem.correctAnswer ? (
              <span className="text-green-600 dark:text-green-400">Correct!</span>
            ) : (
              <span className="text-red-600 dark:text-red-400">
                Incorrect — the answer is {problem.correctAnswer}
              </span>
            )}
          </div>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {problem.explanation}
          </ReactMarkdown>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center mt-4 pt-3 border-t border-emerald-200 dark:border-emerald-800">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setCurrentIndex((i) => i - 1)}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>

        {currentIndex < problems.length - 1 ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setCurrentIndex((i) => i + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={handleFinish}
            disabled={!allRevealed}
          >
            Finish ({answeredCount}/{problems.length} answered)
          </Button>
        )}
      </div>
    </div>
  );
}
