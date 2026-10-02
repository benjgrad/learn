/**
 * MCP server for Palestra, over streamable HTTP.
 *
 * Hand-rolled rather than built on @modelcontextprotocol/sdk: the SDK's server
 * transport is written against Node's http.IncomingMessage/ServerResponse,
 * while App Router handlers take a Web Request and return a Web Response, so
 * using it would mean writing an adapter larger than the dispatcher below.
 *
 * Stateless by design. We never issue an Mcp-Session-Id, so the client never
 * sends one -- the OAuth access token IS the session. That survives container
 * restarts and concurrent clients for free.
 *
 * This endpoint is an OAuth 2.1 protected resource; see src/lib/mcp/auth.ts and
 * /.well-known/oauth-protected-resource.
 *
 * Responses are always a single JSON object; we never open an SSE stream. The
 * spec permits either, and the MCP client has an explicit application/json
 * branch.
 */
import { authenticateMcp, type McpIdentity } from "@/lib/mcp/auth";
import { RESOURCE_METADATA_URL } from "@/lib/mcp/protected-resource";
import { callTool, TOOLS } from "@/lib/mcp/tools";

export const dynamic = "force-dynamic";

const SERVER_INFO = { name: "palestra", version: "1.0.0" };

const INSTRUCTIONS = [
  "Read-only access to this user's Palestra learning platform.",
  "Call get_progress first to find where they left off and what is due for review.",
  "list_curriculum maps a course; get_lesson returns a lesson's full text;",
  "get_review_questions returns quiz questions with their spaced-repetition state.",
  "module_path values returned by get_progress and list_curriculum can be passed",
  "directly to get_lesson. Nothing here can modify the user's progress.",
].join(" ");

// The client asserts our reply is in ITS supported list, so echoing back what
// it asked for is always safe; a hardcoded value would break the day a client
// drops support for it.
const KNOWN_VERSIONS = new Set([
  "2025-11-25",
  "2025-06-18",
  "2025-03-26",
  "2024-11-05",
  "2024-10-07",
]);
const FALLBACK_VERSION = "2025-06-18";

interface JsonRpcMessage {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
}

// Browser-based MCP clients (Inspector, hosted connectors) fetch this endpoint
// cross-origin. Exposing WWW-Authenticate matters as much as allowing it: that
// header is the entire discovery trigger, and a browser client cannot read it
// otherwise.
const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-expose-headers": "WWW-Authenticate, Mcp-Protocol-Version",
};

const JSON_HEADERS = {
  "content-type": "application/json",
  "cache-control": "no-store",
  ...CORS_HEADERS,
};

function ok(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

/**
 * RFC 9728 section 5.1. Pointing at the resource metadata is what lets a client
 * with no prior configuration find the authorization server, register itself
 * and run the consent flow -- it is the whole bootstrap.
 */
function unauthorized(description: string): Response {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: {
      ...JSON_HEADERS,
      "www-authenticate":
        `Bearer error="invalid_token", error_description="${description}", ` +
        `resource_metadata="${RESOURCE_METADATA_URL}", scope="openid email"`,
    },
  });
}

function result(id: JsonRpcMessage["id"], value: unknown) {
  return { jsonrpc: "2.0", id, result: value };
}

function rpcError(id: JsonRpcMessage["id"], code: number, message: string) {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message } };
}

export async function POST(req: Request): Promise<Response> {
  const identity = await authenticateMcp(req);
  if (!identity) {
    return unauthorized("Missing or invalid OAuth access token");
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return ok(rpcError(null, -32700, "Parse error"));
  }

  // Batches were legal through 2025-03-26 and removed in 2025-06-18. Cheap to
  // keep working.
  if (Array.isArray(body)) {
    const responses = [];
    for (const message of body as JsonRpcMessage[]) {
      const response = await dispatch(message, identity);
      if (response) responses.push(response);
    }
    if (responses.length === 0) return new Response(null, { status: 202 });
    return ok(responses);
  }

  const response = await dispatch(body as JsonRpcMessage, identity);
  // Notifications get no body.
  if (!response) return new Response(null, { status: 202 });
  return ok(response);
}

/** null means "this was a notification; reply 202 with no body". */
async function dispatch(
  message: JsonRpcMessage,
  identity: McpIdentity
): Promise<unknown | null> {
  const { id, method, params } = message ?? {};
  if (id === undefined || id === null) return null;
  if (!method) return rpcError(id, -32600, "Invalid Request: missing method");

  switch (method) {
    case "initialize": {
      const requested = params?.protocolVersion;
      const version =
        typeof requested === "string" && KNOWN_VERSIONS.has(requested)
          ? requested
          : FALLBACK_VERSION;
      return result(id, {
        protocolVersion: version,
        // Only tools. Declaring this means SDK clients refuse client-side to
        // send resources/* or prompts/*. No listChanged: a stateless server
        // has no way to push notifications.
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
        instructions: INSTRUCTIONS,
      });
    }

    case "ping":
      return result(id, {});

    case "tools/list":
      return result(id, { tools: TOOLS });

    case "tools/call": {
      const name = params?.name;
      if (typeof name !== "string") {
        return rpcError(id, -32602, "Invalid params: name is required");
      }
      const args = (params?.arguments ?? {}) as Record<string, unknown>;
      try {
        // Domain failures come back as isError, not a JSON-RPC error, so the
        // model can see what went wrong and retry.
        return result(id, await callTool(name, args, identity));
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        return result(id, {
          content: [{ type: "text", text: `Tool '${name}' failed: ${detail}` }],
          isError: true,
        });
      }
    }

    // Stubs for clients (MCP Inspector, some IDEs) that probe unconditionally
    // despite our declared capabilities.
    case "resources/list":
      return result(id, { resources: [] });
    case "resources/templates/list":
      return result(id, { resourceTemplates: [] });
    case "prompts/list":
      return result(id, { prompts: [] });

    default:
      return rpcError(id, -32601, `Method not found: ${method}`);
  }
}

/**
 * We offer no standalone SSE stream. The MCP client treats 405 here as "none
 * available" and carries on; any other non-2xx makes it throw. Exported
 * explicitly so that contract is visible rather than a framework default.
 */
export async function GET(): Promise<Response> {
  return new Response(
    JSON.stringify({ error: "This MCP endpoint accepts POST only." }),
    { status: 405, headers: { ...JSON_HEADERS, allow: "POST, OPTIONS" } }
  );
}

/** CORS preflight. Browser clients cannot POST here without it. */
export async function OPTIONS(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      ...CORS_HEADERS,
      "access-control-allow-methods": "POST, GET, OPTIONS",
      "access-control-allow-headers": "authorization, content-type, mcp-protocol-version",
      "access-control-max-age": "86400",
    },
  });
}
