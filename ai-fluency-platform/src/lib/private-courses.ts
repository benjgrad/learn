import fs from "fs";
import path from "path";
import type { CourseInfo } from "@/types/content";
import { createClient } from "@/lib/supabase/server";

/**
 * Courses only the owner may see.
 *
 * They are registered in content/private-courses.json instead of courses.json
 * because courses.json and every curriculum.json in the client import maps are
 * bundled into public JavaScript. Nothing under content/ is served directly, so
 * a private course is invisible unless a server route hands it out, and every
 * such route checks `canViewCourse` first.
 *
 * Course pricing treats an unpriced course as free and open to signed-out
 * visitors, so a private course that skipped these checks would be public.
 */

const REGISTRY = path.join(process.cwd(), "content", "private-courses.json");

export function getPrivateCourses(): CourseInfo[] {
  if (!fs.existsSync(REGISTRY)) return [];
  return JSON.parse(fs.readFileSync(REGISTRY, "utf-8"));
}

export function isPrivateCourse(courseId: string): boolean {
  return getPrivateCourses().some((c) => c.id === courseId);
}

/** Owner ids come from a runtime env var, so changing them needs a restart, not a rebuild. */
export function isOwner(userId: string | null | undefined): boolean {
  if (!userId) return false;
  const owners = (process.env.OWNER_USER_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  return owners.includes(userId);
}

export async function getViewerId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * Public courses never touch the session, so their routes stay static; only a
 * private course id pays for the cookie read.
 */
export async function canViewCourse(courseId: string, viewerId?: string | null): Promise<boolean> {
  if (!isPrivateCourse(courseId)) return true;
  return isOwner(viewerId === undefined ? await getViewerId() : viewerId);
}

/** The private courses this viewer may see: all of them for the owner, none for anyone else. */
export async function getViewablePrivateCourses(viewerId?: string | null): Promise<CourseInfo[]> {
  const courses = getPrivateCourses();
  if (courses.length === 0) return [];
  return isOwner(viewerId === undefined ? await getViewerId() : viewerId) ? courses : [];
}
