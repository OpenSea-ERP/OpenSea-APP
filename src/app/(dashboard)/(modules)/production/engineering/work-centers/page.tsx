/**
 * Work Centers Listing Page
 * Página de listagem de centros de trabalho
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
import { workCentersService } from '@/services/production';
import type { WorkCenter, CreateWorkCenterRequest } from '@/types/production';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Factory, Loader2, Plus, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

const pageConfig = {
  display: {
    labels: {
      searchPlaceholder: 'Buscar centro de trabalho...',
      singular: 'centro de trabalho',
      plural: 'centros de trabalho',
    },
    gridColumns: 3,
  },
};

export default function WorkCentersPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [createOpen, setCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Create form
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['work-centers'],
    queryFn: async () => {
      const res = await workCentersService.list();
      return res.workCenters;
    },
  });

  const allItems = response ?? [];
  const items = useMemo(() => {
    if (!debouncedSearch) return allItems;
    const q = debouncedSearch.toLowerCase();
    return allItems.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.code.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q),
    );
  }, [allItems, debouncedSearch]);

  const createMutation = useMutation({
    mutationFn: (data: CreateWorkCenterRequest) =>
      workCentersService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-centers'] });
      toast.success('Centro de trabalho criado com sucesso!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => workCentersService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work-centers'] });
      toast.success('Centro de trabalho excluído!');
    },
  });

  const handleCreate = useCallback(() => {
    setNewCode('');
    setNewName('');
    setNewDescription('');
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
      description: newDescription.trim() || undefined,
    });
    setCreateOpen(false);
  }, [newCode, newName, newDescription, createMutation]);

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

  const renderGridCard = (item: WorkCenter, isSelected: boolean) => (
    <EntityContextMenu itemId={item.id} actions={contextActions}>
      <EntityCard
        id={item.id}
        variant="grid"
        title={item.name}
        subtitle={`${item.code}${item.description ? ` - ${item.description}` : ''}`}
        icon={Factory}
        iconBgColor="bg-linear-to-br from-emerald-500 to-teal-600"
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

  const renderListCard = (item: WorkCenter, isSelected: boolean) => (
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
        subtitle={item.description || 'Sem descrição'}
        icon={Factory}
        iconBgColor="bg-linear-to-br from-emerald-500 to-teal-600"
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
        title: 'Novo Centro',
        icon: Plus,
        onClick: handleCreate,
        variant: 'default',
      });
    }
    return buttons;
  }, [hasPermission, handleCreate]);

  const wizardSteps: WizardStep[] = [
    {
      title: 'Novo Centro de Trabalho',
      description: 'Defina código, nome e descrição',
      icon: <Factory className="h-12 w-12 text-emerald-500" />,
      isValid: !!newCode.trim() && !!newName.trim(),
      content: (
        <div className="space-y-4 p-1">
          <div className="grid gap-2">
            <Label htmlFor="wc-code">
              Código <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="wc-code"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="Ex: CT-01"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="wc-name">
              Nome <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="wc-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome do centro de trabalho"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="wc-desc">Descrição</Label>
            <Textarea
              id="wc-desc"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Descrição do centro"
              rows={3}
            />
          </div>
        </div>
      ),
      footer: (
        <div className="flex justify-end w-full">
          <Button
            onClick={handleCreateSubmit}
            disabled={
              !newCode.trim() || !newName.trim() || createMutation.isPending
            }
          >
            {createMutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            )}
            Criar Centro
          </Button>
        </div>
      ),
    },
  ];

  return (
    <CoreProvider selection={{ namespace: 'work-centers', initialIds }}>
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Produção', href: '/production' },
              { label: 'Engenharia' },
              {
                label: 'Centros de Trabalho',
                href: '/production/engineering/work-centers',
              },
            ]}
            buttons={actionButtons}
          />
          <Header
            title="Centros de Trabalho"
            description="Agrupamento lógico de postos de trabalho produtivos"
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
              title="Erro ao carregar centros de trabalho"
              message="Ocorreu um erro ao carregar os centros de trabalho."
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
                  {items.length === 1
                    ? 'centro de trabalho'
                    : 'centros de trabalho'}
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
            description="Digite seu PIN de ação para excluir este centro de trabalho."
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
