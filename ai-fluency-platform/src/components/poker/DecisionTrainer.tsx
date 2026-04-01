"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Sparkles,
  Trophy,
} from "lucide-react";
import { CardHand } from "./CardHand";
import { CardDisplay } from "./CardDisplay";
import { SCENARIOS, type DecisionScenario, type DecisionPoint } from "@/lib/poker/scenarios";
import { shuffleArray } from "@/lib/poker/cards";

type Phase = "menu" | "playing" | "decision" | "feedback" | "summary";

interface DecisionResult {
  decision: DecisionPoint;
  chosen: string;
  correct: boolean;
}

export function DecisionTrainer() {
  const [phase, setPhase] = useState<Phase>("menu");
  const [scenario, setScenario] = useState<DecisionScenario | null>(null);
  const [decisionIdx, setDecisionIdx] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [results, setResults] = useState<DecisionResult[]>([]);
  const [completedScenarios, setCompletedScenarios] = useState<Set<string>>(new Set());

  const startScenario = useCallback((s: DecisionScenario) => {
    setScenario(s);
    setDecisionIdx(0);
    setChosen(null);
    setResults([]);
    setPhase("playing");
  }, []);

  const startRandom = useCallback(() => {
    const available = SCENARIOS.filter((s) => !completedScenarios.has(s.id));
    const pool = available.length > 0 ? available : SCENARIOS;
    const s = pool[Math.floor(Math.random() * pool.length)];
    startScenario(s);
  }, [completedScenarios, startScenario]);

  const makeDecision = useCallback(
    (action: string) => {
      if (!scenario) return;
      setChosen(action);
      const decision = scenario.decisions[decisionIdx];
      const correct = action === decision.correctAction;
      setResults((prev) => [...prev, { decision, chosen: action, correct }]);
      setPhase("feedback");
    },
    [scenario, decisionIdx]
  );

  const nextStep = useCallback(() => {
    if (!scenario) return;
    if (decisionIdx < scenario.decisions.length - 1) {
      setDecisionIdx((i) => i + 1);
      setChosen(null);
      setPhase("playing");
    } else {
      setCompletedScenarios((prev) => new Set([...prev, scenario.id]));
      setPhase("summary");
    }
  }, [scenario, decisionIdx]);

  // ---- MENU ----
  if (phase === "menu") {
    return (
      <div className="space-y-6">
        <div className="text-center mb-8">
          <Sparkles className="h-10 w-10 mx-auto text-amber-500 mb-3" />
          <h2 className="text-2xl font-bold mb-2">Decision Trainer</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Apply everything you've learned in realistic poker scenarios.
            Make decisions at key moments and see how the math guides optimal play.
          </p>
        </div>

        <div className="flex justify-center mb-6">
          <Button onClick={startRandom} size="lg" className="gap-2">
            <Sparkles className="h-5 w-5" />
            Random Scenario
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SCENARIOS.map((s) => (
            <Card
              key={s.id}
              className={`cursor-pointer hover:border-amber-300 transition-colors ${
                completedScenarios.has(s.id) ? "opacity-70" : ""
              }`}
              onClick={() => startScenario(s)}
            >
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-sm">{s.title}</h3>
                  {completedScenarios.has(s.id) && (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {s.position} • {s.decisions.length} decision{s.decisions.length > 1 ? "s" : ""}
                </p>
                <div className="flex gap-1">
                  <CardHand cards={[...s.holeCards]} size="sm" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!scenario) return null;
  const currentDecision = scenario.decisions[decisionIdx];

  // ---- PLAYING (show decision) ----
  if (phase === "playing") {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary">{scenario.position}</Badge>
            <Badge variant="outline">{scenario.blinds}</Badge>
            <span className="text-sm text-muted-foreground ml-auto">
              Decision {decisionIdx + 1} of {scenario.decisions.length}
            </span>
          </div>
          <h2 className="text-xl font-bold mb-2">{scenario.title}</h2>
          {decisionIdx === 0 && (
            <p className="text-muted-foreground text-sm mb-4">{scenario.narrative}</p>
          )}
        </div>

        {/* Your hand */}
        <div className="mb-4">
          <CardHand cards={[...scenario.holeCards]} label="Your Hand" />
        </div>

        {/* Board */}
        {currentDecision.board.length > 0 && (
          <div className="mb-4">
            <CardHand cards={currentDecision.board} label="Board" />
          </div>
        )}

        {/* Pot info */}
        <div className="text-sm text-muted-foreground mb-4">
          Pot: <span className="font-bold">${currentDecision.potSize}</span>
          {currentDecision.betToCall !== undefined && currentDecision.betToCall > 0 && (
            <span> • To call: <span className="font-bold">${currentDecision.betToCall}</span></span>
          )}
        </div>

        {/* Decision prompt */}
        <div className="mb-4 p-4 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
          <p className="font-medium">{currentDecision.prompt}</p>
        </div>

        {/* Options */}
        <div className="space-y-2">
          {currentDecision.options.map((opt) => (
            <Button
              key={opt.action}
              variant="outline"
              className="w-full text-left justify-start h-auto py-3 px-4"
              onClick={() => makeDecision(opt.action)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  // ---- FEEDBACK ----
  if (phase === "feedback") {
    const isCorrect = chosen === currentDecision.correctAction;
    const chosenLabel = currentDecision.options.find((o) => o.action === chosen)?.label;
    const correctLabel = currentDecision.options.find(
      (o) => o.action === currentDecision.correctAction
    )?.label;

    return (
      <div className="max-w-2xl mx-auto">
        {/* Cards context */}
        <div className="flex gap-4 mb-4">
          <CardHand cards={[...scenario.holeCards]} size="sm" label="Your Hand" />
          {currentDecision.board.length > 0 && (
            <CardHand cards={currentDecision.board} size="sm" label="Board" />
          )}
        </div>

        {/* Result */}
        <div className={`p-4 rounded-lg mb-4 ${
          isCorrect
            ? "bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800"
            : "bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800"
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {isCorrect ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  Great decision!
                </span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-amber-600" />
                <span className="font-semibold text-amber-700 dark:text-amber-400">
                  Good thinking, but there's a better play
                </span>
              </>
            )}
          </div>

          {!isCorrect && (
            <div className="text-sm mb-2">
              <span className="text-muted-foreground">You chose:</span>{" "}
              <span className="line-through">{chosenLabel}</span>
              <br />
              <span className="text-muted-foreground">Optimal play:</span>{" "}
              <span className="font-medium">{correctLabel}</span>
            </div>
          )}

          <p className="text-sm mt-2">{currentDecision.explanation}</p>

          {/* Concepts used */}
          <div className="flex gap-1 mt-3 flex-wrap">
            {currentDecision.concepts.map((c) => (
              <Badge key={c} variant="outline" className="text-xs">
                {c.replace(/-/g, " ")}
              </Badge>
            ))}
          </div>
        </div>

        <Button onClick={nextStep} className="w-full gap-2">
          {decisionIdx < scenario.decisions.length - 1 ? (
            <>Continue <ChevronRight className="h-4 w-4" /></>
          ) : (
            <>See Summary</>
          )}
        </Button>
      </div>
    );
  }

  // ---- SUMMARY ----
  const correctCount = results.filter((r) => r.correct).length;

  return (
    <div className="max-w-2xl mx-auto text-center">
      <Trophy className="h-12 w-12 mx-auto text-amber-500 mb-3" />
      <h2 className="text-xl font-bold mb-2">Scenario Complete!</h2>
      <p className="text-muted-foreground mb-4">
        {scenario.title} — {correctCount}/{results.length} optimal decisions
      </p>

      {correctCount === results.length ? (
        <p className="text-emerald-600 dark:text-emerald-400 font-medium mb-4">
          Perfect! You made every decision correctly.
        </p>
      ) : (
        <p className="text-amber-600 dark:text-amber-400 font-medium mb-4">
          Good effort! Review the decisions below to strengthen your thinking.
        </p>
      )}

      {/* Decision recap */}
      <div className="space-y-2 mb-6 text-left">
        {results.map((r, i) => (
          <div
            key={i}
            className={`p-3 rounded-lg text-sm ${
              r.correct
                ? "bg-emerald-50 dark:bg-emerald-950/20"
                : "bg-amber-50 dark:bg-amber-950/20"
            }`}
          >
            <div className="flex items-center gap-2">
              {r.correct ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-amber-600 shrink-0" />
              )}
              <span className="font-medium">Decision {i + 1}</span>
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              {r.decision.prompt.slice(0, 100)}...
            </p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 justify-center">
        <Button variant="outline" onClick={() => startScenario(scenario)} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Replay
        </Button>
        <Button onClick={() => setPhase("menu")} className="gap-2">
          More Scenarios
        </Button>
      </div>
    </div>
  );
}
