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
import { Textarea } from '@/components/ui/textarea';
import {
  useDashboard,
  useUpdateDashboard,
  useDeleteDashboard,
} from '@/hooks/sales/use-analytics';
import { usePermissions } from '@/hooks/use-permissions';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import { logger } from '@/lib/logger';
import type {
  DashboardRole,
  DashboardVisibility,
  UpdateDashboardRequest,
} from '@/types/sales';
import type { LucideIcon } from 'lucide-react';
import {
  ChevronDown,
  LayoutDashboard,
  Loader2,
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

export default function EditDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const dashboardId = params.id as string;

  // Data
  const { data: dashboard, isLoading, error } = useDashboard(dashboardId);

  const updateMutation = useUpdateDashboard();
  const deleteMutation = useDeleteDashboard();

  // State
  const [isSaving, setIsSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [role, setRole] = useState<string>('');
  const [visibility, setVisibility] = useState<DashboardVisibility>('PRIVATE');

  // Initialize form from data
  useEffect(() => {
    if (dashboard) {
      setName(dashboard.name || '');
      setDescription(dashboard.description || '');
      setRole(dashboard.role || '');
      setVisibility(dashboard.visibility || 'PRIVATE');
    }
  }, [dashboard]);

  // Handlers
  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Nome do dashboard e obrigatório');
      return;
    }

    try {
      setIsSaving(true);

      const data: UpdateDashboardRequest = {
        name: name.trim(),
        description: description.trim() || undefined,
        role: role ? (role as DashboardRole) : undefined,
        visibility,
      };

      await updateMutation.mutateAsync({ id: dashboardId, data });
      toast.success('Dashboard atualizado com sucesso!');
      router.push(`/sales/analytics/dashboards/${dashboardId}`);
    } catch (err) {
      logger.error(
        'Erro ao atualizar dashboard',
        err instanceof Error ? err : undefined
      );
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao atualizar dashboard', { description: message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteMutation.mutateAsync(dashboardId);
      toast.success('Dashboard excluído com sucesso!');
      router.push('/sales/analytics/dashboards');
    } catch (err) {
      logger.error(
        'Erro ao excluir dashboard',
        err instanceof Error ? err : undefined
      );
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao excluir dashboard', { description: message });
    }
  };

  // Action buttons
  const actionButtons: HeaderButton[] = [
    ...(hasPermission(SALES_PERMISSIONS.ANALYTICS_DASHBOARDS.REMOVE)
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

  // Breadcrumbs
  const breadcrumbItems = [
    { label: 'Vendas' },
    { label: 'Analytics', href: '/sales/analytics' },
    { label: 'Dashboards', href: '/sales/analytics/dashboards' },
    {
      label: dashboard?.name || '...',
      href: `/sales/analytics/dashboards/${dashboardId}`,
    },
    { label: 'Editar' },
  ];

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

  if (error || !dashboard) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Dashboard não encontrado"
            message="O dashboard solicitado não foi encontrado."
            action={{
              label: 'Voltar para Dashboards',
              onClick: () => router.push('/sales/analytics/dashboards'),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
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
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-purple-500 to-violet-600 text-white">
              <LayoutDashboard className="h-7 w-7" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">
                Editando dashboard
              </p>
              <h1 className="text-xl font-bold truncate">{dashboard.name}</h1>
              <p className="text-xs text-muted-foreground">
                Criado em{' '}
                {new Date(dashboard.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </Card>

        {/* Section: Informações Gerais */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <CollapsibleSection
              icon={NotebookText}
              title="Informações Gerais"
              subtitle="Nome e descrição do dashboard"
            >
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">
                      Nome <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Nome do dashboard"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Descreva o proposito deste dashboard..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </CollapsibleSection>
          </div>
        </Card>

        {/* Section: Configuracoes */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <CollapsibleSection
              icon={Settings}
              title="Configuracoes"
              subtitle="Perfil alvo e visibilidade"
            >
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="role">Perfil Alvo</Label>
                    <Select
                      value={role || 'NONE'}
                      onValueChange={v => setRole(v === 'NONE' ? '' : v)}
                    >
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">Nenhum (generico)</SelectItem>
                        <SelectItem value="SELLER">Vendedor</SelectItem>
                        <SelectItem value="MANAGER">Gerente</SelectItem>
                        <SelectItem value="DIRECTOR">Diretor</SelectItem>
                        <SelectItem value="BID_SPECIALIST">
                          Especialista em Licitações
                        </SelectItem>
                        <SelectItem value="MARKETPLACE_OPS">
                          Operacoes Marketplace
                        </SelectItem>
                        <SelectItem value="CASHIER">Caixa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="visibility">Visibilidade</Label>
                    <Select
                      value={visibility}
                      onValueChange={v =>
                        setVisibility(v as DashboardVisibility)
                      }
                    >
                      <SelectTrigger id="visibility">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PRIVATE">
                          Privado (somente você)
                        </SelectItem>
                        <SelectItem value="TEAM">Equipe</SelectItem>
                        <SelectItem value="TENANT">Todos da empresa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {dashboard.isSystem && (
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-500/8 p-3 text-sm text-blue-700 dark:text-blue-300">
                    Este e um dashboard do sistema e possui configuracoes
                    limitadas de edicao.
                  </div>
                )}
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
        title="Excluir Dashboard"
        description={`Digite seu PIN de ação para excluir o dashboard "${dashboard.name}". Esta ação não pode ser desfeita.`}
      />
    </PageLayout>
  );
}
