/**
 * OpenSea OS - Campaign Detail Page
 * Visualização de campanha com detalhes e performance
 */

'use client';

import { GridLoading } from '@/components/handlers/grid-loading';
import { Header } from '@/components/layout/header';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { usePermissions } from '@/hooks/use-permissions';
import {
  useActivateCampaign,
  useCampaign,
  useDeleteCampaign,
} from '@/hooks/sales/use-campaigns';
import {
  CAMPAIGN_STATUS_COLORS,
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_TYPE_LABELS,
} from '@/types/sales';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import { cn } from '@/lib/utils';
import { Edit, Megaphone, Play, Trash2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { Suspense, useCallback, useState } from 'react';
import { toast } from 'sonner';

export default function CampaignDetailPage() {
  return (
    <Suspense fallback={<GridLoading count={1} layout="grid" size="lg" />}>
      <CampaignDetailContent />
    </Suspense>
  );
}

function CampaignDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const id = params.id as string;

  const { data, isLoading } = useCampaign(id);
  const deleteMutation = useDeleteCampaign();
  const activateMutation = useActivateCampaign();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const campaign = data?.campaign;

  const handleActivate = useCallback(async () => {
    try {
      await activateMutation.mutateAsync(id);
      toast.success('Campanha ativada com sucesso!');
    } catch {
      toast.error('Erro ao ativar campanha.');
    }
  }, [id, activateMutation]);

  const handleDeleteConfirm = useCallback(async () => {
    await deleteMutation.mutateAsync(id);
    setDeleteModalOpen(false);
    toast.success('Campanha excluída com sucesso!');
    router.push('/sales/campaigns');
  }, [id, deleteMutation, router]);

  if (isLoading || !campaign) {
    return <GridLoading count={1} layout="grid" size="lg" />;
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

  const canActivate =
    hasPermission(SALES_PERMISSIONS.CAMPAIGNS.ADMIN) &&
    campaign.status !== 'ACTIVE' &&
    campaign.status !== 'ENDED' &&
    campaign.status !== 'ARCHIVED';

  return (
    <PageLayout data-testid="campaign-detail">
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Vendas', href: '/sales' },
            { label: 'Campanhas', href: '/sales/campaigns' },
            { label: campaign.name },
          ]}
          buttons={[
            ...(canActivate
              ? [
                  {
                    id: 'activate',
                    title: 'Ativar',
                    icon: Play,
                    onClick: handleActivate,
                    variant: 'outline' as const,
                  },
                ]
              : []),
            ...(hasPermission(SALES_PERMISSIONS.CAMPAIGNS.ADMIN)
              ? [
                  {
                    id: 'edit',
                    title: 'Editar',
                    icon: Edit,
                    onClick: () => router.push(`/sales/campaigns/${id}/edit`),
                    variant: 'outline' as const,
                  },
                ]
              : []),
            ...(hasPermission(SALES_PERMISSIONS.CAMPAIGNS.ADMIN)
              ? [
                  {
                    id: 'delete',
                    title: 'Excluir',
                    icon: Trash2,
                    onClick: () => setDeleteModalOpen(true),
                    variant: 'destructive' as const,
                  },
                ]
              : []),
          ]}
        />
        <Header
          title={campaign.name}
          description={
            campaign.description || CAMPAIGN_TYPE_LABELS[campaign.type]
          }
        />
      </PageHeader>

      <PageBody>
        {/* Identity Card */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-violet-500 to-purple-600 text-white">
              <Megaphone className="h-7 w-7" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {campaign.name}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {campaign.description || 'Sem descrição'}
              </p>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border',
                    CAMPAIGN_STATUS_COLORS[campaign.status]
                  )}
                >
                  {CAMPAIGN_STATUS_LABELS[campaign.status]}
                </span>
                <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border border-violet-600/25 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/8 text-violet-700 dark:text-violet-300">
                  {CAMPAIGN_TYPE_LABELS[campaign.type]}
                </span>
                {campaign.stackable && (
                  <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border border-sky-600/25 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300">
                    Acumulavel
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Performance / Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">Período</p>
            <p className="text-sm font-medium mt-1">
              {formatDate(campaign.startDate)} - {formatDate(campaign.endDate)}
            </p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">Utilizacoes</p>
            <p className="text-2xl font-bold mt-1">
              {campaign.usageCount}
              {campaign.maxUsageTotal && (
                <span className="text-sm font-normal text-muted-foreground">
                  {' '}
                  / {campaign.maxUsageTotal}
                </span>
              )}
            </p>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <p className="text-sm text-muted-foreground">Prioridade</p>
            <p className="text-2xl font-bold mt-1">{campaign.priority}</p>
          </div>
        </div>

        <VerifyActionPinModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onSuccess={handleDeleteConfirm}
          title="Confirmar Exclusão"
          description="Digite seu PIN de ação para excluir esta campanha. Esta ação não pode ser desfeita."
        />
      </PageBody>
    </PageLayout>
  );
}
