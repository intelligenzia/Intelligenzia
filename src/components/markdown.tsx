'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownProps {
  content: string;
}

export function Markdown({ content }: MarkdownProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="mb-6 text-3xl font-bold tracking-tight">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="mb-4 mt-10 text-2xl font-semibold tracking-tight">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="mb-3 mt-8 text-xl font-semibold">{children}</h3>
        ),
        h4: ({ children }) => (
          <h4 className="mb-2 mt-6 text-lg font-semibold">{children}</h4>
        ),
        p: ({ children }) => (
          <p className="mb-6 text-base leading-relaxed text-foreground/80">
            {children}
          </p>
        ),
        ul: ({ children }) => (
          <ul className="mb-6 ml-6 list-disc space-y-2">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-6 ml-6 list-decimal space-y-2">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="text-base leading-relaxed text-foreground/80 pl-1">
            {children}
          </li>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            className="font-medium text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
            target={href?.startsWith('http') ? '_blank' : undefined}
            rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
          >
            {children}
          </a>
        ),
        blockquote: ({ children }) => (
          <blockquote className="my-6 border-l-4 border-primary/30 pl-6 italic text-foreground/70">
            {children}
          </blockquote>
        ),
        table: ({ children }) => (
          <div className="my-6 overflow-x-auto rounded-lg border">
            <table className="w-full border-collapse">{children}</table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="border-b bg-muted/50">{children}</thead>
        ),
        th: ({ children }) => (
          <th className="p-3 text-left font-semibold">{children}</th>
        ),
        td: ({ children }) => (
          <td className="border-b p-3 text-foreground/80">{children}</td>
        ),
        strong: ({ children }) => (
          <strong className="font-semibold text-foreground">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic">{children}</em>
        ),
        hr: () => <hr className="my-10 border-border" />,
        code: ({ children, className }) => {
          const isInline = !className;
          if (isInline) {
            return (
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm text-foreground">
                {children}
              </code>
            );
          }
          return (
            <code className={className}>{children}</code>
          );
        },
        pre: ({ children }) => (
          <pre className="my-6 overflow-x-auto rounded-lg bg-muted p-4 font-mono text-sm">
            {children}
          </pre>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
