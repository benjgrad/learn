"use client";

import { StreamingText } from "./StreamingText";
import { Bot } from "lucide-react";

export function FeedbackPanel({
  feedback,
  isStreaming,
}: {
  feedback: string;
  isStreaming: boolean;
}) {
  if (!feedback && !isStreaming) return null;

  return (
    <div className="mt-4 rounded-lg border bg-violet-50/50 dark:bg-violet-950/20 p-4">
      <div className="flex items-center gap-2 mb-2 text-sm font-medium text-violet-700 dark:text-violet-300">
        <Bot className="h-4 w-4" />
        AI Feedback
      </div>
      <StreamingText content={feedback} isStreaming={isStreaming} />
    </div>
  );
}
