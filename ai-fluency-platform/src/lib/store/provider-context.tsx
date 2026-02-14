"use client";

import { createContext, useContext, useEffect, useState } from "react";

export const PROVIDERS = ["claude-code", "codex", "cline", "gemini"] as const;
export type ProviderId = (typeof PROVIDERS)[number];

export const PROVIDER_DISPLAY_NAMES: Record<ProviderId, string> = {
  "claude-code": "Claude Code",
  codex: "Codex",
  cline: "Cline",
  gemini: "Gemini",
};

const STORAGE_KEY = "aif_provider";
const DEFAULT_PROVIDER: ProviderId = "claude-code";

interface ProviderContextValue {
  provider: ProviderId;
  setProvider: (p: ProviderId) => void;
}

const ProviderContext = createContext<ProviderContextValue>({
  provider: DEFAULT_PROVIDER,
  setProvider: () => {},
});

export function ProviderProvider({ children }: { children: React.ReactNode }) {
  const [provider, setProviderState] = useState<ProviderId>(DEFAULT_PROVIDER);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && PROVIDERS.includes(stored as ProviderId)) {
        setProviderState(stored as ProviderId);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  const setProvider = (p: ProviderId) => {
    setProviderState(p);
    try {
      localStorage.setItem(STORAGE_KEY, p);
    } catch {
      // localStorage unavailable
    }
  };

  return (
    <ProviderContext.Provider value={{ provider, setProvider }}>
      {children}
    </ProviderContext.Provider>
  );
}

export function useProvider() {
  return useContext(ProviderContext);
}
