'use client';

/**
 * PushConsentModal — opt-in dialog asking the employee for Web Push consent.
 *
 * Phase 8 / Plan 08-03 / Task 1 (D-03).
 *
 * Shown ~1.5s after the FIRST successful punch in the session, controlled by
 * the parent `/punch/page.tsx` (which also persists a `localStorage` flag so
 * we never show the modal twice).
 *
 * Subscribe is delegated to `usePushSubscription` parametrised for the
 * dedicated punch service worker (`/sw-punch.js`, scope `/punch`) — set up by
 * Plan 8-01. On subscribe success the modal closes and surfaces a toast; on
 * "Agora não" we persist a separate `push-consent-dismissed` flag so we
 * don't nag again.
 */

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePushSubscription } from '@/features/notifications/hooks/use-push-subscription';
import { Bell, Check } from 'lucide-react';
import { toast } from 'sonner';

interface PushConsentModalProps {
  open: boolean;
  onClose: () => void;
  employeeName?: string;
}

const DISMISSED_KEY = 'push-consent-dismissed';

export function PushConsentModal({
  open,
  onClose,
  employeeName,
}: PushConsentModalProps) {
  const { subscribe, subscribing } = usePushSubscription({
    swPath: '/sw-punch.js',
    swScope: '/punch',
  });

  const handleEnable = async () => {
    try {
      const deviceLabel = employeeName
        ? `Punch PWA — ${employeeName}`
        : 'Punch PWA';
      const endpoint = await subscribe(deviceLabel);
      if (endpoint) {
        toast.success('Notificações ativadas');
      } else {
        toast.info('Permissão não concedida.');
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro ao ativar notificações';
      toast.error(message);
    } finally {
      onClose();
    }
  };

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(DISMISSED_KEY, Date.now().toString());
      } catch {
        /* localStorage unavailable — silent (UX flag, non-critical) */
      }
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={open => !open && onClose()}>
      <DialogContent data-testid="push-consent-modal" className="max-w-sm">
        <DialogHeader>
          <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-violet-100 dark:bg-violet-500/20">
            <Bell className="size-6 text-violet-600 dark:text-violet-300" />
          </div>
          <DialogTitle className="text-center">
            Receber confirmações?
          </DialogTitle>
          <DialogDescription className="text-center">
            Ative as notificações para confirmar suas batidas e receber avisos
            do gestor — funciona mesmo com o app fechado.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            type="button"
            onClick={handleEnable}
            disabled={subscribing}
            data-testid="push-consent-enable"
            className="w-full"
          >
            <Check className="mr-2 size-4" />
            {subscribing ? 'Ativando...' : 'Ativar notificações'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={handleDismiss}
            data-testid="push-consent-dismiss"
            className="w-full"
          >
            Agora não
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
