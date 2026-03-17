import { Button } from '@/components/ui/button';
import { CategoryCombobox } from '@/components/ui/category-combobox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useCategories } from '@/hooks/stock/use-categories';
import type { Category } from '@/types/stock';
import { Loader2, Tag, X } from 'lucide-react';
import { useState } from 'react';

interface AssignCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  productIds: string[];
  isSubmitting: boolean;
  onSubmit: (ids: string[], categoryId: string) => Promise<void>;
}

export function AssignCategoryModal({
  isOpen,
  onClose,
  productIds,
  isSubmitting,
  onSubmit,
}: AssignCategoryModalProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const { data: categoriesData } = useCategories();
  const categories =
    (categoriesData as { categories: Category[] } | undefined)?.categories ??
    [];

  const count = productIds.length;
  const title =
    count > 1 ? `Atribuir Categoria (${count} produtos)` : 'Atribuir Categoria';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategoryId) return;
    await onSubmit(productIds, selectedCategoryId);
    setSelectedCategoryId('');
    onClose();
  };

  const handleClose = () => {
    setSelectedCategoryId('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && handleClose()}>
      <DialogContent className="max-w-md [&>button]:hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <DialogTitle className="text-lg font-semibold">
            <div className="flex gap-3 items-center">
              <div className="flex items-center justify-center text-white shrink-0 bg-linear-to-br from-cyan-500 to-teal-600 p-2 rounded-lg">
                <Tag className="h-5 w-5" />
              </div>
              {title}
            </div>
          </DialogTitle>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Categoria</Label>
            <CategoryCombobox
              categories={categories}
              value={selectedCategoryId}
              onValueChange={setSelectedCategoryId}
              placeholder="Selecione uma categoria..."
            />
          </div>

          {count > 1 && (
            <p className="text-sm text-muted-foreground">
              A categoria selecionada será atribuída a {count} produtos.
            </p>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!selectedCategoryId || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Atribuir'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
