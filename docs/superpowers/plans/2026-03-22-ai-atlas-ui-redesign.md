# Atlas AI Assistant — UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Atlas AI assistant from 5 separate basic pages into a single polished page with hero banner navigation, markdown rendering, conversations drawer, and guided empty state.

**Architecture:** Single page at `/ai` with state-driven view switching (`activeView`). Custom `AiHeroBanner` component (onClick-based, not Link-based). Chat messages rendered through `react-markdown` with custom themed components. Conversations managed via a Sheet drawer. Existing sub-page logic refactored into view components.

**Tech Stack:** Next.js 16, React 19, TailwindCSS 4, shadcn/ui (Sheet), react-markdown, remark-gfm, react-syntax-highlighter, React Query

**Spec:** `docs/superpowers/specs/2026-03-22-ai-atlas-ui-redesign-design.md`

---

## File Map

### New Files (Create)

| File                                         | Responsibility                                 |
| -------------------------------------------- | ---------------------------------------------- |
| `src/components/ai/ai-hero-banner.tsx`       | Custom hero banner with onClick view switching |
| `src/components/ai/chat-view.tsx`            | Chat view orchestrator (messages + input)      |
| `src/components/ai/empty-state.tsx`          | Welcome screen with suggestion chips           |
| `src/components/ai/message-bubble.tsx`       | Single message renderer (user or assistant)    |
| `src/components/ai/markdown-renderer.tsx`    | Markdown → React with themed components        |
| `src/components/ai/chat-input.tsx`           | Auto-expanding textarea input area             |
| `src/components/ai/conversations-drawer.tsx` | Sheet with conversation list + search          |
| `src/components/ai/insights-view.tsx`        | Refactored insights (from standalone page)     |
| `src/components/ai/favorites-view.tsx`       | Refactored favorites (from standalone page)    |
| `src/components/ai/actions-view.tsx`         | Refactored actions (from standalone page)      |
| `src/components/ai/settings-view.tsx`        | Refactored settings (from standalone page)     |
| `src/components/ai/index.ts`                 | Barrel export                                  |

### Modified Files

| File                                         | Change                                      |
| -------------------------------------------- | ------------------------------------------- |
| `src/app/(dashboard)/(tools)/ai/page.tsx`    | Complete rewrite — single page orchestrator |
| `src/app/(dashboard)/(tools)/ai/loading.tsx` | Update skeleton to match new layout         |

### Deleted Files (after consolidation)

| File                                                | Reason             |
| --------------------------------------------------- | ------------------ |
| `src/app/(dashboard)/(tools)/ai/insights/page.tsx`  | Moved to component |
| `src/app/(dashboard)/(tools)/ai/favorites/page.tsx` | Moved to component |
| `src/app/(dashboard)/(tools)/ai/actions/page.tsx`   | Moved to component |
| `src/app/(dashboard)/(tools)/ai/settings/page.tsx`  | Moved to component |

---

## Task 1: Install Dependencies

**Files:**

- Modify: `package.json`

- [ ] **Step 1: Install markdown rendering packages**

```bash
cd D:/Code/Projetos/OpenSea/OpenSea-APP
npm install react-markdown remark-gfm react-syntax-highlighter
npm install -D @types/react-syntax-highlighter
```

- [ ] **Step 2: Verify installation**

```bash
cd D:/Code/Projetos/OpenSea/OpenSea-APP
node -e "require('react-markdown'); require('remark-gfm'); require('react-syntax-highlighter'); console.log('OK')"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
cd D:/Code/Projetos/OpenSea/OpenSea-APP
git add package.json package-lock.json
git commit -m "chore: add react-markdown, remark-gfm, react-syntax-highlighter for AI chat"
```

---

## Task 2: Markdown Renderer Component

**Files:**

- Create: `src/components/ai/markdown-renderer.tsx`

This is the foundation — all other components depend on it for rich content.

- [ ] **Step 1: Create the markdown renderer**

```tsx
// src/components/ai/markdown-renderer.tsx
'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import {
  oneDark,
  oneLight,
} from 'react-syntax-highlighter/dist/cjs/styles/prism';
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
      {copied ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

export function AiMarkdownRenderer({
  content,
  className,
}: AiMarkdownRendererProps) {
  const { resolvedTheme } = useTheme();
  const syntaxTheme = resolvedTheme === 'dark' ? oneDark : oneLight;

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      className={cn('prose prose-sm dark:prose-invert max-w-none', className)}
      components={{
        // Code blocks
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

        // Tables
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

        // Links
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

        // Blockquotes
        blockquote({ children }) {
          return (
            <blockquote className="border-l-2 border-violet-500 bg-slate-50 dark:bg-slate-800/50 pl-4 py-2 my-3 text-muted-foreground italic">
              {children}
            </blockquote>
          );
        },

        // Lists
        ul({ children }) {
          return <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>;
        },
        ol({ children }) {
          return (
            <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>
          );
        },

        // Paragraphs
        p({ children }) {
          return <p className="my-1.5 leading-relaxed">{children}</p>;
        },

        // Strong
        strong({ children }) {
          return (
            <strong className="font-semibold text-foreground">
              {children}
            </strong>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd D:/Code/Projetos/OpenSea/OpenSea-APP
npx tsc --noEmit src/components/ai/markdown-renderer.tsx 2>&1 | head -20
```

If tsc standalone doesn't work, verify with `npm run build` later in Task 8.

- [ ] **Step 3: Commit**

```bash
cd D:/Code/Projetos/OpenSea/OpenSea-APP
git add src/components/ai/markdown-renderer.tsx
git commit -m "feat(ai): add markdown renderer with syntax highlighting and themed tables"
```

---

## Task 3: Message Bubble Component

**Files:**

- Create: `src/components/ai/message-bubble.tsx`

- [ ] **Step 1: Create the message bubble**

```tsx
// src/components/ai/message-bubble.tsx
'use client';

import { AiMarkdownRenderer } from './markdown-renderer';
import { cn } from '@/lib/utils';
import { Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AiMessage } from '@/types/ai';

interface AiMessageBubbleProps {
  message: AiMessage;
  userInitial?: string;
  onRetry?: () => void;
  hasError?: boolean;
}

export function AiMessageBubble({
  message,
  userInitial = 'U',
  onRetry,
  hasError,
}: AiMessageBubbleProps) {
  const isUser = message.role === 'USER';
  const isLoading = message.contentType === 'LOADING';
  const isToolCall =
    message.role === 'TOOL_CALL' || message.role === 'TOOL_RESULT';

  // Hide system/tool messages from display
  if (message.role === 'SYSTEM' || isToolCall) return null;

  return (
    <div className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}>
      {/* Assistant avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex-shrink-0 flex items-center justify-center">
          <span className="text-white text-xs font-extrabold">A</span>
        </div>
      )}

      {/* Content */}
      <div className={cn('max-w-[640px]', isUser ? 'text-right' : '')}>
        {/* Name + timestamp */}
        <div
          className={cn(
            'flex items-center gap-2 mb-1',
            isUser ? 'justify-end' : 'justify-start'
          )}
        >
          {isUser ? (
            <>
              <span className="text-muted-foreground text-[10px]">
                {new Date(message.createdAt).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <span className="text-muted-foreground text-xs font-semibold">
                Você
              </span>
            </>
          ) : (
            <>
              <span className="text-violet-600 dark:text-violet-400 text-xs font-bold">
                Atlas
              </span>
              <span className="text-muted-foreground text-[10px]">
                {new Date(message.createdAt).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              {message.toolCalls && (
                <span className="bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-[9px] px-2 py-0.5 rounded font-semibold">
                  DADOS REAIS
                </span>
              )}
            </>
          )}
        </div>

        {/* Message content */}
        {isUser ? (
          <div
            className={cn(
              'bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 inline-block text-left text-sm',
              hasError && 'ring-2 ring-rose-500'
            )}
          >
            {message.content}
            {hasError && (
              <div className="mt-2 flex items-center gap-2 text-xs text-rose-200">
                <span>Erro ao enviar.</span>
                {onRetry && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRetry}
                    className="h-auto p-0 text-rose-200 hover:text-white"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Tentar novamente
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Pensando...</span>
          </div>
        ) : (
          <div className="text-sm text-foreground">
            <AiMarkdownRenderer content={message.content ?? ''} />
            {/* Action chips — deferred until function calling engine is implemented (sub-project #2) */}
            {/* Model info */}
            {message.aiModel && message.aiModel !== 'placeholder' && (
              <div className="mt-2 text-muted-foreground text-[9px] flex items-center gap-2">
                <span>{message.aiModel}</span>
                {message.aiLatencyMs && <span>· {message.aiLatencyMs}ms</span>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 flex-shrink-0 flex items-center justify-center">
          <span className="text-slate-600 dark:text-slate-300 text-xs font-semibold">
            {userInitial}
          </span>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd D:/Code/Projetos/OpenSea/OpenSea-APP
git add src/components/ai/message-bubble.tsx
git commit -m "feat(ai): add message bubble component with user/assistant variants"
```

---

## Task 4: Empty State + Chat Input Components

**Files:**

- Create: `src/components/ai/empty-state.tsx`
- Create: `src/components/ai/chat-input.tsx`

- [ ] **Step 1: Create the empty state**

```tsx
// src/components/ai/empty-state.tsx
'use client';

import { Bot } from 'lucide-react';

interface AiEmptyStateProps {
  onSendSuggestion: (text: string) => void;
}

const SUGGESTIONS = [
  { icon: '📦', text: 'Quantos produtos tenho cadastrados?' },
  { icon: '💰', text: 'Resumo financeiro do mês' },
  { icon: '👥', text: 'Funcionários ativos no sistema' },
  { icon: '📋', text: 'Pedidos em aberto' },
  { icon: '📊', text: 'Movimentações de estoque recentes' },
  { icon: '🏢', text: 'Resumo geral da empresa' },
];

export function AiEmptyState({ onSendSuggestion }: AiEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center mb-6 shadow-lg shadow-violet-500/20">
        <Bot className="h-8 w-8 text-white" />
      </div>

      <h2 className="text-xl font-bold text-foreground mb-2">
        Olá! Sou o Atlas.
      </h2>
      <p className="text-muted-foreground text-center max-w-md mb-8">
        Como posso ajudar você hoje? Pergunte sobre seus dados, solicite
        relatórios ou peça ajuda para navegar pelo sistema.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-lg">
        {SUGGESTIONS.map(suggestion => (
          <button
            key={suggestion.text}
            onClick={() => onSendSuggestion(suggestion.text)}
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-slate-800/60 border border-border hover:border-violet-300 dark:hover:border-violet-500/30 hover:bg-violet-50 dark:hover:bg-violet-500/5 transition-colors text-left group"
          >
            <span className="text-base">{suggestion.icon}</span>
            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors line-clamp-2">
              {suggestion.text}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create the chat input**

```tsx
// src/components/ai/chat-input.tsx
'use client';

import { useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Loader2, Paperclip } from 'lucide-react';

interface AiChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isPending: boolean;
}

export function AiChatInput({
  value,
  onChange,
  onSend,
  isPending,
}: AiChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(e.target.value);
      // Auto-resize
      const el = e.target;
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onSend();
      }
    },
    [onSend]
  );

  return (
    <div className="border-t border-border p-4">
      <div className="max-w-[720px] mx-auto">
        <div className="flex items-end gap-2 bg-muted border border-border rounded-xl px-3 py-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground"
            disabled
            title="Anexos (em breve)"
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte algo ao Atlas..."
            disabled={isPending}
            rows={1}
            className="flex-1 bg-transparent border-0 outline-none resize-none text-sm text-foreground placeholder:text-muted-foreground py-1.5 max-h-40"
          />

          <Button
            size="icon"
            onClick={onSend}
            disabled={!value.trim() || isPending}
            className="h-8 w-8 shrink-0 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white shadow-sm"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd D:/Code/Projetos/OpenSea/OpenSea-APP
git add src/components/ai/empty-state.tsx src/components/ai/chat-input.tsx
git commit -m "feat(ai): add empty state with suggestion chips and auto-expanding chat input"
```

---

## Task 5: Chat View Component

**Files:**

- Create: `src/components/ai/chat-view.tsx`

This orchestrates empty state, messages, and input.

- [ ] **Step 1: Create the chat view**

```tsx
// src/components/ai/chat-view.tsx
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiChatService } from '@/services/ai';
import { useAuth } from '@/contexts/auth-context';
import { AiEmptyState } from './empty-state';
import { AiMessageBubble } from './message-bubble';
import { AiChatInput } from './chat-input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import type { AiMessage } from '@/types/ai';

interface AiChatViewProps {
  selectedConversationId: string | null;
  onConversationCreated: (id: string) => void;
}

export function AiChatView({
  selectedConversationId,
  onConversationCreated,
}: AiChatViewProps) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userInitial = user?.name?.charAt(0)?.toUpperCase() ?? 'U';
  const [inputValue, setInputValue] = useState('');
  const [localMessages, setLocalMessages] = useState<AiMessage[]>([]);
  const [failedMessageId, setFailedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversation messages
  const { data: conversationDetail } = useQuery({
    queryKey: ['ai', 'conversation', selectedConversationId],
    queryFn: async () => {
      if (!selectedConversationId) return null;
      return aiChatService.getConversation(selectedConversationId, {
        limit: 100,
      });
    },
    enabled: !!selectedConversationId,
  });

  // Merge server + local messages
  const allMessages = selectedConversationId
    ? [
        ...(conversationDetail?.messages ?? []),
        ...localMessages.filter(
          lm =>
            !conversationDetail?.messages?.some(
              (m: AiMessage) => m.id === lm.id
            )
        ),
      ]
    : localMessages;

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: aiChatService.sendMessage,
    onSuccess: data => {
      setFailedMessageId(null);
      onConversationCreated(data.conversationId);
      setLocalMessages(prev => [
        ...prev.filter(m => m.contentType !== 'LOADING'),
        data.assistantMessage,
      ]);
      queryClient.invalidateQueries({ queryKey: ['ai', 'conversations'] });
      queryClient.invalidateQueries({
        queryKey: ['ai', 'conversation', data.conversationId],
      });
    },
    onError: () => {
      setLocalMessages(prev => prev.filter(m => m.contentType !== 'LOADING'));
      const lastUserMsg = localMessages.findLast(m => m.role === 'USER');
      if (lastUserMsg) setFailedMessageId(lastUserMsg.id);
      toast.error('Erro ao enviar mensagem. Tente novamente.');
    },
  });

  const handleSend = useCallback(
    (overrideContent?: string) => {
      const content = (overrideContent ?? inputValue).trim();
      if (!content || sendMessage.isPending) return;

      setInputValue('');
      setFailedMessageId(null);

      const optimisticUserMsg: AiMessage = {
        id: `temp-${Date.now()}`,
        role: 'USER',
        content,
        contentType: 'TEXT',
        createdAt: new Date().toISOString(),
      };

      const optimisticLoadingMsg: AiMessage = {
        id: `loading-${Date.now()}`,
        role: 'ASSISTANT',
        content: null,
        contentType: 'LOADING',
        createdAt: new Date().toISOString(),
      };

      setLocalMessages(prev => [
        ...prev,
        optimisticUserMsg,
        optimisticLoadingMsg,
      ]);

      sendMessage.mutate({
        conversationId: selectedConversationId ?? undefined,
        content,
      });
    },
    [inputValue, selectedConversationId, sendMessage]
  );

  // Reset local messages when conversation changes
  useEffect(() => {
    setLocalMessages([]);
    setFailedMessageId(null);
  }, [selectedConversationId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages.length]);

  const hasMessages = allMessages.length > 0;

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <ScrollArea className="flex-1">
        {!hasMessages ? (
          <AiEmptyState onSendSuggestion={text => handleSend(text)} />
        ) : (
          <div className="max-w-[720px] mx-auto py-6 px-4 space-y-6">
            {allMessages.map(msg => (
              <AiMessageBubble
                key={msg.id}
                message={msg}
                userInitial={userInitial}
                hasError={msg.id === failedMessageId}
                onRetry={
                  msg.id === failedMessageId
                    ? () => handleSend(msg.content ?? '')
                    : undefined
                }
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      <AiChatInput
        value={inputValue}
        onChange={setInputValue}
        onSend={() => handleSend()}
        isPending={sendMessage.isPending}
      />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd D:/Code/Projetos/OpenSea/OpenSea-APP
git add src/components/ai/chat-view.tsx
git commit -m "feat(ai): add chat view orchestrator with optimistic messages and error handling"
```

---

## Task 6: Hero Banner + Conversations Drawer

**Files:**

- Create: `src/components/ai/ai-hero-banner.tsx`
- Create: `src/components/ai/conversations-drawer.tsx`

- [ ] **Step 1: Create the AI hero banner**

```tsx
// src/components/ai/ai-hero-banner.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Bot,
  MessageSquare,
  Lightbulb,
  Star,
  Activity,
  Settings,
  History,
} from 'lucide-react';

export type AiView = 'chat' | 'insights' | 'favorites' | 'actions' | 'settings';

interface AiHeroBannerProps {
  activeView: AiView;
  onViewChange: (view: AiView) => void;
  onOpenConversations: () => void;
}

const VIEW_BUTTONS: {
  id: AiView;
  label: string;
  icon: React.ElementType;
  gradient: string;
}[] = [
  {
    id: 'chat',
    label: 'Chat',
    icon: MessageSquare,
    gradient: 'from-violet-500 to-violet-600',
  },
  {
    id: 'insights',
    label: 'Insights',
    icon: Lightbulb,
    gradient: 'from-teal-500 to-teal-600',
  },
  {
    id: 'favorites',
    label: 'Favoritos',
    icon: Star,
    gradient: 'from-cyan-500 to-cyan-600',
  },
  {
    id: 'actions',
    label: 'Ações',
    icon: Activity,
    gradient: 'from-emerald-500 to-emerald-600',
  },
  {
    id: 'settings',
    label: 'Configurações',
    icon: Settings,
    gradient: 'from-slate-500 to-slate-600',
  },
];

export function AiHeroBanner({
  activeView,
  onViewChange,
  onOpenConversations,
}: AiHeroBannerProps) {
  return (
    <Card className="relative overflow-hidden p-8 md:p-12 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full opacity-80 -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/10 rounded-full opacity-80 translate-y-1/2 -translate-x-1/2" />

      <div className="relative z-10 max-w-2xl">
        {/* Icon + Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500">
            <Bot className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Atlas
          </h1>
        </div>

        {/* Description */}
        <p className="text-lg text-gray-600 dark:text-white/60 mb-6">
          Assistente inteligente com IA para análise de dados e automação do
          sistema.
        </p>

        {/* Navigation buttons */}
        <div className="flex flex-wrap gap-3">
          {VIEW_BUTTONS.map(btn => {
            const isActive = activeView === btn.id;
            return (
              <Button
                key={btn.id}
                onClick={() => onViewChange(btn.id)}
                className={cn(
                  'gap-2 text-white bg-gradient-to-r hover:opacity-90 transition-all',
                  btn.gradient,
                  isActive
                    ? 'ring-2 ring-white/40 opacity-100'
                    : 'opacity-70 hover:opacity-100'
                )}
              >
                <btn.icon className="h-4 w-4" />
                {btn.label}
              </Button>
            );
          })}

          {/* Conversations drawer trigger */}
          <Button
            variant="outline"
            onClick={onOpenConversations}
            className="gap-2"
          >
            <History className="h-4 w-4" />
            Conversas anteriores
          </Button>
        </div>
      </div>
    </Card>
  );
}
```

- [ ] **Step 2: Create the conversations drawer**

```tsx
// src/components/ai/conversations-drawer.tsx
'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { aiChatService } from '@/services/ai';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Search, Pin, Archive, Loader2 } from 'lucide-react';
import type { AiConversation } from '@/types/ai';

interface AiConversationsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedConversationId: string | null;
  onSelectConversation: (id: string | null) => void;
}

export function AiConversationsDrawer({
  open,
  onOpenChange,
  selectedConversationId,
  onSelectConversation,
}: AiConversationsDrawerProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['ai', 'conversations'],
    queryFn: async () => {
      const response = await aiChatService.listConversations({ limit: 50 });
      return response.conversations;
    },
    enabled: open,
  });

  const archiveMutation = useMutation({
    mutationFn: aiChatService.archiveConversation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai', 'conversations'] });
    },
  });

  const conversations = data ?? [];

  const filtered = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter(
      (c: AiConversation) => c.title?.toLowerCase().includes(q) ?? false
    );
  }, [conversations, search]);

  const handleSelect = (id: string) => {
    onSelectConversation(id);
    onOpenChange(false);
  };

  const handleNew = () => {
    onSelectConversation(null);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[380px] sm:w-[420px] flex flex-col">
        <SheetHeader className="flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <SheetTitle>Conversas</SheetTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {conversations.length} conversa
              {conversations.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button size="sm" onClick={handleNew} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" />
            Nova
          </Button>
        </SheetHeader>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar conversas..."
            className="pl-9"
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-auto -mx-2 px-2 space-y-1">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">
              {search
                ? 'Nenhuma conversa encontrada.'
                : 'Nenhuma conversa ainda.'}
            </p>
          ) : (
            filtered.map((conv: AiConversation) => {
              const isActive = conv.id === selectedConversationId;
              return (
                <button
                  key={conv.id}
                  onClick={() => handleSelect(conv.id)}
                  className={cn(
                    'w-full text-left rounded-lg px-3 py-3 transition-colors group',
                    isActive
                      ? 'bg-violet-100 dark:bg-violet-500/10 border border-violet-300 dark:border-violet-500/25'
                      : 'hover:bg-accent/50 border border-transparent'
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={cn(
                        'text-sm font-medium truncate',
                        isActive ? 'text-foreground' : 'text-muted-foreground'
                      )}
                    >
                      {conv.isPinned && (
                        <Pin className="h-3 w-3 text-violet-500 inline mr-1.5" />
                      )}
                      {conv.title ?? 'Conversa sem título'}
                    </span>
                    {isActive && (
                      <span className="text-[9px] text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-500/15 px-2 py-0.5 rounded-full font-medium">
                        ativa
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground/70">
                    <span>
                      {conv.messageCount} msg
                      {conv.messageCount !== 1 ? 's' : ''}
                    </span>
                    {conv.lastMessageAt && (
                      <span>
                        {formatDistanceToNow(new Date(conv.lastMessageAt), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    )}
                  </div>

                  {/* Archive button on hover */}
                  {!isActive && (
                    <div className="hidden group-hover:flex justify-end mt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-muted-foreground"
                        onClick={e => {
                          e.stopPropagation();
                          archiveMutation.mutate(conv.id);
                        }}
                      >
                        <Archive className="h-3 w-3 mr-1" />
                        Arquivar
                      </Button>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
```

- [ ] **Step 3: Commit**

```bash
cd D:/Code/Projetos/OpenSea/OpenSea-APP
git add src/components/ai/ai-hero-banner.tsx src/components/ai/conversations-drawer.tsx
git commit -m "feat(ai): add hero banner with view switching and conversations drawer"
```

---

## Task 7: Refactor Sub-Views into Components

**Files:**

- Create: `src/components/ai/insights-view.tsx`
- Create: `src/components/ai/favorites-view.tsx`
- Create: `src/components/ai/actions-view.tsx`
- Create: `src/components/ai/settings-view.tsx`

These are extracted from the existing standalone pages with their layout wrappers removed.

- [ ] **Step 1: Create insights-view.tsx**

Copy the content of `src/app/(dashboard)/(tools)/ai/insights/page.tsx` into `src/components/ai/insights-view.tsx` with these changes:

- Rename `AiInsightsPage` → `AiInsightsView`
- Remove the outer `<div className="flex flex-col h-[calc(100vh-4rem)]">` wrapper
- Remove the `<PageActionBar>` component and its import
- Keep the content inside: filters div + insights grid
- Export as named export `AiInsightsView`
- Wrap in `<div className="flex-1 overflow-auto p-6">` directly

- [ ] **Step 2: Create favorites-view.tsx**

Same refactor for `src/app/(dashboard)/(tools)/ai/favorites/page.tsx`:

- Rename → `AiFavoritesView`
- Remove layout wrapper + `PageActionBar`
- Keep filters, create form, favorites list

- [ ] **Step 3: Create actions-view.tsx**

Same refactor for `src/app/(dashboard)/(tools)/ai/actions/page.tsx`:

- Rename → `AiActionsView`
- Remove layout wrapper + `PageActionBar`
- Keep filters + actions list

- [ ] **Step 4: Create settings-view.tsx**

Same refactor for `src/app/(dashboard)/(tools)/ai/settings/page.tsx`:

- Rename → `AiSettingsView`
- Remove layout wrapper + `PageActionBar`
- Remove the save button from the old `PageActionBar` — move it as a floating/inline button at the top of the settings form
- Keep all form logic, mutations, and cards

- [ ] **Step 5: Create barrel export**

```tsx
// src/components/ai/index.ts
export { AiHeroBanner } from './ai-hero-banner';
export { AiChatView } from './chat-view';
export { AiEmptyState } from './empty-state';
export { AiMessageBubble } from './message-bubble';
export { AiMarkdownRenderer } from './markdown-renderer';
export { AiChatInput } from './chat-input';
export { AiConversationsDrawer } from './conversations-drawer';
export { AiInsightsView } from './insights-view';
export { AiFavoritesView } from './favorites-view';
export { AiActionsView } from './actions-view';
export { AiSettingsView } from './settings-view';

export type { AiView } from './ai-hero-banner';
```

- [ ] **Step 6: Commit**

```bash
cd D:/Code/Projetos/OpenSea/OpenSea-APP
git add src/components/ai/
git commit -m "feat(ai): refactor insights, favorites, actions, settings into view components"
```

---

## Task 8: Main Page Orchestrator + Cleanup

**Files:**

- Modify: `src/app/(dashboard)/(tools)/ai/page.tsx` (complete rewrite)
- Modify: `src/app/(dashboard)/(tools)/ai/loading.tsx`
- Delete: `src/app/(dashboard)/(tools)/ai/insights/page.tsx`
- Delete: `src/app/(dashboard)/(tools)/ai/favorites/page.tsx`
- Delete: `src/app/(dashboard)/(tools)/ai/actions/page.tsx`
- Delete: `src/app/(dashboard)/(tools)/ai/settings/page.tsx`

- [ ] **Step 1: Rewrite the main page**

```tsx
// src/app/(dashboard)/(tools)/ai/page.tsx
'use client';

import { useState } from 'react';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  AiHeroBanner,
  AiChatView,
  AiInsightsView,
  AiFavoritesView,
  AiActionsView,
  AiSettingsView,
  AiConversationsDrawer,
} from '@/components/ai';
import type { AiView } from '@/components/ai';

export default function AiPage() {
  const [activeView, setActiveView] = useState<AiView>('chat');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);

  const handleConversationCreated = (id: string) => {
    setSelectedConversationId(id);
  };

  const handleSelectConversation = (id: string | null) => {
    setSelectedConversationId(id);
    // Switch to chat view when selecting a conversation
    if (id !== null) setActiveView('chat');
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <PageActionBar
        breadcrumbItems={[{ label: 'Ferramentas' }, { label: 'Assistente IA' }]}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Hero Banner */}
        <div className="px-6 pt-5">
          <AiHeroBanner
            activeView={activeView}
            onViewChange={setActiveView}
            onOpenConversations={() => setDrawerOpen(true)}
          />
        </div>

        {/* Dynamic content area */}
        <div className="flex-1 flex flex-col min-h-0 mt-4">
          {activeView === 'chat' && (
            <AiChatView
              selectedConversationId={selectedConversationId}
              onConversationCreated={handleConversationCreated}
            />
          )}
          {activeView === 'insights' && <AiInsightsView />}
          {activeView === 'favorites' && <AiFavoritesView />}
          {activeView === 'actions' && <AiActionsView />}
          {activeView === 'settings' && <AiSettingsView />}
        </div>
      </div>

      {/* Conversations Drawer */}
      <AiConversationsDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        selectedConversationId={selectedConversationId}
        onSelectConversation={handleSelectConversation}
      />
    </div>
  );
}
```

- [ ] **Step 2: Update loading skeleton**

```tsx
// src/app/(dashboard)/(tools)/ai/loading.tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function AiLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Action bar skeleton */}
      <div className="h-12 border-b border-border px-6 flex items-center">
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Hero banner skeleton */}
      <div className="px-6 pt-5">
        <Skeleton className="h-52 w-full rounded-xl" />
      </div>

      {/* Chat area skeleton */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
        <Skeleton className="h-16 w-16 rounded-2xl" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
        <div className="grid grid-cols-3 gap-3 mt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-32 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Delete old standalone pages**

```bash
cd D:/Code/Projetos/OpenSea/OpenSea-APP
rm -f "src/app/(dashboard)/(tools)/ai/insights/page.tsx"
rm -f "src/app/(dashboard)/(tools)/ai/favorites/page.tsx"
rm -f "src/app/(dashboard)/(tools)/ai/actions/page.tsx"
rm -f "src/app/(dashboard)/(tools)/ai/settings/page.tsx"
# Remove empty directories
rmdir "src/app/(dashboard)/(tools)/ai/insights" 2>/dev/null || true
rmdir "src/app/(dashboard)/(tools)/ai/favorites" 2>/dev/null || true
rmdir "src/app/(dashboard)/(tools)/ai/actions" 2>/dev/null || true
rmdir "src/app/(dashboard)/(tools)/ai/settings" 2>/dev/null || true
```

- [ ] **Step 4: Verify build compiles**

```bash
cd D:/Code/Projetos/OpenSea/OpenSea-APP
npm run build 2>&1 | tail -30
```

Expected: Build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
cd D:/Code/Projetos/OpenSea/OpenSea-APP
git add -A "src/app/(dashboard)/(tools)/ai/" src/components/ai/
git commit -m "feat(ai): consolidate AI pages into single-page Atlas experience with hero banner"
```

---

## Task 9: Visual Polish + E2E Verification

**Files:**

- Possibly tweak: any component from Tasks 2-8

- [ ] **Step 1: Start dev server and visually verify**

```bash
cd D:/Code/Projetos/OpenSea/OpenSea-APP
npm run dev
```

Open `http://localhost:3000/ai` in the browser. Verify:

1. Hero banner renders with Atlas identity and all navigation buttons
2. Default view shows empty state with suggestion chips
3. Clicking a suggestion chip sends a message
4. Chat messages render with correct styling (user bubble, assistant markdown)
5. View switching works (Chat → Insights → Favorites → Actions → Settings)
6. "Conversas anteriores" opens the drawer
7. Drawer lists conversations and allows switching
8. Dark mode and light mode both look correct

- [ ] **Step 2: Fix any visual issues found**

Address spacing, colors, overflow, or alignment issues. Common things to watch:

- ScrollArea height not filling available space
- Hero banner buttons not wrapping properly on small screens
- Drawer width on mobile
- Markdown tables overflowing container

- [ ] **Step 3: Final commit**

```bash
cd D:/Code/Projetos/OpenSea/OpenSea-APP
git add -A
git commit -m "fix(ai): visual polish and adjustments for Atlas UI"
```

---

## Summary

| Task | Description                        | Est. Files |
| ---- | ---------------------------------- | ---------- |
| 1    | Install dependencies               | 2          |
| 2    | Markdown renderer                  | 1          |
| 3    | Message bubble                     | 1          |
| 4    | Empty state + chat input           | 2          |
| 5    | Chat view orchestrator             | 1          |
| 6    | Hero banner + conversations drawer | 2          |
| 7    | Refactor sub-views + barrel        | 5          |
| 8    | Main page rewrite + cleanup        | 6          |
| 9    | Visual polish + E2E verification   | 0-N        |

**Total: 9 tasks, ~20 files, 9 commits**
