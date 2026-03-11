import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Copy } from 'lucide-react';

interface DuplicateConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemCount: number;
  onConfirm: () => Promise<void> | void;
  isLoading?: boolean;
}

export function DuplicateConfirmModal({
  isOpen,
  onClose,
  itemCount,
  onConfirm,
  isLoading,
}: DuplicateConfirmModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="w-5 h-5" />
            Confirmar duplicação
          </DialogTitle>
          <DialogDescription>
            Criar cópia de{' '}
            {itemCount === 1 ? '1 empresa' : `${itemCount} empresas`}? O CNPJ
            será regenerado automaticamente para evitar duplicidade.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Duplicando...' : 'Duplicar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
