/**
 * User Dropdown Component
 * Dropdown com informações e ações do usuário
 */

'use client';

import { logger } from '@/lib/logger';
import { UserAvatar } from '@/components/shared/user-avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/auth-context';
import { useFullscreen, useUltrawide } from '@/hooks/use-layout-preferences';
import { useDeviceTerminal } from '@/hooks/sales';
import { cn } from '@/lib/utils';
import {
  LogOut,
  Maximize,
  Minimize,
  Monitor,
  MonitorIcon,
  Moon,
  Settings,
  Sun,
  Users,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { Kbd } from '@/components/ui/kbd';
import { useCallback, useEffect, useMemo } from 'react';

export function UserDropdown() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch (error) {
      logger.error(
        'Erro ao fazer logout',
        error instanceof Error ? error : undefined
      );
    }
  }, [logout]);

  const { isPaired, terminal, currentSession } = useDeviceTerminal();
  const { isUltrawide, toggleUltrawide } = useUltrawide();
  const { isFullscreen, toggleFullscreen } = useFullscreen();

  const switchTheme = useCallback(() => {
    const isDark = theme === 'dark';
    const overlay = document.createElement('div');
    overlay.className = 'theme-fade-overlay';
    overlay.style.backgroundColor = isDark ? '#0f172a' : '#ffffff';
    document.body.appendChild(overlay);

    // Force reflow then fade out
    requestAnimationFrame(() => {
      setTheme(isDark ? 'light' : 'dark');
      requestAnimationFrame(() => {
        overlay.classList.add('fade-out');
        overlay.addEventListener('transitionend', () => overlay.remove());
      });
    });
  }, [theme, setTheme]);

  const toggleTheme = useCallback(
    (e: Event) => {
      e.preventDefault();
      switchTheme();
    },
    [switchTheme]
  );

  const handleToggleUltrawide = useCallback(
    (e: Event) => {
      e.preventDefault();
      toggleUltrawide();
    },
    [toggleUltrawide]
  );

  const handleToggleFullscreen = useCallback(
    (e: Event) => {
      e.preventDefault();
      toggleFullscreen();
    },
    [toggleFullscreen]
  );

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F9') {
        e.preventDefault();
        switchTheme();
      } else if (e.key === 'F10') {
        e.preventDefault();
        toggleUltrawide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [switchTheme, toggleUltrawide]);

  const userName = useMemo(() => {
    if (user?.profile?.name) {
      const surname = user?.profile?.surname || '';
      return surname ? `${user.profile.name} ${surname}` : user.profile.name;
    }
    return user?.username || 'Usuário';
  }, [user]);

  const userEmail = useMemo(() => user?.email || 'email@example.com', [user]);

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="rounded-xl h-10 px-2 gap-2">
          <UserAvatar
            name={user?.profile?.name || user?.username || 'U'}
            surname={user?.profile?.surname}
            avatarUrl={user?.profile?.avatarUrl}
            size="sm"
            className="ring-2 ring-emerald-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={22}
        className="w-64 bg-white/95 dark:bg-slate-900/95 border-gray-200 dark:border-white/10 p-2"
      >
        <DropdownMenuLabel className="px-3 py-2">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {userName}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {userEmail}
          </p>
        </DropdownMenuLabel>
        {/* POS Terminal indicator */}
        {isPaired && terminal && (
          <>
            <DropdownMenuSeparator className="my-2 bg-gray-200 dark:bg-white/10" />
            <DropdownMenuItem
              className="px-3 py-3 cursor-pointer rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              onClick={() => router.push('/sales/pos')}
            >
              <div className="flex items-center w-full gap-3">
                <div className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-lg',
                  currentSession
                    ? 'bg-emerald-50 dark:bg-emerald-500/10'
                    : 'bg-zinc-100 dark:bg-zinc-800'
                )}>
                  <Monitor className={cn(
                    'h-4 w-4',
                    currentSession
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-zinc-500 dark:text-zinc-400'
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{terminal.terminalName}</p>
                  <p className="text-xs font-mono text-muted-foreground">{terminal.terminalCode}</p>
                </div>
                <Badge className={cn(
                  'border-0 text-xs shrink-0',
                  currentSession
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                    : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                )}>
                  {currentSession ? 'Aberto' : 'Fechado'}
                </Badge>
              </div>
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator className="my-2 bg-gray-200 dark:bg-white/10" />

        <DropdownMenuItem
          className="px-3 py-3 cursor-pointer rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          onClick={() => router.push('/profile')}
        >
          <Users className="w-5 h-5 mr-3" />
          <span className="text-sm font-medium">Perfil</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          className="px-3 py-3 cursor-pointer rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          onClick={() => router.push('/settings')}
        >
          <Settings className="w-5 h-5 mr-3" />
          <span className="text-sm font-medium">Configurações</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-2 bg-gray-200 dark:bg-white/10" />

        <DropdownMenuItem
          onSelect={toggleTheme}
          className="px-3 py-3 cursor-pointer rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
        >
          <div className="flex items-center w-full">
            <div className="w-5 h-5 mr-3">
              {theme === 'dark' ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </div>
            <span className="text-sm font-medium flex-1">
              {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
            </span>
            <Kbd>F9</Kbd>
          </div>
        </DropdownMenuItem>

        {/* Desktop-only layout options */}
        <DropdownMenuItem
          onSelect={handleToggleUltrawide}
          className="hidden lg:flex px-3 py-3 cursor-pointer rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
        >
          <div className="flex items-center w-full">
            <MonitorIcon className="w-5 h-5 mr-3" />
            <span className="text-sm font-medium flex-1">
              {isUltrawide ? 'Layout Padrão' : 'Layout Ultrawide'}
            </span>
            <Kbd>F10</Kbd>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          onSelect={handleToggleFullscreen}
          className="hidden lg:flex px-3 py-3 cursor-pointer rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
        >
          <div className="flex items-center w-full">
            {isFullscreen ? (
              <Minimize className="w-5 h-5 mr-3" />
            ) : (
              <Maximize className="w-5 h-5 mr-3" />
            )}
            <span className="text-sm font-medium flex-1">
              {isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}
            </span>
            <Kbd>F11</Kbd>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-2 bg-gray-200 dark:bg-white/10" />

        <DropdownMenuItem
          className="px-3 py-3 cursor-pointer rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 transition-colors"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span className="text-sm font-medium">Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
