import { createClient } from "@/lib/supabase/server";
import { getEffectiveConfig } from "./config";

export interface CourseEntitlement {
  hasAccess: boolean;
  cost: number;
  userId: string | null;
}

/**
 * Server-side counterpart to `canAccessCourse` in course-access.ts.
 *
 * The client check reads localStorage, which is per-browser and therefore not
 * an entitlement at all -- it was the only gate until this existed, so a lesson
 * URL served its content to anyone. This reads `course_unlocks`, and unlike the
 * client it also honours a Spark Pass subscription.
 */
export async function getCourseEntitlement(courseId: string): Promise<CourseEntitlement> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const config = getEffectiveConfig(user?.email);
  const cost = config.freeCourses.includes(courseId)
    ? 0
    : config.coursePrices[courseId] ?? 0;

  // Free courses stay open to signed-out visitors.
  if (cost === 0) {
    return { hasAccess: true, cost: 0, userId: user?.id ?? null };
  }

  if (!user) {
    return { hasAccess: false, cost, userId: null };
  }

  const [{ data: unlock }, { data: wallet }] = await Promise.all([
    supabase
      .from("course_unlocks")
      .select("course_id")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .maybeSingle(),
    supabase
      .from("spark_wallets")
      .select("is_subscriber")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const hasAccess = Boolean(unlock) || Boolean(wallet?.is_subscriber);

  return { hasAccess, cost, userId: user.id };
}
