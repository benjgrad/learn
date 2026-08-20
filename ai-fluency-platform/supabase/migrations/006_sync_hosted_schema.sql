-- Tables that exist on the hosted project but were never captured in a
-- migration — created directly against the cloud database (dashboard/SQL
-- editor), so a stack built only from 001-003 is missing them.
--
-- The app depends on all three: /api/user-data/xp reads user_xp, and
-- /api/user-data/quiz-answer reads quiz_sessions and quiz_question_history.
--
-- DDL extracted verbatim from `supabase db dump --linked` against
-- sqzrnhfddgejemjxknky so local matches production exactly. Columns of the
-- other 18 tables, plus all functions and types, were verified identical.
--
-- Grants come from 004's ALTER DEFAULT PRIVILEGES; RLS policies are the
-- hosted project's own.

CREATE TABLE IF NOT EXISTS "public"."quiz_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "quiz_date" "date" NOT NULL,
    "questions_answered" integer DEFAULT 0 NOT NULL,
    "correct_count" integer DEFAULT 0 NOT NULL,
    "xp_earned" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);



CREATE TABLE IF NOT EXISTS "public"."quiz_question_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "question_id" "text" NOT NULL,
    "last_seen" "date" NOT NULL,
    "next_due" "date" NOT NULL,
    "box" integer DEFAULT 0 NOT NULL,
    "correct_streak" integer DEFAULT 0 NOT NULL,
    "total_seen" integer DEFAULT 0 NOT NULL,
    "total_correct" integer DEFAULT 0 NOT NULL
);



CREATE TABLE IF NOT EXISTS "public"."user_xp" (
    "user_id" "uuid" NOT NULL,
    "total_xp" integer DEFAULT 0 NOT NULL,
    "daily_streak" integer DEFAULT 0 NOT NULL,
    "last_quiz_date" "date",
    "longest_streak" integer DEFAULT 0 NOT NULL,
    "provider" "text" DEFAULT 'claude-code'::"text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);



ALTER TABLE ONLY "public"."quiz_sessions"
    ADD CONSTRAINT "quiz_sessions_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."quiz_sessions"
    ADD CONSTRAINT "quiz_sessions_user_id_quiz_date_key" UNIQUE ("user_id", "quiz_date");

ALTER TABLE ONLY "public"."quiz_sessions"
    ADD CONSTRAINT "quiz_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."quiz_question_history"
    ADD CONSTRAINT "quiz_question_history_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."quiz_question_history"
    ADD CONSTRAINT "quiz_question_history_user_id_question_id_key" UNIQUE ("user_id", "question_id");

ALTER TABLE ONLY "public"."quiz_question_history"
    ADD CONSTRAINT "quiz_question_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."user_xp"
    ADD CONSTRAINT "user_xp_pkey" PRIMARY KEY ("user_id");

ALTER TABLE ONLY "public"."user_xp"
    ADD CONSTRAINT "user_xp_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;

CREATE INDEX "idx_quiz_sessions_user" ON "public"."quiz_sessions" USING "btree" ("user_id");

CREATE INDEX "idx_quiz_question_history_due" ON "public"."quiz_question_history" USING "btree" ("user_id", "next_due");

CREATE INDEX "idx_quiz_question_history_user" ON "public"."quiz_question_history" USING "btree" ("user_id");

CREATE POLICY "Users can insert own quiz sessions" ON "public"."quiz_sessions" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));

CREATE POLICY "Users can update own quiz sessions" ON "public"."quiz_sessions" FOR UPDATE USING (("auth"."uid"() = "user_id"));

CREATE POLICY "Users can view own quiz sessions" ON "public"."quiz_sessions" FOR SELECT USING (("auth"."uid"() = "user_id"));

CREATE POLICY "Users can insert own question history" ON "public"."quiz_question_history" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));

CREATE POLICY "Users can update own question history" ON "public"."quiz_question_history" FOR UPDATE USING (("auth"."uid"() = "user_id"));

CREATE POLICY "Users can view own question history" ON "public"."quiz_question_history" FOR SELECT USING (("auth"."uid"() = "user_id"));

CREATE POLICY "Users can insert own xp" ON "public"."user_xp" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));

CREATE POLICY "Users can update own xp" ON "public"."user_xp" FOR UPDATE USING (("auth"."uid"() = "user_id"));

CREATE POLICY "Users can view own xp" ON "public"."user_xp" FOR SELECT USING (("auth"."uid"() = "user_id"));

ALTER TABLE "public"."quiz_sessions" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."quiz_question_history" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "public"."user_xp" ENABLE ROW LEVEL SECURITY;
