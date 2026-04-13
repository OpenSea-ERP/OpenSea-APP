/**
 * OpenSea OS - Edit Campaign Page
 * Follows the standard edit page pattern: PageLayout > PageHeader > PageBody
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
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  useCampaign,
  useUpdateCampaign,
  useDeleteCampaign,
} from '@/hooks/sales/use-campaigns';
import { usePermissions } from '@/hooks/use-permissions';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import { logger } from '@/lib/logger';
import type {
  Campaign,
  CampaignType,
  UpdateCampaignRequest,
} from '@/types/sales';
import {
  CAMPAIGN_STATUS_COLORS,
  CAMPAIGN_STATUS_LABELS,
  CAMPAIGN_TYPE_LABELS,
} from '@/types/sales';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import {
  CalendarDays,
  ChevronDown,
  Hash,
  Loader2,
  Megaphone,
  NotebookText,
  Save,
  Settings,
  Trash2,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

// =============================================================================
// COLLAPSIBLE SECTION
// =============================================================================

function CollapsibleSection({
  icon: Icon,
  title,
  subtitle,
  children,
  defaultOpen = true,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setOpen(prev => !prev)}
          className="flex w-full items-center justify-between group cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5 text-foreground" />
            <div className="text-left">
              <h3 className="text-base font-semibold">{title}</h3>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground group-hover:text-foreground group-hover:border-foreground/20 transition-colors">
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            />
          </div>
        </button>
        <div className="border-b border-border" />
      </div>

      {open && children}
    </div>
  );
}

// =============================================================================
// PAGE
// =============================================================================

export default function EditCampaignPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const campaignId = params.id as string;

  // ==========================================================================
  // DATA FETCHING
  // ==========================================================================

  const {
    data: campaignData,
    isLoading: isLoadingCampaign,
    error,
  } = useCampaign(campaignId);

  const campaign = campaignData?.campaign as Campaign | undefined;

  // ==========================================================================
  // MUTATIONS
  // ==========================================================================

  const updateMutation = useUpdateCampaign();
  const deleteMutation = useDeleteCampaign();

  // ==========================================================================
  // STATE
  // ==========================================================================

  const [isSaving, setIsSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Info Geral
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<CampaignType>('PERCENTAGE');
  const [priority, setPriority] = useState(0);
  const [stackable, setStackable] = useState(false);

  // Período
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Regras de Uso
  const [maxUsageTotal, setMaxUsageTotal] = useState('');
  const [maxUsagePerCustomer, setMaxUsagePerCustomer] = useState('');
  const [channels, setChannels] = useState('');

  // ==========================================================================
  // EFFECTS
  // ==========================================================================

  useEffect(() => {
    if (campaign) {
      setName(campaign.name || '');
      setDescription(campaign.description || '');
      setType(campaign.type || 'PERCENTAGE');
      setPriority(campaign.priority ?? 0);
      setStackable(campaign.stackable ?? false);
      setStartDate(
        campaign.startDate ? campaign.startDate.substring(0, 10) : ''
      );
      setEndDate(campaign.endDate ? campaign.endDate.substring(0, 10) : '');
      setMaxUsageTotal(
        campaign.maxUsageTotal != null ? String(campaign.maxUsageTotal) : ''
      );
      setMaxUsagePerCustomer(
        campaign.maxUsagePerCustomer != null
          ? String(campaign.maxUsagePerCustomer)
          : ''
      );
      setChannels(
        Array.isArray(campaign.channels) ? campaign.channels.join(', ') : ''
      );
    }
  }, [campaign]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Nome da campanha é obrigatório');
      return;
    }
    if (!startDate) {
      toast.error('Data de início é obrigatória');
      return;
    }
    if (!endDate) {
      toast.error('Data de término é obrigatória');
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      toast.error('Data de término deve ser posterior à data de início');
      return;
    }

    try {
      setIsSaving(true);

      const data: UpdateCampaignRequest = {
        name: name.trim(),
        description: description.trim() || undefined,
        type,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        priority,
        stackable,
        maxUsageTotal: maxUsageTotal ? Number(maxUsageTotal) : undefined,
        maxUsagePerCustomer: maxUsagePerCustomer
          ? Number(maxUsagePerCustomer)
          : undefined,
        channels: channels
          .split(',')
          .map(c => c.trim())
          .filter(Boolean),
      };

      await updateMutation.mutateAsync({ id: campaignId, data });
      toast.success('Campanha atualizada com sucesso!');
      await queryClient.invalidateQueries({
        queryKey: ['campaigns', campaignId],
      });
      router.push(`/sales/campaigns/${campaignId}`);
    } catch (err) {
      logger.error(
        'Erro ao atualizar campanha',
        err instanceof Error ? err : undefined
      );
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao atualizar campanha', { description: message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteMutation.mutateAsync(campaignId);
      toast.success('Campanha excluída com sucesso!');
      router.push('/sales/campaigns');
    } catch (err) {
      logger.error(
        'Erro ao excluir campanha',
        err instanceof Error ? err : undefined
      );
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao excluir campanha', { description: message });
    }
  };

  // ==========================================================================
  // ACTION BUTTONS
  // ==========================================================================

  const actionButtons: HeaderButton[] = [
    ...(hasPermission(SALES_PERMISSIONS.CAMPAIGNS.REMOVE)
      ? [
          {
            id: 'delete',
            title: 'Excluir',
            icon: Trash2,
            onClick: () => setDeleteModalOpen(true),
            variant: 'default' as const,
            className:
              'bg-slate-200 text-slate-700 border-transparent hover:bg-rose-600 hover:text-white dark:bg-[#334155] dark:text-white dark:hover:bg-rose-600',
          },
        ]
      : []),
    {
      id: 'save',
      title: isSaving ? 'Salvando...' : 'Salvar',
      icon: isSaving ? Loader2 : Save,
      onClick: handleSubmit,
      variant: 'default',
      disabled: isSaving || !name.trim(),
    },
  ];

  // ==========================================================================
  // LOADING / ERROR
  // ==========================================================================

  const breadcrumbItems = [
    { label: 'Vendas', href: '/sales' },
    { label: 'Campanhas', href: '/sales/campaigns' },
    {
      label: campaign?.name || '...',
      href: `/sales/campaigns/${campaignId}`,
    },
    { label: 'Editar' },
  ];

  if (isLoadingCampaign) {
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

  if (error || !campaign) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Campanha não encontrada"
            message="A campanha solicitada não foi encontrada."
            action={{
              label: 'Voltar para Campanhas',
              onClick: () => router.push('/sales/campaigns'),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <PageLayout data-testid="campaign-edit">
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
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-violet-500 to-purple-600 text-white">
              <Megaphone className="h-7 w-7" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">Editando campanha</p>
              <h1 className="text-xl font-bold truncate">{campaign.name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border',
                    CAMPAIGN_STATUS_COLORS[campaign.status]
                  )}
                >
                  {CAMPAIGN_STATUS_LABELS[campaign.status]}
                </span>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-3 rounded-lg bg-white/5 px-4 py-2">
                <div className="text-right">
                  <p className="text-xs font-semibold">Acumulável</p>
                  <p className="text-[11px] text-muted-foreground">
                    {stackable ? 'Sim' : 'Não'}
                  </p>
                </div>
                <Switch checked={stackable} onCheckedChange={setStackable} />
              </div>
            </div>
          </div>
        </Card>

        {/* Section: Informações Gerais */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <CollapsibleSection
              icon={NotebookText}
              title="Informações Gerais"
              subtitle="Nome, tipo e configurações básicas da campanha"
            >
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="grid gap-2 sm:col-span-2 lg:col-span-2">
                    <Label htmlFor="name">
                      Nome <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Nome da campanha"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="type">
                      Tipo <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={type}
                      onValueChange={v => setType(v as CampaignType)}
                    >
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Selecione o tipo..." />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CAMPAIGN_TYPE_LABELS).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2 sm:col-span-2 lg:col-span-3">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Descrição da campanha..."
                      rows={3}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="priority">Prioridade</Label>
                    <Input
                      id="priority"
                      type="number"
                      min={0}
                      value={priority}
                      onChange={e => setPriority(Number(e.target.value))}
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Mobile stackable toggle */}
                <div className="grid grid-cols-1 sm:hidden gap-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-white dark:bg-slate-800/60">
                    <div className="space-y-0.5">
                      <Label className="text-base font-medium">
                        Acumulável
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {stackable ? 'Sim' : 'Não'}
                      </p>
                    </div>
                    <Switch
                      checked={stackable}
                      onCheckedChange={setStackable}
                    />
                  </div>
                </div>
              </div>
            </CollapsibleSection>
          </div>
        </Card>

        {/* Section: Período */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <CollapsibleSection
              icon={CalendarDays}
              title="Período"
              subtitle="Datas de início e término da campanha"
            >
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="startDate">
                      Data de Início <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="endDate">
                      Data de Término <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CollapsibleSection>
          </div>
        </Card>

        {/* Section: Regras de Uso */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <CollapsibleSection
              icon={Settings}
              title="Regras"
              subtitle="Limites de uso e canais de aplicação"
            >
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="maxUsageTotal">Limite Total de Uso</Label>
                    <Input
                      id="maxUsageTotal"
                      type="number"
                      min={0}
                      value={maxUsageTotal}
                      onChange={e => setMaxUsageTotal(e.target.value)}
                      placeholder="Sem limite"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="maxUsagePerCustomer">
                      Limite por Cliente
                    </Label>
                    <Input
                      id="maxUsagePerCustomer"
                      type="number"
                      min={0}
                      value={maxUsagePerCustomer}
                      onChange={e => setMaxUsagePerCustomer(e.target.value)}
                      placeholder="Sem limite"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="channels">Canais</Label>
                    <Input
                      id="channels"
                      value={channels}
                      onChange={e => setChannels(e.target.value)}
                      placeholder="online, loja, app"
                    />
                    <p className="text-xs text-muted-foreground">
                      Separe os canais por vírgula
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-white/5 p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Hash className="h-4 w-4" />
                    <span>
                      Utilizações até o momento:{' '}
                      <strong className="text-foreground">
                        {campaign.usageCount}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>
            </CollapsibleSection>
          </div>
        </Card>
      </PageBody>

      {/* Delete PIN Modal */}
      <VerifyActionPinModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onSuccess={handleDeleteConfirm}
        title="Excluir Campanha"
        description={`Digite seu PIN de ação para excluir a campanha "${campaign.name}". Esta ação não pode ser desfeita.`}
      />
    </PageLayout>
  );
}
