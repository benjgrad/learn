import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ANON_LIMIT = 5;
const AUTH_LIMIT = 50;

// In-memory store for anonymous users (keyed by IP)
const anonUsage = new Map<string, { count: number; date: string }>();

function getTodayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export interface RateLimitResult {
  allowed: boolean;
  authenticated: boolean;
  remaining: number;
  limit: number;
}

export async function checkAndIncrementUsage(
  request: NextRequest
): Promise<RateLimitResult> {
  // Skip rate limiting in development
  if (process.env.NODE_ENV === "development") {
    return { allowed: true, authenticated: true, remaining: 999, limit: 999 };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Authenticated: use database RPC for atomic increment
    const { data, error } = await supabase.rpc("increment_ai_usage", {
      p_user_id: user.id,
    });

    if (error) {
      // On DB error, allow the request but log
      console.error("Rate limit DB error:", error);
      return { allowed: true, authenticated: true, remaining: AUTH_LIMIT, limit: AUTH_LIMIT };
    }

    const count = data as number;
    const allowed = count <= AUTH_LIMIT;
    return {
      allowed,
      authenticated: true,
      remaining: Math.max(0, AUTH_LIMIT - count),
      limit: AUTH_LIMIT,
    };
  }

  // Anonymous: use in-memory map keyed by IP
  const ip = getClientIP(request);
  const today = getTodayStr();
  const entry = anonUsage.get(ip);

  if (!entry || entry.date !== today) {
    anonUsage.set(ip, { count: 1, date: today });
    return {
      allowed: true,
      authenticated: false,
      remaining: ANON_LIMIT - 1,
      limit: ANON_LIMIT,
    };
  }

  entry.count += 1;
  const allowed = entry.count <= ANON_LIMIT;
  return {
    allowed,
    authenticated: false,
    remaining: Math.max(0, ANON_LIMIT - entry.count),
    limit: ANON_LIMIT,
  };
}

export function rateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: "Rate limit exceeded",
      authenticated: result.authenticated,
      limit: result.limit,
      remaining: 0,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Authenticated": String(result.authenticated),
      },
    }
  );
}
