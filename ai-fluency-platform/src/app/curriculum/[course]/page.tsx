import { notFound } from "next/navigation";
import { getCurriculum, getCourses } from "@/lib/content";
import { LevelCard } from "@/components/progress/LevelCard";

interface PageProps {
  params: Promise<{ course: string }>;
}

export async function generateStaticParams() {
  const courses = getCourses();
  return courses.map((c) => ({ course: c.id }));
}

export async function generateMetadata({ params }: PageProps) {
  const { course } = await params;
  const courses = getCourses();
  const courseInfo = courses.find((c) => c.id === course);
  if (!courseInfo) return { title: "Not Found" };
  return { title: `${courseInfo.title} Curriculum` };
}

export default async function CurriculumCoursePage({ params }: PageProps) {
  const { course } = await params;
  const courses = getCourses();
  const courseInfo = courses.find((c) => c.id === course);
  if (!courseInfo) notFound();

  const curriculum = getCurriculum(course);

  return (
    <main className="max-w-5xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold mb-4">{courseInfo.title}</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {courseInfo.description}
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
              course={course}
            />
          );
        })}
      </div>
    </main>
  );
}
