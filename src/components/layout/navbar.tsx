/**
 * Navbar Component
 * Barra de navegação flutuante principal
 */

'use client';

import { NotificationsPanel } from '@/components/shared/notifications-panel';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { PrintQueuePanel } from '@/core/print-queue';

import { Crown, Grid3x3, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { UserDropdown } from './user-dropdown';

interface NavbarProps {
  onMenuOpen: () => void;
}

export function Navbar({ onMenuOpen }: NavbarProps) {
  const { isSuperAdmin } = useAuth();

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-[1600px]">
      <div className="bg-white/95 dark:bg-slate-900/95 border border-gray-200 dark:border-white/10 rounded-2xl shadow-lg px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900 dark:text-white">
              OpenSea
            </span>
          </Link>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <Link href="/central">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl gap-2 text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
                >
                  <Crown className="w-4 h-4" />
                  Central
                </Button>
              </Link>
            )}
            <PrintQueuePanel />
            <NotificationsPanel />

            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl"
              onClick={onMenuOpen}
              aria-label="Abrir menu de navegação"
            >
              <Grid3x3 className="w-5 h-5" />
            </Button>

            <UserDropdown />
          </div>
        </div>
      </div>
    </nav>
  );
}
