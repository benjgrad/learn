"use client";

import { isValidElement, type ReactElement } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Mermaid } from "./Mermaid";

type CodeElement = ReactElement<{ className?: string; children?: React.ReactNode }>;

const components: Components = {
  table: ({ children, ...props }) => (
    <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
      <table {...props}>{children}</table>
    </div>
  ),
  pre: ({ children, ...props }) => {
    const code = children as CodeElement;
    if (isValidElement(code) && code.props.className?.includes("language-mermaid")) {
      return <Mermaid chart={String(code.props.children ?? "")} />;
    }
    return <pre {...props}>{children}</pre>;
  },
};

/**
 * The one markdown renderer for lesson content. `math` enables KaTeX; it is
 * opt-in because remark-math treats paired dollar signs ("$100 and $200") as
 * an equation, which would mangle prices in practice questions.
 */
export function LessonMarkdown({ children, math = false }: { children: string; math?: boolean }) {
  return (
    <ReactMarkdown
      remarkPlugins={math ? [remarkGfm, remarkMath] : [remarkGfm]}
      rehypePlugins={math ? [rehypeKatex] : []}
      components={components}
    >
      {children}
    </ReactMarkdown>
  );
}
