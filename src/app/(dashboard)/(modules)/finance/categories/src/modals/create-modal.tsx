'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { FINANCE_CATEGORY_TYPE_LABELS } from '@/types/finance';
import type { FinanceCategory, FinanceCategoryType } from '@/types/finance';
import { Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';

interface CreateCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    type: FinanceCategoryType;
    description?: string;
    displayOrder?: number;
    parentId?: string;
  }) => Promise<void>;
  isSubmitting: boolean;
  nextDisplayOrder: number;
  categories?: FinanceCategory[];
}

export function CreateCategoryModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  nextDisplayOrder,
  categories = [],
}: CreateCategoryModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<FinanceCategoryType>('EXPENSE');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState<string>('');

  // Only allow nesting up to level 2 (0-based), so filter parents that are level 0 or 1
  const availableParents = useMemo(() => {
    // Build a level map
    const levelMap = new Map<string, number>();

    function computeLevel(cat: FinanceCategory): number {
      if (levelMap.has(cat.id)) return levelMap.get(cat.id)!;
      if (!cat.parentId) {
        levelMap.set(cat.id, 0);
        return 0;
      }
      const parent = categories.find(c => c.id === cat.parentId);
      if (!parent) {
        levelMap.set(cat.id, 0);
        return 0;
      }
      const parentLevel = computeLevel(parent);
      levelMap.set(cat.id, parentLevel + 1);
      return parentLevel + 1;
    }

    for (const cat of categories) {
      computeLevel(cat);
    }

    // Only allow parents at level 0 or 1 (so children would be level 1 or 2)
    return categories
      .filter(c => (levelMap.get(c.id) ?? 0) < 2)
      .map(c => ({
        ...c,
        level: levelMap.get(c.id) ?? 0,
      }));
  }, [categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onSubmit({
      name: name.trim(),
      type,
      description: description.trim() || undefined,
      displayOrder: nextDisplayOrder,
      parentId: parentId && parentId !== 'none' ? parentId : undefined,
    });
    // Reset on success
    setName('');
    setType('EXPENSE');
    setDescription('');
    setParentId('');
  };

  const handleClose = () => {
    setName('');
    setType('EXPENSE');
    setDescription('');
    setParentId('');
    onClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={open => {
        if (!open) handleClose();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Nova Categoria Financeira</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar uma nova categoria.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cat-name">Nome *</Label>
                <Input
                  id="cat-name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Nome da categoria"
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-type">Tipo *</Label>
                <Select
                  value={type}
                  onValueChange={v => setType(v as FinanceCategoryType)}
                >
                  <SelectTrigger id="cat-type">
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="cat-parent">Categoria Pai</Label>
              <Select
                value={parentId}
                onValueChange={setParentId}
              >
                <SelectTrigger id="cat-parent">
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
              <Label htmlFor="cat-desc">Descrição</Label>
              <Textarea
                id="cat-desc"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Descrição opcional"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Criar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
