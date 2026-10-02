import { metadataResponse, metadataPreflight } from "@/lib/mcp/protected-resource";

/**
 * Path-inserted form, e.g. /.well-known/oauth-protected-resource/api/mcp.
 * Clients try this before the root form (RFC 9728 section 3.1). A catch-all
 * rather than a literal /api/mcp segment so a client that canonicalises the
 * resource URI slightly differently still discovers the document.
 */
// Not force-static: a route exporting OPTIONS cannot be statically generated,
// and these need the CORS preflight. The document is constant, so caching is
// handled by the Cache-Control header instead.
export const dynamic = "force-dynamic";

export function GET() {
  return metadataResponse();
}

export function OPTIONS() {
  return metadataPreflight();
}
