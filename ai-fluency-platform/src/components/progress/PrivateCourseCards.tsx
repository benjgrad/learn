"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CourseInfo } from "@/types/content";

/**
 * Private courses, fetched after load so the home page stays static and their
 * titles never appear in its HTML or bundle. Renders nothing for anyone but
 * the owner.
 */
export function PrivateCourseCards() {
  const [courses, setCourses] = useState<CourseInfo[]>([]);

  useEffect(() => {
    fetch("/api/courses/private")
      .then((res) => (res.ok ? res.json() : []))
      .then(setCourses)
      .catch(() => setCourses([]));
  }, []);

  if (courses.length === 0) return null;

  return (
    <div className="mt-10">
      <h3 className="flex items-center justify-center gap-2 text-lg font-semibold mb-4 text-muted-foreground">
        <Lock className="h-4 w-4" /> Private to you
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {courses.map((course) => (
          <Link key={course.id} href={`/curriculum/${course.id}`}>
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
              <div className="h-2" style={{ backgroundColor: course.color }} />
              <CardHeader>
                <CardTitle className="text-xl">{course.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{course.description}</p>
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
  );
}
