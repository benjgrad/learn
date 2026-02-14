"use client";

import { useState, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  streamAIResponse,
  RateLimitError,
  getLastRemainingUses,
} from "@/lib/ai-client";

interface PendingRequest {
  endpoint: string;
  body: Record<string, unknown>;
  onChunk: (text: string) => void;
  onDone?: () => void;
}

export function useAIRequest() {
  const { user } = useAuth();
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  const [rateLimitHit, setRateLimitHit] = useState(false);
  const [remaining, setRemaining] = useState(5);
  const [limit, setLimit] = useState(5);
  const pendingRef = useRef<PendingRequest | null>(null);

  const executeRequest = useCallback(
    async (
      endpoint: string,
      body: Record<string, unknown>,
      onChunk: (text: string) => void,
      onDone?: () => void
    ) => {
      try {
        await streamAIResponse(endpoint, body, onChunk, onDone);
        // Update remaining from last response headers
        const r = getLastRemainingUses();
        if (r !== null) {
          setRemaining(r);
        }
      } catch (err) {
        if (err instanceof RateLimitError) {
          setRateLimitHit(true);
          setLimit(err.limit);
          setRemaining(0);
          throw err;
        }
        throw err;
      }
    },
    []
  );

  const requestAI = useCallback(
    async (
      endpoint: string,
      body: Record<string, unknown>,
      onChunk: (text: string) => void,
      onDone?: () => void
    ) => {
      setRateLimitHit(false);

      if (!user) {
        // Anonymous user: show sign-in prompt, stash request
        pendingRef.current = { endpoint, body, onChunk, onDone };
        const r = getLastRemainingUses();
        if (r !== null) {
          setRemaining(r);
          setLimit(5);
        }
        setShowSignInPrompt(true);
        return;
      }

      // Authenticated user: call directly
      await executeRequest(endpoint, body, onChunk, onDone);
    },
    [user, executeRequest]
  );

  const continueAsAnonymous = useCallback(async () => {
    setShowSignInPrompt(false);
    const pending = pendingRef.current;
    if (!pending) return;
    pendingRef.current = null;
    await executeRequest(
      pending.endpoint,
      pending.body,
      pending.onChunk,
      pending.onDone
    );
  }, [executeRequest]);

  const dismissSignInPrompt = useCallback(() => {
    setShowSignInPrompt(false);
    pendingRef.current = null;
  }, []);

  return {
    requestAI,
    showSignInPrompt,
    rateLimitHit,
    remaining,
    limit,
    continueAsAnonymous,
    dismissSignInPrompt,
  };
}
