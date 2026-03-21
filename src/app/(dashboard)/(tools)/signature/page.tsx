'use client';

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageActionBar } from '@/components/layout/page-action-bar';
import { ProtectedRoute } from '@/components/auth/protected-route';
import type { HeaderButton } from '@/components/layout/types/header.types';
import { usePermissions } from '@/hooks/use-permissions';
import { TOOLS_PERMISSIONS } from '@/config/rbac/permission-codes';
import { useInfiniteQuery } from '@tanstack/react-query';
import { envelopesService } from '@/services/signature';
import type { SignatureEnvelope, EnvelopeStatus } from '@/types/signature';
import {
  FileSignature,
  Shield,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  FileKey,
  LayoutTemplate,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const STATUS_CONFIG: Record<
  EnvelopeStatus,
  { label: string; color: string; icon: React.ReactNode }
> = {
  DRAFT: { label: 'Rascunho', color: 'bg-slate-100 text-slate-700 dark:bg-slate-500/8 dark:text-slate-300', icon: <Clock className="h-3.5 w-3.5" /> },
  PENDING: { label: 'Pendente', color: 'bg-amber-50 text-amber-700 dark:bg-amber-500/8 dark:text-amber-300', icon: <Send className="h-3.5 w-3.5" /> },
  IN_PROGRESS: { label: 'Em Andamento', color: 'bg-blue-50 text-blue-700 dark:bg-blue-500/8 dark:text-blue-300', icon: <FileSignature className="h-3.5 w-3.5" /> },
  COMPLETED: { label: 'Concluído', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/8 dark:text-emerald-300', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  CANCELLED: { label: 'Cancelado', color: 'bg-slate-100 text-slate-500 dark:bg-slate-500/8 dark:text-slate-400', icon: <XCircle className="h-3.5 w-3.5" /> },
  EXPIRED: { label: 'Expirado', color: 'bg-rose-50 text-rose-700 dark:bg-rose-500/8 dark:text-rose-300', icon: <Clock className="h-3.5 w-3.5" /> },
  REJECTED: { label: 'Rejeitado', color: 'bg-rose-50 text-rose-700 dark:bg-rose-500/8 dark:text-rose-300', icon: <XCircle className="h-3.5 w-3.5" /> },
};

function EnvelopeCard({ envelope }: { envelope: SignatureEnvelope }) {
  const router = useRouter();
  const config = STATUS_CONFIG[envelope.status];
  const signedCount = envelope.signers?.filter((s) => s.status === 'SIGNED').length ?? 0;
  const totalSigners = envelope.signers?.length ?? 0;

  return (
    <Card
      className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
      onClick={() => router.push(`/signature/envelopes/${envelope.id}`)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">{envelope.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {envelope.sourceModule} / {envelope.sourceEntityType}
          </p>
        </div>
        <Badge variant="secondary" className={`text-xs shrink-0 gap-1 ${config.color}`}>
          {config.icon}
          {config.label}
        </Badge>
      </div>
      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
        <span>{signedCount}/{totalSigners} assinatura(s)</span>
        <span>{new Date(envelope.createdAt).toLocaleDateString('pt-BR')}</span>
      </div>
    </Card>
  );
}

export default function SignatureDashboardPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(TOOLS_PERMISSIONS.SIGNATURE.ENVELOPES.REGISTER);
  const canViewCerts = hasPermission(TOOLS_PERMISSIONS.SIGNATURE.CERTIFICATES.ACCESS);

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['signature', 'envelopes', 'dashboard'],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await envelopesService.listEnvelopes({
        page: pageParam,
        limit: 20,
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

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of envelopes) {
      counts[e.status] = (counts[e.status] ?? 0) + 1;
    }
    return counts;
  }, [envelopes]);

  return (
    <ProtectedRoute requiredPermission={TOOLS_PERMISSIONS.SIGNATURE.ENVELOPES.ACCESS}>
      <div className="flex flex-col h-full">
        <PageActionBar
          breadcrumbItems={[{ label: 'Assinatura Digital' }]}
          buttons={[
            ...(canViewCerts
              ? [{ title: 'Certificados', icon: FileKey, onClick: () => router.push('/signature/certificates'), variant: 'outline' as const }]
              : []),
            ...(canCreate
              ? [{ title: 'Novo Envelope', icon: Plus, onClick: () => router.push('/signature/envelopes/new') }]
              : []),
          ]}
        />

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Status summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'] as EnvelopeStatus[]).map(
              (status) => {
                const config = STATUS_CONFIG[status];
                return (
                  <Card key={status} className="p-3">
                    <div className="flex items-center gap-2 mb-1">
                      {config.icon}
                      <span className="text-xs text-muted-foreground">{config.label}</span>
                    </div>
                    <p className="text-2xl font-semibold">{statusCounts[status] ?? 0}</p>
                  </Card>
                );
              },
            )}
          </div>

          {/* Quick links */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-9 px-2.5"
              onClick={() => router.push('/signature/envelopes')}
            >
              <FileSignature className="h-4 w-4 mr-1.5" />
              Todos os Envelopes
            </Button>
          </div>

          {/* Recent envelopes */}
          <div>
            <h2 className="text-sm font-medium mb-3">Envelopes Recentes</h2>
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
                {canCreate && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => router.push('/signature/envelopes/new')}
                  >
                    Criar Primeiro Envelope
                  </Button>
                )}
              </Card>
            ) : (
              <div className="space-y-2">
                {envelopes.map((envelope) => (
                  <EnvelopeCard key={envelope.id} envelope={envelope} />
                ))}
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
      </div>
    </ProtectedRoute>
  );
}
