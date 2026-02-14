"use client";

import { useState, useCallback, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FeedbackPanel } from "./FeedbackPanel";
import { SignInPromptDialog } from "./SignInPromptDialog";
import { useAIRequest } from "@/lib/use-ai-request";
import { RateLimitError } from "@/lib/ai-client";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Wrench, ChevronDown, CheckCircle2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface TryItYourselfProps {
  title: string;
  solution: string;
  moduleTitle: string;
  interactionKey: string;
  onComplete?: (key: string, userInput: string, aiFeedback?: string) => void;
  isComplete?: boolean;
  savedUserInput?: string;
  savedFeedback?: string;
}

export function TryItYourself({
  title,
  solution,
  moduleTitle,
  interactionKey,
  onComplete,
  isComplete,
  savedUserInput,
  savedFeedback,
}: TryItYourselfProps) {
  const [value, setValue] = useState(savedUserInput || "");
  const [feedback, setFeedback] = useState(savedFeedback || "");
  const [isStreaming, setIsStreaming] = useState(false);
  const [submitted, setSubmitted] = useState(isComplete || false);
  const [revealed, setRevealed] = useState(false);
  const feedbackRef = useRef("");
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
    feedbackRef.current = "";
    setSubmitted(true);

    try {
      await requestAI(
        "/api/ai-feedback",
        {
          type: "tryItYourself",
          moduleTitle,
          title,
          solution,
          userInput: value,
        },
        (text) => {
          feedbackRef.current += text;
          setFeedback((prev) => prev + text);
        },
        () => {
          setIsStreaming(false);
          onComplete?.(interactionKey, value, feedbackRef.current);
        }
      );
    } catch (err) {
      if (err instanceof RateLimitError) {
        setFeedback("You've reached your daily AI usage limit. Sign in for more uses, or try again tomorrow.");
      } else {
        setFeedback("Unable to get AI feedback right now. Your response has been saved.");
      }
      setIsStreaming(false);
      onComplete?.(interactionKey, value);
    }
  }, [value, isStreaming, moduleTitle, title, solution, interactionKey, onComplete, requestAI]);

  const handleReveal = () => {
    setRevealed(true);
    if (!submitted) {
      onComplete?.(interactionKey, "[revealed without submitting]");
    }
  };

  return (
    <div className="my-6 rounded-lg border-l-4 border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 p-4">
      <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-blue-800 dark:text-blue-300">
        <Wrench className="h-4 w-4" />
        Try It Yourself
        {(submitted || isComplete) && (
          <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />
        )}
      </div>
      <p className="text-sm mb-3">{title}</p>
      <Textarea
        placeholder="Write your approach here..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="min-h-[80px] text-sm bg-white dark:bg-background mb-3"
        disabled={isStreaming}
      />
      <div className="flex gap-2 mb-3">
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!value.trim() || isStreaming || rateLimitHit}
        >
          {isStreaming ? "Reviewing..." : rateLimitHit ? "Limit reached" : submitted ? "Resubmit" : "Submit"}
        </Button>
        <Button size="sm" variant="outline" onClick={handleReveal}>
          Reveal Solution
        </Button>
      </div>
      {rateLimitHit && (
        <p className="text-sm text-red-600 dark:text-red-400 mb-3">
          Daily AI usage limit reached. Sign in for more uses, or try again tomorrow.
        </p>
      )}
      <FeedbackPanel feedback={feedback} isStreaming={isStreaming} />
      {revealed && (
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex items-center gap-1 text-sm font-medium text-blue-700 dark:text-blue-300 mt-3">
            <ChevronDown className="h-4 w-4" />
            Solution
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 p-3 rounded bg-blue-100/50 dark:bg-blue-900/30 prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {solution}
              </ReactMarkdown>
            </div>
          </CollapsibleContent>
        </Collapsible>
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
