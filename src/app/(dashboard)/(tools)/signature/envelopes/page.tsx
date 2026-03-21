'use client';

import { useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PageActionBar } from '@/components/layout/page-action-bar';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { usePermissions } from '@/hooks/use-permissions';
import { TOOLS_PERMISSIONS } from '@/config/rbac/permission-codes';
import { useInfiniteQuery } from '@tanstack/react-query';
import { envelopesService } from '@/services/signature';
import type { SignatureEnvelope, EnvelopeStatus } from '@/types/signature';
import {
  FileSignature,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const STATUS_CONFIG: Record<
  EnvelopeStatus,
  { label: string; color: string }
> = {
  DRAFT: { label: 'Rascunho', color: 'bg-slate-100 text-slate-700 dark:bg-slate-500/8 dark:text-slate-300' },
  PENDING: { label: 'Pendente', color: 'bg-amber-50 text-amber-700 dark:bg-amber-500/8 dark:text-amber-300' },
  IN_PROGRESS: { label: 'Em Andamento', color: 'bg-blue-50 text-blue-700 dark:bg-blue-500/8 dark:text-blue-300' },
  COMPLETED: { label: 'Concluído', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/8 dark:text-emerald-300' },
  CANCELLED: { label: 'Cancelado', color: 'bg-slate-100 text-slate-500 dark:bg-slate-500/8 dark:text-slate-400' },
  EXPIRED: { label: 'Expirado', color: 'bg-rose-50 text-rose-700 dark:bg-rose-500/8 dark:text-rose-300' },
  REJECTED: { label: 'Rejeitado', color: 'bg-rose-50 text-rose-700 dark:bg-rose-500/8 dark:text-rose-300' },
};

export default function EnvelopesListPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(TOOLS_PERMISSIONS.SIGNATURE.ENVELOPES.REGISTER);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['signature', 'envelopes', search, statusFilter],
      queryFn: async ({ pageParam = 1 }) => {
        const response = await envelopesService.listEnvelopes({
          page: pageParam,
          limit: 20,
          search: search || undefined,
          status: statusFilter || undefined,
        });
        return response;
      },
      getNextPageParam: (lastPage) =>
        lastPage.meta.page < lastPage.meta.totalPages
          ? lastPage.meta.page + 1
          : undefined,
      initialPageParam: 1,
    });

  const envelopes = useMemo(
    () => data?.pages.flatMap((p) => p.envelopes) ?? [],
    [data],
  );

  const handleEnvelopeClick = useCallback(
    (id: string) => router.push(`/signature/envelopes/${id}`),
    [router],
  );

  return (
    <ProtectedRoute requiredPermission={TOOLS_PERMISSIONS.SIGNATURE.ENVELOPES.ACCESS}>
      <div className="flex flex-col h-full">
        <PageActionBar
          breadcrumbItems={[
            { label: 'Assinatura Digital', href: '/signature' },
            { label: 'Envelopes' },
          ]}
          buttons={canCreate ? [{ title: 'Novo Envelope', icon: Plus, onClick: () => router.push('/signature/envelopes/new') }] : []}
        />

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Filters */}
          <div className="flex gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar envelopes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <div className="flex gap-1">
              {(['', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'] as const).map(
                (s) => (
                  <Button
                    key={s}
                    variant={statusFilter === s ? 'default' : 'outline'}
                    size="sm"
                    className="h-9 px-2.5 text-xs"
                    onClick={() => setStatusFilter(s)}
                  >
                    {s === '' ? 'Todos' : STATUS_CONFIG[s].label}
                  </Button>
                ),
              )}
            </div>
          </div>

          {/* Envelope list */}
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : envelopes.length === 0 ? (
            <Card className="p-8 text-center">
              <FileSignature className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Nenhum envelope encontrado
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {envelopes.map((envelope) => {
                const config = STATUS_CONFIG[envelope.status];
                const signedCount =
                  envelope.signers?.filter((s) => s.status === 'SIGNED').length ?? 0;
                const totalSigners = envelope.signers?.length ?? 0;

                return (
                  <Card
                    key={envelope.id}
                    className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => handleEnvelopeClick(envelope.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">
                          {envelope.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {envelope.sourceModule} / {envelope.sourceEntityType}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className={`text-xs shrink-0 ${config.color}`}
                      >
                        {config.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{signedCount}/{totalSigners} assinatura(s)</span>
                      <span>Nível: {envelope.signatureLevel}</span>
                      <span>
                        {new Date(envelope.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </Card>
                );
              })}
              {hasNextPage && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? 'Carregando...' : 'Carregar mais'}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
