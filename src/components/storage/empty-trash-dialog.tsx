'use client';

import { Trash2 } from 'lucide-react';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { useEmptyTrash } from '@/hooks/storage';
import { toast } from 'sonner';

interface EmptyTrashDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmptyTrashDialog({ open, onOpenChange }: EmptyTrashDialogProps) {
  const emptyTrash = useEmptyTrash();

  const handleConfirm = async () => {
    try {
      const result = await emptyTrash.mutateAsync();
      toast.success(
        `Lixeira esvaziada: ${result.deletedFiles} arquivo(s) e ${result.deletedFolders} pasta(s) removidos`,
      );
      onOpenChange(false);
    } catch {
      toast.error('Falha ao esvaziar a lixeira');
    }
  };

  return (
    <VerifyActionPinModal
      isOpen={open}
      onClose={() => onOpenChange(false)}
      onSuccess={handleConfirm}
      title="Esvaziar lixeira"
      description="Esta ação é irreversível. Todos os itens na lixeira serão excluídos permanentemente. Digite seu PIN de ação para confirmar."
    />
  );
}
