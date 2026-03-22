// src/components/ai/markdown-renderer.tsx
'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useTheme } from 'next-themes';
import { Check, Copy } from 'lucide-react';

interface AiMarkdownRendererProps {
  content: string;
  className?: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 p-1.5 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

export function AiMarkdownRenderer({ content, className }: AiMarkdownRendererProps) {
  const { resolvedTheme } = useTheme();
  const syntaxTheme = resolvedTheme === 'dark' ? oneDark : oneLight;

  return (
    <div className={cn('prose prose-sm dark:prose-invert max-w-none', className)}>
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ className: codeClassName, children, ...props }) {
          const match = /language-(\w+)/.exec(codeClassName || '');
          const codeString = String(children).replace(/\n$/, '');

          if (match) {
            return (
              <div className="relative group my-3">
                <CopyButton text={codeString} />
                <SyntaxHighlighter
                  style={syntaxTheme}
                  language={match[1]}
                  PreTag="div"
                  className="!rounded-lg !text-xs"
                >
                  {codeString}
                </SyntaxHighlighter>
              </div>
            );
          }

          return (
            <code
              className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-violet-700 dark:text-violet-300 text-xs"
              {...props}
            >
              {children}
            </code>
          );
        },
        table({ children }) {
          return (
            <div className="my-3 overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-xs">{children}</table>
            </div>
          );
        },
        thead({ children }) {
          return (
            <thead className="bg-slate-100 dark:bg-slate-700/50 border-b border-border">
              {children}
            </thead>
          );
        },
        th({ children }) {
          return (
            <th className="px-3 py-2 text-left font-semibold text-muted-foreground uppercase tracking-wider text-[10px]">
              {children}
            </th>
          );
        },
        td({ children }) {
          return (
            <td className="px-3 py-2 border-b border-border/50 text-foreground">
              {children}
            </td>
          );
        },
        a({ children, href }) {
          return (
            <a
              href={href}
              className="text-violet-600 dark:text-violet-400 underline hover:opacity-80"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          );
        },
        blockquote({ children }) {
          return (
            <blockquote className="border-l-2 border-violet-500 bg-slate-50 dark:bg-slate-800/50 pl-4 py-2 my-3 text-muted-foreground italic">
              {children}
            </blockquote>
          );
        },
        ul({ children }) {
          return <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>;
        },
        ol({ children }) {
          return <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>;
        },
        p({ children }) {
          return <p className="my-1.5 leading-relaxed">{children}</p>;
        },
        strong({ children }) {
          return <strong className="font-semibold text-foreground">{children}</strong>;
        },
      }}
    >
      {content}
    </ReactMarkdown>
    </div>
  );
}
