/**
 * OpenSea OS - Product Category Detail Page
 * Redesigned to follow the templates detail page pattern
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
import { Card } from '@/components/ui/card';
import { categoriesConfig } from '@/config/entities/categories.config';
import { EntityCard, EntityContextMenu, EntityGrid } from '@/core';
import {
  useCategories,
  useCategory,
  useReorderCategories,
} from '@/hooks/stock/use-categories';
import { categoriesService } from '@/services/stock';
import type { Category } from '@/types/stock';
import { Button } from '@/components/ui/button';
import {
  ArrowUpDown,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  Edit,
  FileText,
  FolderTree,
  Package,
  Plus,
  X,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useMemo, useRef, useState } from 'react';
import { PiFolderOpenDuotone } from 'react-icons/pi';
import {
  SortableCategoryList,
  type SortableCategoryListRef,
} from '../src/components/sortable-category-list';
import { CreateModal } from '../src/modals';

// ============================================================================
// SECTION HEADER
// ============================================================================

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  badge,
  action,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-foreground" />
          <div>
            <h3 className="text-base font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {badge}
          {action}
        </div>
      </div>
      <div className="border-b border-border" />
    </div>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function ProductCategoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.id as string;

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const {
    data: categoryData,
    isLoading,
    error,
    refetch,
  } = useCategory(categoryId);
  const category = categoryData?.category;

  const { data: allCategoriesData, isLoading: isLoadingCategories } =
    useCategories();
  const allCategories = useMemo(
    () => allCategoriesData?.categories || [],
    [allCategoriesData]
  );

  const subcategories = useMemo(
    () =>
      allCategories
        .filter(c => c.parentId === categoryId)
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0)),
    [allCategories, categoryId]
  );

  const parentCategory = useMemo(
    () =>
      category?.parentId
        ? allCategories.find(c => c.id === category.parentId)
        : null,
    [allCategories, category]
  );

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const sortableRef = useRef<SortableCategoryListRef>(null);
  const reorderMutation = useReorderCategories();

  const handleFinishReorder = useCallback(() => {
    if (sortableRef.current) {
      reorderMutation.mutate(sortableRef.current.getReorderedItems());
    }
    setIsReorderMode(false);
  }, [reorderMutation]);

  // ============================================================================
  // ACTION BAR BUTTONS
  // ============================================================================

  const actionButtons: HeaderButton[] = useMemo(() => {
    if (!category) return [];

    const buttons: HeaderButton[] = [];

    if ((category.productCount || 0) > 0) {
      buttons.push({
        id: 'view-products',
        title: `Ver ${category.productCount} Produto${category.productCount !== 1 ? 's' : ''}`,
        icon: Package,
        onClick: () => router.push(`/stock/products?category=${categoryId}`),
        variant: 'outline' as const,
      });
    }

    buttons.push({
      id: 'edit-category',
      title: 'Editar',
      icon: Edit,
      onClick: () =>
        router.push(`/stock/product-categories/${categoryId}/edit`),
      variant: 'default' as const,
    });

    return buttons;
  }, [category, router, categoryId]);

  // ============================================================================
  // SUBCATEGORY CARD RENDERERS
  // ============================================================================

  const renderSubcategoryGridCard = (item: Category) => {
    const subCount = item.childrenCount || 0;
    const prodCount = item.productCount || 0;

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={ids => {
          if (ids.length === 1)
            router.push(`/stock/product-categories/${ids[0]}`);
        }}
        onEdit={ids => {
          if (ids.length === 1)
            router.push(`/stock/product-categories/${ids[0]}/edit`);
        }}
      >
        <EntityCard
          id={item.id}
          variant="grid"
          title={item.name}
          subtitle={`Posição de exibição: ${item.displayOrder || 0}`}
          thumbnail={item.iconUrl || undefined}
          thumbnailFallback={
            <PiFolderOpenDuotone className="w-6 h-6 text-white" />
          }
          iconBgColor="bg-linear-to-br from-blue-500 to-purple-600"
          footer={{
            type: 'split',
            left: {
              icon: FolderTree,
              label: `${subCount} subcategoria${subCount !== 1 ? 's' : ''}`,
              href: `/stock/product-categories/${item.id}`,
              color: 'emerald',
            },
            right: {
              icon: Package,
              label: `${prodCount} produto${prodCount !== 1 ? 's' : ''}`,
              href: `/stock/products?category=${item.id}`,
              color: 'emerald',
            },
          }}
          clickable={false}
          onDoubleClick={() =>
            router.push(`/stock/product-categories/${item.id}`)
          }
          createdAt={item.createdAt}
          updatedAt={item.updatedAt}
          showStatusBadges={true}
        />
      </EntityContextMenu>
    );
  };

  const renderSubcategoryListCard = (item: Category) => {
    const subCount = item.childrenCount || 0;
    const prodCount = item.productCount || 0;

    return (
      <EntityContextMenu
        itemId={item.id}
        onView={ids => {
          if (ids.length === 1)
            router.push(`/stock/product-categories/${ids[0]}`);
        }}
        onEdit={ids => {
          if (ids.length === 1)
            router.push(`/stock/product-categories/${ids[0]}/edit`);
        }}
      >
        <EntityCard
          id={item.id}
          variant="list"
          title={
            <span className="flex items-center gap-2 min-w-0">
              <span className="font-semibold text-gray-900 dark:text-white truncate">
                {item.name}
              </span>
              {!item.isActive && (
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border shrink-0 border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300">
                  Inativa
                </span>
              )}
            </span>
          }
          subtitle={`Posição de exibição: ${item.displayOrder || 0}`}
          thumbnail={item.iconUrl || undefined}
          thumbnailFallback={
            <PiFolderOpenDuotone className="w-5 h-5 text-white" />
          }
          iconBgColor="bg-linear-to-br from-blue-500 to-purple-600"
          clickable={false}
          onDoubleClick={() =>
            router.push(`/stock/product-categories/${item.id}`)
          }
          createdAt={item.createdAt}
          updatedAt={item.updatedAt}
          showStatusBadges={true}
        >
          <div className="flex items-center gap-2">
            <Link
              href={`/stock/product-categories/${item.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/15 transition-colors"
              onClick={e => e.stopPropagation()}
            >
              <FolderTree className="h-3.5 w-3.5" />
              {subCount} subcategoria{subCount !== 1 ? 's' : ''}
              <ChevronRight className="h-3 w-3" />
            </Link>
            <Link
              href={`/stock/products?category=${item.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/15 transition-colors"
              onClick={e => e.stopPropagation()}
            >
              <Package className="h-3.5 w-3.5" />
              {prodCount} produto{prodCount !== 1 ? 's' : ''}
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </EntityCard>
      </EntityContextMenu>
    );
  };

  // ============================================================================
  // LOADING
  // ============================================================================

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Estoque', href: '/stock' },
              { label: 'Categorias', href: '/stock/product-categories' },
              { label: '...' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" size="md" />
        </PageBody>
      </PageLayout>
    );
  }

  // ============================================================================
  // ERROR
  // ============================================================================

  if (error) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Estoque', href: '/stock' },
              { label: 'Categorias', href: '/stock/product-categories' },
              { label: 'Erro' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridError
            type="server"
            title="Erro ao carregar categoria"
            message="Ocorreu um erro ao tentar carregar os dados da categoria."
            action={{
              label: 'Tentar Novamente',
              onClick: () => void refetch(),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  // ============================================================================
  // NOT FOUND
  // ============================================================================

  if (!category) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Estoque', href: '/stock' },
              { label: 'Categorias', href: '/stock/product-categories' },
              { label: 'Erro' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Categoria não encontrada"
            message="A categoria que você está procurando não existe ou foi removida."
            action={{
              label: 'Voltar para Categorias',
              onClick: () => router.push('/stock/product-categories'),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  // ============================================================================
  // DATES
  // ============================================================================

  const formattedCreatedAt = new Date(category.createdAt).toLocaleDateString(
    'pt-BR',
    { day: '2-digit', month: 'long', year: 'numeric' }
  );
  const formattedUpdatedAt =
    category.updatedAt &&
    String(category.updatedAt) !== String(category.createdAt)
      ? new Date(category.updatedAt).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })
      : null;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Estoque', href: '/stock' },
            { label: 'Categorias', href: '/stock/product-categories' },
            { label: category.name },
          ]}
          buttons={actionButtons}
        />
      </PageHeader>

      <PageBody>
        {/* ── Identity Card ── */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-center gap-4">
            {/* Left: Icon */}
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-purple-600 shadow-lg">
              {category.iconUrl ? (
                <Image
                  src={category.iconUrl}
                  alt=""
                  width={32}
                  height={32}
                  className="h-8 w-8 object-contain brightness-0 invert"
                  unoptimized
                  onError={e => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <PiFolderOpenDuotone className="h-7 w-7 text-white" />
              )}
            </div>

            {/* Center: Title + subtitle chips */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold truncate">{category.name}</h1>
                <span
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium border shrink-0 ${
                    category.isActive
                      ? 'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300'
                      : 'border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  {category.isActive ? 'Ativa' : 'Inativa'}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {/* Parent chip (only if has parent) */}
                {parentCategory && (
                  <Link
                    href={`/stock/product-categories/${parentCategory.id}`}
                    className="flex items-center gap-1.5 rounded-md border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <PiFolderOpenDuotone className="h-3 w-3" />
                    {parentCategory.name}
                  </Link>
                )}
                {/* "Nenhum produto" chip when count is 0 and button is hidden */}
                {(category.productCount || 0) === 0 && (
                  <div className="flex items-center gap-1.5 rounded-md border border-gray-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] px-2 py-1 text-xs text-muted-foreground">
                    <Package className="h-3 w-3" />
                    Nenhum produto nesta categoria
                  </div>
                )}
              </div>
            </div>

            {/* Right: Metadata dates */}
            <div className="hidden sm:flex flex-col items-end text-right gap-0.5">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3 text-sky-400" />
                Criado em {formattedCreatedAt}
              </p>
              {formattedUpdatedAt && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3 text-amber-400" />
                  Atualizado em {formattedUpdatedAt}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* ── Content Card ── */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            {/* ── Description Section ── */}
            {category.description && (
              <div className="space-y-5">
                <SectionHeader
                  icon={FileText}
                  title="Descrição"
                  subtitle="Informações sobre esta categoria"
                />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {category.description}
                </p>
              </div>
            )}

            {/* ── Subcategories Section ── */}
            <div id="subcategories-section" className="space-y-5">
              <SectionHeader
                icon={FolderTree}
                title="Subcategorias"
                subtitle="Categorias filhas desta categoria"
                action={
                  <div className="flex items-center gap-2">
                    {isReorderMode ? (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsReorderMode(false)}
                        >
                          <X className="h-4 w-4" />
                          <span className="hidden sm:inline">Cancelar</span>
                        </Button>
                        <Button size="sm" onClick={handleFinishReorder}>
                          <Check className="h-4 w-4" />
                          <span className="hidden sm:inline">Concluir</span>
                        </Button>
                      </>
                    ) : (
                      <>
                        {subcategories.length > 1 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsReorderMode(true)}
                          >
                            <ArrowUpDown className="h-4 w-4" />
                            <span className="hidden sm:inline">Reordenar</span>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setCreateModalOpen(true)}
                        >
                          <Plus className="h-4 w-4" />
                          <span className="hidden sm:inline">Adicionar</span>
                        </Button>
                      </>
                    )}
                  </div>
                }
              />

              {isLoadingCategories ? (
                <GridLoading count={3} layout="grid" size="md" gap="gap-4" />
              ) : isReorderMode && subcategories.length > 0 ? (
                <SortableCategoryList ref={sortableRef} items={subcategories} />
              ) : subcategories.length > 0 ? (
                <EntityGrid
                  config={categoriesConfig}
                  items={subcategories}
                  renderGridItem={renderSubcategoryGridCard}
                  renderListItem={renderSubcategoryListCard}
                  isLoading={false}
                  isSearching={false}
                  showSorting={false}
                  showItemCount={false}
                  defaultSortField="custom"
                  customSortFn={(a, b) =>
                    (a.displayOrder || 0) - (b.displayOrder || 0)
                  }
                  toolbarStart={
                    <p className="text-sm text-muted-foreground whitespace-nowrap">
                      Total de {subcategories.length}{' '}
                      {subcategories.length === 1
                        ? 'subcategoria'
                        : 'subcategorias'}
                    </p>
                  }
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <FolderTree className="w-10 h-10 mb-3 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    Nenhuma subcategoria cadastrada.
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
        {/* Create Subcategory Modal (pre-filled with parent) */}
        <CreateModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSubmit={async data => {
            await categoriesService.createCategory({
              ...data,
              parentId: categoryId,
            } as Parameters<typeof categoriesService.createCategory>[0]);
            setCreateModalOpen(false);
            window.location.reload();
          }}
        />
      </PageBody>
    </PageLayout>
  );
}
