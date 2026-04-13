/**
 * OpenSea OS - Proposal Detail Page
 * Página de detalhes da proposta com itens, anexos e ações
 */

'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import type { HeaderButton } from '@/components/layout/types/header.types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useProposal,
  useSendProposal,
  useApproveProposal,
  useRejectProposal,
  useDuplicateProposal,
} from '@/hooks/sales/use-proposals';
import { usePermissions } from '@/hooks/use-permissions';
import { proposalsConfig } from '@/config/entities/proposals.config';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import type {
  Proposal,
  ProposalItem,
  ProposalAttachment,
  ProposalStatus,
} from '@/types/sales';
import { PROPOSAL_STATUS_LABELS } from '@/types/sales';
import { SignatureStatusSection } from '../../src/components/signature-status-section';
import {
  Calendar,
  Check,
  Clock,
  Copy,
  DollarSign,
  Edit,
  FileCheck,
  FileText,
  Package,
  Paperclip,
  Send,
  User,
  X,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ============================================================================
// STATUS BADGE COLORS
// ============================================================================

const STATUS_COLORS: Record<ProposalStatus, string> = {
  DRAFT:
    'border-gray-300 dark:border-white/[0.1] bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400',
  SENT: 'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300',
  UNDER_REVIEW:
    'border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300',
  APPROVED:
    'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
  REJECTED:
    'border-rose-600/25 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300',
  EXPIRED:
    'border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300',
};

// ============================================================================
// INFO ROW COMPONENT
// ============================================================================

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | undefined | null;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

// ============================================================================
// PAGE
// ============================================================================

export default function ProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const proposalId = params.id as string;

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const { data: proposalData, isLoading, error } = useProposal(proposalId);

  const proposal = proposalData?.proposal as Proposal | undefined;

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const sendMutation = useSendProposal();
  const approveMutation = useApproveProposal();
  const rejectMutation = useRejectProposal();
  const duplicateMutation = useDuplicateProposal();

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSend = async () => {
    try {
      await sendMutation.mutateAsync(proposalId);
      toast.success('Proposta enviada com sucesso!');
    } catch {
      toast.error('Erro ao enviar proposta');
    }
  };

  const handleApprove = async () => {
    try {
      await approveMutation.mutateAsync(proposalId);
      toast.success('Proposta aprovada com sucesso!');
    } catch {
      toast.error('Erro ao aprovar proposta');
    }
  };

  const handleReject = async () => {
    try {
      await rejectMutation.mutateAsync({ id: proposalId });
      toast.success('Proposta rejeitada.');
    } catch {
      toast.error('Erro ao rejeitar proposta');
    }
  };

  const handleDuplicate = async () => {
    try {
      await duplicateMutation.mutateAsync(proposalId);
      toast.success('Proposta duplicada com sucesso!');
    } catch {
      toast.error('Erro ao duplicar proposta');
    }
  };

  // ============================================================================
  // ACTION BUTTONS
  // ============================================================================

  const actionButtons: HeaderButton[] = [
    ...(proposal?.status === 'DRAFT' &&
    proposalsConfig.permissions.update &&
    hasPermission(proposalsConfig.permissions.update)
      ? [
          {
            id: 'edit',
            title: 'Editar',
            icon: Edit,
            onClick: () => router.push(`/sales/proposals/${proposalId}/edit`),
            variant: 'default' as const,
          },
        ]
      : []),
  ];

  // ============================================================================
  // BREADCRUMBS
  // ============================================================================

  const breadcrumbItems = [
    { label: 'Vendas', href: '/sales' },
    { label: 'Propostas', href: '/sales/proposals' },
    { label: proposal?.title || '...' },
  ];

  // ============================================================================
  // LOADING / ERROR
  // ============================================================================

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" size="md" />
        </PageBody>
      </PageLayout>
    );
  }

  if (error || !proposal) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Proposta não encontrada"
            message="A proposta que você está procurando não existe ou foi removida."
            action={{
              label: 'Voltar para Propostas',
              onClick: () => router.push('/sales/proposals'),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);

  const createdDate = new Date(proposal.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const items = (proposal.items ?? []) as ProposalItem[];
  const attachments = (proposal.attachments ?? []) as ProposalAttachment[];

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PageLayout data-testid="proposal-detail">
      <PageHeader>
        <PageActionBar
          breadcrumbItems={breadcrumbItems}
          buttons={actionButtons}
        />
      </PageHeader>
      <PageBody>
        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl shadow-lg bg-linear-to-br from-violet-500 to-purple-600">
              <FileCheck className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">
                {proposal.customerName || 'Cliente'}
              </p>
              <h1 className="text-xl font-bold truncate">{proposal.title}</h1>
            </div>
            <div className="hidden sm:flex items-center gap-3 shrink-0">
              <div
                className={cn(
                  'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border',
                  STATUS_COLORS[proposal.status]
                )}
              >
                {PROPOSAL_STATUS_LABELS[proposal.status]}
              </div>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <Card className="bg-white/5 p-4">
          <div className="flex flex-wrap gap-2">
            {proposal.status === 'DRAFT' &&
              hasPermission(SALES_PERMISSIONS.PROPOSALS.SEND) && (
                <Button
                  size="sm"
                  onClick={handleSend}
                  disabled={sendMutation.isPending}
                  className="h-9 px-2.5"
                >
                  <Send className="h-4 w-4 mr-1.5" />
                  Enviar
                </Button>
              )}
            {(proposal.status === 'SENT' ||
              proposal.status === 'UNDER_REVIEW') &&
              hasPermission(SALES_PERMISSIONS.PROPOSALS.ADMIN) && (
                <>
                  <Button
                    size="sm"
                    onClick={handleApprove}
                    disabled={approveMutation.isPending}
                    className="h-9 px-2.5"
                  >
                    <Check className="h-4 w-4 mr-1.5" />
                    Aprovar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleReject}
                    disabled={rejectMutation.isPending}
                    className="h-9 px-2.5 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 dark:hover:bg-rose-500/8 dark:hover:text-rose-300"
                  >
                    <X className="h-4 w-4 mr-1.5" />
                    Rejeitar
                  </Button>
                </>
              )}
            {hasPermission(SALES_PERMISSIONS.PROPOSALS.REGISTER) && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleDuplicate}
                disabled={duplicateMutation.isPending}
                className="h-9 px-2.5"
              >
                <Copy className="h-4 w-4 mr-1.5" />
                Duplicar
              </Button>
            )}
          </div>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-4 h-12 mb-4">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="items">Itens ({items.length})</TabsTrigger>
            <TabsTrigger value="attachments">
              Anexos ({attachments.length})
            </TabsTrigger>
            <TabsTrigger value="signature">Assinatura</TabsTrigger>
          </TabsList>

          {/* TAB: Informações */}
          <TabsContent value="info" className="space-y-6">
            <Card className="bg-white/5 py-2 overflow-hidden">
              <div className="px-6 py-4 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <FileCheck className="h-5 w-5 text-foreground" />
                    <div>
                      <h3 className="text-base font-semibold">
                        Dados da Proposta
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Informações gerais da proposta
                      </p>
                    </div>
                  </div>
                  <div className="border-b border-border" />
                </div>

                <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoRow
                      icon={User}
                      label="Cliente"
                      value={proposal.customerName}
                    />
                    <InfoRow
                      icon={DollarSign}
                      label="Valor Total"
                      value={formatCurrency(proposal.totalValue)}
                    />
                    <InfoRow
                      icon={Calendar}
                      label="Válida até"
                      value={
                        proposal.validUntil
                          ? new Date(proposal.validUntil).toLocaleDateString(
                              'pt-BR'
                            )
                          : undefined
                      }
                    />
                    <InfoRow
                      icon={Clock}
                      label="Criada em"
                      value={createdDate}
                    />
                  </div>

                  {proposal.description && (
                    <div className="mt-6 pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-1">
                        Descrição
                      </p>
                      <p className="text-sm whitespace-pre-wrap">
                        {proposal.description}
                      </p>
                    </div>
                  )}

                  {proposal.terms && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-1">
                        Termos e Condições
                      </p>
                      <p className="text-sm whitespace-pre-wrap">
                        {proposal.terms}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* TAB: Itens */}
          <TabsContent value="items" className="space-y-6">
            <Card className="bg-white/5 py-2 overflow-hidden">
              <div className="px-6 py-4 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-foreground" />
                    <div>
                      <h3 className="text-base font-semibold">
                        Itens da Proposta
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Produtos e serviços incluídos
                      </p>
                    </div>
                  </div>
                  <div className="border-b border-border" />
                </div>

                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Package className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <h3 className="text-base font-semibold text-muted-foreground">
                      Nenhum item
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Esta proposta ainda não possui itens adicionados.
                    </p>
                  </div>
                ) : (
                  <div className="w-full rounded-xl border border-border bg-white dark:bg-slate-800/60 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-gray-50 dark:bg-slate-800/80">
                          <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                            Descrição
                          </th>
                          <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                            Qtd.
                          </th>
                          <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                            Preço Unit.
                          </th>
                          <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map(item => (
                          <tr
                            key={item.id}
                            className="border-b border-border last:border-0"
                          >
                            <td className="px-4 py-3 font-medium">
                              {item.description}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {item.quantity}
                            </td>
                            <td className="px-4 py-3 text-right">
                              {formatCurrency(item.unitPrice)}
                            </td>
                            <td className="px-4 py-3 text-right font-medium">
                              {formatCurrency(item.total)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-50 dark:bg-slate-800/80">
                          <td
                            colSpan={3}
                            className="px-4 py-3 text-right font-semibold"
                          >
                            Total
                          </td>
                          <td className="px-4 py-3 text-right font-bold">
                            {formatCurrency(proposal.totalValue)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* TAB: Anexos */}
          <TabsContent value="attachments" className="space-y-6">
            <Card className="bg-white/5 py-2 overflow-hidden">
              <div className="px-6 py-4 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Paperclip className="h-5 w-5 text-foreground" />
                    <div>
                      <h3 className="text-base font-semibold">Anexos</h3>
                      <p className="text-sm text-muted-foreground">
                        Documentos anexados à proposta
                      </p>
                    </div>
                  </div>
                  <div className="border-b border-border" />
                </div>

                {attachments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Paperclip className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <h3 className="text-base font-semibold text-muted-foreground">
                      Nenhum anexo
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Esta proposta não possui anexos.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {attachments.map(attachment => (
                      <div
                        key={attachment.id}
                        className="flex items-center gap-3 rounded-lg border border-border bg-white p-3 dark:bg-slate-800/60"
                      >
                        <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {attachment.fileName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(attachment.fileSize / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* TAB: Assinatura Digital */}
          <TabsContent value="signature" className="space-y-6">
            <SignatureStatusSection
              entityId={proposalId}
              entityType="proposal"
              signatureEnvelopeId={proposal.signatureEnvelopeId}
              canRequestSignature={
                proposal.status === 'SENT' &&
                hasPermission(SALES_PERMISSIONS.PROPOSALS.SEND)
              }
              defaultSignerName={proposal.customerName || ''}
              defaultSignerEmail=""
            />
          </TabsContent>
        </Tabs>
      </PageBody>
    </PageLayout>
  );
}
