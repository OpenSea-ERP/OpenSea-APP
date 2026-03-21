'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageActionBar } from '@/components/layout/page-action-bar';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { usePermissions } from '@/hooks/use-permissions';
import { TOOLS_PERMISSIONS } from '@/config/rbac/permission-codes';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { envelopesService } from '@/services/signature';
import type { SignatureEnvelopeSigner, SignatureAuditEvent, EnvelopeStatus, SignerStatus } from '@/types/signature';
import {
  FileSignature,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Mail,
  Shield,
  Bell,
  Trash2,
  Activity,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useState } from 'react';

const STATUS_CONFIG: Record<EnvelopeStatus, { label: string; color: string }> = {
  DRAFT: { label: 'Rascunho', color: 'bg-slate-100 text-slate-700 dark:bg-slate-500/8 dark:text-slate-300' },
  PENDING: { label: 'Pendente', color: 'bg-amber-50 text-amber-700 dark:bg-amber-500/8 dark:text-amber-300' },
  IN_PROGRESS: { label: 'Em Andamento', color: 'bg-blue-50 text-blue-700 dark:bg-blue-500/8 dark:text-blue-300' },
  COMPLETED: { label: 'Concluído', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/8 dark:text-emerald-300' },
  CANCELLED: { label: 'Cancelado', color: 'bg-slate-100 text-slate-500 dark:bg-slate-500/8 dark:text-slate-400' },
  EXPIRED: { label: 'Expirado', color: 'bg-rose-50 text-rose-700 dark:bg-rose-500/8 dark:text-rose-300' },
  REJECTED: { label: 'Rejeitado', color: 'bg-rose-50 text-rose-700 dark:bg-rose-500/8 dark:text-rose-300' },
};

const SIGNER_STATUS_CONFIG: Record<SignerStatus, { label: string; color: string }> = {
  PENDING: { label: 'Pendente', color: 'bg-slate-100 text-slate-600' },
  NOTIFIED: { label: 'Notificado', color: 'bg-amber-50 text-amber-700' },
  VIEWED: { label: 'Visualizou', color: 'bg-blue-50 text-blue-700' },
  SIGNED: { label: 'Assinou', color: 'bg-emerald-50 text-emerald-700' },
  REJECTED: { label: 'Rejeitou', color: 'bg-rose-50 text-rose-700' },
  EXPIRED: { label: 'Expirado', color: 'bg-slate-100 text-slate-500' },
};

const ROLE_LABEL: Record<string, string> = {
  SIGNER: 'Assinante',
  APPROVER: 'Aprovador',
  WITNESS: 'Testemunha',
  REVIEWER: 'Revisor',
};

function SignerCard({ signer }: { signer: SignatureEnvelopeSigner }) {
  const config = SIGNER_STATUS_CONFIG[signer.status];
  const name = signer.externalName ?? signer.userId ?? 'Desconhecido';
  const email = signer.externalEmail;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border">
      <div className="flex items-center gap-3">
        <div className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
          <User className="h-4 w-4 text-slate-500" />
        </div>
        <div>
          <p className="text-sm font-medium">{name}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {email}
              </span>
            )}
            <span>{ROLE_LABEL[signer.role] ?? signer.role}</span>
            <span>Ordem: {signer.order}</span>
          </div>
        </div>
      </div>
      <Badge variant="secondary" className={`text-xs ${config.color}`}>
        {config.label}
      </Badge>
    </div>
  );
}

function AuditEventRow({ event }: { event: SignatureAuditEvent }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b last:border-0">
      <div className="p-1 rounded-full bg-slate-100 dark:bg-slate-800 mt-0.5">
        <Activity className="h-3 w-3 text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm">{event.description}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
          <span>{new Date(event.timestamp).toLocaleString('pt-BR')}</span>
          {event.ipAddress && <span>IP: {event.ipAddress}</span>}
        </div>
      </div>
      <Badge variant="outline" className="text-xs shrink-0">
        {event.type}
      </Badge>
    </div>
  );
}

export default function EnvelopeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const canModify = hasPermission(TOOLS_PERMISSIONS.SIGNATURE.ENVELOPES.MODIFY);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['signature', 'envelope', id],
    queryFn: async () => {
      const response = await envelopesService.getEnvelope(id);
      return response.envelope;
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => envelopesService.cancelEnvelope(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signature', 'envelope', id] });
      queryClient.invalidateQueries({ queryKey: ['signature', 'envelopes'] });
      toast.success('Envelope cancelado');
      setShowCancelModal(false);
    },
    onError: () => toast.error('Erro ao cancelar envelope'),
  });

  const resendMutation = useMutation({
    mutationFn: () => envelopesService.resendNotifications(id),
    onSuccess: (result) => {
      toast.success(`Notificações reenviadas para ${result.notifiedCount} assinante(s)`);
    },
    onError: () => toast.error('Erro ao reenviar notificações'),
  });

  const envelope = data;

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <PageActionBar
          breadcrumbItems={[
            { label: 'Assinatura Digital', href: '/signature' },
            { label: 'Envelopes', href: '/signature/envelopes' },
            { label: 'Carregando...' },
          ]}
        />
        <div className="p-4 space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (error || !envelope) {
    return (
      <div className="flex flex-col h-full">
        <PageActionBar
          breadcrumbItems={[
            { label: 'Assinatura Digital', href: '/signature' },
            { label: 'Envelopes', href: '/signature/envelopes' },
            { label: 'Erro' },
          ]}
        />
        <div className="p-4">
          <Card className="p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Envelope não encontrado
            </p>
          </Card>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[envelope.status];
  const canCancel = canModify && !['COMPLETED', 'CANCELLED'].includes(envelope.status);
  const canResend = canModify && ['PENDING', 'IN_PROGRESS'].includes(envelope.status);

  return (
    <ProtectedRoute requiredPermission={TOOLS_PERMISSIONS.SIGNATURE.ENVELOPES.ACCESS}>
      <div className="flex flex-col h-full">
        <PageActionBar
          breadcrumbItems={[
            { label: 'Assinatura Digital', href: '/signature' },
            { label: 'Envelopes', href: '/signature/envelopes' },
            { label: envelope.title },
          ]}
          buttons={[
            ...(canResend
              ? [{ title: 'Reenviar', icon: Bell, onClick: () => resendMutation.mutate(), variant: 'outline' as const, disabled: resendMutation.isPending }]
              : []),
            ...(canCancel
              ? [{ title: 'Cancelar', icon: Trash2, onClick: () => setShowCancelModal(true), variant: 'outline' as const, style: { className: 'text-rose-600 hover:text-rose-700 hover:bg-rose-50' } }]
              : []),
          ]}
        />

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Envelope Identity */}
          <Card className="bg-white/5 p-5">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-500/8">
                <FileSignature className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold truncate">
                    {envelope.title}
                  </h1>
                  <Badge
                    variant="secondary"
                    className={`text-xs ${statusConfig.color}`}
                  >
                    {statusConfig.label}
                  </Badge>
                </div>
                {envelope.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {envelope.description}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span>Nível: {envelope.signatureLevel}</span>
                  <span>Roteamento: {envelope.routingType}</span>
                  <span>
                    Criado em: {new Date(envelope.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                  <span>
                    Origem: {envelope.sourceModule} / {envelope.sourceEntityType}
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Signers */}
          <Card className="bg-white/5 py-2 overflow-hidden">
            <div className="px-5 py-3 border-b">
              <h2 className="font-medium text-sm flex items-center gap-2">
                <User className="h-4 w-4" />
                Assinantes ({envelope.signers?.length ?? 0})
              </h2>
            </div>
            <div className="px-5 py-3 space-y-2">
              {envelope.signers?.map((signer) => (
                <SignerCard key={signer.id} signer={signer} />
              )) ?? (
                <p className="text-sm text-muted-foreground">
                  Nenhum assinante
                </p>
              )}
            </div>
          </Card>

          {/* Audit Trail */}
          <Card className="bg-white/5 py-2 overflow-hidden">
            <div className="px-5 py-3 border-b">
              <h2 className="font-medium text-sm flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Trilha de Auditoria ({envelope.auditTrail?.length ?? 0})
              </h2>
            </div>
            <div className="px-5 py-3">
              {envelope.auditTrail?.length ? (
                envelope.auditTrail.map((event) => (
                  <AuditEventRow key={event.id} event={event} />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhum evento registrado
                </p>
              )}
            </div>
          </Card>
        </div>

        <VerifyActionPinModal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          onSuccess={() => cancelMutation.mutate()}
          title="Confirmar Cancelamento"
          description="Digite seu PIN de ação para cancelar este envelope de assinatura."
        />
      </div>
    </ProtectedRoute>
  );
}
