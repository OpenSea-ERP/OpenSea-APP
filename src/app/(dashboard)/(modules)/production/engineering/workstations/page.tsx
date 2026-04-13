/**
 * Workstations Listing Page
 * Página de listagem de postos de trabalho
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
import {
  workstationsService,
  workstationTypesService,
  workCentersService,
} from '@/services/production';
import type {
  Workstation,
  WorkstationType,
  WorkCenter,
  CreateWorkstationRequest,
} from '@/types/production';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Cog, Hash, Loader2, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

const pageConfig = {
  display: {
    labels: {
      searchPlaceholder: 'Buscar posto de trabalho...',
      singular: 'posto',
      plural: 'postos',
    },
    gridColumns: 3,
  },
};

export default function WorkstationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [centerFilter, setCenterFilter] = useState<string>('ALL');
  const [createOpen, setCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Create form
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTypeId, setNewTypeId] = useState('');
  const [newCenterId, setNewCenterId] = useState('');
  const [newCapacity, setNewCapacity] = useState('1');

  // Data
  const {
    data: wsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['workstations'],
    queryFn: async () => {
      const res = await workstationsService.list();
      return res.workstations;
    },
  });

  const { data: types } = useQuery({
    queryKey: ['workstation-types'],
    queryFn: async () => {
      const res = await workstationTypesService.list();
      return res.workstationTypes;
    },
  });

  const { data: centers } = useQuery({
    queryKey: ['work-centers'],
    queryFn: async () => {
      const res = await workCentersService.list();
      return res.workCenters;
    },
  });

  const allItems = wsData ?? [];
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
    if (typeFilter !== 'ALL') {
      filtered = filtered.filter((i) => i.workstationTypeId === typeFilter);
    }
    if (centerFilter !== 'ALL') {
      filtered = filtered.filter((i) => i.workCenterId === centerFilter);
    }
    return filtered;
  }, [allItems, debouncedSearch, typeFilter, centerFilter]);

  const typeMap = useMemo(() => {
    const map = new Map<string, string>();
    types?.forEach((t) => map.set(t.id, t.name));
    return map;
  }, [types]);

  const centerMap = useMemo(() => {
    const map = new Map<string, string>();
    centers?.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [centers]);

  const createMutation = useMutation({
    mutationFn: (data: CreateWorkstationRequest) =>
      workstationsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workstations'] });
      toast.success('Posto de trabalho criado com sucesso!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => workstationsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workstations'] });
      toast.success('Posto de trabalho excluído!');
    },
  });

  const handleCreate = useCallback(() => {
    setNewCode('');
    setNewName('');
    setNewDescription('');
    setNewTypeId('');
    setNewCenterId('');
    setNewCapacity('1');
    setCreateStep(1);
    setCreateOpen(true);
  }, []);

  const handleCreateSubmit = useCallback(async () => {
    if (!newCode.trim() || !newName.trim() || !newTypeId) {
      toast.error('Código, Nome e Tipo são obrigatórios.');
      return;
    }
    await createMutation.mutateAsync({
      code: newCode.trim(),
      name: newName.trim(),
      description: newDescription.trim() || undefined,
      workstationTypeId: newTypeId,
      workCenterId: newCenterId || undefined,
      capacityPerDay: Number(newCapacity) || 1,
    });
    setCreateOpen(false);
  }, [newCode, newName, newDescription, newTypeId, newCenterId, newCapacity, createMutation]);

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

  const renderGridCard = (item: Workstation, isSelected: boolean) => (
    <EntityContextMenu itemId={item.id} actions={contextActions}>
      <EntityCard
        id={item.id}
        variant="grid"
        title={item.name}
        subtitle={`${item.code} | Cap: ${item.capacityPerDay}/dia`}
        icon={Cog}
        iconBgColor="bg-linear-to-br from-indigo-500 to-blue-600"
        badges={[
          {
            label: typeMap.get(item.workstationTypeId) || 'Tipo',
            variant: 'outline' as const,
            color:
              'border-violet-600/25 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/8 text-violet-700 dark:text-violet-300',
          },
          ...(item.workCenterId
            ? [
                {
                  label: centerMap.get(item.workCenterId) || 'Centro',
                  variant: 'outline' as const,
                  color:
                    'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
                },
              ]
            : []),
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

  const renderListCard = (item: Workstation, isSelected: boolean) => (
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
            <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium border-violet-600/25 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/8 text-violet-700 dark:text-violet-300">
              {typeMap.get(item.workstationTypeId) || 'Tipo'}
            </span>
            <span className="text-[11px] text-muted-foreground">
              Cap: {item.capacityPerDay}/dia
            </span>
          </div>
        }
        icon={Cog}
        iconBgColor="bg-linear-to-br from-indigo-500 to-blue-600"
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
        title: 'Novo Posto',
        icon: Plus,
        onClick: handleCreate,
        variant: 'default',
      });
    }
    return buttons;
  }, [hasPermission, handleCreate]);

  const wizardSteps: WizardStep[] = [
    {
      title: 'Identificação',
      description: 'Código, nome e tipo do posto',
      icon: <Cog className="h-12 w-12 text-indigo-500" />,
      isValid: !!newCode.trim() && !!newName.trim() && !!newTypeId,
      content: (
        <div className="space-y-4 p-1">
          <div className="grid gap-2">
            <Label htmlFor="ws-code">
              Código <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="ws-code"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="Ex: CNC-01"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ws-name">
              Nome <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="ws-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nome do posto de trabalho"
            />
          </div>
          <div className="grid gap-2">
            <Label>
              Tipo <span className="text-rose-500">*</span>
            </Label>
            <Select value={newTypeId} onValueChange={setNewTypeId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um tipo" />
              </SelectTrigger>
              <SelectContent>
                {types?.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ),
    },
    {
      title: 'Configuração',
      description: 'Centro de trabalho e capacidade',
      icon: <Cog className="h-12 w-12 text-indigo-500" />,
      isValid: true,
      content: (
        <div className="space-y-4 p-1">
          <div className="grid gap-2">
            <Label>Centro de Trabalho</Label>
            <Select value={newCenterId} onValueChange={setNewCenterId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {centers?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ws-capacity">Capacidade/Dia</Label>
            <Input
              id="ws-capacity"
              type="number"
              min={1}
              value={newCapacity}
              onChange={(e) => setNewCapacity(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ws-desc">Descrição</Label>
            <Textarea
              id="ws-desc"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Descrição do posto"
              rows={3}
            />
          </div>
        </div>
      ),
      footer: (
        <div className="flex justify-between w-full">
          <Button variant="ghost" onClick={() => setCreateStep(1)}>
            Voltar
          </Button>
          <Button
            onClick={handleCreateSubmit}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            )}
            Criar Posto
          </Button>
        </div>
      ),
    },
  ];

  // Filter dropdowns
  const filterToolbar = (
    <div className="flex items-center gap-3">
      <p className="text-sm text-muted-foreground whitespace-nowrap">
        {items.length} {items.length === 1 ? 'posto' : 'postos'}
      </p>
      <Select value={typeFilter} onValueChange={setTypeFilter}>
        <SelectTrigger className="w-[160px] h-9">
          <SelectValue placeholder="Tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todos os tipos</SelectItem>
          {types?.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={centerFilter} onValueChange={setCenterFilter}>
        <SelectTrigger className="w-[160px] h-9">
          <SelectValue placeholder="Centro" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todos os centros</SelectItem>
          {centers?.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <CoreProvider selection={{ namespace: 'workstations', initialIds }}>
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Produção', href: '/production' },
              { label: 'Engenharia' },
              {
                label: 'Postos de Trabalho',
                href: '/production/engineering/workstations',
              },
            ]}
            buttons={actionButtons}
          />
          <Header
            title="Postos de Trabalho"
            description="Máquinas e postos produtivos disponíveis"
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
              title="Erro ao carregar postos"
              message="Ocorreu um erro ao carregar os postos de trabalho."
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
              toolbarStart={filterToolbar}
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
            description="Digite seu PIN de ação para excluir este posto de trabalho."
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
