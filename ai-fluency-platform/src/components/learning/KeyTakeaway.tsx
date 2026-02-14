"use client";

import { Star } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function KeyTakeaway({ content }: { content: string }) {
  return (
    <div className="my-6 rounded-lg border-l-4 border-slate-500 bg-slate-50/50 dark:bg-slate-800/30 p-4">
      <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
        <Star className="h-4 w-4" />
        Key Takeaway
      </div>
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </div>
  );
}
