/**
 * RFC 9728 Protected Resource Metadata for the MCP endpoint.
 *
 * This is how an MCP client finds the authorization server: it gets a 401 from
 * /api/mcp carrying a WWW-Authenticate header that points here, reads
 * `authorization_servers`, and runs OAuth discovery against that issuer.
 */
const APP_ORIGIN = "https://learning.gradyserver.com";

function issuer(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!url) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
  return `${url}/auth/v1`;
}

/** Canonical URI of the MCP server, per RFC 8707 -- no query, no fragment. */
export const MCP_RESOURCE_URI = `${APP_ORIGIN}/api/mcp`;

export const RESOURCE_METADATA_URL = `${APP_ORIGIN}/.well-known/oauth-protected-resource/api/mcp`;

export function protectedResourceMetadata() {
  return {
    resource: MCP_RESOURCE_URI,
    // Must keep the /auth/v1 path: it is the exact `issuer` GoTrue emits, and
    // stripping it points discovery at a Kong 404.
    authorization_servers: [issuer()],
    // Sent verbatim by clients as the `scope` parameter, and GoTrue rejects
    // anything outside its fixed OIDC set -- a custom scope here kills the flow
    // with "unsupported scope".
    scopes_supported: ["openid", "email", "offline_access"],
    bearer_methods_supported: ["header"],
    resource_documentation: `${APP_ORIGIN}/settings`,
  };
}

export function metadataResponse(): Response {
  return Response.json(protectedResourceMetadata(), {
    headers: {
      // Public, unauthenticated document -- browser-based MCP clients need to
      // read it cross-origin.
      "access-control-allow-origin": "*",
      "cache-control": "public, max-age=3600",
    },
  });
}

export function metadataPreflight(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, OPTIONS",
      "access-control-allow-headers": "*",
      "access-control-max-age": "86400",
    },
  });
}
