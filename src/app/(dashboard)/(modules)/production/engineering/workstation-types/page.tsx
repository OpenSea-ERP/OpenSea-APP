/**
 * Workstation Types Listing Page
 * Página de listagem de tipos de postos de trabalho
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
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  CoreProvider,
  EntityCard,
  EntityContextMenu,
  EntityGrid,
} from '@/core';
import { PRODUCTION_PERMISSIONS } from '@/config/rbac/permission-codes';
import { usePermissions } from '@/hooks/use-permissions';
import { useDebounce } from '@/hooks/use-debounce';
import { workstationTypesService } from '@/services/production';
import type {
  WorkstationType,
  CreateWorkstationTypeRequest,
} from '@/types/production';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, Settings, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

const pageConfig = {
  display: {
    labels: {
      searchPlaceholder: 'Buscar tipo de posto...',
      singular: 'tipo de posto',
      plural: 'tipos de posto',
    },
    gridColumns: 3,
  },
  permissions: {
    create: PRODUCTION_PERMISSIONS.ENGINEERING.REGISTER,
    edit: PRODUCTION_PERMISSIONS.ENGINEERING.MODIFY,
    delete: PRODUCTION_PERMISSIONS.ENGINEERING.REMOVE,
  },
};

export default function WorkstationTypesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [createOpen, setCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Create form
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['workstation-types'],
    queryFn: async () => {
      const res = await workstationTypesService.list();
      return res.workstationTypes;
    },
    getNextPageParam: () => undefined,
    initialPageParam: 1,
  });

  const allItems = data?.pages.flatMap((p) => p) ?? [];
  const items = useMemo(() => {
    if (!debouncedSearch) return allItems;
    const q = debouncedSearch.toLowerCase();
    return allItems.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q),
    );
  }, [allItems, debouncedSearch]);

  const createMutation = useMutation({
    mutationFn: (data: CreateWorkstationTypeRequest) =>
      workstationTypesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workstation-types'] });
      toast.success('Tipo de posto criado com sucesso!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => workstationTypesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workstation-types'] });
      toast.success('Tipo de posto excluído!');
    },
  });

  const handleCreate = useCallback(() => {
    setNewName('');
    setNewDescription('');
    setCreateStep(1);
    setCreateOpen(true);
  }, []);

  const handleCreateSubmit = useCallback(async () => {
    if (!newName.trim()) {
      toast.error('Nome é obrigatório.');
      return;
    }
    await createMutation.mutateAsync({
      name: newName.trim(),
      description: newDescription.trim() || undefined,
    });
    setCreateOpen(false);
  }, [newName, newDescription, createMutation]);

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

  const renderGridCard = (item: WorkstationType, isSelected: boolean) => (
    <EntityContextMenu
      itemId={item.id}
      actions={contextActions}
    >
      <EntityCard
        id={item.id}
        variant="grid"
        title={item.name}
        subtitle={item.description || 'Sem descrição'}
        icon={Settings}
        iconBgColor="bg-linear-to-br from-violet-500 to-purple-600"
        badges={[
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
        updatedAt={item.updatedAt}
      />
    </EntityContextMenu>
  );

  const renderListCard = (item: WorkstationType, isSelected: boolean) => (
    <EntityContextMenu
      itemId={item.id}
      actions={contextActions}
    >
      <EntityCard
        id={item.id}
        variant="list"
        title={item.name}
        subtitle={item.description || 'Sem descrição'}
        icon={Settings}
        iconBgColor="bg-linear-to-br from-violet-500 to-purple-600"
        badges={[
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
        updatedAt={item.updatedAt}
      />
    </EntityContextMenu>
  );

  const initialIds = useMemo(() => items.map((i) => i.id), [items]);

  const actionButtons = useMemo<HeaderButton[]>(() => {
    const buttons: HeaderButton[] = [];
    if (hasPermission(PRODUCTION_PERMISSIONS.ENGINEERING.REGISTER)) {
      buttons.push({
        id: 'create',
        title: 'Novo Tipo de Posto',
        icon: Plus,
        onClick: handleCreate,
        variant: 'default',
      });
    }
    return buttons;
  }, [hasPermission, handleCreate]);

  const wizardSteps: WizardStep[] = [
    {
      title: 'Novo Tipo de Posto',
      description: 'Defina o nome e descrição',
      icon: <Settings className="h-12 w-12 text-violet-500" />,
      isValid: !!newName.trim(),
      content: (
        <div className="space-y-4 p-1">
          <div className="grid gap-2">
            <Label htmlFor="wst-name">
              Nome <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="wst-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex: CNC, Solda, Montagem"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="wst-desc">Descrição</Label>
            <Textarea
              id="wst-desc"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Descrição do tipo de posto"
              rows={3}
            />
          </div>
        </div>
      ),
      footer: (
        <div className="flex justify-end w-full">
          <Button
            onClick={handleCreateSubmit}
            disabled={!newName.trim() || createMutation.isPending}
          >
            {createMutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            )}
            Criar
          </Button>
        </div>
      ),
    },
  ];

  return (
    <CoreProvider selection={{ namespace: 'workstation-types', initialIds }}>
      <PageLayout data-testid="production-workstation-types-page">
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Produção', href: '/production' },
              { label: 'Engenharia' },
              {
                label: 'Tipos de Posto',
                href: '/production/engineering/workstation-types',
              },
            ]}
            buttons={actionButtons}
          />
          <Header
            title="Tipos de Posto de Trabalho"
            description="Classificações para os postos de trabalho da produção"
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
              title="Erro ao carregar tipos de posto"
              message="Ocorreu um erro ao carregar os tipos de posto."
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
                <p className="text-sm text-muted-foreground whitespace-nowrap">
                  {items.length}{' '}
                  {items.length === 1 ? 'tipo de posto' : 'tipos de posto'}
                </p>
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
            description="Digite seu PIN de ação para excluir este tipo de posto."
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
