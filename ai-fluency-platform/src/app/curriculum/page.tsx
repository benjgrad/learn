import { getCurriculum } from "@/lib/content";
import { LevelCard } from "@/components/progress/LevelCard";

export default function CurriculumPage() {
  const curriculum = getCurriculum();

  return (
    <main className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">Curriculum</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Eight levels of AI fluency, from foundational concepts to pioneering
          research. Each level builds on the last.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {curriculum.levels.map((level) => {
          const levelSlug =
            level.level === 0 ? "foundations" : `level-${level.level}`;
          const modules = (curriculum.modules[levelSlug] || []).filter(
            (m) => !m.isIndex
          );

          return (
            <LevelCard
              key={level.level}
              level={level}
              levelSlug={levelSlug}
              modules={modules}
            />
          );
        })}
      </div>
    </main>
  );
}
