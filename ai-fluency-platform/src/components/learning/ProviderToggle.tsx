"use client";

import {
  useProvider,
  PROVIDERS,
  PROVIDER_DISPLAY_NAMES,
} from "@/lib/store/provider-context";
import { Badge } from "@/components/ui/badge";

export function ProviderToggle() {
  const { provider, setProvider } = useProvider();

  return (
    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border pb-3 mb-6 pt-2">
      <p className="text-xs text-muted-foreground mb-2">
        Your tool — tips and examples adapt to your selection:
      </p>
      <div className="flex flex-wrap gap-2">
        {PROVIDERS.map((id) => (
          <button key={id} onClick={() => setProvider(id)}>
            <Badge variant={provider === id ? "default" : "outline"}>
              {PROVIDER_DISPLAY_NAMES[id]}
            </Badge>
          </button>
        ))}
      </div>
    </div>
  );
}
