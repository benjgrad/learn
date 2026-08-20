-- Postgres grants EXECUTE to PUBLIC on every newly created function, so the
-- GRANTs in 004 did not actually restrict anything: `anon` inherited execute
-- rights via PUBLIC. These are all SECURITY DEFINER and therefore bypass RLS —
-- an unauthenticated caller could POST /rest/v1/rpc/earn_sparks and mint sparks.
--
-- This gap also exists on the hosted project; it matters more here because the
-- Data API is exposed on a public hostname.
--
-- NOTE (not fixed here, needs a product decision): these functions take
-- p_user_id as a parameter and do not check it against auth.uid(), so any
-- signed-in user can still act on another user's account. Adding the check
-- would also affect the Stripe webhook path, which calls them as service_role
-- where auth.uid() is null.

REVOKE EXECUTE ON FUNCTION public.earn_sparks        FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.spend_sparks       FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_streak      FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_ai_usage FROM PUBLIC;

-- Signup trigger; called by the auth system as its owner, never over the API.
REVOKE EXECUTE ON FUNCTION public.handle_new_user FROM PUBLIC;

-- Re-assert the intended grants (REVOKE ... FROM PUBLIC does not touch these).
GRANT EXECUTE ON FUNCTION public.earn_sparks        TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.spend_sparks       TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_streak      TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.increment_ai_usage TO authenticated, service_role;

-- Keep future functions from re-opening the same hole.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
