"use client";

import { useState, useEffect } from "react";
import { DecisionTrainer } from "@/components/poker/DecisionTrainer";
import { isLevelFullyPassed } from "@/lib/store/progress";
import { Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

import curriculumData from "../../../../content/texas-holdem/curriculum.json";
import type { CurriculumData } from "@/types/content";

const curriculum = curriculumData as CurriculumData;

export default function PlayTexasHoldemPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: TEMPORARY - unlocked for testing. Revert this!
    const allComplete = true;
    // const levelSlugs = curriculum.levels.map((l) =>
    //   l.level === 0 ? "foundations" : `level-${l.level}`
    // );
    // const allComplete = levelSlugs.every((slug) => {
    //   const modules = curriculum.modules[slug] || [];
    //   return isLevelFullyPassed("texas-holdem", slug, modules);
    // });

    setUnlocked(allComplete);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center text-muted-foreground">Loading...</div>
      </main>
    );
  }

  if (!unlocked) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-3">Decision Trainer</h1>
        <p className="text-muted-foreground mb-6">
          Complete all 7 levels of the Texas Hold'em course to unlock the Decision Trainer.
          Master the math, then put it into practice with realistic scenarios.
        </p>
        <Link href="/curriculum/texas-holdem">
          <Button className="gap-2">
            Go to Course
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <DecisionTrainer />
    </main>
  );
}
