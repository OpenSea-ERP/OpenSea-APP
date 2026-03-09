/**
 * Finance Categories Page - Grouped Hierarchy Table
 * Tabela agrupada com hierarquia indentada (3 niveis)
 */

'use client';

import { GridError } from '@/components/handlers/grid-error';
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FINANCE_PERMISSIONS } from '@/config/rbac/permission-codes';
import {
  useCreateFinanceCategory,
  useDeleteFinanceCategory,
  useFinanceCategories,
} from '@/hooks/finance';
import { usePermissions } from '@/hooks/use-permissions';
import type { FinanceCategory, FinanceCategoryType } from '@/types/finance';
import { FINANCE_CATEGORY_TYPE_LABELS } from '@/types/finance';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Edit, Lock, MoreHorizontal, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CreateCategoryModal } from './src';

// =============================================================================
// HELPERS
// =============================================================================

function getTypeBadgeVariant(type: FinanceCategoryType) {
  switch (type) {
    case 'EXPENSE':
      return 'destructive' as const;
    case 'REVENUE':
      return 'default' as const;
    case 'BOTH':
      return 'secondary' as const;
    default:
      return 'outline' as const;
  }
}

interface HierarchyNode {
  category: FinanceCategory;
  level: number;
  children: HierarchyNode[];
}

function buildHierarchy(categories: FinanceCategory[]): HierarchyNode[] {
  const map = new Map<string, HierarchyNode>();
  const roots: HierarchyNode[] = [];

  // First pass: create nodes
  for (const cat of categories) {
    map.set(cat.id, { category: cat, level: 0, children: [] });
  }

  // Second pass: link parents and children
  for (const cat of categories) {
    const node = map.get(cat.id)!;
    if (cat.parentId && map.has(cat.parentId)) {
      const parent = map.get(cat.parentId)!;
      parent.children.push(node);
      node.level = parent.level + 1;
    } else {
      roots.push(node);
    }
  }

  // Fix nested levels (walk children)
  function fixLevels(nodes: HierarchyNode[], level: number) {
    for (const node of nodes) {
      node.level = level;
      fixLevels(node.children, level + 1);
    }
  }
  fixLevels(roots, 0);

  // Sort by displayOrder at each level
  function sortNodes(nodes: HierarchyNode[]) {
    nodes.sort((a, b) => a.category.displayOrder - b.category.displayOrder);
    for (const node of nodes) {
      sortNodes(node.children);
    }
  }
  sortNodes(roots);

  return roots;
}

function flattenHierarchy(nodes: HierarchyNode[]): HierarchyNode[] {
  const result: HierarchyNode[] = [];
  for (const node of nodes) {
    result.push(node);
    result.push(...flattenHierarchy(node.children));
  }
  return result;
}

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default function FinanceCategoriesPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const { data, isLoading, error, refetch } = useFinanceCategories();
  const createMutation = useCreateFinanceCategory();
  const deleteMutation = useDeleteFinanceCategory();

  // Permissions
  const canCreate = hasPermission(FINANCE_PERMISSIONS.CATEGORIES.CREATE);
  const canEdit = hasPermission(FINANCE_PERMISSIONS.CATEGORIES.UPDATE);
  const canDelete = hasPermission(FINANCE_PERMISSIONS.CATEGORIES.DELETE);

  // State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<FinanceCategoryType | ''>('');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isPinOpen, setIsPinOpen] = useState(false);

  // Data
  const categories = data?.categories ?? [];

  const filteredCategories = useMemo(() => {
    let filtered = categories;

    if (typeFilter) {
      filtered = filtered.filter(c => c.type === typeFilter);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        c =>
          c.name.toLowerCase().includes(q) ||
          c.description?.toLowerCase().includes(q) ||
          FINANCE_CATEGORY_TYPE_LABELS[c.type].toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [categories, searchQuery, typeFilter]);

  const hierarchyRows = useMemo(() => {
    const tree = buildHierarchy(filteredCategories);
    return flattenHierarchy(tree);
  }, [filteredCategories]);

  const nextDisplayOrder = useMemo(() => {
    if (categories.length === 0) return 1;
    return Math.max(...categories.map(c => c.displayOrder)) + 1;
  }, [categories]);

  // Handlers
  const handleCreate = useCallback(
    async (formData: {
      name: string;
      type: FinanceCategoryType;
      description?: string;
      displayOrder?: number;
    }) => {
      try {
        await createMutation.mutateAsync(formData);
        toast.success('Categoria criada com sucesso!');
        setIsCreateOpen(false);
      } catch {
        toast.error('Erro ao criar categoria.');
      }
    },
    [createMutation]
  );

  const handleDeleteRequest = useCallback((id: string) => {
    setDeleteTarget(id);
    setIsPinOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget);
      toast.success('Categoria excluida com sucesso!');
      setDeleteTarget(null);
    } catch {
      toast.error('Erro ao excluir categoria.');
    }
  }, [deleteTarget, deleteMutation]);

  // Header buttons
  const actionButtons = useMemo<HeaderButton[]>(() => {
    const buttons: HeaderButton[] = [];
    if (canCreate) {
      buttons.push({
        id: 'create-category',
        title: 'Nova Categoria',
        icon: Plus,
        onClick: () => setIsCreateOpen(true),
        variant: 'default',
      });
    }
    return buttons;
  }, [canCreate]);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Financeiro', href: '/finance' },
            { label: 'Categorias', href: '/finance/categories' },
          ]}
          buttons={actionButtons}
        />

        <Header
          title="Categorias Financeiras"
          description="Gerencie as categorias de receitas e despesas organizadas por hierarquia DRE"
        />
      </PageHeader>

      <PageBody>
        {/* Search + Type Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchBar
              placeholder="Buscar por nome, descricao ou tipo..."
              value={searchQuery}
              onSearch={setSearchQuery}
              onClear={() => setSearchQuery('')}
              showClear
              size="md"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={typeFilter === '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter('')}
            >
              Todos
            </Button>
            <Button
              variant={typeFilter === 'REVENUE' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter('REVENUE')}
            >
              Receita
            </Button>
            <Button
              variant={typeFilter === 'EXPENSE' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter('EXPENSE')}
            >
              Despesa
            </Button>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded" />
            ))}
          </div>
        ) : error ? (
          <GridError
            type="server"
            title="Erro ao carregar categorias"
            message="Ocorreu um erro ao tentar carregar as categorias. Por favor, tente novamente."
            action={{
              label: 'Tentar Novamente',
              onClick: () => {
                refetch();
              },
            }}
          />
        ) : hierarchyRows.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {searchQuery || typeFilter
              ? 'Nenhuma categoria encontrada com os filtros aplicados.'
              : 'Nenhuma categoria cadastrada.'}
          </div>
        ) : (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50%]">Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {hierarchyRows.map(({ category, level }) => {
                  const isRoot = level === 0;
                  const indent = level * 24;

                  return (
                    <TableRow
                      key={category.id}
                      className={
                        isRoot
                          ? 'bg-muted/50 font-semibold'
                          : 'hover:bg-muted/30'
                      }
                    >
                      <TableCell>
                        <div
                          className="flex items-center gap-2"
                          style={{ paddingLeft: `${indent}px` }}
                        >
                          {category.isSystem && (
                            <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          )}
                          <button
                            type="button"
                            className="text-left hover:underline cursor-pointer"
                            onClick={() =>
                              router.push(`/finance/categories/${category.id}`)
                            }
                          >
                            {category.name}
                          </button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getTypeBadgeVariant(category.type)}>
                          {FINANCE_CATEGORY_TYPE_LABELS[category.type]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            category.isActive ? 'default' : 'secondary'
                          }
                        >
                          {category.isActive ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {(canEdit || canDelete) && !category.isSystem && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {canEdit && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(
                                      `/finance/categories/${category.id}`
                                    )
                                  }
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                              )}
                              {canDelete && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() =>
                                      handleDeleteRequest(category.id)
                                    }
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Create Modal */}
        <CreateCategoryModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreate}
          isSubmitting={createMutation.isPending}
          nextDisplayOrder={nextDisplayOrder}
        />

        {/* Delete PIN Verification */}
        <VerifyActionPinModal
          isOpen={isPinOpen}
          onClose={() => {
            setIsPinOpen(false);
            setDeleteTarget(null);
          }}
          onSuccess={handleDeleteConfirm}
          title="Excluir Categoria"
          description="Digite seu PIN de Acao para confirmar a exclusao desta categoria."
        />
      </PageBody>
    </PageLayout>
  );
}
