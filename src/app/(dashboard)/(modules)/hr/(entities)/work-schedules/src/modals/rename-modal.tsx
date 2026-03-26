import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FormErrorIcon } from '@/components/ui/form-error-icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { translateError } from '@/lib/error-messages';
import type { WorkSchedule } from '@/types/hr';
import { Clock, Loader2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface RenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  workSchedule: WorkSchedule | null;
  isSubmitting: boolean;
  onSubmit: (id: string, name: string) => Promise<void>;
}

export function RenameModal({
  isOpen,
  onClose,
  workSchedule,
  isSubmitting,
  onSubmit,
}: RenameModalProps) {
  const [name, setName] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (workSchedule) {
      setName(workSchedule.name || '');
      setFieldErrors({});
    }
  }, [workSchedule]);

  if (!workSchedule) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      await onSubmit(workSchedule.id, trimmed);
      onClose();
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('name already') || msg.includes('already exists') || msg.includes('nome')) {
        setFieldErrors(prev => ({ ...prev, name: translateError(msg) }));
      } else {
        toast.error(translateError(msg));
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-md [&>button]:hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <DialogTitle className="text-lg font-semibold">
            <div className="flex gap-3 items-center">
              <div className="flex items-center justify-center text-white shrink-0 bg-linear-to-br from-indigo-500 to-violet-600 p-2 rounded-lg">
                <Clock className="h-5 w-5" />
              </div>
              Renomear Escala
            </div>
          </DialogTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="ws-rename">Nome da Escala</Label>
            <div className="relative">
              <Input
                id="ws-rename"
                value={name}
                onChange={e => {
                  setName(e.target.value);
                  if (fieldErrors.name) setFieldErrors(prev => ({ ...prev, name: '' }));
                }}
                placeholder="Digite o nome da escala"
                autoFocus
                maxLength={255}
                aria-invalid={!!fieldErrors.name}
              />
              <FormErrorIcon message={fieldErrors.name} />
            </div>
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
