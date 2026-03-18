'use client';

import { useState, useCallback } from 'react';
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
import { useCreateZone } from '../api/zones.queries';

// ============================================
// TYPES
// ============================================

export interface CreateZoneModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouseId: string;
  onSuccess?: () => void;
}

// ============================================
// COMPONENT
// ============================================

export function CreateZoneModal({
  open,
  onOpenChange,
  warehouseId,
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
          <DialogTitle>Nova Zona</DialogTitle>
          <DialogDescription>
            Adicione uma nova zona ao armazém
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="zone-code">Código</Label>
            <Input
              id="zone-code"
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
            <Label htmlFor="zone-name">Nome</Label>
            <Input
              id="zone-name"
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
            disabled={createZone.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!isValid || createZone.isPending}
            className="gap-1.5"
          >
            {createZone.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {createZone.isPending ? 'Criando...' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
