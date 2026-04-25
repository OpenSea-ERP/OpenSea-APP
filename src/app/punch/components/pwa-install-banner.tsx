'use client';

/**
 * `PWAInstallBanner` — sticky CTA shown inside `/punch` when the runtime
 * is mobile + NOT in standalone mode + dismiss flag absent.
 *
 * Three install paths:
 *   - Android Chrome / Desktop Edge → deferred `beforeinstallprompt` via
 *     `usePwaInstall().install()`.
 *   - iOS Safari → opens `IOSAddToHomeScreenModal` (no `beforeinstallprompt`
 *     event on iOS).
 *   - Already installed (standalone) → banner does not render at all.
 *
 * Dismiss persists in `localStorage` under `punch-pwa-install-dismissed` so
 * the banner does not nag the user every visit.
 */

import { Smartphone, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { isIOS } from '@/app/punch/utils/ios-detection';
import { usePwaInstall } from '@/hooks/pwa/use-pwa-install';
import { usePwaStandaloneDetect } from '@/hooks/pwa/use-pwa-standalone-detect';
import { cn } from '@/lib/utils';

import { IOSAddToHomeScreenModal } from './ios-add-to-home-screen-modal';

const DISMISS_STORAGE_KEY = 'punch-pwa-install-dismissed';

function isMobileUA(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function PWAInstallBanner() {
  const { isStandalone } = usePwaStandaloneDetect();
  const { isInstallable, install } = usePwaInstall();
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage?.getItem(DISMISS_STORAGE_KEY) === '1';
  });
  const [iosModalOpen, setIosModalOpen] = useState(false);
  const [mobileChecked, setMobileChecked] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Defer mobile UA check to the client (next tick) so SSR snapshot is empty
  // and we do not flash a banner on hydration of desktop pages.
  useEffect(() => {
    setIsMobile(isMobileUA());
    setMobileChecked(true);
  }, []);

  if (!mobileChecked) return null;
  if (!isMobile) return null;
  if (isStandalone) return null;
  if (dismissed) return null;

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage?.setItem(DISMISS_STORAGE_KEY, '1');
      } catch {
        // localStorage may be unavailable (private mode / quota) — UX-only flag
      }
    }
    setDismissed(true);
  };

  const handleInstallClick = async () => {
    if (isIOS()) {
      setIosModalOpen(true);
      return;
    }
    if (isInstallable) {
      await install();
    }
  };

  return (
    <>
      <div
        data-testid="pwa-install-banner"
        className={cn(
          'flex items-center gap-3 rounded-2xl px-4 py-3 border',
          'bg-violet-50 dark:bg-violet-500/8 border-violet-200 dark:border-violet-500/20'
        )}
      >
        <span
          className={cn(
            'flex size-9 items-center justify-center rounded-xl shrink-0',
            'bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-300'
          )}
        >
          <Smartphone className="size-4" />
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-violet-700 dark:text-violet-200">
            Instale o app de ponto
          </p>
          <p className="text-xs text-violet-600/80 dark:text-violet-300/80">
            Acesso mais rápido e funciona offline.
          </p>
        </div>

        <button
          type="button"
          onClick={handleInstallClick}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold shrink-0 text-white',
            'bg-linear-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700'
          )}
        >
          Instalar
        </button>

        <button
          type="button"
          aria-label="Dispensar"
          onClick={handleDismiss}
          className={cn(
            'flex size-8 items-center justify-center rounded-lg shrink-0',
            'text-violet-600/70 hover:text-violet-800 dark:text-violet-300/70 dark:hover:text-violet-200',
            'hover:bg-violet-100 dark:hover:bg-violet-500/20'
          )}
        >
          <X className="size-4" />
        </button>
      </div>

      <IOSAddToHomeScreenModal
        open={iosModalOpen}
        onClose={() => setIosModalOpen(false)}
      />
    </>
  );
}
