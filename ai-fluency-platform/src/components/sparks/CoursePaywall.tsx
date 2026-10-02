"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCourseAccess } from "@/lib/sparks/use-course-access";
import { useSparks } from "@/lib/sparks/use-sparks";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";

interface CoursePaywallProps {
  courseId: string;
  courseTitle: string;
  courseDescription: string;
}

/**
 * The unlock card itself, with no pass-through of locked content. Rendered
 * directly by the /learn server component when the entitlement check fails, so
 * the lesson blocks are never sent to the browser at all, and by the client
 * gates on soft navigation.
 */
export function CoursePaywall({ courseId, courseTitle, courseDescription }: CoursePaywallProps) {
  const { cost, unlock } = useCourseAccess(courseId);
  const { balance, refresh: refreshSparks } = useSparks();
  const { user } = useAuth();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAfford = balance >= cost;
  const sparksNeeded = cost - balance;

  const handleUnlock = async () => {
    setPending(true);
    setError(null);
    const result = await unlock(user?.id || "anon");
    if (result.success) {
      refreshSparks();
      // The lesson is withheld by the server, so the local flag alone is not
      // enough -- re-fetch the route now that the unlock row exists.
      router.refresh();
    } else {
      setError(result.error ?? "Could not unlock this course. Please try again.");
      setPending(false);
    }
  };

  return (
    <main className="max-w-lg mx-auto px-4 py-16">
      <Card className="text-center">
        <CardHeader>
          <div className="text-4xl mb-2">&#128274;</div>
          <CardTitle className="text-2xl">{courseTitle}</CardTitle>
          <CardDescription className="text-base">{courseDescription}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button
            onClick={handleUnlock}
            disabled={!canAfford || pending}
            className="w-full"
            size="lg"
          >
            {pending ? "Unlocking..." : `Unlock for ${cost.toLocaleString()} ⚡ Sparks`}
          </Button>

          <p className="text-sm text-muted-foreground">
            Your balance: <span className="font-medium">{balance.toLocaleString()} &#9889;</span>
            {!canAfford && (
              <span className="block text-red-500 mt-1">
                Need {sparksNeeded.toLocaleString()} more Sparks
              </span>
            )}
          </p>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="border-t pt-4 mt-2">
            <p className="text-sm text-muted-foreground mb-3">
              Or subscribe to Spark Pass for unlimited access
            </p>
            <Link href="/pricing">
              <Button variant="outline" className="w-full">
                View Spark Pass
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
