"use client";

import { useCallback, useState, useEffect } from "react";
import type { ContentBlock, ModuleMeta } from "@/types/content";
import { PredictPrompt } from "@/components/learning/PredictPrompt";
import { ExplainBack } from "@/components/learning/ExplainBack";
import { TryItYourself } from "@/components/learning/TryItYourself";
import { CalibrationCheck } from "@/components/learning/CalibrationCheck";
import { ReflectPrompt } from "@/components/learning/ReflectPrompt";
import { ConnectPrompt } from "@/components/learning/ConnectPrompt";
import { KeyTakeaway } from "@/components/learning/KeyTakeaway";
import { ModuleChat } from "@/components/learning/ModuleChat";
import { ProgressBar } from "@/components/progress/ProgressBar";
import { ModuleComplete } from "@/components/progress/ModuleComplete";
import { useProgress } from "@/lib/store/use-progress";
import { celebrateInteraction, celebrateModule } from "@/lib/celebrations";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";

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
}

export function ModuleRenderer({
  blocks,
  meta,
  levelTitle,
  levelColor,
  nextModule,
}: ModuleRendererProps) {
  const modulePath = `${meta.level}/${meta.slug}`;
  const {
    completedCount,
    moduleComplete,
    markInteraction,
    markModuleComplete,
    isInteractionComplete,
  } = useProgress(modulePath, meta.level);

  // Count total interactive blocks
  const [totalInteractions] = useState(() =>
    blocks.filter(
      (b) =>
        b.type === "predictPrompt" ||
        b.type === "explainBack" ||
        b.type === "tryItYourself" ||
        b.type === "calibrationCheck" ||
        b.type === "reflectPrompt"
    ).length
  );

  let interactionIndex = 0;

  const handleInteractionComplete = useCallback(
    (key: string, userInput: string) => {
      markInteraction(key, { userInput, completed: true });
      celebrateInteraction(levelColor);
    },
    [markInteraction, levelColor]
  );

  const handleModuleComplete = useCallback(() => {
    markModuleComplete();
    celebrateModule(levelColor);
  }, [markModuleComplete, levelColor]);

  return (
    <div>
      {/* Progress bar */}
      {totalInteractions > 0 && (
        <div className="mb-6">
          <ProgressBar completed={completedCount} total={totalInteractions} />
        </div>
      )}

      {/* Content blocks */}
      <div className="prose dark:prose-invert max-w-none overflow-hidden">
        {blocks.map((block, i) => {
          switch (block.type) {
            case "markdown":
              return (
                <div key={i}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {block.content}
                  </ReactMarkdown>
                </div>
              );

            case "predictPrompt": {
              const key = `predictPrompt-${interactionIndex++}`;
              return (
                <PredictPrompt
                  key={i}
                  prompt={block.prompt}
                  moduleTitle={meta.title}
                  interactionKey={key}
                  onComplete={handleInteractionComplete}
                  isComplete={isInteractionComplete(key)}
                />
              );
            }

            case "explainBack": {
              const key = `explainBack-${interactionIndex++}`;
              return (
                <ExplainBack
                  key={i}
                  prompt={block.prompt}
                  moduleTitle={meta.title}
                  interactionKey={key}
                  onComplete={handleInteractionComplete}
                  isComplete={isInteractionComplete(key)}
                />
              );
            }

            case "tryItYourself": {
              const key = `tryItYourself-${interactionIndex++}`;
              return (
                <TryItYourself
                  key={i}
                  title={block.title}
                  solution={block.solution}
                  moduleTitle={meta.title}
                  interactionKey={key}
                  onComplete={handleInteractionComplete}
                  isComplete={isInteractionComplete(key)}
                />
              );
            }

            case "calibrationCheck": {
              const key = `calibrationCheck-${interactionIndex++}`;
              return (
                <CalibrationCheck
                  key={i}
                  question={block.question}
                  answer={block.answer}
                  moduleTitle={meta.title}
                  interactionKey={key}
                  onComplete={handleInteractionComplete}
                  isComplete={isInteractionComplete(key)}
                />
              );
            }

            case "reflectPrompt": {
              const key = `reflectPrompt-${interactionIndex++}`;
              return (
                <ReflectPrompt
                  key={i}
                  questions={block.questions}
                  moduleTitle={meta.title}
                  interactionKey={key}
                  onComplete={handleInteractionComplete}
                  isComplete={isInteractionComplete(key)}
                />
              );
            }

            case "connectPrompt":
              return <ConnectPrompt key={i} prompt={block.prompt} />;

            case "keyTakeaway":
              return <KeyTakeaway key={i} content={block.content} />;

            default:
              return null;
          }
        })}
      </div>

      {/* Module completion */}
      {!meta.isIndex && (
        <ModuleComplete
          isComplete={moduleComplete}
          onMarkComplete={handleModuleComplete}
          nextModule={nextModule}
        />
      )}

      {/* Floating chat */}
      <ModuleChat moduleTitle={meta.title} levelTitle={levelTitle} />
    </div>
  );
}
