import { notFound } from "next/navigation";
import {
  getModuleBySlugPath,
  getAllModulePaths,
  getAdjacentModules,
  getLevelColor,
  getLevelTitle,
} from "@/lib/content";
import { ModuleRenderer } from "@/components/content/ModuleRenderer";
import { Sidebar } from "@/components/layout/Sidebar";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateStaticParams() {
  const paths = getAllModulePaths();
  return paths.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const module = getModuleBySlugPath(slug);
  if (!module) return { title: "Not Found" };

  return {
    title: `${module.meta.title} — AI Fluency`,
    description: module.meta.description,
  };
}

export default async function LearnPage({ params }: PageProps) {
  const { slug } = await params;
  const module = getModuleBySlugPath(slug);

  if (!module) notFound();

  const { meta, blocks } = module;
  const levelColor = getLevelColor(meta.level);
  const levelTitle = getLevelTitle(meta.level);
  const { prev, next } = getAdjacentModules(meta.level, meta.slug);

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-72 border-r shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
        <Sidebar />
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 max-w-4xl mx-auto px-4 sm:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/curriculum" className="hover:text-foreground">
            Curriculum
          </Link>
          <span>/</span>
          <Link
            href={`/learn/${meta.level}/index`}
            className="hover:text-foreground"
            style={{ color: levelColor }}
          >
            {levelTitle}
          </Link>
          {!meta.isIndex && (
            <>
              <span>/</span>
              <span className="text-foreground">{meta.title}</span>
            </>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold mb-2">{meta.title}</h1>
        {meta.description && (
          <p className="text-muted-foreground mb-8">{meta.description}</p>
        )}

        <Separator className="mb-8" />

        {/* Module content */}
        <ModuleRenderer
          blocks={blocks}
          meta={meta}
          levelTitle={levelTitle}
          levelColor={levelColor}
          nextModule={next}
        />

        {/* Prev/Next navigation */}
        {!meta.isIndex && (
          <nav className="flex justify-between items-center mt-12 pt-6 border-t">
            {prev ? (
              <Link
                href={`/learn/${prev.level}/${prev.slug}`}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
                {prev.title}
              </Link>
            ) : (
              <div />
            )}
            {next ? (
              <Link
                href={`/learn/${next.level}/${next.slug}`}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                {next.title}
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <div />
            )}
          </nav>
        )}
      </main>
    </div>
  );
}
