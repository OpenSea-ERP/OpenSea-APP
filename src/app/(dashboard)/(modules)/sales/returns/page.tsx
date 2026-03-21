'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { SearchBar } from '@/components/layout/search-bar';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { Badge } from '@/components/ui/badge';
import {
  CoreProvider,
  EntityCard,
  EntityGrid,
} from '@/core';
import { usePermissions } from '@/hooks/use-permissions';
import { useReturnsInfinite } from '@/hooks/sales/use-returns';
import { PERMISSIONS } from '@/config/rbac/permission-codes';
import type { OrderReturnDTO } from '@/types/sales';
import { RotateCcw } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';

const STATUS_LABELS: Record<string, string> = {
  REQUESTED: 'Solicitada',
  APPROVED: 'Aprovada',
  RECEIVING: 'Recebendo',
  RECEIVED: 'Recebida',
  CREDIT_ISSUED: 'Crédito emitido',
  EXCHANGE_COMPLETED: 'Troca concluída',
  REJECTED: 'Rejeitada',
  CANCELLED: 'Cancelada',
};

const REASON_LABELS: Record<string, string> = {
  DEFECTIVE: 'Defeituoso',
  WRONG_ITEM: 'Item errado',
  CHANGED_MIND: 'Desistência',
  DAMAGED: 'Danificado',
  NOT_AS_DESCRIBED: 'Diferente do descrito',
  OTHER: 'Outro',
};

const TYPE_LABELS: Record<string, string> = {
  FULL_RETURN: 'Devolução total',
  PARTIAL_RETURN: 'Devolução parcial',
  EXCHANGE: 'Troca',
};

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'REQUESTED', label: 'Solicitada' },
  { value: 'APPROVED', label: 'Aprovada' },
  { value: 'RECEIVING', label: 'Recebendo' },
  { value: 'RECEIVED', label: 'Recebida' },
  { value: 'REJECTED', label: 'Rejeitada' },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export default function ReturnsPage() {
  const { hasPermission } = usePermissions();
  const canView = hasPermission(PERMISSIONS.SALES.ORDERS.ACCESS);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const observerRef = useRef<HTMLDivElement>(null);

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useReturnsInfinite({
    search: search || undefined,
    status: statusFilter || undefined,
  });

  const returns = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data],
  );

  const getStatusVariant = useCallback(
    (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
      switch (status) {
        case 'APPROVED':
        case 'RECEIVED':
        case 'CREDIT_ISSUED':
        case 'EXCHANGE_COMPLETED':
          return 'default';
        case 'REQUESTED':
        case 'RECEIVING':
          return 'secondary';
        case 'REJECTED':
        case 'CANCELLED':
          return 'destructive';
        default:
          return 'outline';
      }
    },
    [],
  );

  return (
    <CoreProvider>
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbs={[
              { label: 'Vendas', href: '/sales' },
              { label: 'Devoluções' },
            ]}
          />
        </PageHeader>

        <PageBody>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Buscar devoluções por número..."
          />

          {isLoading ? (
            <GridLoading />
          ) : error ? (
            <GridError />
          ) : (
            <EntityGrid
              items={returns}
              getId={(ret) => ret.id}
              toolbarStart={
                <FilterDropdown
                  label="Status"
                  options={STATUS_OPTIONS}
                  value={statusFilter}
                  onChange={setStatusFilter}
                />
              }
              renderItem={(ret: OrderReturnDTO) => (
                <EntityCard>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                        <RotateCcw className="h-5 w-5 text-orange-500" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {ret.returnNumber}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {TYPE_LABELS[ret.type]} -{' '}
                          {REASON_LABELS[ret.reason]}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {ret.refundAmount > 0 && (
                        <p className="font-medium text-sm">
                          {formatCurrency(ret.refundAmount)}
                        </p>
                      )}
                      <Badge
                        variant={getStatusVariant(ret.status)}
                        className="text-xs"
                      >
                        {STATUS_LABELS[ret.status] ?? ret.status}
                      </Badge>
                    </div>
                  </div>
                </EntityCard>
              )}
              onLoadMore={hasNextPage ? () => fetchNextPage() : undefined}
              isLoadingMore={isFetchingNextPage}
              observerRef={observerRef}
              emptyState={{
                icon: RotateCcw,
                title: 'Nenhuma devolução encontrada',
                description: 'As devoluções de pedidos aparecerão aqui.',
              }}
            />
          )}

          <div ref={observerRef} className="h-1" />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
