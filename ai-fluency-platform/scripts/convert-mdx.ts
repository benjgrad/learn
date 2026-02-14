import matter from "gray-matter";
import { globSync } from "glob";
import * as fs from "fs";
import * as path from "path";

interface ModuleMeta {
  title: string;
  description: string;
  level: string;
  slug: string;
  order: number;
  isCheckpoint: boolean;
  isIndex: boolean;
}

interface ContentBlock {
  type: string;
  [key: string]: unknown;
}

const SOURCE_DIR = path.resolve(__dirname, "../../ai-fluency/src/content/docs");
const OUTPUT_DIR = path.resolve(__dirname, "../content");
const LEVELS_JSON = path.resolve(
  __dirname,
  "../../ai-fluency/src/data/levels.json"
);

function stripImports(content: string): string {
  return content
    .split("\n")
    .filter((line) => !line.trim().startsWith("import "))
    .join("\n");
}

function stripStarlightComponents(content: string): string {
  // Remove Starlight component blocks: <Card>, <CardGrid>, <LinkCard>, <Steps>, <Aside>
  // These are Astro-specific and we'll render the content differently
  let result = content;

  // Remove self-closing Starlight tags
  result = result.replace(
    /<(?:Card|LinkCard|Aside)\s+[^/>]*\/>\s*/g,
    ""
  );

  // Remove opening/closing Starlight wrapper tags but keep inner content
  result = result.replace(/<(?:CardGrid|Steps|Aside)[^>]*>\s*/g, "");
  result = result.replace(/<\/(?:CardGrid|Steps|Aside)>\s*/g, "");

  // Remove Card/LinkCard with content (opening + closing)
  result = result.replace(/<Card\s+[^>]*>[\s\S]*?<\/Card>\s*/g, "");
  result = result.replace(/<LinkCard\s+[^>]*\/>\s*/g, "");

  return result;
}

function extractPropValue(tag: string, propName: string): string {
  // Handle prop="value" (double quotes)
  const doubleQuoteRegex = new RegExp(`${propName}="([^"]*)"`, "s");
  const doubleMatch = tag.match(doubleQuoteRegex);
  if (doubleMatch) return doubleMatch[1];

  // Handle prop='value' (single quotes)
  const singleQuoteRegex = new RegExp(`${propName}='([^']*)'`, "s");
  const singleMatch = tag.match(singleQuoteRegex);
  if (singleMatch) return singleMatch[1];

  return "";
}

function extractJSXArray(tag: string, propName: string): string[] {
  // Match questions={[...]}
  const regex = new RegExp(`${propName}=\\{\\[([\\s\\S]*?)\\]\\}`, "s");
  const match = tag.match(regex);
  if (!match) return [];

  const arrayContent = match[1];
  const items: string[] = [];

  // Parse quoted strings from the array
  const stringRegex = /"([^"]*?)"|'([^']*?)'/g;
  let strMatch;
  while ((strMatch = stringRegex.exec(arrayContent)) !== null) {
    items.push(strMatch[1] || strMatch[2]);
  }

  return items;
}

function parseContent(rawContent: string): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  let content = stripImports(rawContent);
  content = stripStarlightComponents(content);

  // Component patterns
  const componentPatterns = [
    // Self-closing components
    {
      regex:
        /<PredictPrompt\s+([\s\S]*?)\/>/g,
      parse: (match: RegExpExecArray) => ({
        type: "predictPrompt" as const,
        prompt: extractPropValue(match[1], "prompt"),
      }),
    },
    {
      regex:
        /<ExplainBack\s+([\s\S]*?)\/>/g,
      parse: (match: RegExpExecArray) => ({
        type: "explainBack" as const,
        prompt: extractPropValue(match[1], "prompt"),
      }),
    },
    {
      regex:
        /<ConnectPrompt\s+([\s\S]*?)\/>/g,
      parse: (match: RegExpExecArray) => ({
        type: "connectPrompt" as const,
        prompt: extractPropValue(match[1], "prompt"),
      }),
    },
    {
      regex:
        /<ReflectPrompt\s+([\s\S]*?)\/>/g,
      parse: (match: RegExpExecArray) => ({
        type: "reflectPrompt" as const,
        questions: extractJSXArray(match[0], "questions"),
      }),
    },
  ];

  // Components with children
  const childComponentPatterns = [
    {
      regex:
        /<TryItYourself\s+([\s\S]*?)>([\s\S]*?)<\/TryItYourself>/g,
      parse: (match: RegExpExecArray) => ({
        type: "tryItYourself" as const,
        title: extractPropValue(match[1], "title"),
        solution: match[2].trim(),
      }),
    },
    {
      regex:
        /<CalibrationCheck\s+([\s\S]*?)>([\s\S]*?)<\/CalibrationCheck>/g,
      parse: (match: RegExpExecArray) => ({
        type: "calibrationCheck" as const,
        question: extractPropValue(match[1], "question"),
        answer: match[2].trim(),
      }),
    },
    {
      regex:
        /<KeyTakeaway>([\s\S]*?)<\/KeyTakeaway>/g,
      parse: (match: RegExpExecArray) => ({
        type: "keyTakeaway" as const,
        content: match[1].trim(),
      }),
    },
  ];

  // Build a list of all component positions
  interface ComponentMatch {
    start: number;
    end: number;
    block: ContentBlock;
  }

  const matches: ComponentMatch[] = [];

  for (const pattern of componentPatterns) {
    let match;
    // Reset lastIndex
    pattern.regex.lastIndex = 0;
    while ((match = pattern.regex.exec(content)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        block: pattern.parse(match) as ContentBlock,
      });
    }
  }

  for (const pattern of childComponentPatterns) {
    let match;
    pattern.regex.lastIndex = 0;
    while ((match = pattern.regex.exec(content)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        block: pattern.parse(match) as ContentBlock,
      });
    }
  }

  // Sort by position
  matches.sort((a, b) => a.start - b.start);

  // Extract markdown between components
  let lastEnd = 0;
  for (const m of matches) {
    const between = content.substring(lastEnd, m.start).trim();
    if (between) {
      blocks.push({ type: "markdown", content: between });
    }
    blocks.push(m.block);
    lastEnd = m.end;
  }

  // Trailing markdown
  const trailing = content.substring(lastEnd).trim();
  if (trailing) {
    blocks.push({ type: "markdown", content: trailing });
  }

  return blocks;
}

function getLevelSlug(filePath: string): string {
  const relative = path.relative(SOURCE_DIR, filePath);
  const parts = relative.split(path.sep);
  if (parts.length > 1) {
    return parts[0]; // "foundations", "level-1", etc.
  }
  return "root";
}

function getSlug(filePath: string): string {
  return path.basename(filePath, ".mdx");
}

function convertFile(
  filePath: string
): { meta: ModuleMeta; blocks: ContentBlock[] } | null {
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data: frontmatter, content } = matter(raw);

  const levelSlug = getLevelSlug(filePath);
  const slug = getSlug(filePath);

  // Skip root-level files that aren't part of learning content
  if (
    levelSlug === "root" &&
    !["getting-started", "glossary", "competency-map"].includes(slug)
  ) {
    // Still convert the root index for reference
    if (slug !== "index") return null;
  }

  const meta: ModuleMeta = {
    title: frontmatter.title || "",
    description: frontmatter.description || "",
    level: levelSlug,
    slug,
    order: frontmatter.sidebar?.order ?? 0,
    isCheckpoint: slug === "checkpoint",
    isIndex: slug === "index",
  };

  const blocks = parseContent(content);

  return { meta, blocks };
}

function main() {
  console.log("Converting MDX files to JSON...\n");

  // Find all MDX files
  const mdxFiles = globSync(path.join(SOURCE_DIR, "**/*.mdx"));
  console.log(`Found ${mdxFiles.length} MDX files`);

  // Load levels data
  const levelsData = JSON.parse(fs.readFileSync(LEVELS_JSON, "utf-8"));

  // Prepare output directory
  if (fs.existsSync(OUTPUT_DIR)) {
    fs.rmSync(OUTPUT_DIR, { recursive: true });
  }

  const curriculumModules: Record<string, ModuleMeta[]> = {};
  let convertedCount = 0;

  for (const filePath of mdxFiles) {
    const result = convertFile(filePath);
    if (!result) continue;

    const { meta, blocks } = result;

    // Determine output path
    let outputDir: string;
    if (meta.level === "root") {
      outputDir = OUTPUT_DIR;
    } else {
      outputDir = path.join(OUTPUT_DIR, meta.level);
    }

    fs.mkdirSync(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, `${meta.slug}.json`);

    fs.writeFileSync(
      outputPath,
      JSON.stringify({ meta, blocks }, null, 2),
      "utf-8"
    );

    // Track for curriculum index
    if (!curriculumModules[meta.level]) {
      curriculumModules[meta.level] = [];
    }
    curriculumModules[meta.level].push(meta);

    convertedCount++;
  }

  // Sort modules by order within each level
  for (const level of Object.keys(curriculumModules)) {
    curriculumModules[level].sort((a, b) => a.order - b.order);
  }

  // Generate curriculum.json
  const curriculum = {
    levels: levelsData,
    modules: curriculumModules,
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIR, "curriculum.json"),
    JSON.stringify(curriculum, null, 2),
    "utf-8"
  );

  // Copy data files
  const dataDir = path.resolve(__dirname, "../../ai-fluency/src/data");
  fs.copyFileSync(
    path.join(dataDir, "competencies.json"),
    path.join(OUTPUT_DIR, "competencies.json")
  );
  fs.copyFileSync(
    path.join(dataDir, "resources.json"),
    path.join(OUTPUT_DIR, "resources.json")
  );

  console.log(`\nConverted ${convertedCount} modules`);
  console.log(`Generated curriculum.json with ${Object.keys(curriculumModules).length} levels`);
  console.log(`Copied competencies.json and resources.json`);
  console.log(`\nOutput: ${OUTPUT_DIR}`);
}

main();
