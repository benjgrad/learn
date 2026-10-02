import { createClient } from "@/lib/supabase/server";
import { getEffectiveConfig } from "@/lib/sparks/config";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("course_unlocks")
    .select("course_id, unlocked_at, unlock_method, spark_cost")
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const unlocks = (data ?? []).map(
    (row: {
      course_id: string;
      unlocked_at: string;
      unlock_method: string;
      spark_cost: number;
    }) => ({
      courseId: row.course_id,
      unlockedAt: row.unlocked_at,
      unlockMethod: row.unlock_method,
      sparkCost: row.spark_cost,
    })
  );

  return NextResponse.json({ unlocks });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { courseId, reconcileOnly } = body;

  if (!courseId) {
    return NextResponse.json({ error: "Missing courseId" }, { status: 400 });
  }

  // Price the course here rather than trusting the client's `sparkCost` --
  // otherwise a hand-rolled request could unlock anything for nothing.
  const config = getEffectiveConfig(user.email);
  const sparkCost = config.freeCourses.includes(courseId)
    ? 0
    : config.coursePrices[courseId] ?? 0;

  if (sparkCost === 0) {
    // Free courses need no entitlement row -- access is granted by config.
    return NextResponse.json({ success: true, free: true });
  }

  // Check if already unlocked
  const { data: existing } = await supabase
    .from("course_unlocks")
    .select("course_id")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ success: true, alreadyUnlocked: true });
  }

  const idempotencyKey = `${user.id}:course_unlock:${courseId}`;

  // `reconcileOnly` backfills an entitlement the user has already paid for --
  // it must never spend. Legacy unlocks lived in localStorage, and the sync
  // that pushes them up runs unattended on page load; charging there would
  // debit someone for a course they are already holding.

  // Was this unlock already paid for? spend_sparks reports a replayed
  // idempotency key as success=false, indistinguishable from an empty wallet,
  // so check the ledger first. This is the case that stranded users whose
  // unlock lived only in localStorage: charged once, entitlement never
  // written, and every retry rejected as "insufficient".
  const { data: priorTx } = await supabase
    .from("spark_transactions")
    .select("id, balance_after")
    .eq("user_id", user.id)
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (reconcileOnly && !priorTx) {
    return NextResponse.json({
      success: false,
      error: "No prior purchase found for this course",
    });
  }

  let newBalance: number;

  if (priorTx) {
    const { data: wallet } = await supabase
      .from("spark_wallets")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle();
    newBalance = wallet?.balance ?? priorTx.balance_after ?? 0;
  } else {
    const { data: spendResult, error: spendError } = await supabase.rpc("spend_sparks", {
      p_user_id: user.id,
      p_tx_type: "course_unlock",
      p_amount: sparkCost,
      p_idempotency_key: idempotencyKey,
      p_metadata: { courseId },
    });

    if (spendError) {
      return NextResponse.json({ error: spendError.message }, { status: 500 });
    }

    const result = spendResult?.[0] ?? { success: false, new_balance: 0 };

    if (!result.success) {
      return NextResponse.json({
        success: false,
        newBalance: result.new_balance,
        error: "Insufficient sparks",
      });
    }

    newBalance = result.new_balance;
  }

  // Record the unlock. `ignoreDuplicates` keeps a concurrent second request
  // from failing on the (user_id, course_id) unique constraint.
  const { error: unlockError } = await supabase
    .from("course_unlocks")
    .upsert(
      {
        user_id: user.id,
        course_id: courseId,
        unlock_method: "sparks",
        spark_cost: sparkCost,
      },
      { onConflict: "user_id,course_id", ignoreDuplicates: true }
    );

  if (unlockError) {
    return NextResponse.json({ error: unlockError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    newBalance,
  });
}
