import { notFound } from "next/navigation";
import { getCurriculum, getCourses } from "@/lib/content";
import { LevelCard } from "@/components/progress/LevelCard";
import { DrillCurriculumGrid } from "@/components/progress/DrillCurriculumGrid";
import { CourseAccessWrapper } from "@/components/sparks/CourseAccessWrapper";
import { getViewablePrivateCourses, isPrivateCourse } from "@/lib/private-courses";

interface PageProps {
  params: Promise<{ course: string }>;
}

// A private course resolves only for its owner, which means reading the session
// cookie. A statically generated route throws DYNAMIC_SERVER_USAGE (a 500 in
// production; dev doesn't enforce it) when an unlisted param does that, so the
// route renders per request, like /learn. The work is a couple of file reads.
export const dynamic = "force-dynamic";

/** Public courses resolve from courses.json without touching the session. */
async function findCourse(course: string) {
  const publicCourse = getCourses().find((c) => c.id === course);
  if (publicCourse || !isPrivateCourse(course)) return publicCourse;
  return (await getViewablePrivateCourses()).find((c) => c.id === course);
}

export async function generateMetadata({ params }: PageProps) {
  const { course } = await params;
  const courseInfo = await findCourse(course);
  if (!courseInfo) return { title: "Not Found" };
  return { title: `${courseInfo.title} Curriculum` };
}

export default async function CurriculumCoursePage({ params }: PageProps) {
  const { course } = await params;
  const courseInfo = await findCourse(course);
  if (!courseInfo) notFound();

  const curriculum = getCurriculum(course);

  return (
    <CourseAccessWrapper
      courseId={course}
      courseTitle={courseInfo.title}
      courseDescription={courseInfo.description}
    >
      <main className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">{courseInfo.title}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {courseInfo.description}
          </p>
        </div>
        {courseInfo.isDrillCourse ? (
          <DrillCurriculumGrid curriculum={curriculum} course={course} />
        ) : (
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
        )}
      </main>
    </CourseAccessWrapper>
  );
}
