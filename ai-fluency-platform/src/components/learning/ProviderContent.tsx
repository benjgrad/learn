"use client";

import {
  useProvider,
  PROVIDER_DISPLAY_NAMES,
  type ProviderId,
} from "@/lib/store/provider-context";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";

const markdownComponents: Components = {
  table: ({ children, ...props }) => (
    <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
      <table {...props}>{children}</table>
    </div>
  ),
};

interface ProviderContentProps {
  context?: string;
  providers: Partial<Record<ProviderId, string>>;
}

export function ProviderContent({ context, providers }: ProviderContentProps) {
  const { provider } = useProvider();

  const content = providers[provider];
  const availableProviders = Object.keys(providers) as ProviderId[];

  let displayContent = content;
  let fallbackNote: string | null = null;

  if (!displayContent && availableProviders.length > 0) {
    const fallbackProvider = availableProviders[0];
    displayContent = providers[fallbackProvider];
    fallbackNote = `Content for ${PROVIDER_DISPLAY_NAMES[provider]} is not yet available for this section. Showing ${PROVIDER_DISPLAY_NAMES[fallbackProvider]} as a reference.`;
  }

  if (!displayContent) return null;

  return (
    <div className="my-6 rounded-lg border border-border bg-muted/30 p-4">
      {context && (
        <div className="mb-4">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {context}
          </ReactMarkdown>
        </div>
      )}

      {fallbackNote && (
        <p className="text-sm text-muted-foreground italic mb-3">
          {fallbackNote}
        </p>
      )}

      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
          {PROVIDER_DISPLAY_NAMES[content ? provider : (availableProviders[0] ?? provider)]}
        </span>
      </div>

      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {displayContent}
      </ReactMarkdown>
    </div>
  );
}
