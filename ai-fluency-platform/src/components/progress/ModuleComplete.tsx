"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, ArrowRight, PartyPopper } from "lucide-react";
import Link from "next/link";
import type { ModuleMeta } from "@/types/content";

interface ModuleCompleteProps {
  isComplete: boolean;
  onMarkComplete: () => void;
  nextModule: ModuleMeta | null;
  course?: string;
}

export function ModuleComplete({
  isComplete,
  onMarkComplete,
  nextModule,
  course,
}: ModuleCompleteProps) {
  return (
    <Card className="my-8">
      <CardContent className="pt-6">
        {isComplete ? (
          <div className="text-center space-y-4">
            <PartyPopper className="h-8 w-8 mx-auto text-amber-500" />
            <p className="font-semibold text-green-600 dark:text-green-400">
              Module Complete!
            </p>
            {nextModule && (
              <Link href={`/learn/${course ? `${course}/` : ""}${nextModule.level}/${nextModule.slug}`}>
                <Button className="gap-2">
                  Continue to {nextModule.title}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="text-center space-y-4">
            <CheckCircle2 className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Ready to move on? Mark this module as complete.
            </p>
            <Button onClick={onMarkComplete} className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Mark as Complete
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
