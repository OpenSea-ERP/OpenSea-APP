/**
 * Finance Categories Page - Grouped Hierarchy Table
 * Tabela agrupada com hierarquia indentada (3 níveis)
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
import { SearchBar } from '@/components/layout/search-bar';
import { Header } from '@/components/layout/header';
import type { HeaderButton } from '@/components/layout/types/header.types';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  ArrowDown,
  ArrowUp,
  ChevronRight,
  CornerDownRight,
  Edit,
  Eye,
  FolderTree,
  Lock,
  MoreHorizontal,
  Plus,
  Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CreateCategoryWizard } from './src';

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

  for (const cat of categories) {
    map.set(cat.id, { category: cat, level: 0, children: [] });
  }

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

  function fixLevels(nodes: HierarchyNode[], level: number) {
    for (const node of nodes) {
      node.level = level;
      fixLevels(node.children, level + 1);
    }
  }
  fixLevels(roots, 0);

  return roots;
}

function flattenHierarchy(
  nodes: HierarchyNode[],
  sortField: string,
  sortDir: 'asc' | 'desc'
): HierarchyNode[] {
  const sorted = [...nodes].sort((a, b) => {
    let cmp = 0;
    if (sortField === 'name') {
      cmp = a.category.name.localeCompare(b.category.name, 'pt-BR');
    } else if (sortField === 'type') {
      cmp = a.category.type.localeCompare(b.category.type);
    } else if (sortField === 'order') {
      cmp = a.category.displayOrder - b.category.displayOrder;
    }
    return sortDir === 'desc' ? -cmp : cmp;
  });

  const result: HierarchyNode[] = [];
  for (const node of sorted) {
    result.push(node);
    result.push(...flattenHierarchy(node.children, sortField, sortDir));
  }
  return result;
}

// =============================================================================
// PAGE COMPONENT
// =============================================================================

type SortField = 'order' | 'name' | 'type';

export default function FinanceCategoriesPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const { data, isLoading, error, refetch } = useFinanceCategories();
  const createMutation = useCreateFinanceCategory();
  const deleteMutation = useDeleteFinanceCategory();

  const canCreate = hasPermission(FINANCE_PERMISSIONS.CATEGORIES.REGISTER);
  const canEdit = hasPermission(FINANCE_PERMISSIONS.CATEGORIES.MODIFY);
  const canDelete = hasPermission(FINANCE_PERMISSIONS.CATEGORIES.REMOVE);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createType, setCreateType] = useState<FinanceCategoryType>('EXPENSE');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isPinOpen, setIsPinOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('order');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const categories = data?.categories ?? [];

  const filteredCategories = useMemo(() => {
    let filtered = categories;

    if (typeFilter !== 'all') {
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
    return flattenHierarchy(tree, sortField, sortDir);
  }, [filteredCategories, sortField, sortDir]);

  const nextDisplayOrder = useMemo(() => {
    if (categories.length === 0) return 1;
    return Math.max(...categories.map(c => c.displayOrder)) + 1;
  }, [categories]);

  const handleCreate = useCallback(
    async (formData: {
      name: string;
      type: FinanceCategoryType;
      description?: string;
      displayOrder?: number;
      parentId?: string;
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
      toast.success('Categoria excluída com sucesso!');
      setDeleteTarget(null);
    } catch {
      toast.error('Erro ao excluir categoria.');
    }
  }, [deleteTarget, deleteMutation]);

  const handleOpenCreateRevenue = useCallback(() => {
    setCreateType('REVENUE');
    setIsCreateOpen(true);
  }, []);

  const handleOpenCreateExpense = useCallback(() => {
    setCreateType('EXPENSE');
    setIsCreateOpen(true);
  }, []);

  const toggleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortDir('asc');
      }
    },
    [sortField]
  );

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field)
      return <ArrowUp className="h-3 w-3 text-muted-foreground/30" />;
    return sortDir === 'asc' ? (
      <ArrowUp className="h-3 w-3" />
    ) : (
      <ArrowDown className="h-3 w-3" />
    );
  };

  const actionButtons = useMemo<HeaderButton[]>(() => {
    const buttons: HeaderButton[] = [];
    if (canCreate) {
      buttons.push({
        id: 'create-expense',
        title: 'Nova Despesa',
        icon: Plus,
        onClick: handleOpenCreateExpense,
        variant: 'outline',
      });
      buttons.push({
        id: 'create-revenue',
        title: 'Nova Receita',
        icon: Plus,
        onClick: handleOpenCreateRevenue,
      });
    }
    return buttons;
  }, [canCreate, handleOpenCreateExpense, handleOpenCreateRevenue]);

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Financeiro', href: '/finance' },
            { label: 'Categorias' },
          ]}
          buttons={actionButtons}
        />

        <Header
          title="Categorias Financeiras"
          description="Gerencie as categorias de receitas e despesas organizadas por hierarquia DRE"
        />
      </PageHeader>

      <PageBody>
        <div data-testid="categories-page" className="contents" />
        {/* Search */}
        <div data-testid="categories-search">
          <SearchBar
            placeholder="Buscar por nome, descrição ou tipo..."
            value={searchQuery}
            onSearch={setSearchQuery}
            onClear={() => setSearchQuery('')}
            showClear
            size="md"
          />
        </div>

        {/* Type Filter + Sort */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-2" data-testid="categories-filter-type">
            <Button
              variant={typeFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter('all')}
              data-testid="categories-filter-all"
            >
              Todos
            </Button>
            <Button
              variant={typeFilter === 'REVENUE' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter('REVENUE')}
              data-testid="categories-filter-revenue"
            >
              Receita
            </Button>
            <Button
              variant={typeFilter === 'EXPENSE' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter('EXPENSE')}
              data-testid="categories-filter-expense"
            >
              Despesa
            </Button>
          </div>
          <Select
            value={`${sortField}-${sortDir}`}
            onValueChange={v => {
              const [f, d] = v.split('-') as [SortField, 'asc' | 'desc'];
              setSortField(f);
              setSortDir(d);
            }}
          >
            <SelectTrigger className="w-[200px] h-8 text-xs">
              <SelectValue placeholder="Ordenar por..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="order-asc">Ordem de Exibição ↑</SelectItem>
              <SelectItem value="order-desc">Ordem de Exibição ↓</SelectItem>
              <SelectItem value="name-asc">Nome A-Z</SelectItem>
              <SelectItem value="name-desc">Nome Z-A</SelectItem>
              <SelectItem value="type-asc">Tipo A-Z</SelectItem>
              <SelectItem value="type-desc">Tipo Z-A</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {isLoading ? (
          <GridLoading count={8} layout="list" size="sm" />
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
          <Card className="bg-white/50 dark:bg-white/5 border-gray-200/50 dark:border-white/10">
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="p-4 rounded-full bg-muted/50 mb-4">
                <FolderTree className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nenhuma categoria financeira encontrada
              </h3>
              <p className="text-muted-foreground text-sm text-center max-w-sm mb-6">
                {searchQuery || typeFilter !== 'all'
                  ? 'Nenhuma categoria encontrada com os filtros aplicados. Tente ajustar os filtros.'
                  : 'Nenhuma categoria cadastrada. Crie categorias de receita e despesa para organizar seus lançamentos.'}
              </p>
              {canCreate && !searchQuery && typeFilter === 'all' && (
                <Button onClick={handleOpenCreateExpense}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Categoria
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <div
            className="border rounded-lg overflow-hidden"
            data-testid="categories-table"
          >
            <Table aria-label="Tabela de categorias financeiras">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50%]">
                    <button
                      type="button"
                      className="flex items-center gap-1 cursor-pointer hover:text-foreground"
                      onClick={() => toggleSort('name')}
                    >
                      Nome {renderSortIcon('name')}
                    </button>
                  </TableHead>
                  <TableHead className="w-[120px]">
                    <button
                      type="button"
                      className="flex items-center gap-1 cursor-pointer hover:text-foreground"
                      onClick={() => toggleSort('type')}
                    >
                      Tipo {renderSortIcon('type')}
                    </button>
                  </TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[120px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {hierarchyRows.map(({ category, level }) => {
                  const isRoot = level === 0;
                  const showActions =
                    (canEdit || canDelete) && !category.isSystem;

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
                          style={{ paddingLeft: `${level * 20}px` }}
                        >
                          {level === 0 && (
                            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                          {level === 1 && (
                            <CornerDownRight className="h-4 w-4 text-muted-foreground/60 shrink-0" />
                          )}
                          {level >= 2 && (
                            <CornerDownRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                          )}
                          {category.isSystem && (
                            <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          )}
                          <span className="truncate">{category.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getTypeBadgeVariant(category.type)}>
                          {FINANCE_CATEGORY_TYPE_LABELS[category.type]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={category.isActive ? 'default' : 'secondary'}
                        >
                          {category.isActive ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {/* Desktop: direct icon buttons */}
                        <div className="hidden sm:flex gap-1 justify-end">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() =>
                                  router.push(
                                    `/finance/categories/${category.id}`
                                  )
                                }
                              >
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Visualizar</TooltipContent>
                          </Tooltip>
                          {canEdit && !category.isSystem && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() =>
                                    router.push(
                                      `/finance/categories/${category.id}/edit`
                                    )
                                  }
                                >
                                  <Edit className="h-4 w-4 text-sky-500" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Editar</TooltipContent>
                            </Tooltip>
                          )}
                          {canDelete && !category.isSystem && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() =>
                                    handleDeleteRequest(category.id)
                                  }
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Excluir</TooltipContent>
                            </Tooltip>
                          )}
                        </div>

                        {/* Mobile: dropdown menu */}
                        <div className="sm:hidden flex justify-end">
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
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(
                                    `/finance/categories/${category.id}`
                                  )
                                }
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Visualizar
                              </DropdownMenuItem>
                              {showActions && canEdit && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(
                                      `/finance/categories/${category.id}/edit`
                                    )
                                  }
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                              )}
                              {showActions && canDelete && (
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
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Create Wizard */}
        <CreateCategoryWizard
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          onSubmit={handleCreate}
          isSubmitting={createMutation.isPending}
          nextDisplayOrder={nextDisplayOrder}
          categories={categories}
          defaultType={createType}
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
          description="Digite seu PIN de Ação para confirmar a exclusão desta categoria."
        />
      </PageBody>
    </PageLayout>
  );
}
