/**
 * ContentBlock[] -> markdown, for get_lesson.
 *
 * Raw JSON spends a third of its bytes on structure keys and pushes models
 * into quoting fragments back at the learner instead of teaching. The block
 * union lives in src/types/content.ts.
 */
import type { ContentBlock, PracticeProblem, DrillProblem } from "@/types/content";

const DEFAULT_PROBLEM_CAP = 5;

export interface RenderOptions {
  /** From user_xp.provider; picks which providerContent variant to emit. */
  provider?: string;
  /** Emit every practice/drill problem instead of the first few. */
  includeAllProblems?: boolean;
}

export function renderBlocks(
  blocks: ContentBlock[],
  opts: RenderOptions = {}
): string {
  return blocks
    .map((b) => renderBlock(b, opts))
    .filter(Boolean)
    .join("\n\n");
}

function renderBlock(block: ContentBlock, opts: RenderOptions): string {
  switch (block.type) {
    case "markdown":
      return block.content;

    case "keyTakeaway":
      return `> **Key takeaway:** ${block.content}`;

    case "predictPrompt":
      return `### Predict first\n\n${block.prompt}`;

    case "explainBack":
      return `### Explain back\n\n${block.prompt}`;

    case "connectPrompt":
      return `### Connect to your work\n\n${block.prompt}`;

    case "reflectPrompt":
      return `### Reflect\n\n${block.questions.map((q) => `- ${q}`).join("\n")}`;

    case "calibrationCheck":
      return `### Check yourself\n\n**Q:** ${block.question}\n\n**A:** ${block.answer}`;

    case "tryItYourself":
      return `### Try it yourself: ${block.title}\n\n**Worked solution:**\n\n${block.solution}`;

    case "practiceSet":
      return renderProblemSet(
        `### Practice: ${block.title}`,
        block.vignette,
        block.problems,
        opts
      );

    case "drillSet": {
      const header = [
        `### Drill: ${block.title}`,
        block.instructions,
        `_Pass threshold ${block.passThreshold}, ${block.timeLimitSeconds}s limit._`,
      ]
        .filter(Boolean)
        .join("\n\n");
      if (block.generator) {
        return `${header}\n\n_Problems are generated at runtime (${block.generator}); ${block.problemCount ?? "a set"} per attempt._`;
      }
      return renderProblemSet(header, undefined, block.problems ?? [], opts);
    }

    case "pixelAgentTeam":
      return `_[Interactive component - open the lesson on the site to use it.]_`;

    case "providerContent": {
      const providers = block.providers;
      const key = (opts.provider ?? "claude-code") as keyof typeof providers;
      const body = providers[key] ?? providers["claude-code"];
      if (!body) return "";
      return [block.context, body].filter(Boolean).join("\n\n");
    }

    default:
      return "";
  }
}

function renderProblemSet(
  header: string,
  vignette: string | undefined,
  problems: Array<PracticeProblem | DrillProblem>,
  opts: RenderOptions
): string {
  // The largest lesson on disk (content/cfa-3/level-9/exam-mock-itemset.json)
  // is 84KB. Cap by default; the caller can ask for the rest.
  const cap = opts.includeAllProblems ? problems.length : DEFAULT_PROBLEM_CAP;
  const shown = problems.slice(0, cap);

  const parts = [header];
  if (vignette) parts.push(vignette);

  shown.forEach((p, i) => {
    const options = p.options.map((o) => `- ${o}`).join("\n");
    parts.push(
      `**${i + 1}. ${p.question}**\n\n${options}\n\n_Correct: ${p.correctAnswer}_\n\n${p.explanation}`
    );
  });

  const hidden = problems.length - shown.length;
  if (hidden > 0) {
    parts.push(
      `_(${hidden} more problem${hidden === 1 ? "" : "s"} omitted - pass include_all_problems: true to see them.)_`
    );
  }

  return parts.join("\n\n");
}
