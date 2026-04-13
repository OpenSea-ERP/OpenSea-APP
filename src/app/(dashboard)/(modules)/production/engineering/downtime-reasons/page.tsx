/**
 * Downtime Reasons Listing Page
 * Página de listagem de motivos de parada
 */

'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { Header } from '@/components/layout/header';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { SearchBar } from '@/components/layout/search-bar';
import type { HeaderButton } from '@/components/layout/types/header.types';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import {
  CoreProvider,
  EntityCard,
  EntityContextMenu,
  EntityGrid,
} from '@/core';
import { PRODUCTION_PERMISSIONS } from '@/config/rbac/permission-codes';
import { usePermissions } from '@/hooks/use-permissions';
import { useDebounce } from '@/hooks/use-debounce';
import { downtimeReasonsService } from '@/services/production';
import type {
  DowntimeReason,
  DowntimeCategory,
  CreateDowntimeReasonRequest,
} from '@/types/production';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Loader2, Plus, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

const CATEGORY_LABELS: Record<DowntimeCategory, string> = {
  MACHINE: 'Máquina',
  MATERIAL: 'Material',
  QUALITY: 'Qualidade',
  SETUP: 'Setup',
  PLANNING: 'Planejamento',
  MAINTENANCE: 'Manutenção',
  OTHER: 'Outros',
};

const CATEGORY_COLORS: Record<DowntimeCategory, string> = {
  MACHINE:
    'border-blue-600/25 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/8 text-blue-700 dark:text-blue-300',
  MATERIAL:
    'border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300',
  QUALITY:
    'border-rose-600/25 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300',
  SETUP:
    'border-violet-600/25 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/8 text-violet-700 dark:text-violet-300',
  PLANNING:
    'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300',
  MAINTENANCE:
    'border-orange-600/25 dark:border-orange-500/20 bg-orange-50 dark:bg-orange-500/8 text-orange-700 dark:text-orange-300',
  OTHER:
    'border-slate-600/25 dark:border-slate-500/20 bg-slate-50 dark:bg-slate-500/8 text-slate-700 dark:text-slate-300',
};

const ALL_CATEGORIES: DowntimeCategory[] = [
  'MACHINE',
  'MATERIAL',
  'QUALITY',
  'SETUP',
  'PLANNING',
  'MAINTENANCE',
  'OTHER',
];

const pageConfig = {
  display: {
    labels: {
      searchPlaceholder: 'Buscar motivo de parada...',
      singular: 'motivo',
      plural: 'motivos',
    },
    gridColumns: 3,
  },
};

export default function DowntimeReasonsPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [categoryFilter, setCategoryFilter] = useState<
    DowntimeCategory | 'ALL'
  >('ALL');
  const [createOpen, setCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Create form
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<DowntimeCategory>('OTHER');

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['downtime-reasons'],
    queryFn: async () => {
      const res = await downtimeReasonsService.list();
      return res.downtimeReasons;
    },
  });

  const allItems = response ?? [];
  const items = useMemo(() => {
    let filtered = allItems;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.code.toLowerCase().includes(q),
      );
    }
    if (categoryFilter !== 'ALL') {
      filtered = filtered.filter((i) => i.category === categoryFilter);
    }
    return filtered;
  }, [allItems, debouncedSearch, categoryFilter]);

  const createMutation = useMutation({
    mutationFn: (data: CreateDowntimeReasonRequest) =>
      downtimeReasonsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['downtime-reasons'] });
      toast.success('Motivo de parada criado com sucesso!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => downtimeReasonsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['downtime-reasons'] });
      toast.success('Motivo de parada excluído!');
    },
  });

  const handleCreate = useCallback(() => {
    setNewCode('');
    setNewName('');
    setNewCategory('OTHER');
    setCreateStep(1);
    setCreateOpen(true);
  }, []);

  const handleCreateSubmit = useCallback(async () => {
    if (!newCode.trim() || !newName.trim()) {
      toast.error('Código e Nome são obrigatórios.');
      return;
    }
    await createMutation.mutateAsync({
      code: newCode.trim(),
      name: newName.trim(),
      category: newCategory,
    });
    setCreateOpen(false);
  }, [newCode, newName, newCategory, createMutation]);

  const handleDeleteConfirm = useCallback(async () => {
    if (itemToDelete) {
      await deleteMutation.mutateAsync(itemToDelete);
      setDeleteOpen(false);
      setItemToDelete(null);
    }
  }, [itemToDelete, deleteMutation]);

  const contextActions = useMemo(
    () => [
      {
        id: 'delete',
        label: 'Excluir',
        icon: Trash2,
        onClick: (ids: string[]) => {
          setItemToDelete(ids[0]);
          setDeleteOpen(true);
        },
        variant: 'destructive' as const,
        separator: 'before' as const,
      },
    ],
    [],
  );

  const renderGridCard = (item: DowntimeReason, isSelected: boolean) => (
    <EntityContextMenu itemId={item.id} actions={contextActions}>
      <EntityCard
        id={item.id}
        variant="grid"
        title={item.name}
        subtitle={item.code}
        icon={AlertTriangle}
        iconBgColor="bg-linear-to-br from-amber-500 to-orange-600"
        badges={[
          {
            label: CATEGORY_LABELS[item.category],
            variant: 'outline' as const,
            color: CATEGORY_COLORS[item.category],
          },
          {
            label: item.isActive ? 'Ativo' : 'Inativo',
            variant: 'outline' as const,
            color: item.isActive
              ? 'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300'
              : 'border-slate-600/25 dark:border-slate-500/20 bg-slate-50 dark:bg-slate-500/8 text-slate-700 dark:text-slate-300',
          },
        ]}
        isSelected={isSelected}
        showSelection={false}
        clickable={false}
        createdAt={item.createdAt}
      />
    </EntityContextMenu>
  );

  const renderListCard = (item: DowntimeReason, isSelected: boolean) => (
    <EntityContextMenu itemId={item.id} actions={contextActions}>
      <EntityCard
        id={item.id}
        variant="list"
        title={
          <span className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-gray-900 dark:text-white truncate">
              {item.name}
            </span>
            <span className="text-xs text-muted-foreground shrink-0">
              {item.code}
            </span>
          </span>
        }
        metadata={
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${CATEGORY_COLORS[item.category]}`}
            >
              {CATEGORY_LABELS[item.category]}
            </span>
          </div>
        }
        icon={AlertTriangle}
        iconBgColor="bg-linear-to-br from-amber-500 to-orange-600"
        isSelected={isSelected}
        showSelection={false}
        clickable={false}
        createdAt={item.createdAt}
      />
    </EntityContextMenu>
  );

  const initialIds = useMemo(() => items.map((i) => i.id), [items]);

  const actionButtons = useMemo<HeaderButton[]>(() => {
    const buttons: HeaderButton[] = [];
    if (hasPermission(PRODUCTION_PERMISSIONS.SHOPFLOOR.REGISTER)) {
      buttons.push({
        id: 'create',
        title: 'Novo Motivo',
        icon: Plus,
        onClick: handleCreate,
        variant: 'default',
      });
    }
    return buttons;
  }, [hasPermission, handleCreate]);

  const wizardSteps: WizardStep[] = [
    {
      title: 'Novo Motivo de Parada',
      description: 'Defina código, nome e categoria',
      icon: <AlertTriangle className="h-12 w-12 text-amber-500" />,
      isValid: !!newCode.trim() && !!newName.trim(),
      content: (
        <div className="space-y-4 p-1">
          <div className="grid gap-2">
            <Label htmlFor="dr-code">
              Código <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="dr-code"
              data-testid="downtime-reason-code-input"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="Ex: PAR-01"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="dr-name">
              Nome <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="dr-name"
              data-testid="downtime-reason-name-input"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome do motivo de parada"
            />
          </div>
          <div className="grid gap-2">
            <Label>Categoria</Label>
            <Select
              value={newCategory}
              onValueChange={(v) => setNewCategory(v as DowntimeCategory)}
            >
              <SelectTrigger data-testid="downtime-reason-category-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ),
      footer: (
        <div className="flex justify-end w-full">
          <Button
            data-testid="downtime-reason-create-submit"
            onClick={handleCreateSubmit}
            disabled={
              !newCode.trim() || !newName.trim() || createMutation.isPending
            }
          >
            {createMutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            )}
            Criar Motivo
          </Button>
        </div>
      ),
    },
  ];

  return (
    <CoreProvider selection={{ namespace: 'downtime-reasons', initialIds }}>
      <PageLayout data-testid="downtime-reasons-page">
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Produção', href: '/production' },
              { label: 'Engenharia' },
              {
                label: 'Motivos de Parada',
                href: '/production/engineering/downtime-reasons',
              },
            ]}
            buttons={actionButtons}
          />
          <Header
            title="Motivos de Parada"
            description="Cadastro de razões para paradas de produção"
          />
        </PageHeader>

        <PageBody>
          <SearchBar
            value={searchQuery}
            placeholder={pageConfig.display.labels.searchPlaceholder}
            onSearch={setSearchQuery}
            onClear={() => setSearchQuery('')}
            showClear={true}
            size="md"
          />

          {isLoading ? (
            <GridLoading count={6} layout="grid" size="md" gap="gap-4" />
          ) : error ? (
            <GridError
              type="server"
              title="Erro ao carregar motivos de parada"
              message="Ocorreu um erro ao carregar os motivos de parada."
              action={{ label: 'Tentar Novamente', onClick: () => refetch() }}
            />
          ) : (
            <EntityGrid
              config={pageConfig}
              items={items}
              renderGridItem={renderGridCard}
              renderListItem={renderListCard}
              isLoading={isLoading}
              isSearching={!!debouncedSearch}
              showItemCount={false}
              toolbarStart={
                <div className="flex items-center gap-3">
                  <p className="text-sm text-muted-foreground whitespace-nowrap">
                    {items.length}{' '}
                    {items.length === 1 ? 'motivo' : 'motivos'}
                  </p>
                  <Select
                    value={categoryFilter}
                    onValueChange={(v) =>
                      setCategoryFilter(v as DowntimeCategory | 'ALL')
                    }
                  >
                    <SelectTrigger
                      className="w-[180px] h-9"
                      data-testid="downtime-category-filter"
                    >
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todas as categorias</SelectItem>
                      {ALL_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {CATEGORY_LABELS[cat]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              }
            />
          )}

          <StepWizardDialog
            open={createOpen}
            onOpenChange={setCreateOpen}
            steps={wizardSteps}
            currentStep={createStep}
            onStepChange={setCreateStep}
            onClose={() => setCreateOpen(false)}
          />

          <VerifyActionPinModal
            isOpen={deleteOpen}
            onClose={() => {
              setDeleteOpen(false);
              setItemToDelete(null);
            }}
            onSuccess={handleDeleteConfirm}
            title="Confirmar Exclusão"
            description="Digite seu PIN de ação para excluir este motivo de parada."
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
