-- Backfill course_unlocks from the spark ledger.
--
-- unlockCourse() in src/lib/sparks/course-access.ts recorded unlocks in
-- localStorage and only synced the *spend* to the DB, so course_unlocks was
-- empty for every user while spark_transactions carried the proof of purchase.
-- Users who cleared storage or switched browsers lost courses they had paid
-- for. The client now writes through POST /api/sparks/unlock-course; this
-- recovers the entitlements bought before that fix.

INSERT INTO public.course_unlocks (user_id, course_id, unlocked_at, unlock_method, spark_cost)
SELECT DISTINCT ON (t.user_id, t.metadata->>'courseId')
       t.user_id,
       t.metadata->>'courseId',
       t.created_at,
       'sparks',
       abs(t.amount)
FROM public.spark_transactions t
WHERE t.tx_type = 'course_unlock'
  AND t.metadata->>'courseId' IS NOT NULL
ORDER BY t.user_id, t.metadata->>'courseId', t.created_at
ON CONFLICT (user_id, course_id) DO NOTHING;
