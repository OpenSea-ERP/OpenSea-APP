/**
 * Edit Finance Category Page
 * Standard pattern with PageBreadcrumb and parent category selector
 */

'use client';

import { PageBreadcrumb } from '@/components/layout/page-breadcrumb';
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
import { FINANCE_CATEGORY_TYPE_LABELS } from '@/types/finance';
import type { FinanceCategoryType } from '@/types/finance';
import { Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

export default function EditFinanceCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data, isLoading } = useFinanceCategory(id);
  const { data: allCategoriesData } = useFinanceCategories();
  const updateMutation = useUpdateFinanceCategory();
  const category = data?.category;
  const allCategories = allCategoriesData?.categories ?? [];

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'EXPENSE' as FinanceCategoryType,
    displayOrder: 0,
    isActive: true,
    color: '',
    parentId: '',
  });

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

  // Available parents: exclude self and own descendants, max level 1 for parents
  const availableParents = useMemo(() => {
    // Build descendant set
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

    // Build level map
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
      .filter(
        c =>
          c.id !== id &&
          !descendants.has(c.id) &&
          (levelMap.get(c.id) ?? 0) < 2
      )
      .map(c => ({
        ...c,
        level: levelMap.get(c.id) ?? 0,
      }));
  }, [allCategories, id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="space-y-4 w-full max-w-2xl">
          <div className="h-8 bg-muted animate-pulse rounded" />
          <div className="h-64 bg-muted animate-pulse rounded" />
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-destructive">Categoria não encontrada.</p>
      </div>
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
      toast.success('Categoria atualizada com sucesso!');
      router.push(`/finance/categories/${id}`);
    } catch {
      toast.error('Erro ao atualizar categoria.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex w-full items-center justify-between">
        <PageBreadcrumb
          items={[
            { label: 'Financeiro', href: '/finance' },
            { label: 'Categorias', href: '/finance/categories' },
            {
              label: category.name,
              href: `/finance/categories/${id}`,
            },
            { label: 'Editar' },
          ]}
        />
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-6">Editar Categoria</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={e =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: string) =>
                  setFormData({
                    ...formData,
                    type: value as typeof formData.type,
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
            </div>

            <div className="space-y-2">
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

            <div className="space-y-2">
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

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={e =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Cor</Label>
              <Input
                id="color"
                type="color"
                value={formData.color || '#8b5cf6'}
                onChange={e =>
                  setFormData({ ...formData, color: e.target.value })
                }
              />
            </div>

            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={e =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="h-4 w-4 rounded border-border"
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                Categoria ativa
              </Label>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/finance/categories/${id}`)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {updateMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
