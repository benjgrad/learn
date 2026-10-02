"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";

// Errors handed back by /auth/confirm and /auth/callback via ?error=
const LINK_ERRORS: Record<string, string> = {
  invalid_link: "That sign-in link is malformed. Request a new code below.",
  expired_link: "That sign-in link has expired or was already used. Request a new code below.",
  auth: "We couldn't complete that sign-in. Request a new code below.",
};

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(() => LINK_ERRORS[searchParams.get("error") ?? ""] ?? "");

  // Where to land after sign-in. The OAuth consent screen sends users here with
  // ?next=/oauth/consent?authorization_id=..., and losing it would strand a
  // pending authorization. Same guard as /auth/confirm: a relative path only,
  // and never protocol-relative.
  const requestedNext = searchParams.get("next");
  const next =
    requestedNext && requestedNext.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/dashboard";

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Populates {{ .RedirectTo }} in the email templates, so one template serves
        // both production and localhost. The code works regardless of this value.
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`,
        shouldCreateUser: true,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setStep("otp");
    }
    setLoading(false);
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "email",
    });

    if (error) {
      setError(error.message);
    } else {
      // The OTP path is same-tab, so it is the one that reliably returns to a
      // pending consent screen -- an emailed link may open in another browser.
      window.location.href = next;
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Sign In</CardTitle>
          <CardDescription>
            Sign in to sync your progress across devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === "otp" ? (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-sm text-muted-foreground">
                  We sent an 8-digit code to <strong>{email}</strong>
                </p>
              </div>
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <Input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]*"
                  maxLength={8}
                  placeholder="00000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  className="text-center text-2xl tracking-[0.3em] font-mono"
                  autoFocus
                  required
                />
                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}
                <Button type="submit" className="w-full" disabled={loading || otp.length !== 8}>
                  {loading ? "Verifying..." : "Verify Code"}
                </Button>
              </form>
              <button
                type="button"
                onClick={() => { setStep("email"); setOtp(""); setError(""); }}
                className="w-full text-sm text-muted-foreground hover:text-foreground"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send Sign-In Code"}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                No password needed. We&apos;ll send a code to your email.
              </p>
            </form>
          )}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              <ArrowLeft className="h-3 w-3" />
              Back to home
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <LoginForm />
    </Suspense>
  );
}
