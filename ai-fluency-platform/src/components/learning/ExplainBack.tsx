"use client";

import { useState, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FeedbackPanel } from "./FeedbackPanel";
import { SignInPromptDialog } from "./SignInPromptDialog";
import { useAIRequest } from "@/lib/use-ai-request";
import { RateLimitError } from "@/lib/ai-client";
import { MessageSquare, CheckCircle2 } from "lucide-react";

interface ExplainBackProps {
  prompt: string;
  moduleTitle: string;
  interactionKey: string;
  onComplete?: (key: string, userInput: string) => void;
  isComplete?: boolean;
}

export function ExplainBack({
  prompt,
  moduleTitle,
  interactionKey,
  onComplete,
  isComplete,
}: ExplainBackProps) {
  const [value, setValue] = useState("");
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

  const handleSubmit = useCallback(async () => {
    if (!value.trim() || isStreaming) return;
    setIsStreaming(true);
    setFeedback("");
    setSubmitted(true);

    try {
      await requestAI(
        "/api/ai-feedback",
        {
          type: "explainBack",
          moduleTitle,
          prompt,
          userInput: value,
        },
        (text) => setFeedback((prev) => prev + text),
        () => {
          setIsStreaming(false);
          onComplete?.(interactionKey, value);
        }
      );
    } catch (err) {
      if (err instanceof RateLimitError) {
        setFeedback("You've reached your daily AI usage limit. Sign in for more uses, or try again tomorrow.");
      } else {
        setFeedback("Unable to get AI feedback right now. Your explanation has been saved.");
      }
      setIsStreaming(false);
      onComplete?.(interactionKey, value);
    }
  }, [value, isStreaming, moduleTitle, prompt, interactionKey, onComplete, requestAI]);

  return (
    <div className="my-6 rounded-lg border-l-4 border-violet-500 bg-violet-50/50 dark:bg-violet-950/20 p-4">
      <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-violet-800 dark:text-violet-300">
        <MessageSquare className="h-4 w-4" />
        Explain Back
        {submitted && <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />}
      </div>
      <p className="text-sm mb-3">{prompt}</p>
      <Textarea
        placeholder="Explain in your own words..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="min-h-[80px] text-sm bg-white dark:bg-background mb-3"
        disabled={isStreaming}
      />
      <Button
        size="sm"
        onClick={handleSubmit}
        disabled={!value.trim() || isStreaming || rateLimitHit}
      >
        {isStreaming ? "Getting feedback..." : rateLimitHit ? "Limit reached" : submitted ? "Resubmit" : "Submit"}
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
