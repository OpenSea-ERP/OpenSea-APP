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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type {
  CompanyCnae,
  CreateCompanyCnaeData,
  UpdateCompanyCnaeData,
} from '@/types/hr';
import { FileCheck, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

export type CnaeFormData = Partial<
  CreateCompanyCnaeData | UpdateCompanyCnaeData
>;

interface CnaeModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  cnae?: CompanyCnae | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (data: CnaeFormData) => Promise<void>;
}

export function CnaeModal({
  isOpen,
  mode,
  cnae,
  isSubmitting,
  onClose,
  onSubmit,
}: CnaeModalProps) {
  const [form, setForm] = useState<CnaeFormData>({
    isPrimary: false,
  });

  useEffect(() => {
    if (cnae) {
      setForm({
        code: cnae.code || '',
        description: cnae.description || '',
        isPrimary: cnae.isPrimary ?? false,
      });
    } else {
      setForm({ isPrimary: false });
    }
  }, [cnae]);

  const title = useMemo(
    () => (mode === 'create' ? 'Novo CNAE' : 'Editar CNAE'),
    [mode]
  );

  const handleChange = (field: keyof CnaeFormData, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.code || !form.description) return;
    await onSubmit(form);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-2xl [&>button]:hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <DialogTitle className="text-lg font-semibold flex items-center gap-3">
            <div className="flex items-center justify-center text-white shrink-0 bg-linear-to-br from-emerald-500 to-teal-600 p-2 rounded-lg">
              <FileCheck className="h-5 w-5" />
            </div>
            {title}
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="gap-2"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div>
            <Label htmlFor="cnae-code">Código CNAE *</Label>
            <Input
              id="cnae-code"
              value={form.code || ''}
              onChange={e => handleChange('code', e.target.value)}
              placeholder="0000-0/00"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Formato: 7 dígitos (exemplo: 4712-1/00)
            </p>
          </div>

          <div>
            <Label htmlFor="cnae-description">Descrição *</Label>
            <Textarea
              id="cnae-description"
              value={form.description || ''}
              onChange={e => handleChange('description', e.target.value)}
              placeholder="Descrição da atividade econômica"
              rows={3}
              required
            />
          </div>

          <div className="flex items-center justify-between rounded-md border px-4 py-3">
            <div>
              <Label htmlFor="cnae-primary" className="text-sm font-medium">
                CNAE Principal?
              </Label>
              <p className="text-xs text-muted-foreground">
                Marcar como atividade econômica principal da empresa.
              </p>
            </div>
            <Switch
              id="cnae-primary"
              checked={!!form.isPrimary}
              onCheckedChange={value => handleChange('isPrimary', value)}
            />
          </div>
        </div>

        <DialogFooter className="flex items-center justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !form.code || !form.description}
          >
            {isSubmitting ? 'Salvando...' : 'Salvar CNAE'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
