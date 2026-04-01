"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Timer } from "lucide-react";

interface DrillTimerProps {
  totalSeconds: number;
  isRunning: boolean;
  onTimeUp: () => void;
}

export function DrillTimer({ totalSeconds, isRunning, onTimeUp }: DrillTimerProps) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const startTimeRef = useRef<number | null>(null);
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  const getElapsed = useCallback(() => {
    if (!startTimeRef.current) return 0;
    return (Date.now() - startTimeRef.current) / 1000;
  }, []);

  useEffect(() => {
    if (!isRunning) {
      setRemaining(totalSeconds);
      startTimeRef.current = null;
      return;
    }

    startTimeRef.current = Date.now();

    const interval = setInterval(() => {
      const elapsed = getElapsed();
      const left = Math.max(0, totalSeconds - elapsed);
      setRemaining(left);
      if (left <= 0) {
        clearInterval(interval);
        onTimeUpRef.current();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isRunning, totalSeconds, getElapsed]);

  const minutes = Math.floor(remaining / 60);
  const seconds = Math.ceil(remaining % 60);
  const fraction = remaining / totalSeconds;

  let colorClass = "text-emerald-600 dark:text-emerald-400";
  let barColor = "bg-emerald-500";
  if (fraction <= 0.2) {
    colorClass = "text-red-600 dark:text-red-400";
    barColor = "bg-red-500";
  } else if (fraction <= 0.4) {
    colorClass = "text-amber-600 dark:text-amber-400";
    barColor = "bg-amber-500";
  }

  return (
    <div className="flex items-center gap-3">
      <div className={`flex items-center gap-1.5 font-mono text-lg font-bold ${colorClass}`}>
        <Timer className="h-5 w-5" />
        {minutes}:{seconds.toString().padStart(2, "0")}
      </div>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-100 ${barColor}`}
          style={{ width: `${fraction * 100}%` }}
        />
      </div>
    </div>
  );
}
