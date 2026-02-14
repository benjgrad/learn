"use client";

import { Progress } from "@/components/ui/progress";

export function ProgressBar({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  const percentage = total > 0 ? (completed / total) * 100 : 0;

  if (total === 0) return null;

  return (
    <div className="flex items-center gap-3 text-sm">
      <Progress value={percentage} className="flex-1 h-2" />
      <span className="text-muted-foreground whitespace-nowrap">
        {completed}/{total} exercises
      </span>
    </div>
  );
}
