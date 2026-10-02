"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase/client";
import { TOOL_SUMMARY } from "@/lib/mcp/tool-summary";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Check, Copy, Loader2 } from "lucide-react";

const MCP_URL = "https://learning.gradyserver.com/api/mcp";
const SETUP_COMMAND = `claude mcp add --transport http palestra ${MCP_URL}`;

const TOOL_DETAIL = [
  ["get_progress", "where you left off, completion counts, XP, streaks, what's due"],
  ["list_curriculum", "the course catalogue, or one course's lessons with completion state"],
  ["get_lesson", "the full text of any lesson, optionally with your past answers"],
  ["get_review_questions", "quiz questions with your spaced-repetition state"],
] as const;

interface Grant {
  clientId: string;
  clientName: string;
  scopes: string[];
  grantedAt: string | null;
}

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [grants, setGrants] = useState<Grant[]>([]);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/auth/login");
  }, [loading, user, router]);

  // `fetching` starts true and every setState sits behind the await, so the
  // mount path renders once. The reload after a revoke is covered by that row's
  // own "Disconnecting…" state.
  const load = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.oauth.listGrants();
    if (error) {
      setError("Could not load connected applications.");
    } else {
      setError(null);
      setGrants(
        (data ?? []).map((g) => ({
          clientId: g.client.id,
          clientName: g.client.name || g.client.id,
          scopes: g.scopes ?? [],
          grantedAt: g.granted_at ?? null,
        }))
      );
    }
    setFetching(false);
  }, []);

  useEffect(() => {
    if (user) load();
  }, [user, load]);

  const revoke = async (clientId: string, clientName: string) => {
    if (!confirm(`Disconnect ${clientName}? It will lose access within a minute.`)) return;
    setRevoking(clientId);
    const supabase = createClient();
    const { error } = await supabase.auth.oauth.revokeGrant({ clientId });
    if (error) setError(`Could not disconnect ${clientName}.`);
    else await load();
    setRevoking(null);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(SETUP_COMMAND);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading || !user) return null;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-1 text-3xl font-bold">Settings</h1>
      <p className="mb-8 text-muted-foreground">Signed in as {user.email}</p>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Connect an AI assistant</CardTitle>
          <CardDescription>
            Give Claude — or any MCP client — read access to your Palestra progress, so it can
            quiz you, explain a lesson you are stuck on, or tell you what is due.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <code className="flex-1 overflow-x-auto rounded-md bg-muted px-3 py-2 text-sm">
              {SETUP_COMMAND}
            </code>
            <Button variant="outline" size="icon" onClick={copy} aria-label="Copy command">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            No token to paste. Your client opens a browser, you approve the request, and that is
            it.
          </p>

          <Separator />

          <div>
            <p className="mb-2 text-sm font-medium">What a connected client can read</p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {TOOL_DETAIL.map(([tool, what]) => (
                <li key={tool}>
                  <code className="text-xs">{tool}</code> — {what}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-sm text-muted-foreground">
              Read-only: nothing it does can change your progress or your account.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connected applications</CardTitle>
          <CardDescription>
            Applications you have granted access. Disconnecting one cuts it off within a minute.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

          {fetching ? (
            <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : grants.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">
              Nothing connected yet. Run the command above to connect your first client.
            </p>
          ) : (
            <ul className="divide-y">
              {grants.map((grant) => (
                <li key={grant.clientId} className="flex items-center justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{grant.clientName}</p>
                    <p className="text-sm text-muted-foreground">
                      {grant.grantedAt
                        ? `Connected ${new Date(grant.grantedAt).toLocaleDateString()}`
                        : "Connected"}
                      {grant.scopes.length > 0 && ` · ${grant.scopes.join(", ")}`}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={revoking === grant.clientId}
                    onClick={() => revoke(grant.clientId, grant.clientName)}
                  >
                    {revoking === grant.clientId ? "Disconnecting…" : "Disconnect"}
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <p className="mt-4 text-xs text-muted-foreground">
            Access is granted per application. Each one sees only your own data — {TOOL_SUMMARY.length}{" "}
            categories in total, all read-only.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
