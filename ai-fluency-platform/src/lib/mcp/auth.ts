/**
 * OAuth bearer-token auth for the MCP endpoint (src/app/api/mcp/route.ts).
 *
 * The MCP endpoint is an OAuth 2.1 protected resource. Its authorization server
 * is the project's own GoTrue (`[auth.oauth_server]` in supabase/config.toml);
 * clients discover it via /.well-known/oauth-protected-resource and register
 * themselves through RFC 7591 dynamic registration.
 *
 * Tokens are verified locally against the ES256 JWKS rather than by calling
 * GoTrue on every request. supabase-js caches the JWKS for 10 minutes, so the
 * steady-state cost is a WebCrypto verify; a remote check would add ~70ms to
 * every tool call, and a single "quiz me" turn fires a dozen.
 *
 * Local verification alone cannot see a revoked grant, though: revoking deletes
 * the GoTrue session, but an already-issued JWT stays cryptographically valid
 * until it expires -- up to an hour. Settings tells users disconnecting takes
 * effect immediately, so we hold that to be true: after the signature checks
 * out, the session is confirmed against GoTrue at most once per minute per
 * session. That caps revocation lag at ~60s for one remote call a minute,
 * instead of ~60 minutes for none or a remote call on every request.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function supabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  return url.replace(/\/$/, "");
}

/** The `iss` every token from our authorization server carries. */
export function expectedIssuer(): string {
  return `${supabaseUrl()}/auth/v1`;
}

// Cached: this runs in a long-lived Node container, not a serverless function.
let adminClient: SupabaseClient | null = null;

export function getAdminSupabase(): SupabaseClient {
  if (adminClient) return adminClient;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error("Missing Supabase service role configuration");
  }
  adminClient = createClient(supabaseUrl(), serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return adminClient;
}

// Anon-key client used only for its JWKS cache and getClaims(). It holds no
// session of its own -- the token under test is passed in explicitly.
let verifierClient: SupabaseClient | null = null;

function getVerifier(): SupabaseClient {
  if (verifierClient) return verifierClient;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
  verifierClient = createClient(supabaseUrl(), anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return verifierClient;
}

/**
 * Revoking a grant deletes the session rows behind its tokens, so GoTrue answers
 * /user with 403 session_not_found. Cached per session id -- a "quiz me" turn
 * fires a dozen tool calls and they should not each pay a round trip.
 */
const SESSION_CHECK_MS = 60_000;
const SESSION_CACHE_MAX = 500;
const sessionChecked = new Map<string, number>();

async function sessionStillValid(sessionKey: string, token: string): Promise<boolean> {
  const now = Date.now();
  const last = sessionChecked.get(sessionKey);
  if (last !== undefined && now - last < SESSION_CHECK_MS) return true;

  const { error } = await getVerifier().auth.getUser(token);
  if (error) {
    sessionChecked.delete(sessionKey);
    return false;
  }

  // Bounded: this map lives for the process lifetime. Oldest insertion first,
  // which is good enough -- a dropped entry only costs one extra round trip.
  if (sessionChecked.size >= SESSION_CACHE_MAX) {
    const oldest = sessionChecked.keys().next().value;
    if (oldest !== undefined) sessionChecked.delete(oldest);
  }
  sessionChecked.set(sessionKey, now);
  return true;
}

export interface McpIdentity {
  userId: string;
  /** OAuth client that obtained this token. Absent on web-session tokens. */
  clientId: string;
  scopes: string[];
  /** Carried so data.ts can build a user-scoped client and let RLS do the scoping. */
  accessToken: string;
}

export async function authenticateMcp(req: Request): Promise<McpIdentity | null> {
  const header = req.headers.get("authorization");
  if (!header || !header.toLowerCase().startsWith("bearer ")) return null;

  const token = header.slice(7).trim();
  if (!token) return null;

  let claims: Record<string, unknown>;
  try {
    // Verifies the ES256 signature against the JWKS and checks exp.
    const { data, error } = await getVerifier().auth.getClaims(token);
    if (error || !data?.claims) return null;
    claims = data.claims as unknown as Record<string, unknown>;
  } catch {
    return null;
  }

  if (claims.iss !== expectedIssuer()) return null;

  const userId = typeof claims.sub === "string" ? claims.sub : "";
  if (!UUID_RE.test(userId)) return null;

  // The closest thing to audience validation available here. GoTrue does not
  // implement RFC 8707, and sets aud to "authenticated" on every token it
  // issues -- the same value an ordinary cookie-session token carries. But
  // client_id is set only on tokens minted through the OAuth authorization-code
  // flow, so requiring it stops a stolen web session from being replayed
  // against this endpoint. See CLAUDE.md for why this is short of the spec.
  const clientId = typeof claims.client_id === "string" ? claims.client_id : "";
  if (!clientId) return null;

  const sessionKey = typeof claims.session_id === "string" ? claims.session_id : token;
  if (!(await sessionStillValid(sessionKey, token))) return null;

  const scopes = typeof claims.scope === "string" ? claims.scope.split(/\s+/).filter(Boolean) : [];

  return { userId, clientId, scopes, accessToken: token };
}
