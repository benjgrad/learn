"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { TOOL_SUMMARY } from "@/lib/mcp/tool-summary";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, TriangleAlert } from "lucide-react";

interface Details {
  clientName: string;
  redirectHost: string;
  scopes: string[];
}

function ConsentScreen() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const authorizationId = searchParams.get("authorization_id");

  const [details, setDetails] = useState<Details | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const [deciding, setDeciding] = useState(false);

  // Not signed in: send them through login carrying the authorization_id, or
  // the pending authorization is stranded with no way back to it.
  useEffect(() => {
    if (authLoading || user || !authorizationId) return;
    const back = `/oauth/consent?authorization_id=${encodeURIComponent(authorizationId)}`;
    router.replace(`/auth/login?next=${encodeURIComponent(back)}`);
  }, [authLoading, user, authorizationId, router]);

  useEffect(() => {
    if (authLoading || !user || !authorizationId) return;
    let active = true;

    (async () => {
      const supabase = createClient();
      const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(authorizationId);
      if (!active) return;

      if (error) {
        // GoTrue expires a pending authorization after 10 minutes, and a
        // first-time user has to receive an email and type an 8-digit code
        // inside that window. Say so plainly instead of showing a raw error.
        setExpired(true);
        return;
      }

      // Already consented to these scopes: GoTrue returns only a redirect_url
      // and does not follow it for us. Without this the second connection
      // attempt renders a blank page forever.
      if (data && "redirect_url" in data && data.redirect_url) {
        window.location.assign(data.redirect_url);
        return;
      }

      if (data && "client" in data) {
        let redirectHost = data.redirect_uri;
        try {
          redirectHost = new URL(data.redirect_uri).host;
        } catch {
          // Fall back to the raw value rather than hiding it.
        }
        setDetails({
          clientName: data.client.name || "An application",
          redirectHost,
          scopes: (data.scope ?? "").split(/\s+/).filter(Boolean),
        });
      }
    })();

    return () => {
      active = false;
    };
  }, [authLoading, user, authorizationId]);

  const decide = useCallback(
    async (approve: boolean) => {
      if (!authorizationId) return;
      setDeciding(true);
      setError(null);

      const supabase = createClient();
      const { data, error } = approve
        ? await supabase.auth.oauth.approveAuthorization(authorizationId, {
            skipBrowserRedirect: true,
          })
        : await supabase.auth.oauth.denyAuthorization(authorizationId, {
            skipBrowserRedirect: true,
          });

      if (error || !data?.redirect_url) {
        setError(error?.message ?? "Could not complete this request. Try connecting again.");
        setDeciding(false);
        return;
      }
      window.location.assign(data.redirect_url);
    },
    [authorizationId]
  );

  if (!authorizationId) {
    return (
      <Notice
        title="Nothing to authorize"
        body="This page is opened by an application asking for access. Start the connection from that application."
      />
    );
  }

  if (expired) {
    return (
      <Notice
        title="This request expired"
        body="Authorization requests are valid for 10 minutes. Go back to your application and connect again — you are already signed in, so it will be quick this time."
      />
    );
  }

  if (authLoading || !user || !details) {
    return <Card className="w-full max-w-md"><CardContent className="py-12 text-center text-muted-foreground">Loading…</CardContent></Card>;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl">{details.clientName} wants access</CardTitle>
        <CardDescription>
          It is asking to read your Palestra data as <strong>{user.email}</strong>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <p className="mb-2 text-sm font-medium">It will be able to read</p>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {TOOL_SUMMARY.map((line) => (
              <li key={line}>• {line}</li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-muted-foreground">
            It cannot change anything, and it cannot see your password or payment details.
          </p>
        </div>

        <div className="flex items-start gap-2 rounded-md border p-3 text-sm">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-muted-foreground">
            After you approve, you will be sent to <strong>{details.redirectHost}</strong>. Only
            continue if you started this from an application you trust.
          </p>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" disabled={deciding} onClick={() => decide(false)}>
            Deny
          </Button>
          <Button className="flex-1" disabled={deciding} onClick={() => decide(true)}>
            {deciding ? "Working…" : "Allow access"}
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          You can revoke this at any time from Settings.
        </p>
      </CardContent>
    </Card>
  );
}

function Notice({ title, body }: { title: string; body: string }) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-center text-sm text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}

export default function ConsentPage() {
  return (
    <Suspense fallback={null}>
      <ConsentScreen />
    </Suspense>
  );
}
