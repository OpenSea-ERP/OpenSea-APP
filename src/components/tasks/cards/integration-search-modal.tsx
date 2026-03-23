'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2, Mail } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { IntegrationType } from '@/types/tasks';
import type { FinanceEntry, FinanceEntryType } from '@/types/finance';
import {
  FINANCE_ENTRY_STATUS_LABELS,
  FINANCE_ENTRY_TYPE_LABELS,
} from '@/types/finance';
import { financeEntriesService } from '@/services/finance/finance-entries.service';
import { emailService } from '@/services/email/email.service';
import type { EmailMessageListItem, EmailAccount } from '@/types/email';

interface IntegrationSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: IntegrationType;
  onSelect: (entityId: string, entityLabel: string) => void;
}

type TypeFilter = 'ALL' | FinanceEntryType;

// ─── Account dot colors (cycle through for multi-account indicator) ──────────
const ACCOUNT_DOT_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-orange-500',
  'bg-indigo-500',
];

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  } catch {
    return dateStr;
  }
}

function formatShortDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) {
      return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias`;

    return date.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return dateStr;
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value / 100);
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'PAID':
    case 'RECEIVED':
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/8 dark:text-emerald-300';
    case 'PENDING':
    case 'SCHEDULED':
      return 'bg-amber-50 text-amber-700 dark:bg-amber-500/8 dark:text-amber-300';
    case 'OVERDUE':
      return 'bg-rose-50 text-rose-700 dark:bg-rose-500/8 dark:text-rose-300';
    case 'PARTIALLY_PAID':
      return 'bg-blue-50 text-blue-700 dark:bg-blue-500/8 dark:text-blue-300';
    case 'CANCELLED':
      return 'bg-slate-50 text-slate-700 dark:bg-slate-500/8 dark:text-slate-300';
    default:
      return 'bg-slate-50 text-slate-700 dark:bg-slate-500/8 dark:text-slate-300';
  }
}

// ─── Email Content ──────────────────────────────────────────────────────────

function EmailSearchContent({
  open,
  onSelect,
  onOpenChange,
  searchInputRef,
}: {
  open: boolean;
  onSelect: (entityId: string, entityLabel: string) => void;
  onOpenChange: (open: boolean) => void;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const [search, setSearch] = useState('');
  const [accounts, setAccounts] = useState<EmailAccount[]>([]);
  const [messages, setMessages] = useState<EmailMessageListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [noAccounts, setNoAccounts] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accountIdsRef = useRef<string[]>([]);

  // Build account index map for dot colors
  const accountColorMap = useRef(new Map<string, number>());

  function getAccountDotColor(accountId: string): string {
    if (!accountColorMap.current.has(accountId)) {
      accountColorMap.current.set(accountId, accountColorMap.current.size);
    }
    const idx = accountColorMap.current.get(accountId)!;
    return ACCOUNT_DOT_COLORS[idx % ACCOUNT_DOT_COLORS.length];
  }

  // Fetch accounts on open
  useEffect(() => {
    if (!open) return;

    setSearch('');
    setMessages([]);
    setNoAccounts(false);
    accountColorMap.current.clear();

    (async () => {
      setAccountsLoading(true);
      try {
        const response = await emailService.listAccounts();
        const activeAccounts = response.data.filter(a => a.isActive);
        setAccounts(activeAccounts);
        accountIdsRef.current = activeAccounts.map(a => a.id);

        if (activeAccounts.length === 0) {
          setNoAccounts(true);
          setAccountsLoading(false);
          return;
        }

        // Fetch initial recent messages
        await fetchMessages(
          activeAccounts.map(a => a.id),
          ''
        );
      } catch {
        toast.error('Erro ao carregar contas de email.');
      } finally {
        setAccountsLoading(false);
      }
    })();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchMessages = useCallback(
    async (accountIds: string[], searchTerm: string) => {
      if (accountIds.length === 0) return;

      // API requires min 2 chars for search
      if (searchTerm.length === 1) return;

      setIsLoading(true);
      try {
        const response = await emailService.listCentralInbox({
          accountIds,
          search: searchTerm || undefined,
          limit: 15,
        });
        setMessages(response.data);
      } catch {
        toast.error('Erro ao buscar emails.');
        setMessages([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Debounced search
  useEffect(() => {
    if (!open || accountsLoading || noAccounts) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchMessages(accountIdsRef.current, search);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [search, open, accountsLoading, noAccounts, fetchMessages]);

  function handleSelect(message: EmailMessageListItem) {
    onSelect(message.id, message.subject || '(Sem assunto)');
    onOpenChange(false);
  }

  if (accountsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (noAccounts) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-2">
        <Mail className="h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          Nenhuma conta de email configurada
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={searchInputRef}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por assunto, remetente..."
          className="pl-9"
        />
      </div>

      {/* Results */}
      <div className="max-h-72 overflow-y-auto space-y-1 -mx-1 px-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length > 0 ? (
          messages.map(message => (
            <button
              key={message.id}
              type="button"
              className={cn(
                'w-full flex flex-col gap-0.5 rounded-lg px-3 py-2.5 text-left hover:bg-muted transition-colors border border-transparent hover:border-border',
                !message.isRead && 'bg-primary/[0.03]'
              )}
              onClick={() => handleSelect(message)}
            >
              {/* Top row: account dot + from + date */}
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'shrink-0 h-2 w-2 rounded-full',
                    getAccountDotColor(message.accountId)
                  )}
                  title={
                    accounts.find(a => a.id === message.accountId)?.address ??
                    ''
                  }
                />
                <span
                  className={cn(
                    'text-sm truncate flex-1',
                    !message.isRead ? 'font-semibold' : 'font-medium'
                  )}
                >
                  {message.fromName || message.fromAddress}
                </span>
                {message.fromName && (
                  <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                    &lt;{message.fromAddress}&gt;
                  </span>
                )}
                <span className="text-xs text-muted-foreground shrink-0 ml-auto">
                  {formatShortDate(message.receivedAt)}
                </span>
              </div>
              {/* Subject row */}
              <div className="flex items-center gap-2 pl-4">
                <span
                  className={cn(
                    'text-xs line-clamp-1 flex-1',
                    !message.isRead
                      ? 'font-medium text-foreground'
                      : 'text-muted-foreground'
                  )}
                >
                  {message.subject || '(Sem assunto)'}
                </span>
                {!message.isRead && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] shrink-0 border-0 bg-blue-50 text-blue-700 dark:bg-blue-500/8 dark:text-blue-300"
                  >
                    Novo
                  </Badge>
                )}
              </div>
            </button>
          ))
        ) : search.length === 1 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Digite ao menos 2 caracteres para buscar
          </p>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum email encontrado
          </p>
        )}
      </div>
    </>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function IntegrationSearchModal({
  open,
  onOpenChange,
  type,
  onSelect,
}: IntegrationSearchModalProps) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL');
  const [results, setResults] = useState<FinanceEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset state when modal opens/closes (for FINANCE_ENTRY)
  useEffect(() => {
    if (open && type === 'FINANCE_ENTRY') {
      setSearch('');
      setTypeFilter('ALL');
      setResults([]);
      // Initial fetch
      fetchEntries('', 'ALL');
      // Focus search input
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
    if (open && type === 'EMAIL') {
      // Focus search input for email
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchEntries = useCallback(
    async (searchTerm: string, entryType: TypeFilter) => {
      if (type !== 'FINANCE_ENTRY') return;

      setIsLoading(true);
      try {
        const response = await financeEntriesService.list({
          search: searchTerm || undefined,
          type: entryType === 'ALL' ? undefined : entryType,
          perPage: 15,
        });
        setResults(response.entries);
      } catch {
        toast.error('Erro ao buscar entradas financeiras.');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [type]
  );

  // Debounced search (for FINANCE_ENTRY)
  useEffect(() => {
    if (!open || type !== 'FINANCE_ENTRY') return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchEntries(search, typeFilter);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [search, typeFilter, open, fetchEntries, type]);

  function handleSelect(entry: FinanceEntry) {
    onSelect(entry.id, entry.description);
    onOpenChange(false);
  }

  // Modal config per type
  const modalConfig: Record<string, { title: string } | undefined> = {
    FINANCE_ENTRY: { title: 'Vincular Entrada Financeira' },
    EMAIL: { title: 'Vincular Email' },
  };

  const config = modalConfig[type];
  if (!config) return null;

  const typeFilters: { value: TypeFilter; label: string }[] = [
    { value: 'ALL', label: 'Todos' },
    { value: 'PAYABLE', label: 'A Pagar' },
    { value: 'RECEIVABLE', label: 'A Receber' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
        </DialogHeader>

        {type === 'EMAIL' ? (
          <EmailSearchContent
            open={open}
            onSelect={onSelect}
            onOpenChange={onOpenChange}
            searchInputRef={searchInputRef}
          />
        ) : (
          <>
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por descrição, fornecedor ou cliente..."
                className="pl-9"
              />
            </div>

            {/* Type filter tabs */}
            <div className="flex gap-1">
              {typeFilters.map(filter => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setTypeFilter(filter.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                    typeFilter === filter.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Results */}
            <div className="max-h-72 overflow-y-auto space-y-1 -mx-1 px-1">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : results.length > 0 ? (
                results.map(entry => (
                  <button
                    key={entry.id}
                    type="button"
                    className="w-full flex flex-col gap-1 rounded-lg px-3 py-2.5 text-left hover:bg-muted transition-colors border border-transparent hover:border-border"
                    onClick={() => handleSelect(entry)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium truncate flex-1">
                        {entry.description}
                      </span>
                      <Badge
                        variant="secondary"
                        className={cn(
                          'text-[10px] shrink-0 border-0',
                          getStatusColor(entry.status)
                        )}
                      >
                        {FINANCE_ENTRY_STATUS_LABELS[entry.status]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span
                        className={cn(
                          'font-medium',
                          entry.type === 'PAYABLE'
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-emerald-600 dark:text-emerald-400'
                        )}
                      >
                        {FINANCE_ENTRY_TYPE_LABELS[entry.type]}
                      </span>
                      {(entry.supplierName || entry.customerName) && (
                        <>
                          <span className="text-muted-foreground/50">·</span>
                          <span className="truncate">
                            {entry.supplierName || entry.customerName}
                          </span>
                        </>
                      )}
                      <span className="text-muted-foreground/50">·</span>
                      <span className="shrink-0">
                        Venc. {formatDate(entry.dueDate)}
                      </span>
                      <span className="text-muted-foreground/50">·</span>
                      <span className="shrink-0 font-medium">
                        {formatCurrency(entry.expectedAmount)}
                      </span>
                    </div>
                  </button>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma entrada encontrada
                </p>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
