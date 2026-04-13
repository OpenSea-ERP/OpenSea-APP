/**
 * BOMs (Bill of Materials) Listing Page
 * Página de listagem de listas de materiais
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
import { bomsService } from '@/services/production';
import type { Bom, BomStatus, CreateBomRequest } from '@/types/production';
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { LayoutList, Loader2, Plus, Star, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

const BOM_STATUS_LABELS: Record<BomStatus, string> = {
  DRAFT: 'Rascunho',
  ACTIVE: 'Ativa',
  OBSOLETE: 'Obsoleta',
};

const BOM_STATUS_COLORS: Record<BomStatus, string> = {
  DRAFT:
    'border-slate-600/25 dark:border-slate-500/20 bg-slate-50 dark:bg-slate-500/8 text-slate-700 dark:text-slate-300',
  ACTIVE:
    'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
  OBSOLETE:
    'border-rose-600/25 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300',
};

const ALL_BOM_STATUSES: BomStatus[] = ['DRAFT', 'ACTIVE', 'OBSOLETE'];

const pageConfig = {
  display: {
    labels: {
      searchPlaceholder: 'Buscar lista de materiais...',
      singular: 'BOM',
      plural: 'BOMs',
    },
    gridColumns: 3,
  },
};

export default function BomsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState<BomStatus | 'ALL'>('ALL');
  const [createOpen, setCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Create form
  const [newName, setNewName] = useState('');
  const [newProductId, setNewProductId] = useState('');
  const [newVersion, setNewVersion] = useState(1);
  const [newDescription, setNewDescription] = useState('');

  const { data, isLoading, error, refetch } = useInfiniteQuery({
    queryKey: ['boms'],
    queryFn: async () => {
      const res = await bomsService.list();
      return res.boms;
    },
    getNextPageParam: () => undefined,
    initialPageParam: 1,
  });

  const allItems = data?.pages.flatMap(p => p) ?? [];
  const items = useMemo(() => {
    let filtered = allItems;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        i =>
          i.name.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(i => i.status === statusFilter);
    }
    return filtered;
  }, [allItems, debouncedSearch, statusFilter]);

  const createMutation = useMutation({
    mutationFn: (data: CreateBomRequest) => bomsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boms'] });
      toast.success('BOM criada com sucesso!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => bomsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boms'] });
      toast.success('BOM excluída!');
    },
  });

  const handleCreate = useCallback(() => {
    setNewName('');
    setNewProductId('');
    setNewVersion(1);
    setNewDescription('');
    setCreateStep(1);
    setCreateOpen(true);
  }, []);

  const handleCreateSubmit = useCallback(async () => {
    if (!newName.trim() || !newProductId.trim()) {
      toast.error('Nome e ID do Produto são obrigatórios.');
      return;
    }
    await createMutation.mutateAsync({
      name: newName.trim(),
      productId: newProductId.trim(),
      version: newVersion,
      description: newDescription.trim() || undefined,
    });
    setCreateOpen(false);
  }, [newName, newProductId, newVersion, newDescription, createMutation]);

  const handleDeleteConfirm = useCallback(async () => {
    if (itemToDelete) {
      await deleteMutation.mutateAsync(itemToDelete);
      setDeleteOpen(false);
      setItemToDelete(null);
    }
  }, [itemToDelete, deleteMutation]);

  const handleContextView = (ids: string[]) => {
    if (ids.length === 1) {
      router.push(`/production/engineering/boms/${ids[0]}`);
    }
  };

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
    []
  );

  const renderGridCard = (item: Bom, isSelected: boolean) => (
    <EntityContextMenu
      itemId={item.id}
      onView={handleContextView}
      actions={contextActions}
    >
      <EntityCard
        id={item.id}
        variant="grid"
        title={item.name}
        subtitle={`v${item.version} | Base: ${item.baseQuantity}`}
        icon={LayoutList}
        iconBgColor="bg-linear-to-br from-blue-500 to-cyan-600"
        badges={[
          {
            label: BOM_STATUS_LABELS[item.status],
            variant: 'outline' as const,
            color: BOM_STATUS_COLORS[item.status],
          },
          ...(item.isDefault
            ? [
                {
                  label: 'Padrão',
                  variant: 'outline' as const,
                  icon: Star,
                  color:
                    'border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300',
                },
              ]
            : []),
        ]}
        isSelected={isSelected}
        showSelection={false}
        clickable={false}
        createdAt={item.createdAt}
        updatedAt={item.updatedAt}
      />
    </EntityContextMenu>
  );

  const renderListCard = (item: Bom, isSelected: boolean) => (
    <EntityContextMenu
      itemId={item.id}
      onView={handleContextView}
      actions={contextActions}
    >
      <EntityCard
        id={item.id}
        variant="list"
        title={
          <span className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-gray-900 dark:text-white truncate">
              {item.name}
            </span>
            <span className="text-xs text-muted-foreground shrink-0">
              v{item.version}
            </span>
            {item.isDefault && (
              <Star className="h-3 w-3 fill-amber-400 text-amber-400 shrink-0" />
            )}
          </span>
        }
        metadata={
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${BOM_STATUS_COLORS[item.status]}`}
            >
              {BOM_STATUS_LABELS[item.status]}
            </span>
          </div>
        }
        icon={LayoutList}
        iconBgColor="bg-linear-to-br from-blue-500 to-cyan-600"
        isSelected={isSelected}
        showSelection={false}
        clickable={false}
        createdAt={item.createdAt}
        updatedAt={item.updatedAt}
      />
    </EntityContextMenu>
  );

  const initialIds = useMemo(() => items.map(i => i.id), [items]);

  const actionButtons = useMemo<HeaderButton[]>(() => {
    const buttons: HeaderButton[] = [];
    if (hasPermission(PRODUCTION_PERMISSIONS.ENGINEERING.REGISTER)) {
      buttons.push({
        id: 'create',
        title: 'Nova BOM',
        icon: Plus,
        onClick: handleCreate,
        variant: 'default',
      });
    }
    return buttons;
  }, [hasPermission, handleCreate]);

  const wizardSteps: WizardStep[] = [
    {
      title: 'Nova Lista de Materiais',
      description: 'Defina nome, produto, versão e descrição',
      icon: <LayoutList className="h-12 w-12 text-blue-500" />,
      isValid: !!newName.trim() && !!newProductId.trim(),
      content: (
        <div className="space-y-4 p-1" data-testid="bom-create-form">
          <div className="grid gap-2">
            <Label htmlFor="bom-product">
              ID do Produto <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="bom-product"
              data-testid="bom-product-input"
              value={newProductId}
              onChange={e => setNewProductId(e.target.value)}
              placeholder="ID do produto"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bom-name">
              Nome <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="bom-name"
              data-testid="bom-name-input"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Nome da lista de materiais"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bom-version">Versão</Label>
            <Input
              id="bom-version"
              data-testid="bom-version-input"
              type="number"
              min={1}
              value={newVersion}
              onChange={e => setNewVersion(Number(e.target.value) || 1)}
              placeholder="1"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="bom-desc">Descrição</Label>
            <Textarea
              id="bom-desc"
              data-testid="bom-description-input"
              value={newDescription}
              onChange={e => setNewDescription(e.target.value)}
              placeholder="Descrição da BOM"
              rows={3}
            />
          </div>
        </div>
      ),
      footer: (
        <div className="flex justify-end w-full">
          <Button
            data-testid="bom-create-submit"
            onClick={handleCreateSubmit}
            disabled={
              !newName.trim() ||
              !newProductId.trim() ||
              createMutation.isPending
            }
          >
            {createMutation.isPending && (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            )}
            Criar BOM
          </Button>
        </div>
      ),
    },
  ];

  const filterToolbar = (
    <div className="flex items-center gap-3">
      <p className="text-sm text-muted-foreground whitespace-nowrap">
        {items.length} {items.length === 1 ? 'BOM' : 'BOMs'}
      </p>
      <Select
        value={statusFilter}
        onValueChange={v => setStatusFilter(v as BomStatus | 'ALL')}
      >
        <SelectTrigger className="w-[160px] h-9">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todos os status</SelectItem>
          {ALL_BOM_STATUSES.map(s => (
            <SelectItem key={s} value={s}>
              {BOM_STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <CoreProvider selection={{ namespace: 'boms', initialIds }}>
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Produção', href: '/production' },
              { label: 'Engenharia' },
              {
                label: 'Lista de Materiais',
                href: '/production/engineering/boms',
              },
            ]}
            buttons={actionButtons}
          />
          <Header
            title="Lista de Materiais (BOM)"
            description="Estruturas de produto e composição de materiais"
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
              title="Erro ao carregar BOMs"
              message="Ocorreu um erro ao carregar as listas de materiais."
              action={{
                label: 'Tentar Novamente',
                onClick: () => {
                  refetch();
                },
              }}
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
              onItemDoubleClick={item =>
                router.push(`/production/engineering/boms/${item.id}`)
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
            description="Digite seu PIN de ação para excluir esta lista de materiais."
          />
        </PageBody>
      </PageLayout>
    </CoreProvider>
  );
}
