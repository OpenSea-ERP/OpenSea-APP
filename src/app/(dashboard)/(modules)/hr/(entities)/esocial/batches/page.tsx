'use client';

import { useCallback, useRef } from 'react';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  Package,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

import { PageActionBar } from '@/components/layout/page-action-bar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePermissions } from '@/hooks/use-permissions';
import { esocialService } from '@/services/hr/esocial.service';
import { toast } from 'sonner';
import type { EsocialBatchListItem } from '@/types/esocial';
import { EsocialStatusChip } from '@/components/hr/esocial-status-chip';
import { EsocialEnvironmentBadge } from '@/components/hr/esocial-environment-badge';

// ============================
// Batch Row
// ============================

interface BatchRowProps {
  batch: EsocialBatchListItem;
  onCheckStatus: (id: string) => void;
  isChecking: boolean;
}

function BatchRow({ batch, onCheckStatus, isChecking }: BatchRowProps) {
  const canCheck =
    batch.status === 'TRANSMITTED' || batch.status === 'TRANSMITTING';

  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium font-mono">
            {batch.id.slice(0, 8)}...
          </span>
          <EsocialStatusChip
            status={batch.status}
            returnMessage={batch.errorMessage}
          />
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          {batch.protocol && (
            <span className="font-mono">Protocolo: {batch.protocol}</span>
          )}
          <span>{batch.totalEvents} evento(s)</span>
          {batch.transmittedAt && (
            <span>
              Transmitido em{' '}
              {new Date(batch.transmittedAt).toLocaleDateString('pt-BR')}
            </span>
          )}
          {!batch.transmittedAt && (
            <span>
              Criado em {new Date(batch.createdAt).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>
      </div>

      {/* Counts */}
      <div className="flex items-center gap-3 text-xs shrink-0">
        {batch.acceptedCount > 0 && (
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
            <CheckCircle className="h-3.5 w-3.5" />
            {batch.acceptedCount}
          </span>
        )}
        {batch.rejectedCount > 0 && (
          <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
            <XCircle className="h-3.5 w-3.5" />
            {batch.rejectedCount}
          </span>
        )}
      </div>

      {/* Check Status Button */}
      {canCheck && (
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2.5 shrink-0"
          onClick={() => onCheckStatus(batch.id)}
          disabled={isChecking}
        >
          {isChecking ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-1.5" />
          )}
          Verificar Status
        </Button>
      )}
    </div>
  );
}

// ============================
// Main Batches Page
// ============================

export default function EsocialBatchesPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const checkingBatchRef = useRef<string | null>(null);

  // Infinite query for batches
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['esocial', 'batches'],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await esocialService.listBatches({
        page: pageParam,
        perPage: 20,
      });
      return response;
    },
    getNextPageParam: lastPage => {
      if (lastPage.meta.page < lastPage.meta.pages) {
        return lastPage.meta.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
  });

  // IntersectionObserver for infinite scroll
  const observerCallback = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  const sentinelCallbackRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return;
      const observer = new IntersectionObserver(observerCallback, {
        threshold: 0.1,
      });
      observer.observe(node);
      return () => observer.disconnect();
    },
    [observerCallback]
  );

  // Check batch status mutation
  const checkStatusMutation = useMutation({
    mutationFn: (batchId: string) => {
      checkingBatchRef.current = batchId;
      return esocialService.checkBatchStatus(batchId);
    },
    onSuccess: result => {
      toast.success(
        `Lote verificado: ${result.acceptedCount} aceito(s), ${result.rejectedCount} rejeitado(s)`
      );
      checkingBatchRef.current = null;
      queryClient.invalidateQueries({ queryKey: ['esocial'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao verificar status do lote');
      checkingBatchRef.current = null;
    },
  });

  const handleCheckStatus = useCallback(
    (batchId: string) => {
      checkStatusMutation.mutate(batchId);
    },
    [checkStatusMutation]
  );

  // Flatten pages
  const batches = data?.pages.flatMap(page => page.batches) ?? [];
  const totalCount = data?.pages[0]?.meta.total ?? 0;

  return (
    <div className="space-y-6" data-testid="esocial-batches-page">
      <PageActionBar
        breadcrumbItems={[
          { label: 'RH', href: '/hr' },
          { label: 'eSocial', href: '/hr/esocial' },
          { label: 'Lotes', href: '/hr/esocial/batches' },
        ]}
        hasPermission={hasPermission}
      />

      {/* Summary */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-500/8">
            <Package className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Lotes de Transmissão</h2>
            <p className="text-sm text-muted-foreground">
              {totalCount} lote(s) encontrado(s)
            </p>
          </div>
        </div>
        <EsocialEnvironmentBadge />
      </div>

      {/* Batch List */}
      <Card className="bg-white dark:bg-slate-800/60 border border-border overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <AlertTriangle className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm">Erro ao carregar lotes</p>
          </div>
        ) : batches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Package className="h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm">Nenhum lote encontrado</p>
          </div>
        ) : (
          <>
            {batches.map(batch => (
              <BatchRow
                key={batch.id}
                batch={batch}
                onCheckStatus={handleCheckStatus}
                isChecking={
                  checkStatusMutation.isPending &&
                  checkingBatchRef.current === batch.id
                }
              />
            ))}

            {/* Infinite scroll sentinel */}
            <div ref={sentinelCallbackRef} className="h-1" />

            {isFetchingNextPage && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
