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
import type { Product } from '@/types/stock';
import { Loader2, Package, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface RenameProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  isSubmitting: boolean;
  onSubmit: (id: string, data: { name: string }) => Promise<void>;
}

export function RenameProductModal({
  isOpen,
  onClose,
  product,
  isSubmitting,
  onSubmit,
}: RenameProductModalProps) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (product) {
      setName(product.name || '');
    }
  }, [product]);

  if (!product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    await onSubmit(product.id, { name: trimmed });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-md [&>button]:hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <DialogTitle className="text-lg font-semibold">
            <div className="flex gap-3 items-center">
              <div className="flex items-center justify-center text-white shrink-0 bg-linear-to-br from-blue-500 to-cyan-600 p-2 rounded-lg">
                <Package className="h-5 w-5" />
              </div>
              Renomear Produto
            </div>
          </DialogTitle>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Fechar">
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="product-name">Nome do Produto</Label>
            <Input
              id="product-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Digite o nome do produto"
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
