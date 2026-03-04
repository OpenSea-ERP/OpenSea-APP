'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  format,
  isAfter,
  isBefore,
  isSameYear,
  isToday,
  isYesterday,
  startOfDay,
  endOfDay,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertCircle,
  Archive,
  Filter,
  Inbox,
  Loader2,
  Mail,
  MailOpen,
  Paperclip,
  Search,
  Settings,
  Trash2,
  X,
} from 'lucide-react';
import NextLink from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

function formatEmailDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  if (isToday(d)) return format(d, 'HH:mm');
  if (isYesterday(d)) return 'Ontem';
  if (isSameYear(d, now)) return format(d, 'd MMM', { locale: ptBR });
  return format(d, 'd MMM yyyy', { locale: ptBR });
}

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
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(
    null
  );
  const [fromFilter, setFromFilter] = useState('');
  const [hasAttachmentsFilter, setHasAttachmentsFilter] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
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

  // +1 row when there's more to load (renders a spinner/sentinel as last item)
  const rowCount = filteredMessages.length + (hasMore ? 1 : 0);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 6,
  });

  // Multi-select click handler
  const handleMessageClick = useCallback(
    (messageId: string, index: number, event: React.MouseEvent) => {
      if (event.shiftKey && lastSelectedIndex !== null) {
        // Range select: all between lastSelectedIndex and current
        const start = Math.min(lastSelectedIndex, index);
        const end = Math.max(lastSelectedIndex, index);
        const newSelected = new Set(selectedIds);
        for (let i = start; i <= end; i++) {
          const msg = filteredMessages[i];
          if (msg) newSelected.add(msg.id);
        }
        onSelectedIdsChange?.(newSelected);
      } else if (event.ctrlKey || event.metaKey) {
        // Toggle single
        const newSelected = new Set(selectedIds);
        if (newSelected.has(messageId)) newSelected.delete(messageId);
        else newSelected.add(messageId);
        onSelectedIdsChange?.(newSelected);
        setLastSelectedIndex(index);
      } else {
        // Normal click: clear selection, open message
        if (selectedIds.size > 0) {
          onClearSelection?.();
        }
        onSelectMessage(messageId);
        setLastSelectedIndex(index);
      }
    },
    [
      lastSelectedIndex,
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
      // Don't handle shortcuts when typing in input fields
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
  useEffect(() => {
    const virtualItems = virtualizer.getVirtualItems();
    const lastItem = virtualItems[virtualItems.length - 1];
    if (!lastItem) return;
    if (
      lastItem.index >= filteredMessages.length - 5 &&
      hasMore &&
      !isFetchingNextPage
    ) {
      onLoadMore?.();
    }
  }, [
    virtualizer.getVirtualItems(),
    hasMore,
    isFetchingNextPage,
    filteredMessages.length,
    onLoadMore,
  ]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-sm font-semibold tracking-tight">
          {folderName ?? 'Mensagens'}
        </h2>
        <Badge
          variant="secondary"
          className="text-[10px] font-medium h-5 px-1.5"
        >
          {total ?? messages.length}
        </Badge>
      </div>

      {/* Search + Filter */}
      <div className="px-3 pb-2 space-y-2">
        <div className="relative flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Pesquisar e-mails..."
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              className="pl-8 h-8 text-sm rounded-lg"
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={hasActiveFilters ? 'default' : 'ghost'}
                size="icon"
                className={cn(
                  'size-8 shrink-0 rounded-lg',
                  hasActiveFilters && 'shadow-sm'
                )}
                title="Filtros avan\u00e7ados"
              >
                <Filter className="size-3.5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3 space-y-3" align="end">
              <div className="space-y-1">
                <p className="text-xs font-semibold">Filtros</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">
                  Remetente
                </label>
                <Input
                  placeholder="email@exemplo.com"
                  value={fromFilter}
                  onChange={e => setFromFilter(e.target.value)}
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">
                  Per\u00edodo
                </label>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={e => setDateFrom(e.target.value)}
                    className="h-7 text-xs flex-1"
                  />
                  <span className="text-xs text-muted-foreground">a</span>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={e => setDateTo(e.target.value)}
                    className="h-7 text-xs flex-1"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-muted-foreground">
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
                  className="w-full h-7 text-xs gap-1.5 text-muted-foreground"
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
        </div>

        {/* Tabs */}
        <Tabs
          value={filter}
          onValueChange={v => onFilterChange(v as 'all' | 'unread')}
        >
          <TabsList className="h-8 w-full">
            <TabsTrigger value="all" className="flex-1 text-xs">
              Todos
              {folderTotalMessages !== undefined && folderTotalMessages > 0
                ? ` (${folderTotalMessages})`
                : ''}
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex-1 text-xs">
              N\u00e3o lidos
              {folderUnreadMessages !== undefined && folderUnreadMessages > 0
                ? ` (${folderUnreadMessages})`
                : ''}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Separator />

      {/* Bulk-actions toolbar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/5 border-b">
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
          <span className="text-xs font-medium mr-1 text-primary">
            {selectedIds.size} selecionado{selectedIds.size > 1 ? 's' : ''}
          </span>
          <Separator orientation="vertical" className="h-4" />
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1.5"
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
            className="h-7 text-xs gap-1.5"
            onClick={() => {
              onBulkMarkRead?.(Array.from(selectedIds), false);
            }}
          >
            <Mail className="size-3.5" />
            N\u00e3o lida
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1.5"
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
            className="h-7 text-xs gap-1.5 text-destructive hover:text-destructive"
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
            className="size-7"
            onClick={() => onClearSelection?.()}
            title="Limpar sele\u00e7\u00e3o"
          >
            <X className="size-3.5" />
          </Button>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-0 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-3 border-b">
              <Skeleton className="size-2 rounded-full shrink-0 mt-2" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
          <div className="size-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="size-6 text-destructive/60" />
          </div>
          <div>
            <p className="text-sm font-medium text-destructive">
              Erro ao carregar mensagens
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Verifique sua conectividade ou sincronize a conta.
            </p>
          </div>
        </div>
      )}

      {/* No account */}
      {noAccount && !isLoading && (
        <div className="flex flex-col items-center justify-center gap-4 px-6 py-12 text-center">
          <div className="size-16 rounded-full bg-muted flex items-center justify-center">
            <Inbox className="size-8 text-muted-foreground/50" />
          </div>
          <div>
            <p className="text-sm font-medium">Nenhuma conta configurada</p>
            <p className="text-xs text-muted-foreground mt-1">
              Configure uma conta para gerenciar seus e-mails.
            </p>
          </div>
          <Button asChild size="sm" variant="outline" className="gap-1.5">
            <NextLink href="/email/settings">
              <Settings className="size-3.5" />
              Configurar conta
            </NextLink>
          </Button>
        </div>
      )}

      {/* Empty */}
      {!isLoading &&
        !isError &&
        !noAccount &&
        filteredMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
            {searchQuery ? (
              <>
                <div className="size-12 rounded-full bg-muted flex items-center justify-center">
                  <Search className="size-6 text-muted-foreground/40" />
                </div>
                <div>
                  <p className="text-sm font-medium">Nenhum resultado</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Nenhuma mensagem para{' '}
                    <span className="font-medium">"{searchQuery}"</span>
                  </p>
                </div>
              </>
            ) : filter === 'unread' ? (
              <>
                <div className="size-12 rounded-full bg-muted flex items-center justify-center">
                  <MailOpen className="size-6 text-muted-foreground/40" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    Nenhuma mensagem n\u00e3o lida
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Voc\u00ea est\u00e1 em dia!
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="size-12 rounded-full bg-muted flex items-center justify-center">
                  <Inbox className="size-6 text-muted-foreground/40" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {folderName ? `${folderName} vazia` : 'Caixa vazia'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Nenhuma mensagem nesta pasta.
                  </p>
                </div>
              </>
            )}
          </div>
        )}

      {/* Virtualized list */}
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
              const isLoader = virtualRow.index >= filteredMessages.length;

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

              const message = filteredMessages[virtualRow.index];
              const isSelected = selectedMessageId === message.id;
              const isChecked = selectedIds.has(message.id);
              const senderDisplay = message.fromName || message.fromAddress;

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
                  <div
                    className={cn(
                      'group flex w-full items-start gap-2.5 px-3 py-2.5 text-left border-b cursor-pointer transition-colors duration-150',
                      isSelected && 'bg-primary/10',
                      isChecked && !isSelected && 'bg-primary/5',
                      !isSelected && !isChecked && 'hover:bg-muted/30',
                      !message.isRead &&
                        !isSelected &&
                        !isChecked &&
                        'bg-primary/[0.03]'
                    )}
                    onClick={e =>
                      handleMessageClick(message.id, virtualRow.index, e)
                    }
                  >
                    {/* Unread dot / Checkbox area */}
                    <div
                      className="relative size-5 shrink-0 mt-1 flex items-center justify-center"
                      onClick={e => {
                        e.stopPropagation();
                        onToggleSelect?.(message.id);
                      }}
                    >
                      {/* Unread dot - hidden when checked or on hover */}
                      <div
                        className={cn(
                          'flex items-center justify-center transition-opacity duration-150',
                          isChecked || selectedIds.size > 0
                            ? 'opacity-0'
                            : 'group-hover:opacity-0'
                        )}
                      >
                        {!message.isRead && (
                          <div className="size-2 rounded-full bg-primary" />
                        )}
                      </div>
                      {/* Checkbox - shown when checked or on hover */}
                      <div
                        className={cn(
                          'absolute inset-0 flex items-center justify-center transition-opacity duration-150',
                          isChecked || selectedIds.size > 0
                            ? 'opacity-100'
                            : 'opacity-0 group-hover:opacity-100'
                        )}
                      >
                        <Checkbox
                          checked={isChecked}
                          className="size-4"
                          onCheckedChange={() => onToggleSelect?.(message.id)}
                          onClick={e => e.stopPropagation()}
                        />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      {/* Row 1: Sender + Attachment + Date */}
                      <div className="flex items-center gap-1">
                        <span
                          className={cn(
                            'truncate text-sm flex-1',
                            !message.isRead
                              ? 'font-semibold text-foreground'
                              : 'text-muted-foreground'
                          )}
                        >
                          {senderDisplay}
                        </span>
                        {message.hasAttachments && (
                          <Paperclip className="size-3 shrink-0 text-muted-foreground" />
                        )}
                        <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
                          {formatEmailDate(message.receivedAt)}
                        </span>
                      </div>

                      {/* Row 2: Subject */}
                      <p
                        className={cn(
                          'truncate text-sm leading-snug',
                          !message.isRead
                            ? 'font-medium text-foreground'
                            : 'text-foreground/80'
                        )}
                      >
                        {message.subject || '(sem assunto)'}
                      </p>

                      {/* Row 3: Snippet */}
                      {message.snippet && (
                        <p className="truncate text-xs text-muted-foreground mt-0.5 leading-snug">
                          {message.snippet}
                        </p>
                      )}
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
