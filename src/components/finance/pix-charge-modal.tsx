'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, QrCode, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import type { CreatePixChargeResponse } from '@/types/finance';

interface PixChargeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pixCharge: CreatePixChargeResponse | null;
  entryDescription?: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function getTimeRemaining(expiresAt: string): {
  expired: boolean;
  text: string;
} {
  const now = Date.now();
  const expiry = new Date(expiresAt).getTime();
  const diff = expiry - now;

  if (diff <= 0) {
    return { expired: true, text: 'Expirado' };
  }

  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  if (minutes > 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return {
      expired: false,
      text: `${hours}h ${remainingMinutes.toString().padStart(2, '0')}min`,
    };
  }

  return {
    expired: false,
    text: `${minutes}:${seconds.toString().padStart(2, '0')}`,
  };
}

type PixChargeStatus = 'ACTIVE' | 'PAID' | 'EXPIRED';

function getStatusBadge(status: PixChargeStatus) {
  switch (status) {
    case 'ACTIVE':
      return (
        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 border-0">
          Ativa
        </Badge>
      );
    case 'PAID':
      return (
        <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 border-0">
          Pago
        </Badge>
      );
    case 'EXPIRED':
      return (
        <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400 border-0">
          Expirado
        </Badge>
      );
  }
}

export function PixChargeModal({
  open,
  onOpenChange,
  pixCharge,
  entryDescription,
}: PixChargeModalProps) {
  const [timeRemaining, setTimeRemaining] = useState<{
    expired: boolean;
    text: string;
  }>({ expired: false, text: '' });

  useEffect(() => {
    if (!pixCharge?.expiresAt || !open) return;

    const update = () => {
      setTimeRemaining(getTimeRemaining(pixCharge.expiresAt));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [pixCharge?.expiresAt, open]);

  if (!pixCharge) return null;

  const status: PixChargeStatus = timeRemaining.expired ? 'EXPIRED' : 'ACTIVE';

  const handleCopyPixCode = async () => {
    try {
      await navigator.clipboard.writeText(pixCharge.pixCopiaECola);
      toast.success('Copiado!');
    } catch {
      toast.error('Erro ao copiar para a área de transferência.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-violet-100 dark:bg-violet-500/10">
              <QrCode className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <DialogTitle className="text-lg">Cobrança PIX</DialogTitle>
              <DialogDescription>
                {entryDescription || 'Cobrança PIX gerada com sucesso'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Amount */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Valor</p>
            <p className="text-3xl font-bold text-violet-600 dark:text-violet-400">
              {formatCurrency(pixCharge.amount)}
            </p>
          </div>

          {/* Status + Expiration */}
          <div className="flex items-center justify-center gap-4">
            {getStatusBadge(status)}
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{timeRemaining.text}</span>
            </div>
          </div>

          {/* QR Code */}
          {pixCharge.qrCodeUrl && (
            <div className="flex justify-center">
              <div className="bg-white p-4 rounded-xl border">
                <img
                  src={pixCharge.qrCodeUrl}
                  alt="QR Code PIX"
                  className="w-48 h-48 object-contain"
                />
              </div>
            </div>
          )}

          {/* Copia e Cola */}
          <div>
            <p className="text-sm text-muted-foreground mb-1">
              PIX Copia e Cola
            </p>
            <div className="bg-violet-50 dark:bg-violet-500/8 rounded-lg p-3">
              <p className="font-mono text-xs tracking-wide break-all text-violet-700 dark:text-violet-300 line-clamp-4">
                {pixCharge.pixCopiaECola}
              </p>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Identificador</p>
              <Badge variant="outline" className="font-mono text-xs">
                {pixCharge.txId.slice(0, 16)}...
              </Badge>
            </div>
            <div>
              <p className="text-muted-foreground">Expiração</p>
              <p className="font-medium">
                {new Date(pixCharge.expiresAt).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-2">
            <Button
              variant="default"
              className="w-full gap-2"
              onClick={handleCopyPixCode}
              disabled={timeRemaining.expired}
            >
              <Copy className="h-4 w-4" />
              Copiar Código PIX
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => onOpenChange(false)}
            >
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
