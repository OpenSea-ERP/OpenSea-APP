'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageActionBar } from '@/components/layout/page-action-bar';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { usePermissions } from '@/hooks/use-permissions';
import { TOOLS_PERMISSIONS } from '@/config/rbac/permission-codes';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { certificatesService } from '@/services/signature';
import type { DigitalCertificate, CertificateStatus } from '@/types/signature';
import {
  FileKey,
  Plus,
  Trash2,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const STATUS_BADGE: Record<CertificateStatus, { label: string; color: string }> = {
  ACTIVE: { label: 'Ativo', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/8 dark:text-emerald-300' },
  EXPIRED: { label: 'Expirado', color: 'bg-rose-50 text-rose-700 dark:bg-rose-500/8 dark:text-rose-300' },
  REVOKED: { label: 'Revogado', color: 'bg-slate-100 text-slate-500 dark:bg-slate-500/8 dark:text-slate-400' },
  PENDING_ACTIVATION: { label: 'Pendente', color: 'bg-amber-50 text-amber-700 dark:bg-amber-500/8 dark:text-amber-300' },
};

const TYPE_LABEL: Record<string, string> = {
  A1: 'A1 (Servidor)',
  A3: 'A3 (Token/Smartcard)',
  CLOUD_NEOID: 'Nuvem (NeoID)',
  CLOUD_BIRDID: 'Nuvem (BirdID)',
  CLOUD_OTHER: 'Nuvem (Outro)',
};

function CertificateCard({
  cert,
  canDelete,
  onDelete,
}: {
  cert: DigitalCertificate;
  canDelete: boolean;
  onDelete: (id: string) => void;
}) {
  const statusConfig = STATUS_BADGE[cert.status];

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/8">
            <FileKey className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="font-medium text-sm">{cert.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {TYPE_LABEL[cert.type] ?? cert.type}
              {cert.subjectCnpj && ` - CNPJ: ${cert.subjectCnpj}`}
            </p>
            {cert.issuerName && (
              <p className="text-xs text-muted-foreground">
                Emissor: {cert.issuerName}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className={`text-xs ${statusConfig.color}`}>
            {statusConfig.label}
          </Badge>
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50"
              onClick={() => onDelete(cert.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
        {cert.validUntil && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Válido até: {new Date(cert.validUntil).toLocaleDateString('pt-BR')}
          </span>
        )}
        {cert.daysUntilExpiry !== null && cert.daysUntilExpiry <= 30 && (
          <span className="flex items-center gap-1 text-amber-600">
            <AlertTriangle className="h-3 w-3" />
            {cert.daysUntilExpiry} dias restantes
          </span>
        )}
        {cert.isDefault && (
          <span className="flex items-center gap-1 text-blue-600">
            <CheckCircle2 className="h-3 w-3" />
            Padrão
          </span>
        )}
      </div>
    </Card>
  );
}

export default function CertificatesPage() {
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(TOOLS_PERMISSIONS.SIGNATURE.CERTIFICATES.REGISTER);
  const canDelete = hasPermission(TOOLS_PERMISSIONS.SIGNATURE.CERTIFICATES.REMOVE);
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery({
      queryKey: ['signature', 'certificates'],
      queryFn: async ({ pageParam = 1 }) => {
        const response = await certificatesService.listCertificates({
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

  const certificates = useMemo(
    () => data?.pages.flatMap((p) => p.certificates) ?? [],
    [data],
  );

  const deleteMutation = useMutation({
    mutationFn: (id: string) => certificatesService.deleteCertificate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signature', 'certificates'] });
      toast.success('Certificado excluído com sucesso');
      setDeleteId(null);
    },
    onError: () => {
      toast.error('Erro ao excluir certificado');
    },
  });

  return (
    <ProtectedRoute requiredPermission={TOOLS_PERMISSIONS.SIGNATURE.CERTIFICATES.ACCESS}>
      <div className="flex flex-col h-full">
        <PageActionBar
          breadcrumbItems={[
            { label: 'Assinatura Digital', href: '/signature' },
            { label: 'Certificados' },
          ]}
          buttons={canCreate ? [{ title: 'Novo Certificado', icon: Plus, onClick: () => {} }] : []}
        />

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : certificates.length === 0 ? (
            <Card className="p-8 text-center">
              <Shield className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                Nenhum certificado digital cadastrado
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {certificates.map((cert) => (
                <CertificateCard
                  key={cert.id}
                  cert={cert}
                  canDelete={canDelete}
                  onDelete={setDeleteId}
                />
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

        <VerifyActionPinModal
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onSuccess={() => {
            if (deleteId) deleteMutation.mutate(deleteId);
          }}
          title="Confirmar Exclusão"
          description="Digite seu PIN de ação para excluir este certificado."
        />
      </div>
    </ProtectedRoute>
  );
}
