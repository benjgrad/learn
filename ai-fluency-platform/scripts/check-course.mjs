/**
 * Validates a whole course directory and prints its density stats.
 *
 * Checks what the renderer and the review build silently tolerate: lessons
 * missing from curriculum.json, practice answers that match no option, review
 * questions out of range, unknown block types, and mermaid diagrams that would
 * fall back to raw source because they don't parse.
 *
 * Usage: node scripts/check-course.mjs <course-id>
 */
import fs from "node:fs";
import path from "node:path";
import { Window } from "happy-dom";

const course = process.argv[2];
if (!course) {
  console.error("Usage: node scripts/check-course.mjs <course-id>");
  process.exit(2);
}
const root = path.join(process.cwd(), "content", course);

const w = new Window();
globalThis.window = w;
globalThis.document = w.document;
const { default: mermaid } = await import("mermaid");
mermaid.initialize({ startOnLoad: false });

const errors = [];
const stats = { lessons: 0, checkpoints: 0, mcq: 0, drillProblems: 0, diagrams: 0, openEnded: 0, review: 0 };
const BLOCK_FIELDS = {
  markdown: ["content"],
  predictPrompt: ["prompt"],
  calibrationCheck: ["question", "answer"],
  tryItYourself: ["title", "solution"],
  explainBack: ["prompt"],
  reflectPrompt: ["questions"],
  connectPrompt: ["prompt"],
  keyTakeaway: ["content"],
  practiceSet: ["title", "problems"],
  drillSet: ["title", "passThreshold", "timeLimitSeconds"],
  providerContent: ["providers"],
  pixelAgentTeam: [],
};
const DIFFICULTIES = new Set(["basic", "intermediate", "advanced"]);
const problemIds = new Map();

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8"));
  } catch (e) {
    errors.push(`${rel(file)}: invalid JSON (${e.message})`);
    return null;
  }
}
const rel = (f) => path.relative(root, f);

async function checkMermaid(text, where) {
  for (const m of text.matchAll(/```mermaid\n([\s\S]*?)```/g)) {
    stats.diagrams++;
    try {
      await mermaid.parse(m[1]);
    } catch (e) {
      errors.push(`${where}: mermaid parse error: ${String(e.message).split("\n").slice(0, 3).join(" | ")}`);
    }
  }
}

async function walkStrings(value, where) {
  if (typeof value === "string") return checkMermaid(value, where);
  if (Array.isArray(value)) for (const v of value) await walkStrings(v, where);
  else if (value && typeof value === "object") for (const v of Object.values(value)) await walkStrings(v, where);
}

function checkProblems(problems, where, kind) {
  if (!Array.isArray(problems) || problems.length === 0) {
    errors.push(`${where}: ${kind} has no problems`);
    return;
  }
  problems.forEach((p, i) => {
    const at = `${where} ${kind}[${i}]${p.id ? ` (${p.id})` : ""}`;
    for (const f of ["id", "question", "options", "correctAnswer", "explanation", "difficulty"]) {
      if (p[f] === undefined || p[f] === "") errors.push(`${at}: missing ${f}`);
    }
    if (Array.isArray(p.options)) {
      if (p.options.length < 2) errors.push(`${at}: needs at least 2 options`);
      // Mirrors PracticeSet/DrillSet: "B) text" answers by letter, unlettered options by full text.
      const answers = p.options.map((o) => o.match(/^([A-D])\)/)?.[1] ?? o);
      if (!answers.includes(p.correctAnswer)) errors.push(`${at}: correctAnswer "${p.correctAnswer}" matches no option`);
      if (new Set(p.options).size !== p.options.length) errors.push(`${at}: duplicate options`);
    }
    if (p.difficulty && !DIFFICULTIES.has(p.difficulty)) errors.push(`${at}: bad difficulty "${p.difficulty}"`);
    if (p.id) {
      if (problemIds.has(p.id)) errors.push(`${at}: duplicate problem id (also in ${problemIds.get(p.id)})`);
      problemIds.set(p.id, where);
    }
  });
}

async function checkLesson(file, levelSlug) {
  const lesson = readJson(file);
  if (!lesson) return null;
  const where = rel(file);
  const meta = lesson.meta ?? {};
  for (const f of ["title", "description", "level", "slug", "order", "isCheckpoint", "isIndex"]) {
    if (meta[f] === undefined) errors.push(`${where}: meta.${f} missing`);
  }
  if (meta.level !== levelSlug) errors.push(`${where}: meta.level "${meta.level}" != directory "${levelSlug}"`);
  if (meta.slug !== path.basename(file, ".json")) errors.push(`${where}: meta.slug "${meta.slug}" != filename`);
  if (!Array.isArray(lesson.blocks)) {
    errors.push(`${where}: blocks missing`);
    return meta;
  }
  for (const [i, b] of lesson.blocks.entries()) {
    const fields = BLOCK_FIELDS[b.type];
    if (!fields) {
      errors.push(`${where}: blocks[${i}] unknown type "${b.type}"`);
      continue;
    }
    for (const f of fields) if (b[f] === undefined) errors.push(`${where}: blocks[${i}] ${b.type} missing ${f}`);
    if (b.type === "practiceSet") {
      checkProblems(b.problems, where, "practiceSet");
      stats.mcq += b.problems?.length ?? 0;
    }
    if (b.type === "drillSet") {
      if (!b.generator) checkProblems(b.problems, where, "drillSet");
      stats.drillProblems += b.problems?.length ?? 0;
    }
    if (b.type === "tryItYourself") stats.openEnded++;
  }
  await walkStrings(lesson.blocks, where);

  const regular = !meta.isIndex && !meta.isCheckpoint && !meta.isPracticeOnly && !meta.isExamBank;
  if (meta.isCheckpoint) stats.checkpoints++;
  if (regular) {
    stats.lessons++;
    const rq = lesson.reviewQuestions;
    if (!Array.isArray(rq) || rq.length < 2 || rq.length > 3) errors.push(`${where}: needs 2-3 reviewQuestions`);
    (rq ?? []).forEach((q, i) => {
      stats.review++;
      const at = `${where} reviewQuestions[${i}]`;
      if (!Array.isArray(q.options) || q.options.length !== 3) errors.push(`${at}: needs exactly 3 options`);
      if (!Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex >= (q.options?.length ?? 0))
        errors.push(`${at}: correctIndex out of range`);
      for (const f of ["question", "explanation", "encourageCorrect", "encourageIncorrect"])
        if (!q[f]) errors.push(`${at}: missing ${f}`);
    });
  }
  return meta;
}

const curriculum = readJson(path.join(root, "curriculum.json"));
if (!curriculum?.levels || !curriculum?.modules) errors.push("curriculum.json: needs both levels and modules");

for (const dir of fs.readdirSync(root, { withFileTypes: true })) {
  if (!dir.isDirectory()) continue;
  const levelSlug = dir.name;
  const listed = curriculum?.modules?.[levelSlug] ?? [];
  if (!curriculum?.modules?.[levelSlug]) errors.push(`curriculum.json: no modules entry for ${levelSlug}`);
  const files = fs.readdirSync(path.join(root, levelSlug)).filter((f) => f.endsWith(".json"));
  for (const f of files) {
    const meta = await checkLesson(path.join(root, levelSlug, f), levelSlug);
    if (!meta || meta.isIndex) continue;
    const entry = listed.find((m) => m.slug === meta.slug);
    if (!entry) errors.push(`curriculum.json: ${levelSlug}/${meta.slug} is not listed in modules`);
    else if (entry.order !== meta.order || entry.title !== meta.title)
      errors.push(`curriculum.json: ${levelSlug}/${meta.slug} order/title differ from the lesson meta`);
  }
  for (const m of listed) {
    if (!files.includes(`${m.slug}.json`)) errors.push(`curriculum.json: ${levelSlug}/${m.slug} has no lesson file`);
  }
  const orders = listed.map((m) => m.order);
  if (orders.some((o, i) => i > 0 && o <= orders[i - 1])) errors.push(`curriculum.json: ${levelSlug} modules not sorted by order`);
  if (!files.includes("index.json")) errors.push(`${levelSlug}: missing index.json`);
}

console.log(`${course}:`, stats);
if (errors.length) {
  console.error(`\n${errors.length} problem(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}
console.log("OK");
