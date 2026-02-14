"use client";

import { ArrowRight } from "lucide-react";

export function ConnectPrompt({ prompt }: { prompt: string }) {
  return (
    <div className="my-6 rounded-lg border-l-4 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 p-4">
      <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
        <ArrowRight className="h-4 w-4" />
        Connect
      </div>
      <p className="text-sm">{prompt}</p>
    </div>
  );
}
