'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { EmailMessageListItem } from '@/types/email';
import { useVirtualizer } from '@tanstack/react-virtual';
import { endOfDay, isAfter, isBefore, startOfDay } from 'date-fns';
import {
  AlertCircle,
  Archive,
  ChevronRight,
  ChevronsDownUp,
  ChevronsUpDown,
  Filter,
  Inbox,
  Loader2,
  Mail,
  MailOpen,
  MoreHorizontal,
  Paperclip,
  Reply,
  Search,
  Settings,
  Trash2,
  X,
} from 'lucide-react';
import NextLink from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  formatEmailDate,
  formatEmailDateFull,
  getAvatarColor,
  getInitials,
  groupMessagesByDate,
} from './email-utils';

// ── Virtual list item types ───────────────────────────────────────────────────

interface VirtualGroupHeader {
  type: 'group-header';
  groupKey: string;
  label: string;
  messageCount: number;
  messageIds: string[];
}

interface VirtualMessageRow {
  type: 'message';
  message: EmailMessageListItem;
}

type VirtualListItem = VirtualGroupHeader | VirtualMessageRow;

// ── Heights ───────────────────────────────────────────────────────────────────

const GROUP_HEADER_HEIGHT = 36;
const MESSAGE_ROW_HEIGHT = 82;
const LOADER_ROW_HEIGHT = 40;

// ── Props ─────────────────────────────────────────────────────────────────────

interface EmailMessageListProps {
  messages: EmailMessageListItem[];
  total?: number;
  selectedMessageId: string | null;
  onSelectMessage: (id: string) => void;
  isLoading: boolean;
  isError: boolean;
  noAccount: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filter: 'all' | 'unread';
  onFilterChange: (f: 'all' | 'unread') => void;
  folderName?: string;
  hasMore?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  /** Server-side total messages in the current folder */
  folderTotalMessages?: number;
  /** Server-side unread messages in the current folder */
  folderUnreadMessages?: number;
  /** Bulk-select state */
  selectedIds?: Set<string>;
  onSelectedIdsChange?: (ids: Set<string>) => void;
  onToggleSelect?: (id: string) => void;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  onBulkMarkRead?: (ids: string[], isRead: boolean) => void;
  onBulkArchive?: (ids: string[]) => void;
  onBulkDelete?: (ids: string[]) => void;
}

export function EmailMessageList({
  messages,
  total,
  selectedMessageId,
  onSelectMessage,
  isLoading,
  isError,
  noAccount,
  searchQuery,
  onSearchChange,
  filter,
  onFilterChange,
  folderName,
  hasMore = false,
  isFetchingNextPage = false,
  onLoadMore,
  folderTotalMessages,
  folderUnreadMessages,
  selectedIds = new Set(),
  onSelectedIdsChange,
  onToggleSelect,
  onSelectAll,
  onClearSelection,
  onBulkMarkRead,
  onBulkArchive,
  onBulkDelete,
}: EmailMessageListProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const [fromFilter, setFromFilter] = useState('');
  const [hasAttachmentsFilter, setHasAttachmentsFilter] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
    new Set()
  );
  const hasActiveFilters =
    Boolean(fromFilter) ||
    hasAttachmentsFilter ||
    Boolean(dateFrom) ||
    Boolean(dateTo);

  /** Client-side filters applied on top of server-side search */
  const filteredMessages = useMemo(() => {
    let result = messages;
    if (fromFilter.trim()) {
      const q = fromFilter.trim().toLowerCase();
      result = result.filter(
        m =>
          m.fromAddress.toLowerCase().includes(q) ||
          (m.fromName?.toLowerCase().includes(q) ?? false)
      );
    }
    if (hasAttachmentsFilter) {
      result = result.filter(m => m.hasAttachments);
    }
    if (dateFrom) {
      const from = startOfDay(new Date(dateFrom));
      result = result.filter(m => isAfter(new Date(m.receivedAt), from));
    }
    if (dateTo) {
      const to = endOfDay(new Date(dateTo));
      result = result.filter(m => isBefore(new Date(m.receivedAt), to));
    }
    return result;
  }, [messages, fromFilter, hasAttachmentsFilter, dateFrom, dateTo]);

  // ── Build flat virtual items from date groups ─────────────────────────────

  const flatItems = useMemo<VirtualListItem[]>(() => {
    const groups = groupMessagesByDate(filteredMessages);
    const items: VirtualListItem[] = [];

    for (const group of groups) {
      items.push({
        type: 'group-header',
        groupKey: group.key,
        label: group.label,
        messageCount: group.messages.length,
        messageIds: group.messages.map(m => m.id),
      });

      if (!collapsedGroups.has(group.key)) {
        for (const message of group.messages) {
          items.push({ type: 'message', message });
        }
      }
    }

    return items;
  }, [filteredMessages, collapsedGroups]);

  // All group keys (for expand/collapse all toggle)
  const allGroupKeys = useMemo(
    () =>
      flatItems
        .filter((i): i is VirtualGroupHeader => i.type === 'group-header')
        .map(i => i.groupKey),
    [flatItems]
  );
  const allCollapsed =
    allGroupKeys.length > 0 && collapsedGroups.size >= allGroupKeys.length;

  const toggleAllGroups = useCallback(() => {
    setCollapsedGroups(prev =>
      prev.size >= allGroupKeys.length
        ? new Set()
        : new Set(allGroupKeys)
    );
  }, [allGroupKeys]);

  // +1 row when there's more to load (renders a spinner/sentinel as last item)
  const rowCount = flatItems.length + (hasMore ? 1 : 0);

  const getItemKey = useCallback(
    (index: number) => {
      if (index >= flatItems.length) return `loader-${index}`;
      const item = flatItems[index];
      return item.type === 'group-header'
        ? `gh-${item.groupKey}`
        : `msg-${item.message.id}`;
    },
    [flatItems]
  );

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: index => {
      if (index >= flatItems.length) return LOADER_ROW_HEIGHT;
      const item = flatItems[index];
      return item.type === 'group-header'
        ? GROUP_HEADER_HEIGHT
        : MESSAGE_ROW_HEIGHT;
    },
    getItemKey,
    overscan: 6,
  });

  // Reset cached measurements when collapse state changes so items are re-estimated
  useEffect(() => {
    virtualizer.measure();
  }, [virtualizer, collapsedGroups]);

  // Toggle group collapse
  const toggleGroup = useCallback((groupKey: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupKey)) next.delete(groupKey);
      else next.add(groupKey);
      return next;
    });
  }, []);

  // Multi-select click handler (uses message IDs instead of array indices)
  const handleMessageClick = useCallback(
    (messageId: string, event: React.MouseEvent) => {
      if (event.shiftKey && lastSelectedId !== null) {
        // Find range in filteredMessages by ID
        const startIdx = filteredMessages.findIndex(
          m => m.id === lastSelectedId
        );
        const endIdx = filteredMessages.findIndex(m => m.id === messageId);
        if (startIdx !== -1 && endIdx !== -1) {
          const lo = Math.min(startIdx, endIdx);
          const hi = Math.max(startIdx, endIdx);
          const newSelected = new Set(selectedIds);
          for (let i = lo; i <= hi; i++) {
            newSelected.add(filteredMessages[i].id);
          }
          onSelectedIdsChange?.(newSelected);
        }
      } else if (event.ctrlKey || event.metaKey) {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(messageId)) newSelected.delete(messageId);
        else newSelected.add(messageId);
        onSelectedIdsChange?.(newSelected);
        setLastSelectedId(messageId);
      } else {
        if (selectedIds.size > 0) {
          onClearSelection?.();
        }
        onSelectMessage(messageId);
        setLastSelectedId(messageId);
      }
    },
    [
      lastSelectedId,
      selectedIds,
      filteredMessages,
      onSelectedIdsChange,
      onClearSelection,
      onSelectMessage,
    ]
  );

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === 'Escape' && selectedIds.size > 0) {
        e.preventDefault();
        onClearSelection?.();
      }

      if (
        (e.ctrlKey || e.metaKey) &&
        e.key === 'a' &&
        filteredMessages.length > 0
      ) {
        e.preventDefault();
        const allIds = new Set(filteredMessages.map(m => m.id));
        onSelectedIdsChange?.(allIds);
      }

      if (e.key === 'Delete' && selectedIds.size > 0) {
        e.preventDefault();
        onBulkDelete?.(Array.from(selectedIds));
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedIds,
    filteredMessages,
    onClearSelection,
    onSelectedIdsChange,
    onBulkDelete,
  ]);

  // Trigger load-more when the user scrolls within 5 items of the end
  const virtualRange = virtualizer.range;
  useEffect(() => {
    if (!virtualRange) return;
    if (
      virtualRange.endIndex >= flatItems.length - 5 &&
      hasMore &&
      !isFetchingNextPage
    ) {
      onLoadMore?.();
    }
  }, [
    virtualRange?.startIndex,
    virtualRange?.endIndex,
    hasMore,
    isFetchingNextPage,
    flatItems.length,
    onLoadMore,
  ]);

  return (
    <div className="flex h-full flex-col" data-testid="email-message-list">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <h2 className="text-base font-semibold tracking-tight">
          {folderName ?? 'Mensagens'}
        </h2>
        <Badge
          variant="secondary"
          className="text-[11px] font-medium h-5.5 px-2 rounded-full"
        >
          {total ?? messages.length}
        </Badge>
      </div>

      {/* Search + Filter */}
      <div className="px-4 pb-3 space-y-3">
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Pesquisar e-mails..."
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              className="pl-9 h-9 text-sm rounded-xl"
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={hasActiveFilters ? 'default' : 'ghost'}
                size="icon"
                className={cn(
                  'size-9 shrink-0 rounded-xl',
                  hasActiveFilters && 'shadow-sm'
                )}
                title="Filtros avançados"
              >
                <Filter className="size-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-4 space-y-4" align="end">
              <div>
                <p className="text-sm font-semibold">Filtros</p>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Remetente
                </label>
                <Input
                  placeholder="email@exemplo.com"
                  value={fromFilter}
                  onChange={e => setFromFilter(e.target.value)}
                  className="h-8 text-xs rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Período
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={e => setDateFrom(e.target.value)}
                    className="h-8 text-xs flex-1 rounded-lg"
                  />
                  <span className="text-xs text-muted-foreground">a</span>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={e => setDateTo(e.target.value)}
                    className="h-8 text-xs flex-1 rounded-lg"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground">
                  Tem anexo
                </label>
                <Switch
                  checked={hasAttachmentsFilter}
                  onCheckedChange={setHasAttachmentsFilter}
                />
              </div>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-8 text-xs gap-2 text-muted-foreground rounded-lg"
                  onClick={() => {
                    setFromFilter('');
                    setHasAttachmentsFilter(false);
                    setDateFrom('');
                    setDateTo('');
                  }}
                >
                  <X className="size-3" />
                  Limpar filtros
                </Button>
              )}
            </PopoverContent>
          </Popover>
          <Button
            variant="ghost"
            size="icon"
            className="size-9 shrink-0 rounded-xl"
            onClick={toggleAllGroups}
            title={allCollapsed ? 'Expandir todos os grupos' : 'Colapsar todos os grupos'}
            aria-label={allCollapsed ? 'Expandir todos os grupos' : 'Colapsar todos os grupos'}
          >
            {allCollapsed ? (
              <ChevronsUpDown className="size-4" />
            ) : (
              <ChevronsDownUp className="size-4" />
            )}
          </Button>
        </div>

        {/* Tabs */}
        <Tabs
          value={filter}
          onValueChange={v => onFilterChange(v as 'all' | 'unread')}
        >
          <TabsList className="h-9 w-full rounded-xl">
            <TabsTrigger value="all" className="flex-1 text-xs rounded-lg">
              Todos
              {folderTotalMessages !== undefined && folderTotalMessages > 0
                ? ` (${folderTotalMessages})`
                : ''}
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex-1 text-xs rounded-lg">
              Não lidos
              {folderUnreadMessages !== undefined && folderUnreadMessages > 0
                ? ` (${folderUnreadMessages})`
                : ''}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Bulk-actions toolbar */}
      {selectedIds.size > 0 && (
        <div
          className="flex items-center gap-2 px-4 py-2 bg-primary/8 border-y"
          data-testid="email-bulk-actions-toolbar"
        >
          <Checkbox
            checked={
              selectedIds.size === filteredMessages.length &&
              filteredMessages.length > 0
                ? true
                : selectedIds.size > 0
                  ? 'indeterminate'
                  : false
            }
            onCheckedChange={checked => {
              if (checked) onSelectAll?.();
              else onClearSelection?.();
            }}
            className="size-4"
          />
          <span
            className="text-xs font-semibold text-primary"
            data-testid="email-bulk-selection-count"
          >
            {selectedIds.size} selecionado{selectedIds.size > 1 ? 's' : ''}
          </span>
          <Separator orientation="vertical" className="h-4" />
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1.5 rounded-lg"
            onClick={() => {
              onBulkMarkRead?.(Array.from(selectedIds), true);
            }}
          >
            <MailOpen className="size-3.5" />
            Lida
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1.5 rounded-lg"
            onClick={() => {
              onBulkMarkRead?.(Array.from(selectedIds), false);
            }}
          >
            <Mail className="size-3.5" />
            Não lida
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1.5 rounded-lg"
            onClick={() => {
              onBulkArchive?.(Array.from(selectedIds));
            }}
          >
            <Archive className="size-3.5" />
            Arquivar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1.5 rounded-lg text-destructive hover:text-destructive"
            onClick={() => {
              onBulkDelete?.(Array.from(selectedIds));
            }}
          >
            <Trash2 className="size-3.5" />
            Excluir
          </Button>
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="icon"
            className="size-7 rounded-lg"
            onClick={() => onClearSelection?.()}
            title="Limpar seleção"
            aria-label="Limpar seleção"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-0 overflow-hidden px-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 px-3 py-3.5">
              <Skeleton className="size-9 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-14" />
                </div>
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
          <div className="size-14 rounded-2xl bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="size-7 text-destructive/60" />
          </div>
          <div>
            <p className="text-sm font-medium text-destructive">
              Erro ao carregar mensagens
            </p>
            <p className="text-xs text-muted-foreground mt-1.5">
              Verifique sua conectividade ou sincronize a conta.
            </p>
          </div>
        </div>
      )}

      {/* No account */}
      {noAccount && !isLoading && (
        <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
          <div className="size-16 rounded-2xl bg-muted flex items-center justify-center">
            <Inbox className="size-8 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">Nenhuma conta de e-mail</p>
            <p className="text-xs text-muted-foreground mt-1.5">
              Configure uma conta para começar
            </p>
          </div>
          <Button
            asChild
            size="sm"
            variant="outline"
            className="gap-2 rounded-xl"
          >
            <NextLink href="/email/settings">
              <Settings className="size-4" />
              Adicionar conta
            </NextLink>
          </Button>
        </div>
      )}

      {/* Empty */}
      {!isLoading &&
        !isError &&
        !noAccount &&
        filteredMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
            {searchQuery ? (
              <>
                <div className="size-14 rounded-2xl bg-muted flex items-center justify-center">
                  <Search className="size-7 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Nenhum resultado</p>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Tente uma busca diferente
                  </p>
                </div>
              </>
            ) : filter === 'unread' ? (
              <>
                <div className="size-14 rounded-2xl bg-muted flex items-center justify-center">
                  <MailOpen className="size-7 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    Nenhuma mensagem não lida
                  </p>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Você está em dia!
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="size-14 rounded-2xl bg-muted flex items-center justify-center">
                  <Inbox className="size-7 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Nenhuma mensagem</p>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Esta pasta está vazia
                  </p>
                </div>
              </>
            )}
          </div>
        )}

      {/* Virtualized list with date groups */}
      {!isLoading && !isError && !noAccount && filteredMessages.length > 0 && (
        <div ref={parentRef} className="flex-1 overflow-y-auto">
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map(virtualRow => {
              const isLoader = virtualRow.index >= flatItems.length;

              if (isLoader) {
                return (
                  <div
                    key="load-more-sentinel"
                    data-index={virtualRow.index}
                    ref={virtualizer.measureElement}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    className="flex items-center justify-center py-4"
                  >
                    {isFetchingNextPage ? (
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        Role para carregar mais
                      </span>
                    )}
                  </div>
                );
              }

              const item = flatItems[virtualRow.index];

              // ── Group header row ────────────────────────────────────────
              if (item.type === 'group-header') {
                const isCollapsed = collapsedGroups.has(item.groupKey);

                return (
                  <div
                    key={`group-${item.groupKey}`}
                    data-index={virtualRow.index}
                    ref={virtualizer.measureElement}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <div className="group/header px-2">
                      <div
                        className="flex items-center gap-1.5 px-3 h-9 cursor-pointer select-none hover:bg-muted/40 rounded-lg transition-colors duration-150"
                        onClick={() => toggleGroup(item.groupKey)}
                      >
                        <ChevronRight
                          className={cn(
                            'size-3.5 shrink-0 text-muted-foreground transition-transform duration-200',
                            !isCollapsed && 'rotate-90'
                          )}
                        />
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex-1">
                          {item.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground/60 tabular-nums mr-0.5">
                          {item.messageCount}
                        </span>

                        {/* Hover actions dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-6 shrink-0 rounded-md opacity-0 group-hover/header:opacity-100 focus:opacity-100 transition-opacity duration-150"
                              onClick={e => e.stopPropagation()}
                              title="Ações do grupo"
                              aria-label="Ações do grupo"
                            >
                              <MoreHorizontal className="size-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() => {
                                onBulkMarkRead?.(item.messageIds, true);
                              }}
                              className="text-xs gap-2"
                            >
                              <MailOpen className="size-3.5" />
                              Marcar como Lido
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                onBulkMarkRead?.(item.messageIds, false);
                              }}
                              className="text-xs gap-2"
                            >
                              <Mail className="size-3.5" />
                              Marcar como Não Lido
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                onBulkDelete?.(item.messageIds);
                              }}
                              className="text-xs gap-2 text-destructive focus:text-destructive"
                            >
                              <Trash2 className="size-3.5" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                );
              }

              // ── Message row ─────────────────────────────────────────────
              const message = item.message;
              const isSelected = selectedMessageId === message.id;
              const isChecked = selectedIds.has(message.id);
              const senderDisplay =
                message.fromName || message.fromAddress || '(sem remetente)';
              const avatarColor = getAvatarColor(message.fromAddress);
              const initials = getInitials(
                message.fromName,
                message.fromAddress
              );

              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={virtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <div className="px-2">
                    <div
                      className={cn(
                        'group flex w-full items-start gap-3 px-3 py-3 text-left cursor-pointer transition-all duration-150 rounded-xl',
                        isSelected && 'bg-accent shadow-sm',
                        isChecked && !isSelected && 'bg-primary/5',
                        !isSelected && !isChecked && 'hover:bg-muted/50'
                      )}
                      onClick={e => handleMessageClick(message.id, e)}
                    >
                      {/* Avatar / Checkbox area */}
                      <div
                        className="relative shrink-0 mt-0.5"
                        onClick={e => {
                          e.stopPropagation();
                          onToggleSelect?.(message.id);
                        }}
                      >
                        {/* Avatar */}
                        <div
                          className={cn(
                            'flex size-9 items-center justify-center rounded-full text-white transition-opacity duration-150',
                            (isChecked || selectedIds.size > 0) &&
                              'opacity-0 group-hover:opacity-0'
                          )}
                          style={{ backgroundColor: avatarColor }}
                        >
                          <span className="text-xs font-semibold leading-none">
                            {initials}
                          </span>
                        </div>

                        {/* Unread dot */}
                        {!message.isRead &&
                          !isChecked &&
                          selectedIds.size === 0 && (
                            <div className="absolute -top-0.5 -left-0.5 size-2.5 rounded-full bg-primary ring-2 ring-background" />
                          )}

                        {/* Checkbox overlay */}
                        <div
                          className={cn(
                            'absolute inset-0 flex items-center justify-center rounded-full transition-opacity duration-150',
                            isChecked || selectedIds.size > 0
                              ? 'opacity-100'
                              : 'opacity-0 group-hover:opacity-100'
                          )}
                        >
                          <div className="size-9 rounded-full bg-muted/80 backdrop-blur-sm flex items-center justify-center">
                            <Checkbox
                              checked={isChecked}
                              className="size-4"
                              onCheckedChange={() =>
                                onToggleSelect?.(message.id)
                              }
                              onClick={e => e.stopPropagation()}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Content — sender+date, subject */}
                      <div className="min-w-0 flex-1">
                        {/* Row 1: Sender + Date */}
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              'truncate text-sm flex-1',
                              !message.isRead
                                ? 'font-semibold text-foreground'
                                : 'text-muted-foreground font-semibold'
                            )}
                            title={senderDisplay}
                          >
                            {senderDisplay}
                          </span>
                          <span
                            className="shrink-0 text-[11px] text-muted-foreground tabular-nums"
                            title={formatEmailDateFull(message.receivedAt)}
                          >
                            {formatEmailDate(message.receivedAt)}
                          </span>
                        </div>

                        {/* Row 2: Subject (with attachment icon) */}
                        <div className="flex items-center justify-between gap-1 mt-0.5">
                          <p
                            className={cn(
                              'truncate text-[13px] leading-snug',
                              !message.isRead
                                ? 'font-medium text-foreground'
                                : 'text-muted-foreground'
                            )}
                            title={message.subject || '(sem assunto)'}
                          >
                            {message.subject || (
                              <em className="text-muted-foreground">
                                (sem assunto)
                              </em>
                            )}
                          </p>
                          <div className="flex items-center gap-1 shrink-0">
                            {message.isAnswered && (
                              <Reply className="size-3 shrink-0 text-muted-foreground" />
                            )}
                            {message.hasAttachments && (
                              <Paperclip className="size-3 shrink-0 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
