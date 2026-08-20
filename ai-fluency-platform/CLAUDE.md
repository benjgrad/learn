# Palestra

This is the onboarding contract for authoring and integrating courses on this platform. Read the relevant section before making changes.

## Build & Dev

```bash
npm run dev          # Start dev server
npm run build        # Production build (also type-checks)
npm run build:review # Extract review questions from content → public/review-questions.json
```

Run `npm run build:review` after any lesson edit. Never hand-edit `public/review-questions.json`.

## Local Docker hosting

Production runs on this machine, not Vercel. `learn-two-chi.vercel.app` is a 308 redirect
(`vercel.json`) to `https://learning.gradyserver.com`.

| Piece | Where |
|---|---|
| Web app | `palestra-web` container, `127.0.0.1:3005` → nginx `learning.gradyserver.com` |
| Supabase API (Kong) | `127.0.0.1:54321` → nginx `db.learning.gradyserver.com` |
| Postgres | `127.0.0.1:54322` (not exposed publicly) |
| Studio | `127.0.0.1:54323` (not exposed publicly) |

Supabase is managed by the Supabase CLI, not by `compose.yml` — it owns the postgres/gotrue/
postgrest/kong containers and the `supabase_network_learning` network the web container joins.

```bash
npx supabase start                                   # bring up Supabase; applies supabase/migrations/*
npx supabase status                                  # prints the local anon key for .env.docker
docker compose --env-file .env.docker up -d --build  # build + run the web app
```

**Always pass `--env-file .env.docker`.** `NEXT_PUBLIC_*` are inlined into the client bundle at
build time, so they are Docker *build args*; without the flag they interpolate to empty and the
build fails the guard in `Dockerfile`. Changing either value requires a rebuild, not a restart.

Two things the Dockerfile copies that `output: "standalone"` does not trace on its own:
`content/` (read at runtime by `src/lib/content.ts` via `process.cwd()`) and `public/`
(holds the generated `review-questions.json`). Dropping either yields 500s on every lesson.

nginx vhosts live in `deploy/nginx/` and are installed to `/etc/nginx/sites-available/`
with certbot managing the TLS blocks. Supabase Studio is deliberately not proxied.

`supabase status` prints a freshly minted anon/service key on every start. The key *string*
changes but previously issued keys keep working — they are signed with the stable ES256 key in
`supabase/signing_keys.json` (gitignored, not in version control) and expire in 2036. A restart
does not require rebuilding the image.

Migrations 004-006 exist because the hosted project had drifted from `001`-`003`: it was missing
Data API grants, left `PUBLIC` EXECUTE on the SECURITY DEFINER sparks functions, and had three
tables (`quiz_sessions`, `quiz_question_history`, `user_xp`) created outside the migration flow.
Re-pulling production data:

```bash
npx supabase login && npx supabase link --project-ref sqzrnhfddgejemjxknky
npx supabase db dump --linked --data-only -f supabase/dumps/data.sql   # includes auth schema
npx supabase db reset                                                  # reapplies 001-006
# truncate public tables first — migrations seed achievement_definitions, which collides
docker exec -i supabase_db_learning psql -U postgres -d postgres < supabase/dumps/data.sql
```

Dumps land in `supabase/dumps/` and are gitignored — they contain user emails and password hashes.

Stripe is unconfigured — `src/lib/sparks/env.ts` throws on the sparks purchase/subscription
routes. Sparks earning works; buying does not.

## Learning framework

The curricula are evidence-based; see `../AI Enabled Learning Patterns.md` and `../AI Fluency Curriculum Development.md` for the source research. Authoring choices should follow from four principles:

1. **Prevent false mastery.** Force generation before exposition (predict → learn), force articulation after (explain back), and test delayed retention (review questions).
2. **AI as tutor, not answer engine.** Interactive blocks prompt reasoning and self-assessment rather than deliver solutions.
3. **Self-regulated learning scaffolding.** Each lesson follows a plan → act → reflect arc.
4. **Epistemic vigilance.** Learners must evaluate claims and calibrate confidence — baked into `calibrationCheck` and `reflectPrompt`.

**Canonical lesson arc:** `predict → learn (markdown) → calibrationCheck → tryItYourself → explainBack → reflectPrompt → keyTakeaway → connectPrompt`. Not every lesson uses every block, but deviations should be deliberate. For course-wide competency frameworks (e.g., AI Fluency's Delegation / Description / Discernment / Diligence), expose them via `competencies.json` and `competency-map.json`.

## Lesson block types

The full `ContentBlock` union lives in `src/types/content.ts:71-106`. Authoring reference:

| Block | Purpose | Mechanism |
|---|---|---|
| `markdown` | Primary narrative | — |
| `predictPrompt` | Activate prior knowledge before reading | Generation effect |
| `calibrationCheck` | Mid-module Q&A against a model answer | Retrieval practice |
| `tryItYourself` | Applied task with worked solution | Transfer |
| `explainBack` | Articulate in learner's own words | Self-explanation |
| `reflectPrompt` | Array of metacognitive questions | SRL scaffolding |
| `connectPrompt` | Connect lesson to learner's context | Elaboration |
| `keyTakeaway` | One-sentence crystallization | Consolidation |
| `practiceSet` | MCQ drill using `PracticeProblem[]` (`correctAnswer: string`) | Retrieval |
| `drillSet` | Timed drill with `passThreshold` + `timeLimitSeconds`; `DrillProblem[]` or `generator` + `problemCount` | Overlearning to automaticity |
| `pixelAgentTeam` | Interactive agent UI | — |
| `providerContent` | Provider-specific branching (claude-code / codex / cline / gemini) | — |

Note the schema split: `PracticeProblem` uses `correctAnswer: string` (`src/types/content.ts:15-24`). `reviewQuestions` uses `correctIndex: number` (`src/types/content.ts:56-63`). They are not interchangeable.

## Per-course content checklist

Layout: `content/<course>/...`

| File | Required | Purpose |
|---|---|---|
| `index.json` | yes | Course landing; `meta.level: "root"`, `meta.slug: "index"` |
| `curriculum.json` | yes | Both `levels: LevelInfo[]` **and** `modules: Record<string, ModuleMeta[]>` keyed by level slug (`"foundations"`, `"level-1"`, …). The sidebar renders empty dropdowns if `modules` is missing — see `src/components/layout/Sidebar.tsx:133-136`. |
| `getting-started.json` | optional | Orientation page; auto-resolved by slug in `src/lib/content.ts:47-53` |
| `glossary.json` | optional | Markdown term reference |
| `competencies.json` | optional | `Competency[]` per `src/types/content.ts:125-132` |
| `competency-map.json` | optional | Framework overview page |
| `resources.json` | optional | `Resource[]` per `src/types/content.ts:134-143` |
| `<level>/index.json` | yes per level | Level intro; `meta.isIndex: true` |
| `<level>/<slug>.json` | per lesson | Lesson (see schema) |
| `<level>/<...>-checkpoint.json` | recommended last in level | Interview-style synthesis; `meta.isCheckpoint: true` |

**Required `meta` fields on every lesson:** `title`, `description`, `level`, `slug`, `order`, `isCheckpoint`, `isIndex`. Optional flags: `isPracticeOnly`, `isExamBank`, `cfaTopic`, `cfaLOS`.

**Every level needs `modules` entries in `curriculum.json`.** When adding a lesson, also add a matching entry in `curriculum.json` → `modules[<levelSlug>]` with `{title, description, level, slug, order, isCheckpoint, isIndex}`, sorted by `order`. `contract-bridge/curriculum.json:84-852` is the canonical template.

## Code integration checklist for a new course

Seven touchpoints. Missing any one leaves the course partially broken. Cross-check with `grep -R "<some-existing-course>\b" ai-fluency-platform/` — your new course ID should appear in the same places.

| # | File | Change |
|---|---|---|
| 1 | `content/courses.json` | Append `{id, title, description, color, isDrillCourse?}` |
| 2 | `content/<course>/curriculum.json` | Must have both `levels` and `modules` |
| 3 | `src/components/layout/Sidebar.tsx` | Import `curriculum.json` + entry in `curricula` map |
| 4 | `src/app/dashboard/page.tsx` | Import `curriculum.json` + entry in `curricula` map |
| 5 | `src/lib/sparks/config.ts` | Add course ID to `SPARK_CONFIG.coursePrices` (0) and `freeCourses`; add to `BEN_CONFIG_OVERRIDES.coursePrices` with a price tier (500 / 750 / 1000) |
| 6 | `scripts/build-review-questions.ts` | Add course ID to `COURSES` array |
| 7 | `public/review-questions.json` | Regenerate with `npm run build:review` |

No Supabase migration needed. `course_id` is `TEXT` in `supabase/migrations/003_sparks_economy.sql:92`. No union/enum of course IDs exists in `src/types/content.ts` — course IDs are strings everywhere.

## Sparks economy

Config lives in `src/lib/sparks/config.ts`. Key knobs:

- `lessonReward: 10` — sparks per lesson completion.
- `quizBaseReward: 5` + `quizPerCorrectBonus: 2` — sparks per daily quiz.
- `coursePrices[courseId]` — sparks needed to unlock. `0` + presence in `freeCourses` = free.
- `BEN_CONFIG_OVERRIDES` — despite the name, `isSparkGatingEnabled` in `src/lib/sparks/feature-flags.ts:1-3` returns `true` for all users, so this override is the live config. Price tiers in use:
  - `500` — lightweight literacy courses (web-fundamentals, react-literacy)
  - `750` — standard depth (claude-code, system-design, cfa-1, contract-bridge, make-pm)
  - `1000` — premium (cfa-2, cfa-3)

`ai-fluency` and `texas-holdem` are the only permanently free courses (in `BEN_CONFIG_OVERRIDES.freeCourses`).

## Review questions

Every regular lesson **must** include a `reviewQuestions` array. The build script at `scripts/build-review-questions.ts:75-76` and the validator at `scripts/validate-lesson.ts:25-26` auto-skip lessons marked `isIndex`, `isCheckpoint`, `isPracticeOnly`, or `isExamBank`. Regular lessons with zero questions still render but are silently dropped from the daily quiz pool.

Schema:

```json
{
  "meta": { ... },
  "blocks": [ ... ],
  "reviewQuestions": [
    {
      "question": "Approximately how many seconds are in a day?",
      "options": ["~1,000 (10^3)", "~86,400 (10^5)", "~1,000,000 (10^6)"],
      "correctIndex": 1,
      "explanation": "There are 86,400 seconds in a day — a key number for QPS estimation.",
      "encourageCorrect": "Nailed it! That number will come in handy for estimation problems.",
      "encourageIncorrect": "Not quite — it's about 86,400. A useful trick: round to 10^5 for quick math."
    }
  ]
}
```

Rules:

1. **2-3 questions per lesson** — enough to reinforce, not overwhelm.
2. **Very easy** — basic recall from the lesson, not trick questions.
3. **3 options each** — fast to answer.
4. **Test specific knowledge** — "How many seconds in a day?" not "What is a key takeaway?"
5. **Warm, encouraging tone** in both `encourageCorrect` and `encourageIncorrect`.
6. **Vary encouragement messages** — no repeating phrases across questions.
7. **No LaTeX or complex formatting** — questions render in a simple modal.
8. **For math/formula content** — test concepts, not computation (e.g., "What does 2^30 approximately equal?" not "Calculate 2^30").
9. **Skip** `isIndex`, `isCheckpoint`, `isPracticeOnly`, and `isExamBank` lessons — they're auto-excluded from the build.

Run `npm run build:review` after modifying content.

## Project structure

- `content/` — Course content as JSON (`courses.json`, per-course `curriculum.json`, lesson files).
- `src/app/` — Next.js App Router pages and API routes.
- `src/components/` — React components (learning/, content/, review/, ui/, layout/, progress/, dashboard/).
- `src/lib/` — Content loading, utilities, stores, sparks economy.
- `src/types/` — TypeScript type definitions.
- `scripts/` — Build and validation scripts (`build-review-questions.ts`, `validate-lesson.ts`).
- `supabase/` — Migrations and edge functions.
