"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCourseAccess } from "@/lib/sparks/use-course-access";
import { useSparks } from "@/lib/sparks/use-sparks";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Lock } from "lucide-react";
import Link from "next/link";

interface CourseLockedBannerProps {
  courseId: string;
  courseTitle: string;
  courseDescription: string;
}

/**
 * Non-blocking counterpart to CourseUnlockGate. The full outline stays visible
 * beneath it -- browsing what a course covers is what convinces someone to buy
 * it -- and this only surfaces the unlock CTA.
 */
export function CourseLockedBanner({ courseId, courseTitle }: CourseLockedBannerProps) {
  const { cost, unlock } = useCourseAccess(courseId);
  const { balance, refresh: refreshSparks } = useSparks();
  const { user } = useAuth();
  const router = useRouter();

  const canAfford = balance >= cost;
  const sparksNeeded = cost - balance;

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUnlock = async () => {
    setPending(true);
    setError(null);
    const result = await unlock(user?.id || "anon");
    if (result.success) {
      refreshSparks();
      router.refresh();
    } else {
      setError(result.error ?? "Could not unlock this course. Please try again.");
    }
    setPending(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 pt-8">
      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 shrink-0 mt-0.5 text-muted-foreground" />
            <div>
              <p className="font-medium">{courseTitle} is locked</p>
              <p className="text-sm text-muted-foreground">
                Browse the full outline below. Unlock the course to start any lesson.
                {!canAfford && (
                  <span className="block text-destructive mt-1">
                    Need {sparksNeeded.toLocaleString()} more Sparks &mdash; you have{" "}
                    {balance.toLocaleString()} &#9889;
                  </span>
                )}
                {error && <span className="block text-destructive mt-1">{error}</span>}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Link href="/pricing">
              <Button variant="outline">Spark Pass</Button>
            </Link>
            <Button onClick={handleUnlock} disabled={!canAfford || pending}>
              {pending ? "Unlocking..." : <>Unlock for {cost.toLocaleString()} &#9889;</>}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
