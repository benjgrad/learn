"use client";

import { useState, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FeedbackPanel } from "./FeedbackPanel";
import { SignInPromptDialog } from "./SignInPromptDialog";
import { useAIRequest } from "@/lib/use-ai-request";
import { RateLimitError } from "@/lib/ai-client";
import { HelpCircle, CheckCircle2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface CalibrationCheckProps {
  question: string;
  answer: string;
  moduleTitle: string;
  interactionKey: string;
  onComplete?: (key: string, userInput: string) => void;
  isComplete?: boolean;
}

export function CalibrationCheck({
  question,
  answer,
  moduleTitle,
  interactionKey,
  onComplete,
  isComplete,
}: CalibrationCheckProps) {
  const [revealed, setRevealed] = useState(false);
  const [discussInput, setDiscussInput] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [completed, setCompleted] = useState(isComplete || false);
  const {
    requestAI,
    showSignInPrompt,
    rateLimitHit,
    remaining,
    limit,
    continueAsAnonymous,
    dismissSignInPrompt,
  } = useAIRequest();

  const handleReveal = () => {
    setRevealed(true);
    if (!completed) {
      setCompleted(true);
      onComplete?.(interactionKey, "[revealed]");
    }
  };

  const handleDiscuss = useCallback(async () => {
    if (!discussInput.trim() || isStreaming) return;
    setIsStreaming(true);
    setFeedback("");

    try {
      await requestAI(
        "/api/ai-feedback",
        {
          type: "calibrationCheck",
          moduleTitle,
          question,
          answer,
          userInput: discussInput,
        },
        (text) => setFeedback((prev) => prev + text),
        () => setIsStreaming(false)
      );
    } catch (err) {
      if (err instanceof RateLimitError) {
        setFeedback("You've reached your daily AI usage limit. Sign in for more uses, or try again tomorrow.");
      } else {
        setFeedback("Unable to connect to AI right now.");
      }
      setIsStreaming(false);
    }
  }, [discussInput, isStreaming, moduleTitle, question, answer, requestAI]);

  return (
    <div className="my-6 rounded-lg border-l-4 border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 p-4">
      <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
        <HelpCircle className="h-4 w-4" />
        Check Your Understanding
        {completed && <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />}
      </div>
      <p className="text-sm mb-3">{question}</p>
      {!revealed ? (
        <Button size="sm" variant="outline" onClick={handleReveal}>
          Reveal Answer
        </Button>
      ) : (
        <>
          <div className="p-3 rounded bg-amber-100/50 dark:bg-amber-900/30 mb-3 prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {answer}
            </ReactMarkdown>
          </div>
          <div className="border-t pt-3 mt-3">
            <p className="text-sm text-muted-foreground mb-2">
              Want to discuss this further?
            </p>
            <Textarea
              placeholder="Ask a follow-up question..."
              value={discussInput}
              onChange={(e) => setDiscussInput(e.target.value)}
              className="min-h-[60px] text-sm bg-white dark:bg-background mb-2"
              disabled={isStreaming}
            />
            <Button
              size="sm"
              onClick={handleDiscuss}
              disabled={!discussInput.trim() || isStreaming || rateLimitHit}
            >
              {isStreaming ? "Thinking..." : rateLimitHit ? "Limit reached" : "Discuss with AI"}
            </Button>
            {rateLimitHit && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                Daily AI usage limit reached. Sign in for more uses, or try again tomorrow.
              </p>
            )}
          </div>
          <FeedbackPanel feedback={feedback} isStreaming={isStreaming} />
        </>
      )}
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
