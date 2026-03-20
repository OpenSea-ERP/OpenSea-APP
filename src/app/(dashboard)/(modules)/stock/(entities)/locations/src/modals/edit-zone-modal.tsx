'use client';

import { useState, useCallback, useEffect } from 'react';
import { Loader2, MapPin, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
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

  useEffect(() => {
    if (zone && open) {
      setCode(zone.code);
      setName(zone.name);
    }
  }, [zone, open]);

  const handleCodeChange = useCallback((value: string) => {
    setCode(
      value
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 5)
    );
  }, []);

  const handleClose = useCallback(() => {
    setCode('');
    setName('');
    onOpenChange(false);
  }, [onOpenChange]);

  const handleSave = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
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
    },
    [zone, code, name, updateZone, onSuccess, handleClose]
  );

  if (!zone) return null;

  const isValid = code.length >= 2 && name.trim().length > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={val => {
        if (!val) handleClose();
        else onOpenChange(val);
      }}
    >
      <DialogContent className="max-w-md [&>button]:hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <DialogTitle className="text-lg font-semibold">
            <div className="flex gap-3 items-center">
              <div className="flex items-center justify-center text-white shrink-0 bg-linear-to-br from-emerald-500 to-teal-600 p-2 rounded-lg">
                <MapPin className="h-5 w-5" />
              </div>
              Renomear Zona
            </div>
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 pt-2">
          <div className="grid grid-cols-[1fr_120px] gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-zone-name">Nome</Label>
              <Input
                id="edit-zone-name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Estoque"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-zone-code">Código</Label>
              <Input
                id="edit-zone-code"
                value={code}
                onChange={e => handleCodeChange(e.target.value)}
                placeholder="EST"
                maxLength={5}
                className="uppercase font-mono"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={updateZone.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={!isValid || updateZone.isPending}>
              {updateZone.isPending ? (
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
