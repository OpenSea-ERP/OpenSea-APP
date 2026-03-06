# Task Board Frontend Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Complete visual and UX redesign of the Task Board frontend following Trello Modern style — gradient board cards, expressive kanban cards with color bars, 2-column card detail modal, and polished views.

**Architecture:** Rewrite all `src/components/tasks/` UI components and the 2 page files. Keep all existing infrastructure: types (`src/types/tasks/`), hooks (`src/hooks/tasks/`), services (`src/services/tasks/`), API config. The redesign is purely a UI layer rewrite.

**Tech Stack:** Next.js 16, React 19, TailwindCSS 4, shadcn/ui, @dnd-kit/core, @fullcalendar/react, date-fns, sonner.

**Reference:** Trello Modern — kanban-first, gradient board backgrounds, card color bars, large centered detail modal with sidebar.

---

## Reutilização (NÃO modificar)

- `src/types/tasks/**` — All types are correct
- `src/hooks/tasks/**` — All React Query hooks work
- `src/services/tasks/**` — API call layer
- `src/lib/api/tasks.ts` — API config with endpoints

## Board Gradient System

Since the backend has no `color` field on Board, gradients will be stored client-side in localStorage keyed by `board-gradient-{boardId}`. A constant palette of 12 gradients is defined.

---

## Task 1: Gradient Constants + Utility

**Files:**
- Create: `src/components/tasks/shared/board-gradients.ts`

**What to build:**
- Export `BOARD_GRADIENTS` — array of 12 gradient presets, each with `id`, `from`, `to`, `className` (Tailwind `bg-gradient-to-br from-X to-Y`)
- Export `getGradientForBoard(boardId: string): BoardGradient` — reads from localStorage, falls back to deterministic hash pick
- Export `setGradientForBoard(boardId: string, gradientId: string): void` — saves to localStorage
- Export `BoardGradient` type

Gradients: blue→indigo, green→teal, purple→pink, orange→red, cyan→blue, rose→fuchsia, emerald→cyan, amber→orange, violet→purple, sky→indigo, lime→green, slate→zinc

---

## Task 2: Board Listing Page Redesign

**Files:**
- Rewrite: `src/app/(dashboard)/(tools)/tasks/page.tsx`
- Rewrite: `src/components/tasks/boards/board-list.tsx`

**What to build:**

**page.tsx:**
- Remove hero banner entirely
- Compact header: breadcrumb row with "Novo Quadro" button (same as now)
- Below: board grid directly (no Card wrapper, no decorative blobs)

**board-list.tsx:**
- Each board card: full gradient background from `getGradientForBoard(board.id)`
- White text overlay with board title (font-bold, text-lg), description (text-sm, opacity-80)
- Bottom of card: card count badge + member count badge (semi-transparent backgrounds)
- Member avatars (first 3) with white ring
- `hover:scale-[1.02]` + shadow transition
- Skeleton: gradient placeholder cards during loading
- Empty state: centered icon + message

---

## Task 3: Board Create Dialog with Gradient Picker

**Files:**
- Rewrite: `src/components/tasks/boards/board-create-dialog.tsx`

**What to build:**
- Same form fields: title (required), description, type, visibility
- ADD: gradient picker grid (4x3 grid of gradient swatches, 40x28px each, rounded, ring on selected)
- On create success: `setGradientForBoard(newBoardId, selectedGradientId)` before navigating
- Preview: show selected gradient as background of the dialog header area

---

## Task 4: Board Page Layout Redesign

**Files:**
- Rewrite: `src/app/(dashboard)/(tools)/tasks/[boardId]/page.tsx`

**What to build:**
- Neutral background (no board gradient here per user choice)
- Header: breadcrumb + board title (inline editable on click) + settings gear icon
- View toggle (underline style instead of pill background)
- Filters bar (keep existing BoardFilters component — it's already good)
- Unified `selectedCardId` state — ALL views use the same `CardDetailModal` instance at page level (remove duplicated modals from each view)
- Archived banner (keep)
- Loading/error states (keep, polish)

---

## Task 5: View Toggle Redesign

**Files:**
- Rewrite: `src/components/tasks/shared/view-toggle.tsx`

**What to build:**
- Underline-style tabs instead of pill background
- Each view button: icon + label, with colored underline when active (2px bottom border, primary color)
- Subtle hover effect on inactive tabs
- Same router logic as before

---

## Task 6: Kanban View Redesign

**Files:**
- Rewrite: `src/components/tasks/views/kanban-view.tsx`
- Rewrite: `src/components/tasks/cards/card-item.tsx`
- Rewrite: `src/components/tasks/cards/card-inline-create.tsx`

**What to build:**

**kanban-view.tsx:**
- Columns: 280px wide, rounded-xl container with subtle background (`bg-muted/30 dark:bg-white/[0.03]`)
- Column header: color bar (4px top border using column.color), title, card count, "⋯" menu button (rename/delete)
- WIP limit indicator: if `column.wipLimit` is set, show "N/limit" next to count, red text when exceeded
- Cards container: scroll vertical within column (max-height calc), custom scrollbar
- Drag & drop: keep @dnd-kit logic, improve placeholder (dashed border where card will drop)
- Horizontal scroll: ScrollArea with visible scrollbar
- Add column button: same logic, cleaner visual

**card-item.tsx:**
- Color bar at top (first label color, or priority color if no labels, 4px height with rounded top)
- Labels as small colored pills (just color, no text — Trello style compact)
- Title: text-sm, font-medium, line-clamp-2
- Bottom row: due date badge (red if overdue), subtask progress (small progress bar), comment count icon, attachment count icon
- Assignee avatar bottom-right
- Hover: shadow-md, slight scale
- Drag overlay: shadow-2xl, slight rotation

**card-inline-create.tsx:**
- Simpler: just a text input that appears on click of "+ Adicionar cartão" at bottom of column
- Press Enter to create, Escape to cancel
- Subtle animation (slide down)

---

## Task 7: Card Detail Modal Redesign (Trello-style 2-column)

**Files:**
- Rewrite: `src/components/tasks/cards/card-detail-modal.tsx`

**What to build:**
- Modal: max-w-3xl (720px), rounded-xl, with overlay
- Top: color bar (same as card color bar) spanning full width
- Title: large (text-xl), click-to-edit inline
- Below title: column badge ("em A Fazer") — clickable to change column
- **2-column layout:**
  - LEFT (flex-1): Description (click-to-edit placeholder), Checklists section, Attachments section, Activity/Comments section (merged, chronological)
  - RIGHT (w-48 sidebar): Stacked action buttons — Membros, Etiquetas, Prazo, Prioridade, Mover, Copiar, Arquivar, Excluir
- Each sidebar button: icon + label, ghost variant, full width, left-aligned
- Clicking sidebar buttons opens popovers (reuse existing logic for assignee, labels, due date, priority)
- NO tabs — all content visible in scrollable left column
- Footer: subtle "Criado em [date]" text

---

## Task 8: Subtasks Section (inside Card Detail)

**Files:**
- Rewrite: `src/components/tasks/tabs/card-subtasks-tab.tsx` → rename to `card-subtasks-section.tsx`

**What to build:**
- Same logic as before (useSubtasks, useCreateSubtask, etc.)
- Visual: collapsible section with header "Subtarefas (N/total)"
- Progress bar below header
- Subtask list: checkbox + title + priority dot + delete (hover)
- Inline add at bottom
- No longer a tab — it's a section within the left column

---

## Task 9: Checklist Section (inside Card Detail)

**Files:**
- Rewrite: `src/components/tasks/tabs/card-checklist-tab.tsx` → rename to `card-checklist-section.tsx`

**What to build:**
- Same logic, visual as collapsible section
- Header: "Checklist: [name] (N/total)"
- Progress bar
- Items: checkbox + title + delete (hover)
- Add item inline

---

## Task 10: Comments & Activity Section (inside Card Detail)

**Files:**
- Rewrite: `src/components/tasks/tabs/card-comments-tab.tsx` → rename to `card-comments-section.tsx`
- Rewrite: `src/components/tasks/tabs/card-activity-tab.tsx` → merge into comments section

**What to build:**
- Merge comments and activity into one chronological feed
- Comment input at top (avatar + textarea + "Salvar" button)
- Feed below: comments (editable, deletable) interspersed with activity entries (grey, non-editable)
- Avatar + name + timestamp for each entry

---

## Task 11: Description Section (inside Card Detail)

**Files:**
- Rewrite: `src/components/tasks/tabs/card-details-tab.tsx` → rename to `card-description-section.tsx`

**What to build:**
- Click-to-edit description area
- When not editing: rendered text (or "Adicionar uma descrição..." placeholder)
- When editing: textarea with Save/Cancel buttons
- Attachments section below (keep existing upload logic)

---

## Task 12: Custom Fields Section (inside Card Detail)

**Files:**
- Rewrite: `src/components/tasks/tabs/card-custom-fields-tab.tsx` → rename to `card-custom-fields-section.tsx`

**What to build:**
- Collapsible section "Campos personalizados"
- Same field rendering logic, just adapted to section layout instead of tab

---

## Task 13: List View Redesign

**Files:**
- Rewrite: `src/components/tasks/views/list-view.tsx`

**What to build:**
- Same grouped-by-column structure
- Column headers: colored left border (column.color), bold title, count, collapse toggle
- Card rows: checkbox (for quick done toggle) + priority dot + title + labels (compact colored dots) + due date + assignee avatar
- Row hover: subtle highlight
- Inline create at bottom of each group
- Remove CardDetailModal from this component (handled at page level)

---

## Task 14: Table View Redesign

**Files:**
- Rewrite: `src/components/tasks/views/table-view.tsx`

**What to build:**
- Keep custom table (project doesn't have a shared DataTable pattern for this)
- Improve styling: better header, hover rows, zebra striping subtle
- Columns: #, Título, Coluna, Prioridade, Responsável, Prazo, Etiquetas
- Sorting: keep existing logic
- Cells: compact, with inline badges
- Remove CardDetailModal from this component (handled at page level)

---

## Task 15: Calendar View Polish

**Files:**
- Rewrite: `src/components/tasks/views/calendar-view.tsx`

**What to build:**
- Keep FullCalendar
- Improve event styling: rounded events, hover tooltip with card title + priority + assignee
- Colors: use label color (first label) or priority color
- Remove CardDetailModal from this component (handled at page level)

---

## Task 16: Board Settings Dialog Polish

**Files:**
- Edit: `src/components/tasks/boards/board-settings-dialog.tsx`

**What to build:**
- Add gradient picker section (same grid as create dialog)
- Keep existing column management
- Polish visual consistency with new design

---

## Task 17: Shared Components Polish

**Files:**
- Edit: `src/components/tasks/shared/label-badge.tsx`
- Edit: `src/components/tasks/shared/member-avatar.tsx`
- Edit: `src/components/tasks/shared/priority-badge.tsx`
- Edit: `src/components/tasks/shared/empty-states.tsx`

**What to build:**
- `label-badge.tsx`: Add compact mode (color-only dot, no text) for kanban cards
- `member-avatar.tsx`: Polish, ensure consistent sizing
- `priority-badge.tsx`: Keep
- `empty-states.tsx`: Polish with better illustrations

---

## Task 18: Cleanup Old Files

**Files:**
- Delete: Any remaining tab files that were renamed to sections
- Ensure all imports are updated
- Verify TypeScript compiles clean: `npx tsc --noEmit`

---

## Execution Order

Tasks 1→2→3 (foundation + listing page)
Task 4→5 (board page + view toggle)
Task 6 (kanban — biggest task)
Task 7→8→9→10→11→12 (card detail modal + sections)
Tasks 13→14→15 (other views)
Tasks 16→17→18 (polish + cleanup)
