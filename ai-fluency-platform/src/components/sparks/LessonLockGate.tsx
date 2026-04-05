"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { isSparkGatingEnabled, LESSON_SKIP_COST } from "@/lib/sparks/feature-flags";
import { isModuleComplete } from "@/lib/store/progress";
import { spendSparks, getBalance } from "@/lib/sparks/store";
import { generateIdempotencyKey } from "@/lib/sparks/idempotency";
import { syncSparkSpend } from "@/lib/sparks/db-sync";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock } from "lucide-react";

interface LessonLockGateProps {
  prevModulePath: string | null;
  course: string;
  children: React.ReactNode;
}

export function LessonLockGate({
  prevModulePath,
  course,
  children,
}: LessonLockGateProps) {
  const { user } = useAuth();
  const email = user?.email;
  const [skipped, setSkipped] = useState(false);
  const [balance, setBalance] = useState(() => getBalance());

  // No restrictions for non-gated users
  if (!isSparkGatingEnabled(email)) {
    return <>{children}</>;
  }

  // First lesson in level — always accessible
  if (!prevModulePath) {
    return <>{children}</>;
  }

  // Previous lesson completed or user paid to skip
  if (skipped || isModuleComplete(prevModulePath)) {
    return <>{children}</>;
  }

  const handleSkip = () => {
    const idempotencyKey = generateIdempotencyKey(
      user?.id || "anon",
      "cooldown_skip",
      `lesson_skip:${course}:${prevModulePath}:${new Date().toISOString().slice(0, 10)}`
    );
    const result = spendSparks(LESSON_SKIP_COST, "cooldown_skip", idempotencyKey, {
      course,
      prevModulePath,
      type: "lesson_skip",
    });
    if (result.success) {
      syncSparkSpend("cooldown_skip", LESSON_SKIP_COST, idempotencyKey, {
        course,
        prevModulePath,
        type: "lesson_skip",
      });
      setSkipped(true);
      setBalance(result.newBalance);
    } else {
      setBalance(getBalance());
    }
  };

  const canAfford = balance >= LESSON_SKIP_COST;

  return (
    <div className="flex items-center justify-center min-h-[400px] px-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <Lock className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
          <CardTitle>Lesson Locked</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-muted-foreground">
            Complete the previous lesson to unlock this one.
          </p>

          <Button
            onClick={handleSkip}
            disabled={!canAfford}
            className="w-full"
            size="lg"
          >
            Skip for {LESSON_SKIP_COST} &#9889; Sparks
          </Button>

          <p className="text-sm text-muted-foreground">
            Your balance: <span className="font-medium">{balance.toLocaleString()} &#9889;</span>
            {!canAfford && (
              <span className="block text-red-500 mt-1">
                Need {LESSON_SKIP_COST - balance} more Sparks
              </span>
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
