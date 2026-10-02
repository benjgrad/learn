/**
 * Every Supabase read the MCP tools make.
 *
 * These run under a client built from the caller's own OAuth access token, so
 * RLS enforces the scoping -- every table read here has
 * `SELECT USING (auth.uid() = user_id)`. Note this is not belt-and-braces:
 * OAuth scopes (openid/email/profile/phone) govern only ID-token and UserInfo
 * content and grant no table access at all, so RLS is the whole authorization
 * mechanism for an MCP client.
 *
 * The .eq("user_id", userId) filters are kept as defence in depth. They are no
 * longer what makes the query safe -- if a policy were ever dropped, the filter
 * still stops the query widening.
 *
 * Errors are propagated, never swallowed. Under the old service-role client a
 * query error was near-impossible; under RLS an expired or mis-scoped token
 * returns { data: null, error }, and returning [] there would report an empty
 * curriculum instead of a failure -- silent data loss that reads as a content
 * bug. dispatch() in the route turns a throw into isError: true.
 *
 * Query shapes mirror src/app/api/user-data/route.ts.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { McpIdentity } from "./auth";

/**
 * Per-request client bound to the caller's access token. Uses the `accessToken`
 * option rather than a raw Authorization header: it is the supported
 * third-party-auth path and it disables supabase.auth.* on the client, so this
 * can only ever read data, never manipulate the session.
 */
export function userClient(identity: McpIdentity): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("Missing Supabase configuration");

  return createClient(url, anonKey, {
    accessToken: async () => identity.accessToken,
  });
}

function fail(table: string, message: string): never {
  throw new Error(`Could not read ${table}: ${message}`);
}

export interface ModuleProgressRow {
  module_path: string;
  level_id: string;
  completed: boolean;
  completed_at: string | null;
}

export interface QuestionHistoryRow {
  question_id: string;
  last_seen: string | null;
  next_due: string | null;
  box: number;
  correct_streak: number;
  total_seen: number;
  total_correct: number;
}

export interface UserXpRow {
  total_xp: number;
  daily_streak: number;
  last_quiz_date: string | null;
  longest_streak: number;
  provider: string | null;
}

export interface InteractionRow {
  interaction_type: string;
  interaction_index: number;
  user_input: string | null;
  ai_feedback: string | null;
  created_at: string;
}

export async function getModuleProgress(
  identity: McpIdentity
): Promise<ModuleProgressRow[]> {
  const { data, error } = await userClient(identity)
    .from("module_progress")
    .select("module_path, level_id, completed, completed_at")
    .eq("user_id", identity.userId);
  if (error) fail("module_progress", error.message);
  return (data as ModuleProgressRow[] | null) ?? [];
}

export async function getUserXp(identity: McpIdentity): Promise<UserXpRow | null> {
  const { data, error } = await userClient(identity)
    .from("user_xp")
    .select("total_xp, daily_streak, last_quiz_date, longest_streak, provider")
    .eq("user_id", identity.userId)
    .maybeSingle();
  if (error) fail("user_xp", error.message);
  return (data as UserXpRow | null) ?? null;
}

export async function getSparkBalance(identity: McpIdentity): Promise<number> {
  const { data, error } = await userClient(identity)
    .from("spark_wallets")
    .select("balance")
    .eq("user_id", identity.userId)
    .maybeSingle();
  if (error) fail("spark_wallets", error.message);
  return (data as { balance: number } | null)?.balance ?? 0;
}

export async function getQuestionHistory(
  identity: McpIdentity
): Promise<QuestionHistoryRow[]> {
  const { data, error } = await userClient(identity)
    .from("quiz_question_history")
    .select(
      "question_id, last_seen, next_due, box, correct_streak, total_seen, total_correct"
    )
    .eq("user_id", identity.userId);
  if (error) fail("quiz_question_history", error.message);
  return (data as QuestionHistoryRow[] | null) ?? [];
}

export async function getInteractionsForModule(
  identity: McpIdentity,
  modulePath: string
): Promise<InteractionRow[]> {
  const { data, error } = await userClient(identity)
    .from("interaction_responses")
    .select(
      "interaction_type, interaction_index, user_input, ai_feedback, created_at"
    )
    .eq("user_id", identity.userId)
    .eq("module_path", modulePath)
    .order("interaction_index", { ascending: true });
  if (error) fail("interaction_responses", error.message);
  return (data as InteractionRow[] | null) ?? [];
}

/** Completed module_path values as a set, for the curriculum walk. */
export function completedPaths(rows: ModuleProgressRow[]): Set<string> {
  return new Set(rows.filter((r) => r.completed).map((r) => r.module_path));
}
