# Atlas AI Assistant — UI Redesign Spec

## Overview

Redesign the AI assistant interface ("Atlas") from a basic chat page into a polished, unified experience with rich content rendering, proper navigation, and an empty state that guides user discovery.

**Current state**: 5 separate pages (`/ai`, `/ai/insights`, `/ai/favorites`, `/ai/actions`, `/ai/settings`) with basic styling, no markdown rendering, no navigation between sub-pages, and a bland empty state.

**Target state**: Single page (`/ai`) with hero banner navigation, dynamic content views, drawer for conversation management, markdown rendering with rich responses, and a guided empty state.

## Architecture

### Page Structure

```
/ai (single page)
├── PageActionBar (breadcrumbs: Ferramentas / Assistente IA)
├── PageHeroBanner (Atlas identity + navigation buttons)
│   ├── Icon: gradient violet→cyan with "A" or Bot icon
│   ├── Title: "Atlas"
│   ├── Description: "Assistente inteligente com IA para análise de dados e automação do sistema."
│   ├── Buttons: Chat | Insights | Favoritos | Ações | Configurações | Conversas anteriores
│   └── Active button visually highlighted
├── Dynamic Content Area (switches based on active view)
│   ├── AiChatView (default)
│   ├── AiInsightsView
│   ├── AiFavoritesView
│   ├── AiActionsView
│   └── AiSettingsView
└── AiConversationsDrawer (sheet from right)
```

### State Management

- `activeView`: `'chat' | 'insights' | 'favorites' | 'actions' | 'settings'` — controls which view renders below the hero banner
- `drawerOpen`: boolean — controls the conversations drawer
- `selectedConversationId`: string | null — current conversation
- `localMessages`: AiMessage[] — optimistic messages before server confirmation

### Component Breakdown

| Component               | File                                     | Purpose                                 |
| ----------------------- | ---------------------------------------- | --------------------------------------- |
| `AiPage`                | `app/(dashboard)/(tools)/ai/page.tsx`    | Main page orchestrator with view state  |
| `AiChatView`            | `components/ai/chat-view.tsx`            | Chat messages + input area              |
| `AiEmptyState`          | `components/ai/empty-state.tsx`          | Welcome + suggestion chips              |
| `AiMessageBubble`       | `components/ai/message-bubble.tsx`       | Single message (user or assistant)      |
| `AiMarkdownRenderer`    | `components/ai/markdown-renderer.tsx`    | Markdown → React with custom components |
| `AiConversationsDrawer` | `components/ai/conversations-drawer.tsx` | Sheet with conversation list            |
| `AiInsightsView`        | `components/ai/insights-view.tsx`        | Refactored from current insights page   |
| `AiFavoritesView`       | `components/ai/favorites-view.tsx`       | Refactored from current favorites page  |
| `AiActionsView`         | `components/ai/actions-view.tsx`         | Refactored from current actions page    |
| `AiSettingsView`        | `components/ai/settings-view.tsx`        | Refactored from current settings page   |

## Detailed Design

### 1. Hero Banner

The existing `PageHeroBanner` component only supports `href`-based navigation (wraps buttons in `<Link>`). Since this page needs `onClick`-based view switching, we will **not** use `PageHeroBanner` directly. Instead, build a custom `AiHeroBanner` component that follows the same visual pattern (Card with `bg-white/95 dark:bg-white/5`, decorative circles, icon+title+description+buttons) but uses `onClick` handlers instead of `<Link>` wrappers.

```tsx
// Button configuration
interface AiHeroButton {
  id: string;
  label: string;
  icon: React.ElementType;
  gradient: string;
  view: AiView; // 'chat' | 'insights' | 'favorites' | 'actions' | 'settings'
}

const heroButtons: AiHeroButton[] = [
  {
    id: 'chat',
    label: 'Chat',
    icon: MessageSquare,
    view: 'chat',
    gradient: 'from-violet-500 to-violet-600',
  },
  {
    id: 'insights',
    label: 'Insights',
    icon: Lightbulb,
    view: 'insights',
    gradient: 'from-teal-500 to-teal-600',
  },
  {
    id: 'favorites',
    label: 'Favoritos',
    icon: Star,
    view: 'favorites',
    gradient: 'from-cyan-500 to-cyan-600',
  },
  {
    id: 'actions',
    label: 'Ações',
    icon: Activity,
    view: 'actions',
    gradient: 'from-emerald-500 to-emerald-600',
  },
  {
    id: 'settings',
    label: 'Configurações',
    icon: Settings,
    view: 'settings',
    gradient: 'from-slate-500 to-slate-600',
  },
];
```

The "Conversas anteriores" button is separate — an outline-style `<Button variant="outline">` that triggers the drawer via `onClick` instead of switching views.

**Active button indicator**: The active view button gets `ring-2 ring-white/40 opacity-100`, while inactive buttons get `opacity-70 hover:opacity-100`.

**Permissions**: AI views do not require individual permissions — if the user can access the AI tool (via `TOOLS_PERMISSIONS.AI.CHAT.ACCESS`), all sub-views are available. Permission gating happens at the page level, not per-button.

### 2. Chat View — Empty State

Displayed when no conversation is selected and no messages exist.

```
┌────────────────────────────────────────┐
│                                        │
│         [Atlas icon gradient]          │
│         Olá! Sou o Atlas.              │
│   Como posso ajudar você hoje?         │
│                                        │
│  ┌──────────┐ ┌─────────────────┐      │
│  │ Quantos  │ │ Resumo          │      │
│  │ produtos │ │ financeiro      │      │
│  │ tenho?   │ │ do mês          │      │
│  └──────────┘ └─────────────────┘      │
│  ┌──────────────┐ ┌───────────────┐    │
│  │ Funcionários │ │ Pedidos em    │    │
│  │ ativos       │ │ aberto        │    │
│  └──────────────┘ └───────────────┘    │
│                                        │
│  ┌─────────────────────────────────┐   │
│  │ Pergunte algo ao Atlas...    ↑  │   │
│  └─────────────────────────────────┘   │
└────────────────────────────────────────┘
```

Suggestion chips are clickable and send the text as a message, starting a new conversation.

Chip styling: `bg-white dark:bg-slate-800/60 border border-border` with hover effect. Each chip has a subtle icon (emoji or lucide).

### 3. Chat View — Messages

Messages use a layout inspired by ChatGPT/Claude:

**Assistant messages (left-aligned):**

- Avatar: 32px gradient violet→cyan rounded-lg with "A"
- Name "Atlas" in `text-violet-400` + timestamp in muted
- Content rendered through `AiMarkdownRenderer`
- Optional badge "DADOS REAIS" (green) when response used function calling
- Optional action chips below content
- Model info line (muted, small): model name, latency, function called

**User messages (right-aligned):**

- Content in indigo bubble (`bg-indigo-600 rounded-2xl rounded-tr-sm`)
- Avatar: 32px slate rounded-lg with user initial
- Name "Você" + timestamp

**Loading state:**

- Atlas avatar + animated dots or skeleton pulse

**Error state:**

- If `sendMessage` fails, the user message stays but gets a red border indicator
- Inline error text below: "Erro ao enviar. Tente novamente." with a retry button
- Toast notification via `sonner` for network errors

### 4. Chat View — Input Area

Fixed at bottom of the page. Max-width 720px centered.

```
┌────────────────────────────────────────────┐
│ [+]  Pergunte algo ao Atlas...    [⌘K] [↑] │
└────────────────────────────────────────────┘
```

- `[+]` — future: attach files (not implemented in this phase, render as disabled placeholder)
- Auto-expanding `<Textarea>` using `react-textarea-autosize` (already available, or implement manually with `scrollHeight` resize). Replaces the current `<Input>`.
- Remove `[⌘K]` hint — not functional, avoid confusion
- `[↑]` — send button with gradient, disabled when empty or pending
- Enter sends, Shift+Enter for new line
- Container: `bg-muted border border-border rounded-xl`

### 5. Markdown Renderer

Dependencies: `react-markdown`, `remark-gfm`, `react-syntax-highlighter`

Custom component overrides (dual-theme):

- **Tables**: `bg-white dark:bg-slate-800 border-border`, header `bg-slate-100 dark:bg-slate-700/50`
- **Code blocks**: syntax highlighted with `oneLight`/`oneDark` theme (based on system), copy button
- **Inline code**: `bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-violet-700 dark:text-violet-300`
- **Lists**: proper spacing and bullet styling
- **Links**: `text-violet-600 dark:text-violet-400 underline`
- **Bold/italic**: standard rendering
- **Blockquotes**: left border violet with `bg-slate-50 dark:bg-slate-800/50`

### 6. Conversations Drawer

Uses shadcn `Sheet` component, opens from the right.

Content:

- Header: "Conversas" title + count + New (+) button + Close (X)
- Search input (client-side filtering on conversation title — no server search needed for initial implementation)
- Conversation list:
  - Active conversation highlighted with indigo border/bg
  - Each item: title, message count, relative timestamp
  - Pinned conversations shown with pin icon
  - Context menu: Rename, Pin/Unpin, Archive
- Footer: link to "Ver conversas arquivadas"

### 7. Sub-Views (Insights, Favorites, Actions, Settings)

These are refactored from the existing standalone pages:

- Remove their `PageActionBar` (the main page handles breadcrumbs)
- Remove the outer layout wrapper (`flex flex-col h-[calc(100vh-4rem)]`)
- Keep all React Query hooks, mutations, and UI logic intact
- Export as view components that render directly below the hero banner

### 8. Removed Pages

After consolidation, delete:

- `app/(tools)/ai/insights/page.tsx`
- `app/(tools)/ai/favorites/page.tsx`
- `app/(tools)/ai/actions/page.tsx`
- `app/(tools)/ai/settings/page.tsx`

Keep `app/(tools)/ai/loading.tsx` — update skeleton to match new layout.

## Visual Design

### Color System

- **Atlas brand**: gradient `from-violet-500 to-cyan-500` (icon, accents)
- **User messages**: `bg-indigo-600` bubble
- **Assistant messages**: no bubble, content directly on page background
- **Tables in responses**: `bg-white dark:bg-slate-800 border-border` (dual-theme)
- **Action chips**: `bg-violet-50 dark:bg-violet-500/10 border-violet-200 dark:border-violet-500/20 text-violet-700 dark:text-violet-400`
- **Destructive**: Rose (project standard)
- **Success/data**: `text-emerald-600 dark:text-emerald-400`
- **No yellow/amber**: use teal for Insights gradient (project color rule)

### Responsive Behavior

- Hero banner buttons wrap on smaller screens
- Chat max-width 720px, centered
- Drawer is full-width on mobile
- Input area respects padding on mobile

## Dependencies

New npm packages:

- `react-markdown` — markdown parsing
- `remark-gfm` — GitHub Flavored Markdown (tables, strikethrough, etc.)
- `react-syntax-highlighter` — code block syntax highlighting

## Out of Scope

- Function calling engine (separate sub-project #2)
- Real data tools/functions (separate sub-project #3)
- File attachments in chat (future)
- Voice input (future)
- Command bar ⌘K functionality (future)
- Inline context panel in other modules (future)

## Success Criteria

1. Single `/ai` page with hero banner and view switching works
2. Chat renders markdown with tables, code blocks, lists, bold/italic
3. Empty state shows suggestion chips that start conversations
4. Conversations drawer opens/closes, lists conversations, allows switching
5. All existing sub-page functionality preserved (insights, favorites, actions, settings)
6. Visual consistency with other OpenSea modules (hero banner, color system, typography)
7. Dark and light mode both work correctly
8. Portuguese text with correct accents throughout
