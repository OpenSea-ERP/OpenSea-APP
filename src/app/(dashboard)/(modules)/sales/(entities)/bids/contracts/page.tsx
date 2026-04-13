'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { Header } from '@/components/layout/header';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { useBidContracts } from '@/hooks/sales/use-bids';
import type { BidContractStatus } from '@/types/sales';
import { BID_CONTRACT_STATUS_LABELS } from '@/types/sales';
import { Calendar, DollarSign, FileCheck } from 'lucide-react';
import { Suspense, useMemo, useState } from 'react';

function formatCurrency(value: number | null) {
  if (value === null || value === undefined) return '-';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function BidContractsContent() {
  const [statusFilter, setStatusFilter] = useState<BidContractStatus | ''>('');

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useBidContracts({
    status: statusFilter || undefined,
  });

  const contracts = useMemo(
    () => data?.pages.flatMap(p => p.contracts) ?? [],
    [data]
  );

  const statusOptions = Object.entries(BID_CONTRACT_STATUS_LABELS).map(
    ([value, label]) => ({ value, label })
  );

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Vendas' },
            { label: 'Licitações', href: '/sales/bids' },
            { label: 'Contratos' },
          ]}
        />
      </PageHeader>
      <PageBody>
        <Header
          title="Contratos de Licitação"
          description="Contratos firmados a partir de licitações vencidas"
        />

        <div className="flex gap-2 mb-4">
          <FilterDropdown
            label="Status"
            value={statusFilter}
            options={statusOptions}
            onChange={v => setStatusFilter(v as BidContractStatus | '')}
          />
        </div>

        {isLoading ? (
          <GridLoading />
        ) : error ? (
          <GridError message="Erro ao carregar contratos" />
        ) : contracts.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-12">
            Nenhum contrato encontrado
          </p>
        ) : (
          <div className="space-y-2">
            {contracts.map(contract => (
              <Card key={contract.id} className="bg-white/5 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/10">
                      <FileCheck className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {contract.contractNumber}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Licitação ID: {contract.bidId.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                  <Badge>
                    {BID_CONTRACT_STATUS_LABELS[contract.status] ??
                      contract.status}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5" />{' '}
                    {formatCurrency(contract.totalValue)}
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5" /> Restante:{' '}
                    {formatCurrency(contract.remainingValue)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />{' '}
                    {formatDate(contract.startDate)} -{' '}
                    {formatDate(contract.endDate)}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}

        {hasNextPage && (
          <div className="flex justify-center py-4">
            <button
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {isFetchingNextPage ? 'Carregando...' : 'Carregar mais'}
            </button>
          </div>
        )}
      </PageBody>
    </PageLayout>
  );
}

export default function BidContractsPage() {
  return (
    <Suspense fallback={<GridLoading />}>
      <BidContractsContent />
    </Suspense>
  );
}
