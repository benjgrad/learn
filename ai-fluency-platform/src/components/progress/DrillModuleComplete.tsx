"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, ArrowRight, Sparkles } from "lucide-react";
import { getMasteryLabel, getMasteryColor, type MasteryLevel } from "@/lib/poker/messages";
import Link from "next/link";
import type { ModuleMeta } from "@/types/content";

interface DrillModuleCompleteProps {
  isComplete: boolean;
  drillKeys: string[];
  isDrillPassed: (key: string) => boolean;
  getMasteryLevel: (key: string) => MasteryLevel;
  nextModule: ModuleMeta | null;
  course?: string;
}

export function DrillModuleComplete({
  isComplete,
  drillKeys,
  isDrillPassed,
  getMasteryLevel: getMastery,
  nextModule,
  course,
}: DrillModuleCompleteProps) {
  return (
    <Card className="my-8">
      <CardContent className="pt-6">
        {isComplete ? (
          <div className="text-center space-y-4">
            <Trophy className="h-8 w-8 mx-auto text-amber-500" />
            <p className="font-semibold text-emerald-600 dark:text-emerald-400">
              Level Mastered! Your skills are automatic now.
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
            <Sparkles className="h-8 w-8 mx-auto text-amber-500" />
            <div className="flex justify-center gap-3">
              {drillKeys.map((key, i) => {
                const mastery = getMastery(key);
                const color = getMasteryColor(mastery);
                const label = getMasteryLabel(mastery);
                return (
                  <div key={key} className="flex flex-col items-center gap-1">
                    <div
                      className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold"
                      style={{
                        borderColor: color,
                        backgroundColor: mastery === "mastered" ? color : "transparent",
                        color: mastery === "mastered" ? "white" : color,
                      }}
                    >
                      {i + 1}
                    </div>
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-sm text-muted-foreground">
              Keep practicing — you're building strong foundations!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
