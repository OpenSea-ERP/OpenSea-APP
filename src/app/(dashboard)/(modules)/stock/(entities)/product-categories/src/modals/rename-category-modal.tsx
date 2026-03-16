import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Category } from '@/types/stock';
import { Loader2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { PiFolderOpenDuotone } from 'react-icons/pi';

interface RenameCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  isSubmitting: boolean;
  onSubmit: (id: string, data: { name: string }) => Promise<void>;
}

export function RenameCategoryModal({
  isOpen,
  onClose,
  category,
  isSubmitting,
  onSubmit,
}: RenameCategoryModalProps) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (category) {
      setName(category.name || '');
    }
  }, [category]);

  if (!category) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    await onSubmit(category.id, { name: trimmed });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-md [&>button]:hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <DialogTitle className="text-lg font-semibold">
            <div className="flex gap-3 items-center">
              <div className="flex items-center justify-center text-white shrink-0 bg-linear-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
                <PiFolderOpenDuotone className="h-5 w-5" />
              </div>
              Renomear Categoria
            </div>
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="category-name">Nome da Categoria</Label>
            <Input
              id="category-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Digite o nome da categoria"
              autoFocus
              maxLength={255}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!name.trim() || isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
