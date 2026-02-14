import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurriculum } from "@/lib/content";
import { ArrowRight, BookOpen, Brain, Target, Shield } from "lucide-react";

export default function Home() {
  const curriculum = getCurriculum();

  return (
    <main>
      {/* Hero */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Master AI Fluency
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Evidence-based learning from foundational concepts to pioneering
            research. Build genuine fluency with AI through interactive
            exercises, AI-powered feedback, and structured progression.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/curriculum">
              <Button size="lg" className="gap-2">
                Start Learning <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button variant="outline" size="lg">
                Sign In to Track Progress
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Learning Cycle */}
      <section className="py-16 px-4 bg-muted/50">
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

      {/* 4D Competencies */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            4D Competency Framework
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                icon: Target,
                name: "Delegation",
                desc: "Strategic task distribution between humans and AI",
              },
              {
                icon: BookOpen,
                name: "Description",
                desc: "Effective communication of goals to AI systems",
              },
              {
                icon: Brain,
                name: "Discernment",
                desc: "Critical evaluation of AI outputs and processes",
              },
              {
                icon: Shield,
                name: "Diligence",
                desc: "Responsible and ethical application of AI",
              },
            ].map((comp) => (
              <Card key={comp.name}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <comp.icon className="h-5 w-5" />
                    {comp.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{comp.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Level Overview */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            8 Levels of AI Fluency
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {curriculum.levels.map((level) => (
              <Link
                key={level.level}
                href={`/learn/${level.level === 0 ? "foundations" : `level-${level.level}`}/index`}
              >
                <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mb-2"
                      style={{ backgroundColor: level.color }}
                    >
                      {level.level}
                    </div>
                    <CardTitle className="text-base">{level.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      {level.subtitle}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
