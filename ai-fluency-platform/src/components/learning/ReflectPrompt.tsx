"use client";

import { useState, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FeedbackPanel } from "./FeedbackPanel";
import { SignInPromptDialog } from "./SignInPromptDialog";
import { useAIRequest } from "@/lib/use-ai-request";
import { RateLimitError } from "@/lib/ai-client";
import { Info, CheckCircle2 } from "lucide-react";

interface ReflectPromptProps {
  questions: string[];
  moduleTitle: string;
  interactionKey: string;
  onComplete?: (key: string, userInput: string) => void;
  isComplete?: boolean;
}

export function ReflectPrompt({
  questions,
  moduleTitle,
  interactionKey,
  onComplete,
  isComplete,
}: ReflectPromptProps) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [feedback, setFeedback] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [submitted, setSubmitted] = useState(isComplete || false);
  const {
    requestAI,
    showSignInPrompt,
    rateLimitHit,
    remaining,
    limit,
    continueAsAnonymous,
    dismissSignInPrompt,
  } = useAIRequest();

  const hasContent = Object.values(answers).some((a) => a.trim());

  const handleSubmit = useCallback(async () => {
    if (!hasContent || isStreaming) return;
    setIsStreaming(true);
    setFeedback("");
    setSubmitted(true);

    const userInput = questions
      .map((q, i) => `Q: ${q}\nA: ${answers[i] || "(no response)"}`)
      .join("\n\n");

    try {
      await requestAI(
        "/api/ai-feedback",
        {
          type: "reflectPrompt",
          moduleTitle,
          questions: JSON.stringify(questions),
          userInput,
        },
        (text) => setFeedback((prev) => prev + text),
        () => {
          setIsStreaming(false);
          onComplete?.(interactionKey, userInput);
        }
      );
    } catch (err) {
      if (err instanceof RateLimitError) {
        setFeedback("You've reached your daily AI usage limit. Sign in for more uses, or try again tomorrow.");
      } else {
        setFeedback("Unable to get AI feedback right now. Your reflections have been saved.");
      }
      setIsStreaming(false);
      onComplete?.(interactionKey, userInput);
    }
  }, [hasContent, isStreaming, questions, answers, moduleTitle, interactionKey, onComplete, requestAI]);

  return (
    <div className="my-6 rounded-lg border-l-4 border-violet-500 bg-violet-50/50 dark:bg-violet-950/20 p-4">
      <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-violet-800 dark:text-violet-300">
        <Info className="h-4 w-4" />
        Reflect
        {submitted && <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />}
      </div>
      <ol className="space-y-3">
        {questions.map((q, i) => (
          <li key={i} className="text-sm">
            <p className="mb-1">
              {i + 1}. {q}
            </p>
            <Textarea
              placeholder="Your thoughts..."
              value={answers[i] || ""}
              onChange={(e) =>
                setAnswers((prev) => ({ ...prev, [i]: e.target.value }))
              }
              className="min-h-[50px] text-sm bg-white dark:bg-background"
              disabled={isStreaming}
            />
          </li>
        ))}
      </ol>
      <Button
        size="sm"
        onClick={handleSubmit}
        disabled={!hasContent || isStreaming || rateLimitHit}
        className="mt-3"
      >
        {isStreaming ? "Getting feedback..." : rateLimitHit ? "Limit reached" : submitted ? "Resubmit" : "Submit Reflections"}
      </Button>
      {rateLimitHit && (
        <p className="text-sm text-red-600 dark:text-red-400 mt-2">
          Daily AI usage limit reached. Sign in for more uses, or try again tomorrow.
        </p>
      )}
      <FeedbackPanel feedback={feedback} isStreaming={isStreaming} />
      <SignInPromptDialog
        open={showSignInPrompt}
        remaining={remaining}
        limit={limit}
        onContinue={continueAsAnonymous}
        onClose={dismissSignInPrompt}
      />
    </div>
  );
}
