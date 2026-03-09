/**
 * Edit Finance Category Page
 * Follows company edit page pattern: PageLayout > PageActionBar (Save/Cancel) > Identity Card > Form
 */

'use client';

import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { Badge } from '@/components/ui/badge';
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
import { Textarea } from '@/components/ui/textarea';
import {
  useFinanceCategories,
  useFinanceCategory,
  useUpdateFinanceCategory,
} from '@/hooks/finance';
import { useQueryClient } from '@tanstack/react-query';
import { FINANCE_CATEGORY_TYPE_LABELS } from '@/types/finance';
import type { FinanceCategoryType } from '@/types/finance';
import { FolderTree, Save, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

export default function EditFinanceCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data, isLoading } = useFinanceCategory(id);
  const { data: allCategoriesData, isLoading: isLoadingCategories } =
    useFinanceCategories();
  const updateMutation = useUpdateFinanceCategory();
  const queryClient = useQueryClient();
  const category = data?.category;
  const allCategories = allCategoriesData?.categories ?? [];
  const formRef = useRef<HTMLFormElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'EXPENSE' as FinanceCategoryType,
    displayOrder: 0,
    isActive: true,
    color: '',
    parentId: '',
  });

  // Whether this category is a child (has a parent)
  const isChild = !!category?.parentId;

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
      });
    }
  }, [category]);

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
  }, [allCategories, id, formData.type]);

  // Check if this category has children
  const hasChildren = useMemo(
    () => allCategories.some(c => c.parentId === id),
    [allCategories, id]
  );

  if (isLoading || isLoadingCategories) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Financeiro', href: '/finance' },
              { label: 'Categorias', href: '/finance/categories' },
            ]}
          />
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
          <PageActionBar
            breadcrumbItems={[
              { label: 'Financeiro', href: '/finance' },
              { label: 'Categorias', href: '/finance/categories' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <Card className="bg-white/5 p-12 text-center">
            <FolderTree className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">
              Categoria não encontrada
            </h2>
            <Button onClick={() => router.push('/finance/categories')}>
              Voltar para Categorias
            </Button>
          </Card>
        </PageBody>
      </PageLayout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
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
      await queryClient.invalidateQueries({ queryKey: ['finance-categories'] });
      toast.success('Categoria atualizada com sucesso!');
      router.push(`/finance/categories/${id}`);
    } catch {
      toast.error('Erro ao atualizar categoria.');
    }
  };

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Financeiro', href: '/finance' },
            { label: 'Categorias', href: '/finance/categories' },
            {
              label: category.name,
              href: `/finance/categories/${id}`,
            },
            { label: 'Editar' },
          ]}
          buttons={[
            {
              id: 'cancel',
              title: 'Cancelar',
              icon: X,
              onClick: () => router.push(`/finance/categories/${id}`),
              variant: 'outline',
            },
            {
              id: 'save',
              title: 'Salvar',
              icon: Save,
              onClick: () => {
                if (formRef.current) {
                  formRef.current.dispatchEvent(
                    new Event('submit', { cancelable: true, bubbles: true })
                  );
                }
              },
              disabled: updateMutation.isPending,
            },
          ]}
        />

        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-start gap-5">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-xl shrink-0"
              style={{
                background: category.color
                  ? `linear-gradient(135deg, ${category.color}, ${category.color}cc)`
                  : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              }}
            >
              <FolderTree className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold tracking-tight">
                {category.name}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Editar Categoria
              </p>
            </div>
            <Badge variant="secondary">Editando</Badge>
          </div>
        </Card>
      </PageHeader>

      <PageBody>
        <Card className="p-4 sm:p-6 w-full bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* Row 1: Name + Parent */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">
                  Nome <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  required
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

            {/* Row 2: Type + Status + Order */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">
                  Tipo <span className="text-red-500">*</span>
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
                    Alterar o tipo irá propagar para todas as subcategorias.
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.isActive ? 'active' : 'inactive'}
                  onValueChange={v =>
                    setFormData({ ...formData, isActive: v === 'active' })
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

            {/* Row 3: Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Descrição opcional da categoria"
                rows={3}
              />
            </div>

            {/* Row 4: Color */}
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
          </form>
        </Card>
      </PageBody>
    </PageLayout>
  );
}
