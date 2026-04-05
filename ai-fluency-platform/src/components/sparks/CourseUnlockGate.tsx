"use client";

import { useCourseAccess } from "@/lib/sparks/use-course-access";
import { useSparks } from "@/lib/sparks/use-sparks";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";

interface CourseUnlockGateProps {
  courseId: string;
  courseTitle: string;
  courseDescription: string;
  children: React.ReactNode;
}

export function CourseUnlockGate({
  courseId,
  courseTitle,
  courseDescription,
  children,
}: CourseUnlockGateProps) {
  const { hasAccess, cost, unlock } = useCourseAccess(courseId);
  const { balance, refresh: refreshSparks } = useSparks();
  const { user } = useAuth();

  if (hasAccess) {
    return <>{children}</>;
  }

  const canAfford = balance >= cost;
  const sparksNeeded = cost - balance;

  const handleUnlock = () => {
    const result = unlock(user?.id || "anon");
    if (result.success) {
      refreshSparks();
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
            disabled={!canAfford}
            className="w-full"
            size="lg"
          >
            Unlock for {cost.toLocaleString()} &#9889; Sparks
          </Button>

          <p className="text-sm text-muted-foreground">
            Your balance: <span className="font-medium">{balance.toLocaleString()} &#9889;</span>
            {!canAfford && (
              <span className="block text-red-500 mt-1">
                Need {sparksNeeded.toLocaleString()} more Sparks
              </span>
            )}
          </p>

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
