'use client';

import { useCallback, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  FileCode,
  Clock,
  User,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Send,
  Eye,
  FilePen,
} from 'lucide-react';

import { PageActionBar } from '@/components/layout/page-action-bar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { usePermissions } from '@/hooks/use-permissions';
import { esocialService } from '@/services/hr/esocial.service';
import { toast } from 'sonner';
import type { EventStatusAction } from '@/types/esocial';
import { EsocialStatusChip } from '@/components/hr/esocial-status-chip';
import { EsocialRetryButton } from '@/components/hr/esocial-retry-button';
import { EsocialEnvironmentBadge } from '@/components/hr/esocial-environment-badge';
import { getEsocialCodeInfo } from '@/lib/hr/esocial-codes';

// ============================
// Status Config
// ============================

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  DRAFT: { label: 'Rascunho', color: 'slate', icon: FilePen },
  REVIEWED: { label: 'Revisado', color: 'sky', icon: Eye },
  APPROVED: { label: 'Aprovado', color: 'emerald', icon: CheckCircle },
  TRANSMITTING: { label: 'Transmitindo', color: 'violet', icon: Send },
  ACCEPTED: { label: 'Aceito', color: 'emerald', icon: CheckCircle },
  REJECTED: { label: 'Rejeitado', color: 'rose', icon: XCircle },
  ERROR: { label: 'Erro', color: 'rose', icon: AlertTriangle },
};

// ============================
// Timeline Entry
// ============================

interface TimelineEntryProps {
  label: string;
  date: string | null;
  user?: string | null;
  icon: React.ElementType;
  color: string;
  isLast?: boolean;
}

function TimelineEntry({
  label,
  date,
  user,
  icon: Icon,
  color,
  isLast,
}: TimelineEntryProps) {
  if (!date) return null;

  const colorMap: Record<string, string> = {
    slate:
      'bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400',
    sky: 'bg-sky-100 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400',
    emerald:
      'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
    rose: 'bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
    violet:
      'bg-violet-100 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
  };

  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full ${colorMap[color] || colorMap.slate}`}
        >
          <Icon className="h-4 w-4" />
        </div>
        {!isLast && <div className="w-px h-6 bg-border mt-1" />}
      </div>
      <div className="pt-1">
        <p className="text-sm font-medium">{label}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
          <span>
            {new Date(date).toLocaleDateString('pt-BR')}{' '}
            {new Date(date).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          {user && (
            <>
              <span className="text-muted-foreground/50">|</span>
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {user}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================
// XML Preview
// ============================

function XmlPreview({ xml, title }: { xml: string | null; title: string }) {
  const [expanded, setExpanded] = useState(false);

  if (!xml) return null;

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <FileCode className="h-4 w-4 text-muted-foreground" />
          {title}
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>
      {expanded && (
        <div className="border-t border-border bg-slate-50 dark:bg-slate-900/50 p-4 overflow-auto max-h-96">
          <pre className="text-xs font-mono whitespace-pre-wrap break-words text-slate-600 dark:text-slate-400">
            {xml}
          </pre>
        </div>
      )}
    </div>
  );
}

// ============================
// Main Detail Page
// ============================

export default function EsocialEventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  // Fetch event
  const { data, isLoading, error } = useQuery({
    queryKey: ['esocial', 'event', id],
    queryFn: () => esocialService.getEvent(id),
    enabled: !!id,
  });

  const event = data?.event;

  // Status mutation
  const statusMutation = useMutation({
    mutationFn: ({
      action,
      reason,
    }: {
      action: EventStatusAction;
      reason?: string;
    }) => esocialService.updateEventStatus(id, action, reason),
    onSuccess: result => {
      toast.success(`Evento atualizado para "${result.event.status}"`);
      queryClient.invalidateQueries({ queryKey: ['esocial'] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleAction = useCallback(
    (action: EventStatusAction) => {
      statusMutation.mutate({ action });
    },
    [statusMutation]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="esocial-detail-page">
        <PageActionBar
          breadcrumbItems={[
            { label: 'RH', href: '/hr' },
            { label: 'eSocial', href: '/hr/esocial' },
            { label: 'Carregando...' },
          ]}
          hasPermission={hasPermission}
        />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !event) {
    return (
      <div className="space-y-6" data-testid="esocial-detail-page">
        <PageActionBar
          breadcrumbItems={[
            { label: 'RH', href: '/hr' },
            { label: 'eSocial', href: '/hr/esocial' },
            { label: 'Erro' },
          ]}
          hasPermission={hasPermission}
        />
        <Card className="bg-white dark:bg-slate-800/60 border border-border p-8 text-center">
          <XCircle className="h-10 w-10 mx-auto text-rose-500 mb-3" />
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : 'Evento não encontrado.'}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => router.push('/hr/esocial')}
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Voltar
          </Button>
        </Card>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[event.status] || STATUS_CONFIG.DRAFT;
  const StatusIcon = statusConfig.icon;

  // Static color map to avoid dynamic Tailwind class purging
  const statusColorMap: Record<
    string,
    { iconWrapper: string; iconText: string }
  > = {
    slate: {
      iconWrapper: 'bg-slate-50 dark:bg-slate-500/8',
      iconText: 'text-slate-600 dark:text-slate-400',
    },
    sky: {
      iconWrapper: 'bg-sky-50 dark:bg-sky-500/8',
      iconText: 'text-sky-600 dark:text-sky-400',
    },
    emerald: {
      iconWrapper: 'bg-emerald-50 dark:bg-emerald-500/8',
      iconText: 'text-emerald-600 dark:text-emerald-400',
    },
    rose: {
      iconWrapper: 'bg-rose-50 dark:bg-rose-500/8',
      iconText: 'text-rose-600 dark:text-rose-400',
    },
    violet: {
      iconWrapper: 'bg-violet-50 dark:bg-violet-500/8',
      iconText: 'text-violet-600 dark:text-violet-400',
    },
  };
  const statusColors =
    statusColorMap[statusConfig.color] || statusColorMap.slate;

  // Available actions based on status
  const canReview = event.status === 'DRAFT';
  const canApprove = event.status === 'DRAFT' || event.status === 'REVIEWED';
  const canReject = event.status === 'REVIEWED' || event.status === 'APPROVED';
  const canRectify = event.status === 'REJECTED' || event.status === 'ACCEPTED';

  return (
    <div className="space-y-6" data-testid="esocial-detail-page">
      <PageActionBar
        breadcrumbItems={[
          { label: 'RH', href: '/hr' },
          { label: 'eSocial', href: '/hr/esocial' },
          { label: event.eventType },
        ]}
        hasPermission={hasPermission}
        actions={
          <div className="flex items-center gap-2">
            {canReview && (
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-2.5"
                onClick={() => handleAction('review')}
                disabled={statusMutation.isPending}
              >
                <Eye className="h-4 w-4 mr-1.5" />
                Revisar
              </Button>
            )}
            {canApprove && (
              <Button
                size="sm"
                className="h-9 px-2.5"
                onClick={() => handleAction('approve')}
                disabled={statusMutation.isPending}
              >
                <CheckCircle className="h-4 w-4 mr-1.5" />
                Aprovar
              </Button>
            )}
            {canReject && (
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-2.5 text-rose-600 border-rose-200 dark:text-rose-400 dark:border-rose-500/30"
                onClick={() => handleAction('reject')}
                disabled={statusMutation.isPending}
              >
                <XCircle className="h-4 w-4 mr-1.5" />
                Rejeitar
              </Button>
            )}
            {canRectify && (
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-2.5"
                onClick={() => handleAction('rectify')}
                disabled={statusMutation.isPending}
              >
                <RefreshCw className="h-4 w-4 mr-1.5" />
                Retificar
              </Button>
            )}
            <EsocialRetryButton
              eventId={event.id}
              status={event.status}
              size="default"
              className="h-9 px-2.5"
              label="Reenviar"
            />
          </div>
        }
      />

      <EsocialEnvironmentBadge />

      {/* Rejection / error hint card */}
      {(event.status === 'REJECTED' || event.status === 'ERROR') &&
        (event.rejectionCode || event.rejectionMessage) && (
          <Card className="bg-rose-50/60 dark:bg-rose-500/8 border border-rose-200 dark:border-rose-500/20 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-500/15">
                <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">
                    Próximo passo recomendado
                  </p>
                  {event.rejectionCode && (
                    <Badge
                      variant="outline"
                      className="font-mono text-xs border-rose-300 text-rose-700 dark:border-rose-500/30 dark:text-rose-300"
                    >
                      Cód. {event.rejectionCode}
                    </Badge>
                  )}
                </div>
                {event.rejectionCode && (
                  <p className="text-xs text-rose-700/90 dark:text-rose-300/90">
                    {getEsocialCodeInfo(event.rejectionCode).message}
                  </p>
                )}
                {event.rejectionMessage && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 break-words">
                    {event.rejectionMessage}
                  </p>
                )}
                {event.rejectionCode && (
                  <p className="text-xs text-rose-700 dark:text-rose-200 mt-1">
                    <span className="font-medium">Sugestão: </span>
                    {getEsocialCodeInfo(event.rejectionCode).hint}
                  </p>
                )}
              </div>
            </div>
          </Card>
        )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Event details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Identity Card */}
          <Card className="bg-white dark:bg-slate-800/60 border border-border p-5">
            <div className="flex items-start gap-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${statusColors.iconWrapper}`}
              >
                <StatusIcon className={`h-6 w-6 ${statusColors.iconText}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    {event.eventType}
                  </Badge>
                  <EsocialStatusChip
                    status={event.status}
                    returnCode={event.rejectionCode}
                    returnMessage={event.rejectionMessage}
                  />
                </div>
                <h2 className="text-lg font-semibold mt-1">
                  {event.description}
                </h2>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  {event.referenceName && (
                    <span>Referência: {event.referenceName}</span>
                  )}
                  {event.receipt && (
                    <span className="font-mono">Recibo: {event.receipt}</span>
                  )}
                </div>
              </div>
            </div>
          </Card>

          {/* Metadata */}
          <Card className="bg-white dark:bg-slate-800/60 border border-border p-5">
            <h3 className="text-sm font-semibold mb-4">Detalhes do Evento</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Tipo</p>
                <p className="text-sm font-medium">{event.eventType}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="text-sm font-medium">{statusConfig.label}</p>
              </div>
              {event.periodStart && (
                <div>
                  <p className="text-xs text-muted-foreground">
                    Período Início
                  </p>
                  <p className="text-sm font-medium">
                    {new Date(event.periodStart).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}
              {event.periodEnd && (
                <div>
                  <p className="text-xs text-muted-foreground">Período Fim</p>
                  <p className="text-sm font-medium">
                    {new Date(event.periodEnd).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}
              {event.deadline && (
                <div>
                  <p className="text-xs text-muted-foreground">Prazo</p>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-amber-500" />
                    {new Date(event.deadline).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}
              {event.batchId && (
                <div>
                  <p className="text-xs text-muted-foreground">Lote</p>
                  <p className="text-sm font-medium font-mono">
                    {event.batchId.slice(0, 8)}...
                  </p>
                </div>
              )}
              {event.retryCount > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">Tentativas</p>
                  <p className="text-sm font-medium">{event.retryCount}/5</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Criado em</p>
                <p className="text-sm font-medium">
                  {new Date(event.createdAt).toLocaleDateString('pt-BR')}{' '}
                  {new Date(event.createdAt).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </Card>

          {/* XML Preview */}
          <div className="space-y-3">
            <XmlPreview xml={event.xmlContent} title="XML Original" />
            <XmlPreview xml={event.signedXml} title="XML Assinado" />
          </div>
        </div>

        {/* Right column: Timeline */}
        <div className="space-y-6" data-testid="esocial-detail-page">
          <Card className="bg-white dark:bg-slate-800/60 border border-border p-5">
            <h3 className="text-sm font-semibold mb-4">Histórico</h3>
            <div className="space-y-0">
              <TimelineEntry
                label="Evento criado"
                date={event.createdAt}
                user={event.createdBy}
                icon={FilePen}
                color="slate"
              />
              <TimelineEntry
                label="Revisado"
                date={event.reviewedAt}
                user={event.reviewedBy}
                icon={Eye}
                color="sky"
              />
              <TimelineEntry
                label="Aprovado"
                date={event.approvedAt}
                user={event.approvedBy}
                icon={CheckCircle}
                color="emerald"
              />
              {event.status === 'REJECTED' && (
                <TimelineEntry
                  label="Rejeitado"
                  date={event.updatedAt}
                  icon={XCircle}
                  color="rose"
                  isLast
                />
              )}
              {event.status === 'ACCEPTED' && (
                <TimelineEntry
                  label="Aceito pelo eSocial"
                  date={event.updatedAt}
                  icon={CheckCircle}
                  color="emerald"
                  isLast
                />
              )}
            </div>
          </Card>

          {/* Rectification info */}
          {event.rectifiedEventId && (
            <Card className="bg-white dark:bg-slate-800/60 border border-border p-5">
              <h3 className="text-sm font-semibold mb-3">Retificação</h3>
              <p className="text-xs text-muted-foreground mb-2">
                Este evento é uma retificação de:
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() =>
                  router.push(`/hr/esocial/${event.rectifiedEventId}`)
                }
              >
                <Eye className="h-4 w-4 mr-1.5" />
                Ver evento original
              </Button>
            </Card>
          )}

          {/* Retry info */}
          {event.retryCount > 0 && event.nextRetryAt && (
            <Card className="bg-white dark:bg-slate-800/60 border border-border p-5">
              <h3 className="text-sm font-semibold mb-3">
                Informações de Retentativa
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tentativas</span>
                  <span className="font-medium">{event.retryCount}/5</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Próxima tentativa
                  </span>
                  <span className="font-medium">
                    {new Date(event.nextRetryAt).toLocaleDateString('pt-BR')}{' '}
                    {new Date(event.nextRetryAt).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
