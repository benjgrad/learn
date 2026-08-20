-- Expose the public schema through the Data API (PostgREST).
--
-- The hosted project predated Supabase's change to stop auto-granting the API
-- roles on new public-schema objects, so it never needed explicit GRANTs. A
-- fresh local stack does: without these, every request fails with
-- "permission denied for table <name>" (42501) even though RLS would allow it.
--
-- Safe as a blanket grant because all 18 public tables have RLS enabled with
-- policies — the GRANT lets the roles reach the table, RLS decides the rows.

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public
  TO anon, authenticated, service_role;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public
  TO anon, authenticated, service_role;

-- SECURITY DEFINER helpers the API routes call via .rpc() under the caller's
-- session (role = authenticated). Deliberately not granted to anon.
-- handle_new_user() is the signup trigger and is granted to nobody.
GRANT EXECUTE ON FUNCTION public.earn_sparks       TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.spend_sparks      TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_streak     TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.increment_ai_usage TO authenticated, service_role;

-- Keep future migrations from reintroducing the same gap.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated, service_role;
