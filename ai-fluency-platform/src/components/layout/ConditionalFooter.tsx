"use client";

import { usePathname } from "next/navigation";
import { Footer } from "./Footer";

/**
 * The lesson route renders its own <Footer /> inside the content column so the
 * sticky sidebar's containing block reaches the bottom of the document. A sticky
 * element is clamped to its parent's box, so a footer sitting *outside* that
 * parent leaves the sidebar unpinned by exactly the footer's height at the end
 * of the scroll. Suppress the global footer there to avoid rendering two.
 */
export function ConditionalFooter() {
  const pathname = usePathname();
  if (pathname?.startsWith("/learn/")) return null;
  return <Footer />;
}
