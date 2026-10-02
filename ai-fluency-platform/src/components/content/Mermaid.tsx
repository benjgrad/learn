"use client";

import { useEffect, useId, useState } from "react";

/** Smallest scale a diagram may shrink to before the frame scrolls instead. */
const MIN_SCALE = 0.75;

/**
 * Mermaid emits width="100%" with a max-width of the natural size, so a wide
 * diagram (a long sequence diagram is ~1800px) shrinks until its labels are
 * unreadable. Let it fill the column, but never below MIN_SCALE of its natural
 * width; past that the wrapper scrolls horizontally.
 */
function readableSize(svg: string) {
  const natural = Number(svg.match(/max-width:\s*([\d.]+)px/)?.[1]);
  if (!natural) return svg;
  return svg.replace(
    /max-width:\s*[\d.]+px;?/,
    `max-width: ${natural}px; min-width: ${Math.round(natural * MIN_SCALE)}px;`
  );
}

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
          setSvg(readableSize(svg));
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
          className="[&_svg]:mx-auto [&_svg]:h-auto"
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
