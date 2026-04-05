"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { addSparks } from "@/lib/sparks/store";
import { syncSparkEarn } from "@/lib/sparks/db-sync";
import { generateIdempotencyKey } from "@/lib/sparks/idempotency";

const SPIN_KEY = "aif_daily_spin";

interface SpinData {
  lastSpinDate: string;
  reward: number;
}

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function DailySpinLottery() {
  const [spunToday, setSpunToday] = useState(false);
  const [reward, setReward] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [displayNumber, setDisplayNumber] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const today = getTodayString();
    try {
      const raw = localStorage.getItem(SPIN_KEY);
      if (raw) {
        const data: SpinData = JSON.parse(raw);
        if (data.lastSpinDate === today) {
          setSpunToday(true);
          setReward(data.reward);
          setDisplayNumber(data.reward);
        }
      }
    } catch {
      // Corrupted data
    }
  }, []);

  const handleSpin = useCallback(() => {
    if (spinning || spunToday) return;
    setSpinning(true);

    const finalReward = Math.floor(Math.random() ** 2 * 50) + 1;
    let elapsed = 0;
    const duration = 1500;
    const intervalMs = 80;

    const interval = setInterval(() => {
      elapsed += intervalMs;
      setDisplayNumber(Math.floor(Math.random() * 50) + 1);

      if (elapsed >= duration) {
        clearInterval(interval);
        setDisplayNumber(finalReward);
        setReward(finalReward);
        setSpunToday(true);
        setSpinning(false);

        // Award sparks
        const today = getTodayString();
        const idempotencyKey = generateIdempotencyKey(
          "local",
          "daily_spin",
          today
        );
        addSparks(finalReward, "admin_adjustment", idempotencyKey);
        syncSparkEarn("admin_adjustment", finalReward, idempotencyKey);

        // Save to localStorage
        const spinData: SpinData = {
          lastSpinDate: today,
          reward: finalReward,
        };
        localStorage.setItem(SPIN_KEY, JSON.stringify(spinData));
      }
    }, intervalMs);
  }, [spinning, spunToday]);

  if (!mounted) {
    return (
      <Card className="py-4">
        <CardHeader>
          <CardTitle className="text-base">Daily Spin</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3">
          <span className="text-3xl">{"\u2728"}</span>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="py-4">
      <CardHeader>
        <CardTitle className="text-base">{"\u2728"} Daily Spin</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3">
        {spinning ? (
          <>
            <span className="text-4xl font-bold text-amber-500 tabular-nums animate-pulse">
              {displayNumber}
            </span>
            <p className="text-sm text-muted-foreground">Spinning...</p>
          </>
        ) : spunToday ? (
          <>
            <span className="text-4xl font-bold text-amber-500">
              +{reward}
            </span>
            <p className="text-sm text-amber-600 font-medium">
              Sparks earned today!
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground text-center">
              Spin once per day for bonus Sparks!
            </p>
            <Button onClick={handleSpin} className="w-full">
              Spin for Sparks!
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
