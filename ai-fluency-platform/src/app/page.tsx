import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCourses } from "@/lib/content";
import { ArrowRight, BookOpen, Brain, Target, Shield } from "lucide-react";

export default function Home() {
  const courses = getCourses();

  return (
    <main>
      {/* Hero */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Learn With Purpose
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Evidence-based learning with interactive exercises, AI-powered
            feedback, and structured progression. Choose your course below.
          </p>
        </div>
      </section>

      {/* Course Selector */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            Available Courses
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {courses.map((course) => (
              <Link key={course.id} href={`/curriculum/${course.id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
                  <div
                    className="h-2"
                    style={{ backgroundColor: course.color }}
                  />
                  <CardHeader>
                    <CardTitle className="text-xl">{course.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {course.description}
                    </p>
                    <Button
                      variant="outline"
                      className="gap-2"
                      style={{ borderColor: course.color, color: course.color }}
                    >
                      Explore Course <ArrowRight className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Learning Cycle */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            Evidence-Based Learning Cycle
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { step: "1", label: "Predict", desc: "Activate prior knowledge" },
              { step: "2", label: "Learn", desc: "Engage with content" },
              { step: "3", label: "Practice", desc: "Apply concepts" },
              { step: "4", label: "Reflect", desc: "Self-explain" },
              { step: "5", label: "Connect", desc: "Link to real world" },
            ].map((item) => (
              <div
                key={item.step}
                className="text-center p-4 rounded-lg bg-background border"
              >
                <div className="text-2xl font-bold text-primary mb-1">
                  {item.step}
                </div>
                <div className="font-semibold">{item.label}</div>
                <div className="text-sm text-muted-foreground">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
