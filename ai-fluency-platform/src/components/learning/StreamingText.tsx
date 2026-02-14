"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function StreamingText({
  content,
  isStreaming,
}: {
  content: string;
  isStreaming: boolean;
}) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
      {isStreaming && (
        <span className="inline-block w-2 h-4 bg-current animate-pulse ml-0.5" />
      )}
    </div>
  );
}
