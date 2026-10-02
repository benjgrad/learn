"use client";

import { useEffect, useId, useState } from "react";

function isDarkMode() {
  return document.documentElement.classList.contains("dark");
}

/**
 * Renders a ```mermaid fenced block. Mermaid touches the DOM, so it is loaded
 * lazily in the browser and never during server rendering. Parse errors fall
 * back to the diagram source so a typo never blanks out a lesson.
 */
export function Mermaid({ chart }: { chart: string }) {
  const id = `mermaid-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(isDarkMode());
    const observer = new MutationObserver(() => setDark(isDarkMode()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { default: mermaid } = await import("mermaid");
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: dark ? "dark" : "neutral",
          fontFamily: "inherit",
        });
        const { svg } = await mermaid.render(`${id}-${dark ? "d" : "l"}`, chart.trim());
        if (!cancelled) {
          setSvg(svg);
          setFailed(false);
        }
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chart, dark, id]);

  if (failed) {
    return (
      <pre>
        <code>{chart}</code>
      </pre>
    );
  }

  return (
    <div className="not-prose my-6 overflow-x-auto rounded-lg border border-border bg-card p-4">
      {svg ? (
        <div
          className="mx-auto w-fit [&_svg]:max-w-none"
          role="img"
          aria-label="Diagram"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <div className="h-24 animate-pulse rounded bg-muted" aria-label="Loading diagram" />
      )}
    </div>
  );
}
