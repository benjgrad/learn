-- Drop the personal-access-token system.
--
-- The MCP endpoint is now an OAuth 2.1 protected resource: clients register
-- dynamically with GoTrue's authorization server and users grant access through
-- the consent screen at /oauth/consent, so hand-minted `palestra_mcp_*` bearer
-- tokens have no remaining role. Grants are managed through GoTrue
-- (auth.oauth_clients / auth.oauth_authorizations), not here.
--
-- 007_mcp_tokens.sql stays in history: it is recorded as applied, and removing
-- it would desynchronize local migration state from the live database.

DROP TABLE IF EXISTS public.mcp_tokens;
