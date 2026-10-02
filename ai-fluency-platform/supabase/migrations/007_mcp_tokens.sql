-- Personal access tokens for the MCP endpoint (src/app/api/mcp/route.ts).
--
-- Token lookup runs under the service-role client: an MCP request carries no
-- cookie session, so auth.uid() is null and RLS cannot scope it. The settings
-- UI (/api/mcp-tokens) reads, creates and revokes under the caller's own
-- session, where the policies below apply.
--
-- token_hash is an unsalted SHA-256 hex digest, not a KDF. Bcrypt would embed
-- a per-row salt and make `WHERE token_hash = $1` impossible -- every request
-- would scan the table and run a KDF per row. The work factor buys nothing
-- here anyway: the token is 256 bits from crypto.randomBytes, so there is no
-- dictionary to try and no enumerable space for a rainbow table.

CREATE TABLE mcp_tokens (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name         TEXT NOT NULL DEFAULT 'Claude Code',
  token_hash   TEXT NOT NULL UNIQUE,  -- sha256 hex of the plaintext token
  token_prefix TEXT NOT NULL,         -- first 8 chars of the random part, for display
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  revoked_at   TIMESTAMPTZ
);

-- The UNIQUE constraint on token_hash already indexes the hot lookup path.
CREATE INDEX mcp_tokens_user_id_idx ON mcp_tokens(user_id) WHERE revoked_at IS NULL;

ALTER TABLE mcp_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mcp tokens" ON mcp_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own mcp tokens" ON mcp_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can revoke own mcp tokens" ON mcp_tokens
  FOR UPDATE USING (auth.uid() = user_id);

-- No DELETE policy on purpose: revocation is a soft delete (revoked_at) so
-- last_used_at survives as an audit trail.

-- No GRANTs needed. 004_data_api_grants.sql set ALTER DEFAULT PRIVILEGES in
-- schema public for anon/authenticated/service_role, and migrations run as the
-- role that set them.
