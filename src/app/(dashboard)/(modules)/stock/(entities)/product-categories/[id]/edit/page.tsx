/**
 * Edit Category Page
 * Follows the template edit page pattern (Identity Card + Form Card + VerifyActionPinModal)
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
import { Button } from '@/components/ui/button';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  useCategories,
  useCategory,
  useDeleteCategory,
  useReorderCategories,
  useUpdateCategory,
} from '@/hooks/stock/use-categories';
import { logger } from '@/lib/logger';
import type { Category, UpdateCategoryRequest } from '@/types/stock';
import { FolderTree, Loader2, Save, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { use, useEffect, useMemo, useRef, useState } from 'react';
import { PiFolderOpenDuotone } from 'react-icons/pi';
import { toast } from 'sonner';
import {
  SortableCategoryList,
  type SortableCategoryListRef,
} from '../../src/components/sortable-category-list';

export default function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id: categoryId } = use(params);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const {
    data: categoryData,
    isLoading: isLoadingCategory,
    error,
    refetch,
  } = useCategory(categoryId);
  const category = categoryData?.category;

  const { data: categoriesData } = useCategories();
  const categories = useMemo(
    () => categoriesData?.categories || [],
    [categoriesData]
  );
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();
  const reorderMutation = useReorderCategories();
  const subcategorySortableRef = useRef<SortableCategoryListRef>(null);

  // ============================================================================
  // FORM STATE
  // ============================================================================

  const [isSaving, setIsSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [parentId, setParentId] = useState('none');
  const [isActive, setIsActive] = useState(true);

  // ============================================================================
  // COMPUTED
  // ============================================================================

  const subcategories = useMemo(
    () => categories.filter((c: Category) => c.parentId === categoryId),
    [categories, categoryId]
  );

  const availableParents = useMemo(
    () =>
      categories.filter((c: Category) => {
        if (c.id === categoryId) return false;
        let current = c;
        while (current.parentId) {
          if (current.parentId === categoryId) return false;
          const parent = categories.find(
            (cat: Category) => cat.id === current.parentId
          );
          if (!parent) break;
          current = parent;
        }
        return true;
      }),
    [categories, categoryId]
  );

  // ============================================================================
  // SYNC FORM WITH DATA
  // ============================================================================

  useEffect(() => {
    if (category) {
      setName(category.name || '');
      setDescription(category.description || '');
      setIconUrl(category.iconUrl || '');
      setParentId(category.parentId || 'none');
      setIsActive(category.isActive ?? true);
    }
  }, [category]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    try {
      setIsSaving(true);
      const data: UpdateCategoryRequest = {
        name: name.trim(),
        description: description.trim() || undefined,
        iconUrl: iconUrl.trim() || null,
        parentId: parentId === 'none' ? undefined : parentId || undefined,
        isActive,
      };

      await updateCategoryMutation.mutateAsync({
        id: categoryId,
        data,
      });

      toast.success('Categoria atualizada com sucesso!');
      router.push(`/stock/product-categories/${categoryId}`);
    } catch (error) {
      logger.error(
        'Erro ao atualizar categoria',
        error instanceof Error ? error : undefined
      );
      const message =
        error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error('Erro ao atualizar categoria', { description: message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteCategoryMutation.mutateAsync(categoryId);
      toast.success('Categoria excluída com sucesso!');
      router.push('/stock/product-categories');
    } catch (error) {
      logger.error(
        'Erro ao deletar categoria',
        error instanceof Error ? error : undefined
      );
      const message =
        error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error('Erro ao deletar categoria', { description: message });
    } finally {
      setDeleteModalOpen(false);
    }
  };

  // ============================================================================
  // ACTION BAR BUTTONS
  // ============================================================================

  const actionButtons: HeaderButton[] = [
    {
      id: 'delete',
      title: 'Excluir',
      icon: Trash2,
      onClick: () => setDeleteModalOpen(true),
      variant: 'destructive',
      disabled: isSaving,
    },
    {
      id: 'save',
      title: isSaving ? 'Salvando...' : 'Salvar alterações',
      icon: isSaving ? Loader2 : Save,
      onClick: handleSubmit,
      variant: 'default',
      disabled: isSaving || !name.trim(),
    },
  ];

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (isLoadingCategory) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Estoque', href: '/stock' },
              { label: 'Categorias', href: '/stock/product-categories' },
              { label: '...' },
              { label: 'Editar' },
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
  // ERROR STATE
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
  // RENDER
  // ============================================================================

  const formattedDate = new Date(category.createdAt).toLocaleDateString(
    'pt-BR',
    { day: '2-digit', month: 'long', year: 'numeric' }
  );

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Estoque', href: '/stock' },
            { label: 'Categorias', href: '/stock/product-categories' },
            {
              label: category.name,
              href: `/stock/product-categories/${categoryId}`,
            },
            { label: 'Editar' },
          ]}
          buttons={actionButtons}
        />
      </PageHeader>

      <PageBody>
        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-purple-600 shadow-lg">
              {category.iconUrl ? (
                <Image
                  src={category.iconUrl}
                  alt={category.name}
                  width={28}
                  height={28}
                  className="h-7 w-7 object-contain brightness-0 invert"
                  unoptimized
                  onError={e => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <PiFolderOpenDuotone className="h-7 w-7 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">
                Editando categoria
              </p>
              <h1 className="text-xl font-bold truncate">{category.name}</h1>
            </div>
            <div className="hidden sm:flex flex-col items-end text-right gap-0.5">
              <p className="text-xs text-muted-foreground">
                Criado em {formattedDate}
              </p>
            </div>
          </div>
        </Card>

        {/* Form Card */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            {/* Row 1: Nome, Categoria Pai, Ícone */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">
                  Nome <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Nome da categoria"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="parentId">Categoria Pai</Label>
                <Select value={parentId} onValueChange={setParentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria pai" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma (raiz)</SelectItem>
                    {availableParents.map(parent => (
                      <SelectItem key={parent.id} value={parent.id}>
                        {parent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="iconUrl">Ícone (URL)</Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="iconUrl"
                    placeholder="https://exemplo.com/icone.svg"
                    value={iconUrl}
                    onChange={e => setIconUrl(e.target.value)}
                    className="flex-1"
                  />
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border overflow-hidden">
                    {iconUrl ? (
                      <Image
                        src={iconUrl}
                        alt="Preview"
                        width={24}
                        height={24}
                        className="h-6 w-6 object-contain"
                        unoptimized
                        onError={e => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <PiFolderOpenDuotone className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: Descrição */}
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Descrição da categoria"
                rows={3}
              />
            </div>

            {/* Row 3: Status toggle */}
            <div className="flex items-center justify-between w-full rounded-lg border border-border bg-white dark:bg-slate-800/60 p-4">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-sm font-medium">Categoria Ativa</p>
                  <p className="text-xs text-muted-foreground">
                    Categorias inativas não aparecem nas listagens
                  </p>
                </div>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>
        </Card>

        {/* Subcategories Section */}
        {subcategories.length > 0 && (
          <Card className="bg-white/5 py-2 overflow-hidden">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <FolderTree className="h-5 w-5" />
                  Subcategorias ({subcategories.length})
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (subcategorySortableRef.current) {
                      reorderMutation.mutate(
                        subcategorySortableRef.current.getReorderedItems()
                      );
                    }
                  }}
                >
                  Salvar Ordem
                </Button>
              </div>
              <SortableCategoryList
                ref={subcategorySortableRef}
                items={subcategories}
              />
            </div>
          </Card>
        )}
      </PageBody>

      {/* Delete Confirmation */}
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
