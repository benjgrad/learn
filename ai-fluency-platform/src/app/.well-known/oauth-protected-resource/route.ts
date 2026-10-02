import { metadataResponse, metadataPreflight } from "@/lib/mcp/protected-resource";

// Root form. Clients fall back to this when the path-inserted URL 404s.
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
