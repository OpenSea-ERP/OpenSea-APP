'use client';

/**
 * `IOSAddToHomeScreenModal` — fallback install path for iOS Safari.
 *
 * Safari does not fire `beforeinstallprompt`, so we cannot trigger a native
 * prompt. Instead we render a 3-step instructional dialog telling the user
 * how to manually add the PWA to the home screen via the Share sheet.
 *
 * Triggered by `PWAInstallBanner` when `isIOS()` is true.
 */

import { Plus, Share } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface IOSAddToHomeScreenModalProps {
  open: boolean;
  onClose: () => void;
}

export function IOSAddToHomeScreenModal({
  open,
  onClose,
}: IOSAddToHomeScreenModalProps) {
  return (
    <Dialog open={open} onOpenChange={value => !value && onClose()}>
      <DialogContent className="max-w-sm" data-testid="ios-a2hs-modal">
        <DialogHeader>
          <DialogTitle>Adicione à Tela de Início</DialogTitle>
          <DialogDescription>
            Siga os 3 passos abaixo para instalar o app de ponto no seu iPhone
            ou iPad.
          </DialogDescription>
        </DialogHeader>

        <ol className="space-y-4 text-sm text-slate-700 dark:text-slate-200">
          <li className="flex items-start gap-3">
            <span className="size-7 shrink-0 rounded-full bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-200 flex items-center justify-center font-bold">
              1
            </span>
            <span>
              Toque no botão{' '}
              <Share
                className="inline size-4 text-violet-600 dark:text-violet-300"
                aria-label="Compartilhar"
              />{' '}
              <strong>Compartilhar</strong> (parte inferior da barra do Safari).
            </span>
          </li>

          <li className="flex items-start gap-3">
            <span className="size-7 shrink-0 rounded-full bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-200 flex items-center justify-center font-bold">
              2
            </span>
            <span>
              Selecione{' '}
              <Plus
                className="inline size-4 text-violet-600 dark:text-violet-300"
                aria-label="Adicionar"
              />{' '}
              <strong>Adicionar à Tela de Início</strong> na lista que aparecer.
            </span>
          </li>

          <li className="flex items-start gap-3">
            <span className="size-7 shrink-0 rounded-full bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-200 flex items-center justify-center font-bold">
              3
            </span>
            <span>
              Toque em <strong>Adicionar</strong> no canto superior direito para
              confirmar.
            </span>
          </li>
        </ol>

        <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
          Após instalar, abra o app pela Tela de Início para receber
          notificações de confirmação.
        </p>
      </DialogContent>
    </Dialog>
  );
}
