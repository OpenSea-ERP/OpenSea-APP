/**
 * User Dropdown Component
 * Dropdown com informações e ações do usuário
 */

'use client';

import { logger } from '@/lib/logger';
import { UserAvatar } from '@/components/shared/user-avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/auth-context';
import { LogOut, Moon, Settings, Sun, Users } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo } from 'react';

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

  const toggleTheme = useCallback(
    (e: Event) => {
      e.preventDefault();
      setTheme(theme === 'dark' ? 'light' : 'dark');
    },
    [theme, setTheme]
  );

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
            className="ring-2 ring-gray-300 dark:ring-white/70"
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
        <DropdownMenuSeparator className="my-2" />

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

        <DropdownMenuSeparator className="my-2" />

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
            <span className="text-sm font-medium">
              {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
            </span>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-2" />

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
