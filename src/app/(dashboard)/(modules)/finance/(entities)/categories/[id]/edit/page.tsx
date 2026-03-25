/**
 * Edit Finance Category Page
 * Follows pattern: PageLayout > PageActionBar (Delete + Save) > Identity Card > Section Cards
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
import { Textarea } from '@/components/ui/textarea';
import PermissionCodes from '@/config/rbac/permission-codes';
import {
  useDeleteFinanceCategory,
  useFinanceCategories,
  useFinanceCategory,
  useUpdateFinanceCategory,
} from '@/hooks/finance';
import { usePermissions } from '@/hooks/use-permissions';
import { logger } from '@/lib/logger';
import { FINANCE_CATEGORY_TYPE_LABELS } from '@/types/finance';
import type { FinanceCategoryType } from '@/types/finance';
import { useQueryClient } from '@tanstack/react-query';
import {
  FolderTree,
  Loader2,
  Palette,
  Percent,
  Save,
  Settings,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

// =============================================================================
// SECTION HEADER
// =============================================================================

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-foreground" />
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="border-b border-border" />
    </div>
  );
}

// =============================================================================
// PAGE
// =============================================================================

export default function EditFinanceCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  // ==========================================================================
  // DATA FETCHING
  // ==========================================================================

  const { data, isLoading } = useFinanceCategory(id);
  const { data: allCategoriesData, isLoading: isLoadingCategories } =
    useFinanceCategories();
  const updateMutation = useUpdateFinanceCategory();
  const deleteMutation = useDeleteFinanceCategory();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const canDelete = hasPermission(PermissionCodes.FINANCE.CATEGORIES.REMOVE);
  const category = data?.category;
  const allCategories = allCategoriesData?.categories ?? [];

  // Whether this category is a child (has a parent)
  const isChild = !!category?.parentId;

  // ==========================================================================
  // STATE
  // ==========================================================================

  const [isSaving, setIsSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'EXPENSE' as FinanceCategoryType,
    displayOrder: 0,
    isActive: true,
    color: '',
    parentId: '',
    interestRate: '',
    penaltyRate: '',
  });

  // ==========================================================================
  // EFFECTS
  // ==========================================================================

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || '',
        type: category.type,
        displayOrder: category.displayOrder,
        isActive: category.isActive,
        color: category.color || '',
        parentId: category.parentId || '',
        interestRate:
          category.interestRate != null ? String(category.interestRate) : '',
        penaltyRate:
          category.penaltyRate != null ? String(category.penaltyRate) : '',
      });
    }
  }, [category]);

  // ==========================================================================
  // AVAILABLE PARENTS
  // ==========================================================================

  // Available parents: exclude self and own descendants, same type or BOTH, max level 1
  const availableParents = useMemo(() => {
    const descendants = new Set<string>();
    function addDescendants(parentId: string) {
      for (const cat of allCategories) {
        if (cat.parentId === parentId && !descendants.has(cat.id)) {
          descendants.add(cat.id);
          addDescendants(cat.id);
        }
      }
    }
    addDescendants(id);

    const levelMap = new Map<string, number>();
    function computeLevel(catId: string): number {
      if (levelMap.has(catId)) return levelMap.get(catId)!;
      const cat = allCategories.find(c => c.id === catId);
      if (!cat || !cat.parentId) {
        levelMap.set(catId, 0);
        return 0;
      }
      const parentLevel = computeLevel(cat.parentId);
      levelMap.set(catId, parentLevel + 1);
      return parentLevel + 1;
    }

    for (const cat of allCategories) {
      computeLevel(cat.id);
    }

    return allCategories
      .filter(c => {
        if (c.id === id || descendants.has(c.id)) return false;
        // Always include the current parent so it shows in the select
        if (c.id === category?.parentId) return true;
        if ((levelMap.get(c.id) ?? 0) >= 2) return false;
        return c.type === formData.type || c.type === 'BOTH';
      })
      .map(c => ({
        ...c,
        level: levelMap.get(c.id) ?? 0,
      }));
  }, [allCategories, id, formData.type, category?.parentId]);

  // Check if this category has children
  const hasChildren = useMemo(
    () => allCategories.some(c => c.parentId === id),
    [allCategories, id]
  );

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('O nome é obrigatório.');
      return;
    }

    try {
      setIsSaving(true);
      await updateMutation.mutateAsync({
        id,
        data: {
          name: formData.name,
          type: formData.type,
          isActive: formData.isActive,
          description: formData.description || undefined,
          displayOrder: formData.displayOrder || undefined,
          color: formData.color || undefined,
          parentId: formData.parentId || undefined,
        },
      });
      // Wait for cache to refetch before navigating
      await queryClient.invalidateQueries({
        queryKey: ['finance-categories'],
      });
      toast.success('Categoria atualizada com sucesso!');
      router.push(`/finance/categories/${id}`);
    } catch (err) {
      logger.error(
        'Erro ao atualizar categoria',
        err instanceof Error ? err : undefined
      );
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao atualizar categoria', { description: message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Categoria excluída com sucesso.');
      router.push('/finance/categories');
    } catch (err) {
      logger.error(
        'Erro ao excluir categoria',
        err instanceof Error ? err : undefined
      );
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao excluir categoria', { description: message });
    }
  };

  // ==========================================================================
  // ACTION BUTTONS
  // ==========================================================================

  const actionButtons: HeaderButton[] = [
    {
      id: 'cancel',
      title: 'Cancelar',
      onClick: () => router.push(`/finance/categories/${id}`),
      variant: 'ghost',
    },
    ...(canDelete
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
      title: isSaving ? 'Salvando...' : 'Salvar Alterações',
      icon: isSaving ? Loader2 : Save,
      onClick: handleSubmit,
      variant: 'default',
      disabled: isSaving,
    },
  ];

  // ==========================================================================
  // BREADCRUMBS
  // ==========================================================================

  const breadcrumbItems = [
    { label: 'Financeiro', href: '/finance' },
    { label: 'Categorias', href: '/finance/categories' },
    {
      label: category?.name || '...',
      href: `/finance/categories/${id}`,
    },
    { label: 'Editar' },
  ];

  // ==========================================================================
  // LOADING / ERROR
  // ==========================================================================

  if (isLoading || isLoadingCategories) {
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

  if (!category) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Categoria não encontrada"
            message="A categoria solicitada não foi encontrada."
            action={{
              label: 'Voltar para Categorias',
              onClick: () => router.push('/finance/categories'),
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
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl shadow-lg"
              style={{
                background: category.color
                  ? `linear-gradient(135deg, ${category.color}, ${category.color}cc)`
                  : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              }}
            >
              <FolderTree className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">
                Editando categoria
              </p>
              <h1 className="text-xl font-bold truncate">{category.name}</h1>
            </div>
            <div className="hidden sm:flex items-center gap-3 shrink-0 rounded-lg bg-white/5 px-4 py-2">
              <div className="text-right">
                <p className="text-xs font-semibold">Tipo</p>
                <p className="text-[11px] text-muted-foreground">
                  {FINANCE_CATEGORY_TYPE_LABELS[category.type]}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Section 1: Identificação */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={FolderTree}
                title="Identificação"
                subtitle="Nome e categoria pai"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">
                      Nome <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={e =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Nome da categoria"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="parentId">Categoria Pai</Label>
                    <Select
                      value={formData.parentId || 'none'}
                      onValueChange={v =>
                        setFormData({
                          ...formData,
                          parentId: v === 'none' ? '' : v,
                        })
                      }
                    >
                      <SelectTrigger id="parentId">
                        <SelectValue placeholder="Nenhuma (raiz)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhuma (raiz)</SelectItem>
                        {availableParents.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {'─'.repeat(cat.level)} {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Section 2: Configurações */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={Settings}
                title="Configurações"
                subtitle="Tipo, status e ordem de exibição"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="type">
                      Tipo <span className="text-rose-500">*</span>
                    </Label>
                    {isChild ? (
                      <div className="flex items-center h-9 px-3 rounded-md border bg-muted text-sm text-muted-foreground">
                        {FINANCE_CATEGORY_TYPE_LABELS[formData.type]}
                        <span className="ml-2 text-xs">(herdado do pai)</span>
                      </div>
                    ) : (
                      <Select
                        value={formData.type}
                        onValueChange={(value: string) =>
                          setFormData({
                            ...formData,
                            type: value as FinanceCategoryType,
                          })
                        }
                      >
                        <SelectTrigger id="type">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(FINANCE_CATEGORY_TYPE_LABELS).map(
                            ([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    )}
                    {hasChildren && !isChild && (
                      <p className="text-xs text-amber-500">
                        Alterar o tipo irá propagar para todas as
                        subcategorias.
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.isActive ? 'active' : 'inactive'}
                      onValueChange={v =>
                        setFormData({
                          ...formData,
                          isActive: v === 'active',
                        })
                      }
                    >
                      <SelectTrigger id="status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativa</SelectItem>
                        <SelectItem value="inactive">Inativa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="displayOrder">Ordem de Exibição</Label>
                    <Input
                      id="displayOrder"
                      type="number"
                      value={formData.displayOrder}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          displayOrder: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Section 3: Taxas Padrão */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={Percent}
                title="Taxas Padrão"
                subtitle="Taxas de juros e multa aplicadas por padrão"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="interestRate">Taxa de Juros (%)</Label>
                    <Input
                      id="interestRate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.interestRate}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          interestRate: e.target.value,
                        })
                      }
                      placeholder="0,00"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="penaltyRate">Taxa de Multa (%)</Label>
                    <Input
                      id="penaltyRate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.penaltyRate}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          penaltyRate: e.target.value,
                        })
                      }
                      placeholder="0,00"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Section 4: Aparência */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={Palette}
                title="Aparência"
                subtitle="Cor e descrição da categoria"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2 max-w-[200px]">
                    <Label htmlFor="color">Cor</Label>
                    <Input
                      id="color"
                      type="color"
                      value={formData.color || '#8b5cf6'}
                      onChange={e =>
                        setFormData({ ...formData, color: e.target.value })
                      }
                      className="h-10 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      })
                    }
                    placeholder="Descrição opcional da categoria"
                    rows={4}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>
      </PageBody>

      {/* Delete PIN Modal */}
      <VerifyActionPinModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onSuccess={handleDeleteConfirm}
        title="Excluir Categoria"
        description={`Digite seu PIN de ação para excluir a categoria "${category.name}". Esta ação não pode ser desfeita.`}
      />
    </PageLayout>
  );
}
