'use client';

import { useState, useCallback, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useUpdateZone } from '../api/zones.queries';
import type { Zone } from '@/types/stock';

// ============================================
// TYPES
// ============================================

export interface EditZoneModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zone: Zone | null;
  onSuccess?: () => void;
}

// ============================================
// COMPONENT
// ============================================

export function EditZoneModal({
  open,
  onOpenChange,
  zone,
  onSuccess,
}: EditZoneModalProps) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const updateZone = useUpdateZone();

  // Pre-fill with zone data when modal opens
  useEffect(() => {
    if (zone && open) {
      setCode(zone.code);
      setName(zone.name);
    }
  }, [zone, open]);

  const handleCodeChange = useCallback((value: string) => {
    setCode(value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5));
  }, []);

  const handleClose = useCallback(() => {
    setCode('');
    setName('');
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSave = useCallback(async () => {
    if (!zone || code.length < 2 || !name.trim()) return;

    try {
      await updateZone.mutateAsync({
        id: zone.id,
        data: {
          code,
          name: name.trim(),
        },
      });
      toast.success('Zona atualizada com sucesso!');
      onSuccess?.();
      handleClose();
    } catch {
      toast.error('Erro ao atualizar zona. Tente novamente.');
    }
  }, [zone, code, name, updateZone, onSuccess, handleClose]);

  const isValid = code.length >= 2 && name.trim().length > 0;

  if (!zone) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={val => {
        if (!val) handleClose();
        else onOpenChange(val);
      }}
    >
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Editar Zona</DialogTitle>
          <DialogDescription>
            Altere as informações da zona
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-zone-code">Código</Label>
            <Input
              id="edit-zone-code"
              value={code}
              onChange={e => handleCodeChange(e.target.value)}
              placeholder="Ex: EST"
              maxLength={5}
              className="uppercase"
            />
            <p className="text-xs text-muted-foreground">
              2 a 5 caracteres (letras e números)
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-zone-name">Nome</Label>
            <Input
              id="edit-zone-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Estoque"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={updateZone.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isValid || updateZone.isPending}
            className="gap-1.5"
          >
            {updateZone.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {updateZone.isPending ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
