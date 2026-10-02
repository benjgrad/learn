import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const VALID_TYPES: EmailOtpType[] = [
  "email",
  "signup",
  "magiclink",
  "recovery",
  "invite",
  "email_change",
];

// Email links land here rather than /auth/callback. Verifying a token_hash works from
// any browser; the PKCE ?code= path only works in the browser that started the sign-in,
// which is never the case when the link is opened from a mail app.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/dashboard";

  if (!tokenHash || !type || !VALID_TYPES.includes(type)) {
    redirect("/auth/login?error=invalid_link");
  }

  const supabase = await createClient();
  // token_hash must be sent alone - GoTrue rejects it alongside email/phone/redirect_to.
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

  if (error) {
    redirect("/auth/login?error=expired_link");
  }

  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
}
