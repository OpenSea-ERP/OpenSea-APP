'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KeyRound, Loader2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { storageSecurityService } from '@/services/storage/security.service';

interface SecurityKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function SecurityKeyDialog({ open, onOpenChange, onSuccess }: SecurityKeyDialogProps) {
  const [key, setKey] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) return;

    setIsVerifying(true);
    setError('');

    try {
      const { valid } = await storageSecurityService.verifySecurityKey(key.trim());
      if (valid) {
        toast.success('Itens ocultos revelados');
        onSuccess();
        onOpenChange(false);
        setKey('');
      } else {
        setError('Chave de segurança inválida');
      }
    } catch {
      setError('Erro ao verificar chave de segurança');
    } finally {
      setIsVerifying(false);
    }
  }, [key, onSuccess, onOpenChange]);

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setKey('');
      setError('');
    }
    onOpenChange(open);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5" />
            Chave de Segurança
          </DialogTitle>
          <DialogDescription>
            Digite a chave de segurança para revelar itens ocultos.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="security-key">Chave</Label>
              <Input
                id="security-key"
                type="password"
                autoComplete="off"
                placeholder="Digite a chave de segurança..."
                value={key}
                onChange={e => { setKey(e.target.value); setError(''); }}
                disabled={isVerifying}
                autoFocus
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isVerifying}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!key.trim() || isVerifying}>
              {isVerifying && <Loader2 className="w-4 h-4 animate-spin" />}
              Verificar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
