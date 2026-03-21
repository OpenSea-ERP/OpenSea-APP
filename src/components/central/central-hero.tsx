'use client';

import { useCentralTheme } from '@/contexts/central-theme-context';
import { cn } from '@/lib/utils';
import { Bell, Moon, Search, Sun } from 'lucide-react';
import { ReactNode } from 'react';

export interface CentralHeroProps {
  children?: ReactNode;
  greeting?: string;
  subtitle?: string;
  className?: string;
}

/**
 * Hero banner do Central (topo das páginas).
 * Contém greeting, barra de busca com ⌘K, sino de notificações,
 * toggle de tema e slot para stat pills.
 */
export function CentralHero({
  children,
  greeting,
  subtitle,
  className,
}: CentralHeroProps) {
  const { theme, toggleTheme } = useCentralTheme();

  return (
    <section className={cn('central-hero', className)}>
      {/* Top row: greeting + controls */}
      <div className="flex items-center justify-between mb-4">
        <div>
          {greeting && (
            <h1
              className="text-lg font-bold"
              style={{ color: 'var(--central-hero-text)' }}
            >
              {greeting}
            </h1>
          )}
          {subtitle && (
            <p
              className="text-xs mt-0.5"
              style={{ color: 'var(--central-hero-muted)' }}
            >
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Search bar */}
          <button
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm central-transition"
            style={{
              background: 'var(--central-hero-search-bg)',
              color: 'var(--central-hero-search-text)',
            }}
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden sm:inline text-xs">Buscar...</span>
            <kbd
              className="hidden sm:inline text-[10px] font-mono px-1.5 py-0.5 rounded"
              style={{
                background: 'var(--central-hero-kbd-bg)',
                color: 'var(--central-hero-kbd-text)',
              }}
            >
              ⌘K
            </kbd>
          </button>

          {/* Notification bell */}
          <button
            className="flex items-center justify-center w-8 h-8 rounded-lg central-transition"
            style={{
              background: 'var(--central-hero-btn-bg)',
              color: 'var(--central-hero-btn-text)',
            }}
            title="Notificações"
          >
            <Bell className="h-4 w-4" />
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-8 h-8 rounded-lg central-transition"
            style={{
              background: 'var(--central-hero-btn-bg)',
              color: 'var(--central-hero-btn-text)',
            }}
            title={`Alternar para tema ${theme === 'dark' ? 'claro' : 'escuro'}`}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Bottom row: stat pills */}
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </section>
  );
}
