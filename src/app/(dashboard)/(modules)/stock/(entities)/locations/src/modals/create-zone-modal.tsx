'use client';

import { useState, useCallback, useMemo } from 'react';
import { Loader2, MapPin } from 'lucide-react';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useCreateZone } from '../api/zones.queries';

// ============================================
// TYPES
// ============================================

export interface CreateZoneModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouseId: string;
  warehouseName?: string;
  onSuccess?: () => void;
}

// ============================================
// COMPONENT
// ============================================

export function CreateZoneModal({
  open,
  onOpenChange,
  warehouseId,
  warehouseName,
  onSuccess,
}: CreateZoneModalProps) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const createZone = useCreateZone();

  const handleCodeChange = useCallback((value: string) => {
    setCode(value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5));
  }, []);

  const handleClose = useCallback(() => {
    setCode('');
    setName('');
    onOpenChange(false);
  }, [onOpenChange]);

  const handleCreate = useCallback(async () => {
    if (code.length < 2 || !name.trim()) return;

    try {
      await createZone.mutateAsync({
        warehouseId,
        data: {
          code,
          name: name.trim(),
        },
      });
      toast.success('Zona criada com sucesso!');
      onSuccess?.();
      handleClose();
    } catch {
      toast.error('Erro ao criar zona. Tente novamente.');
    }
  }, [code, name, warehouseId, createZone, onSuccess, handleClose]);

  const isValid = code.length >= 2 && name.trim().length > 0;

  const steps = useMemo<WizardStep[]>(() => [
    {
      title: (
        <span className="inline-flex items-center gap-2 flex-wrap">
          Nova Zona
          {warehouseName && (
            <span className="inline-flex items-center rounded-md border border-border bg-muted/50 px-2 py-0.5 text-[11px] font-medium uppercase text-muted-foreground">
              {warehouseName}
            </span>
          )}
        </span>
      ),
      description: 'Defina o código e nome da nova zona.',
      icon: <MapPin className="h-16 w-16 text-emerald-500/60" />,
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="zone-name">
              Nome <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="zone-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Estoque"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zone-code">
              Código <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="zone-code"
              value={code}
              onChange={e => handleCodeChange(e.target.value)}
              placeholder="Ex: EST"
              maxLength={5}
              className="uppercase font-mono"
            />
            <p className="text-[11px] text-muted-foreground">
              2 a 5 caracteres (letras e números)
            </p>
          </div>
        </div>
      ),
      isValid,
      footer: (
        <div className="flex items-center justify-end w-full gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={createZone.isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleCreate}
            disabled={!isValid || createZone.isPending}
            className="gap-1.5"
          >
            {createZone.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {createZone.isPending ? 'Criando...' : 'Criar Zona'}
          </Button>
        </div>
      ),
    },
  ], [code, name, warehouseName, isValid, handleCodeChange, handleClose, handleCreate, createZone.isPending]);

  return (
    <StepWizardDialog
      open={open}
      onOpenChange={onOpenChange}
      steps={steps}
      currentStep={1}
      onStepChange={() => {}}
      onClose={handleClose}
    />
  );
}
