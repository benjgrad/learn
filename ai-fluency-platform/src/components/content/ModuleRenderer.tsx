"use client";

import { useCallback, useState, useEffect, useMemo } from "react";
import type { ContentBlock, ModuleMeta } from "@/types/content";
import { PredictPrompt } from "@/components/learning/PredictPrompt";
import { ExplainBack } from "@/components/learning/ExplainBack";
import { TryItYourself } from "@/components/learning/TryItYourself";
import { CalibrationCheck } from "@/components/learning/CalibrationCheck";
import { ReflectPrompt } from "@/components/learning/ReflectPrompt";
import { ConnectPrompt } from "@/components/learning/ConnectPrompt";
import { KeyTakeaway } from "@/components/learning/KeyTakeaway";
import { ProviderContent } from "@/components/learning/ProviderContent";
import { ProviderToggle } from "@/components/learning/ProviderToggle";
import { PracticeSet } from "@/components/learning/PracticeSet";
import { DrillSet } from "@/components/learning/DrillSet";
import { PixelAgentTeam } from "@/components/learning/PixelAgentTeam";
import { DrillModuleComplete } from "@/components/progress/DrillModuleComplete";
import { ModuleChat } from "@/components/learning/ModuleChat";
import { ProgressBar } from "@/components/progress/ProgressBar";
import { ModuleComplete } from "@/components/progress/ModuleComplete";
import { useProgress } from "@/lib/store/use-progress";
import { celebrateInteraction, celebrateModule, celebrateDrillPass } from "@/lib/celebrations";
import { addSparks } from "@/lib/sparks/store";
import { syncSparkEarn } from "@/lib/sparks/db-sync";
import { generateIdempotencyKey } from "@/lib/sparks/idempotency";
import { SPARK_CONFIG } from "@/lib/sparks/config";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

const markdownComponents: Components = {
  table: ({ children, ...props }) => (
    <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
      <table {...props}>{children}</table>
    </div>
  ),
};

interface ModuleRendererProps {
  blocks: ContentBlock[];
  meta: ModuleMeta;
  levelTitle: string;
  levelColor: string;
  nextModule: ModuleMeta | null;
  course?: string;
  isDrillCourse?: boolean;
}

export function ModuleRenderer({
  blocks,
  meta,
  levelTitle,
  levelColor,
  nextModule,
  course,
  isDrillCourse,
}: ModuleRendererProps) {
  const modulePath = `${course}/${meta.level}/${meta.slug}`;
  const {
    completedCount,
    moduleComplete,
    markInteraction,
    markModuleComplete,
    isInteractionComplete,
    getInteractionData,
    markDrillPassed,
    storeDrillAttempt,
    isDrillPassed,
    getDrillAttempts,
    incrementPracticeSession,
    getPracticeCount,
    isTestUnlocked: isTestUnlockedCheck,
    getMasteryLevel,
  } = useProgress(modulePath, meta.level);

  // Count total interactive blocks
  const [totalInteractions] = useState(() =>
    blocks.filter(
      (b) =>
        b.type === "predictPrompt" ||
        b.type === "explainBack" ||
        b.type === "tryItYourself" ||
        b.type === "calibrationCheck" ||
        b.type === "reflectPrompt" ||
        b.type === "practiceSet" ||
        b.type === "drillSet"
    ).length
  );

  const hasProviderContent = blocks.some((b) => b.type === "providerContent");

  let interactionIndex = 0;

  const handleInteractionComplete = useCallback(
    (key: string, userInput: string, aiFeedback?: string) => {
      markInteraction(key, { userInput, aiFeedback, completed: true });
      celebrateInteraction(levelColor);

      // Award sparks for answering a question / completing an exercise
      const sparkKey = generateIdempotencyKey(
        "anon",
        "lesson_completed",
        `interaction:${modulePath}:${key}`
      );
      addSparks(3, "lesson_completed", sparkKey, { modulePath, interaction: key });
      syncSparkEarn("lesson_completed", 3, sparkKey, { modulePath, interaction: key });
    },
    [markInteraction, levelColor, modulePath]
  );

  const handleModuleComplete = useCallback(() => {
    markModuleComplete();
    celebrateModule(levelColor);

    // Award sparks for lesson completion
    const key = generateIdempotencyKey(
      "anon",
      "lesson_completed",
      `${modulePath}:${new Date().toISOString().slice(0, 10)}`
    );
    addSparks(SPARK_CONFIG.lessonReward, "lesson_completed", key, { modulePath });
    syncSparkEarn("lesson_completed", SPARK_CONFIG.lessonReward, key, { modulePath });
  }, [markModuleComplete, levelColor, modulePath]);

  // Collect all drill keys for auto-completion logic
  // interactionIndex increments for every interactive block, so drill keys
  // use the same indexing as in the render loop below
  const allDrillKeys = useMemo(() => {
    let idx = 0;
    const keys: string[] = [];
    for (const b of blocks) {
      const isInteractive =
        b.type === "predictPrompt" ||
        b.type === "explainBack" ||
        b.type === "tryItYourself" ||
        b.type === "calibrationCheck" ||
        b.type === "reflectPrompt" ||
        b.type === "practiceSet" ||
        b.type === "drillSet";
      if (isInteractive) {
        if (b.type === "drillSet") {
          keys.push(`drillSet-${idx}`);
        }
        idx++;
      }
    }
    return keys;
  }, [blocks]);

  const handleDrillPassed = useCallback(
    (key: string, attempt: import("@/types/progress").DrillAttempt) => {
      markDrillPassed(key, attempt, allDrillKeys);
      celebrateDrillPass(levelColor);

      // Award sparks for passing a drill test
      const sparkKey = generateIdempotencyKey(
        "anon",
        "lesson_completed",
        `drill:${modulePath}:${key}:${attempt.attemptNumber}`
      );
      const drillSparks = 15;
      addSparks(drillSparks, "lesson_completed", sparkKey, {
        modulePath,
        drill: key,
        accuracy: attempt.accuracy,
      });
      syncSparkEarn("lesson_completed", drillSparks, sparkKey, {
        modulePath,
        drill: key,
        accuracy: attempt.accuracy,
      });
    },
    [markDrillPassed, allDrillKeys, levelColor, modulePath]
  );

  const handleDrillFailed = useCallback(
    (key: string, attempt: import("@/types/progress").DrillAttempt) => {
      storeDrillAttempt(key, attempt);
    },
    [storeDrillAttempt]
  );

  const handlePracticeComplete = useCallback(
    (key: string) => {
      incrementPracticeSession(key);
    },
    [incrementPracticeSession]
  );

  return (
    <div>
      {/* Progress bar */}
      {totalInteractions > 0 && (
        <div className="mb-6">
          <ProgressBar completed={completedCount} total={totalInteractions} />
        </div>
      )}

      {/* Provider toggle (only if module has provider content) */}
      {hasProviderContent && <ProviderToggle />}

      {/* Content blocks */}
      <div className="prose dark:prose-invert max-w-none overflow-hidden">
        {blocks.map((block, i) => {
          switch (block.type) {
            case "markdown":
              return (
                <div key={i}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={markdownComponents}
                  >
                    {block.content}
                  </ReactMarkdown>
                </div>
              );

            case "predictPrompt": {
              const key = `predictPrompt-${interactionIndex++}`;
              const saved = getInteractionData(key);
              return (
                <PredictPrompt
                  key={i}
                  prompt={block.prompt}
                  moduleTitle={meta.title}
                  interactionKey={key}
                  onComplete={handleInteractionComplete}
                  isComplete={isInteractionComplete(key)}
                  savedUserInput={saved?.userInput}
                  savedFeedback={saved?.aiFeedback}
                />
              );
            }

            case "explainBack": {
              const key = `explainBack-${interactionIndex++}`;
              const saved = getInteractionData(key);
              return (
                <ExplainBack
                  key={i}
                  prompt={block.prompt}
                  moduleTitle={meta.title}
                  interactionKey={key}
                  onComplete={handleInteractionComplete}
                  isComplete={isInteractionComplete(key)}
                  savedUserInput={saved?.userInput}
                  savedFeedback={saved?.aiFeedback}
                />
              );
            }

            case "tryItYourself": {
              const key = `tryItYourself-${interactionIndex++}`;
              const saved = getInteractionData(key);
              return (
                <TryItYourself
                  key={i}
                  title={block.title}
                  solution={block.solution}
                  moduleTitle={meta.title}
                  interactionKey={key}
                  onComplete={handleInteractionComplete}
                  isComplete={isInteractionComplete(key)}
                  savedUserInput={saved?.userInput}
                  savedFeedback={saved?.aiFeedback}
                />
              );
            }

            case "calibrationCheck": {
              const key = `calibrationCheck-${interactionIndex++}`;
              const saved = getInteractionData(key);
              return (
                <CalibrationCheck
                  key={i}
                  question={block.question}
                  answer={block.answer}
                  moduleTitle={meta.title}
                  interactionKey={key}
                  onComplete={handleInteractionComplete}
                  isComplete={isInteractionComplete(key)}
                  savedUserInput={saved?.userInput}
                  savedFeedback={saved?.aiFeedback}
                />
              );
            }

            case "reflectPrompt": {
              const key = `reflectPrompt-${interactionIndex++}`;
              const saved = getInteractionData(key);
              return (
                <ReflectPrompt
                  key={i}
                  questions={block.questions}
                  moduleTitle={meta.title}
                  interactionKey={key}
                  onComplete={handleInteractionComplete}
                  isComplete={isInteractionComplete(key)}
                  savedUserInput={saved?.userInput}
                  savedFeedback={saved?.aiFeedback}
                />
              );
            }

            case "practiceSet": {
              const key = `practiceSet-${interactionIndex++}`;
              return (
                <PracticeSet
                  key={i}
                  title={block.title}
                  vignette={block.vignette}
                  problems={block.problems}
                  interactionKey={key}
                  onComplete={handleInteractionComplete}
                  isComplete={isInteractionComplete(key)}
                />
              );
            }

            case "drillSet": {
              const key = `drillSet-${interactionIndex++}`;
              return (
                <DrillSet
                  key={i}
                  title={block.title}
                  instructions={block.instructions}
                  problems={block.problems}
                  generator={block.generator}
                  problemCount={block.problemCount}
                  passThreshold={block.passThreshold}
                  timeLimitSeconds={block.timeLimitSeconds}
                  interactionKey={key}
                  onComplete={handleInteractionComplete}
                  onDrillPassed={handleDrillPassed}
                  onDrillFailed={handleDrillFailed}
                  onPracticeComplete={handlePracticeComplete}
                  isPassed={isDrillPassed(key)}
                  previousAttempts={getDrillAttempts(key)}
                  practiceSessionCount={getPracticeCount(key)}
                  masteryLevel={getMasteryLevel(key)}
                  isTestUnlocked={isTestUnlockedCheck(key)}
                />
              );
            }

            case "pixelAgentTeam":
              return <PixelAgentTeam key={i} />;

            case "connectPrompt":
              return <ConnectPrompt key={i} prompt={block.prompt} />;

            case "keyTakeaway":
              return <KeyTakeaway key={i} content={block.content} />;

            case "providerContent":
              return (
                <ProviderContent
                  key={i}
                  context={block.context}
                  providers={block.providers}
                />
              );

            default:
              return null;
          }
        })}
      </div>

      {/* Module completion */}
      {!meta.isIndex && isDrillCourse ? (
        <DrillModuleComplete
          isComplete={moduleComplete}
          drillKeys={allDrillKeys}
          isDrillPassed={isDrillPassed}
          getMasteryLevel={getMasteryLevel}
          nextModule={nextModule}
          course={course}
        />
      ) : !meta.isIndex ? (
        <ModuleComplete
          isComplete={moduleComplete}
          onMarkComplete={handleModuleComplete}
          nextModule={nextModule}
          course={course}
        />
      ) : null}

      {/* Floating chat */}
      <ModuleChat
        moduleTitle={meta.title}
        levelTitle={levelTitle}
        courseName={course}
      />
    </div>
  );
}
