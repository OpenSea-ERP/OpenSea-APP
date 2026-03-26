'use client';

import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useDebounce } from '@/hooks/use-debounce';
import { customersService } from '@/services/sales';
import { useQuery } from '@tanstack/react-query';
import { Search, User, X, Phone, FileText } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SelectedCustomer {
  id: string;
  name: string;
  document?: string;
  phone?: string;
}

interface CustomerSelectorProps {
  selectedCustomer: SelectedCustomer | null;
  onSelectCustomer: (customer: SelectedCustomer | null) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CustomerSelector({
  selectedCustomer,
  onSelectCustomer,
}: CustomerSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data } = useQuery({
    queryKey: ['pos-customer-search', debouncedSearch],
    queryFn: () =>
      customersService.list({
        search: debouncedSearch || undefined,
        page: 1,
        limit: 5,
      }),
    enabled: !!debouncedSearch && isSearching,
  });

  const customers = data?.data ?? [];

  const handleSelect = useCallback(
    (customer: {
      id: string;
      name: string;
      document?: string;
      phone?: string;
    }) => {
      onSelectCustomer({
        id: customer.id,
        name: customer.name,
        document: customer.document,
        phone: customer.phone,
      });
      setSearchQuery('');
      setIsSearching(false);
    },
    [onSelectCustomer]
  );

  const handleClear = useCallback(() => {
    onSelectCustomer(null);
    setSearchQuery('');
    setIsSearching(false);
  }, [onSelectCustomer]);

  // Selected customer card
  if (selectedCustomer && !isSearching) {
    return (
      <Card className="p-3 bg-white dark:bg-slate-800/60 border border-border">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">
              {selectedCustomer.name}
            </p>
            {selectedCustomer.document && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <FileText className="h-3 w-3" />
                <span>{selectedCustomer.document}</span>
              </div>
            )}
            {selectedCustomer.phone && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" />
                <span>{selectedCustomer.phone}</span>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-rose-500"
            onClick={handleClear}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </Card>
    );
  }

  // Search mode
  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar cliente..."
          className="pl-8 h-9 text-sm"
          value={searchQuery}
          onChange={e => {
            setSearchQuery(e.target.value);
            setIsSearching(true);
          }}
          onFocus={() => setIsSearching(true)}
        />
      </div>

      {isSearching && debouncedSearch && customers.length > 0 && (
        <div className="rounded-lg border border-border bg-white dark:bg-slate-800/60 overflow-hidden shadow-md">
          {customers.map(customer => (
            <button
              key={customer.id}
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 transition-colors border-b border-border last:border-b-0"
              onClick={() =>
                handleSelect({
                  id: customer.id,
                  name: customer.name,
                  document: customer.document ?? undefined,
                  phone: customer.phone ?? undefined,
                })
              }
            >
              <p className="font-medium truncate">{customer.name}</p>
              {customer.document && (
                <p className="text-xs text-muted-foreground">
                  {customer.document}
                </p>
              )}
            </button>
          ))}
        </div>
      )}

      {isSearching && debouncedSearch && customers.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-2">
          Nenhum cliente encontrado
        </p>
      )}
    </div>
  );
}
