'use client';

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useAuth } from '@/contexts/auth-context';
import { useCentralTheme } from '@/contexts/central-theme-context';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import {
  Activity,
  ArrowLeft,
  Building2,
  CreditCard,
  Layers,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Moon,
  Sun,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useMemo } from 'react';

interface SidebarItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  separator?: boolean;
  badgeDot?: boolean;
}

const sidebarItems: SidebarItem[] = [
  { href: '/central', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/central/tenants', label: 'Empresas', icon: Building2 },
  { href: '/central/catalog', label: 'Catálogo', icon: Layers },
  { href: '/central/subscriptions', label: 'Assinaturas', icon: CreditCard },
  {
    href: '/central/support',
    label: 'Suporte',
    icon: LifeBuoy,
    separator: true,
    badgeDot: true,
  },
  { href: '/central/monitoring', label: 'Monitoramento', icon: Activity },
  { href: '/central/team', label: 'Equipe', icon: Users },
];

/**
 * Sidebar do Central — modo icon-only (68px).
 * Logo "OS", 7 itens de navegação com ícones Lucide,
 * avatar do usuário com iniciais no rodapé.
 * Tooltip no hover exibe o label.
 */
export function CentralSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useCentralTheme();

  const initials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : 'AD';

  const userName = useMemo(() => {
    if (user?.profile?.name) {
      const surname = user?.profile?.surname || '';
      return surname ? `${user.profile.name} ${surname}` : user.profile.name;
    }
    return user?.username || 'Usuário';
  }, [user]);

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

  return (
    <aside
      className="hidden md:flex flex-col items-center w-[68px] min-h-screen py-4"
      style={{
        background: 'var(--central-sidebar-bg)',
        borderRight: '1px solid var(--central-sidebar-border)',
      }}
    >
      {/* Logo */}
      <Link
        href="/central"
        className="flex items-center justify-center w-10 h-10 rounded-xl text-sm font-bold mb-6"
        style={{
          background: 'var(--central-logo-bg)',
          color: 'var(--central-logo-text)',
        }}
      >
        OS
      </Link>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col items-center gap-1 w-full px-2">
        {sidebarItems.map(item => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/central' && pathname?.startsWith(item.href));

          return (
            <div key={item.href} className="w-full">
              {item.separator && (
                <div
                  className="h-px mx-2 my-2"
                  style={{ background: 'var(--central-separator)' }}
                />
              )}
              <Link
                href={item.href}
                title={item.label}
                className={cn(
                  'relative flex items-center justify-center w-full h-10 rounded-xl central-transition group',
                  isActive ? 'font-medium' : 'hover:brightness-95'
                )}
                style={{
                  background: isActive
                    ? 'var(--central-nav-active-bg)'
                    : 'transparent',
                  color: isActive
                    ? 'var(--central-nav-active-text)'
                    : 'var(--central-nav-text)',
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.background =
                      'var(--central-nav-hover-bg)';
                    e.currentTarget.style.color =
                      'var(--central-nav-hover-text)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--central-nav-text)';
                  }
                }}
              >
                <item.icon className="h-[18px] w-[18px]" />

                {/* Badge dot */}
                {item.badgeDot && (
                  <span
                    className="absolute top-1.5 right-2.5 w-1.5 h-1.5 rounded-full"
                    style={{ background: 'var(--central-badge-dot)' }}
                  />
                )}

                {/* Tooltip */}
                <span
                  className={cn(
                    'absolute left-full ml-2 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap',
                    'opacity-0 pointer-events-none group-hover:opacity-100',
                    'transition-opacity duration-150 z-50'
                  )}
                  style={{
                    background: 'var(--central-text-primary)',
                    color: 'var(--central-bg)',
                  }}
                >
                  {item.label}
                </span>
              </Link>
            </div>
          );
        })}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User menu */}
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="flex items-center justify-center w-9 h-9 rounded-full text-xs font-semibold cursor-pointer central-transition"
            style={{
              background: 'var(--central-avatar-bg)',
              color: 'var(--central-avatar-text)',
            }}
            title={user?.email ?? 'Usuário'}
          >
            {initials}
          </button>
        </PopoverTrigger>
        <PopoverContent
          side="right"
          align="end"
          sideOffset={12}
          className="w-56 p-0 border rounded-xl overflow-hidden"
          style={{
            background: 'var(--central-card-bg, var(--central-sidebar-bg))',
            borderColor: 'var(--central-sidebar-border)',
          }}
        >
          {/* User info */}
          <div
            className="px-4 py-3"
            style={{ borderBottom: '1px solid var(--central-separator)' }}
          >
            <p
              className="text-sm font-semibold truncate"
              style={{ color: 'var(--central-text-primary)' }}
            >
              {userName}
            </p>
            <p
              className="text-xs truncate mt-0.5"
              style={{ color: 'var(--central-text-secondary)' }}
            >
              {user?.email}
            </p>
          </div>

          {/* Actions */}
          <div className="p-1.5">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm central-transition"
              style={{ color: 'var(--central-text-primary)' }}
              onMouseEnter={e => {
                e.currentTarget.style.background =
                  'var(--central-nav-hover-bg)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {theme === 'dark' ? (
                <Sun
                  className="h-4 w-4"
                  style={{ color: 'var(--central-text-secondary)' }}
                />
              ) : (
                <Moon
                  className="h-4 w-4"
                  style={{ color: 'var(--central-text-secondary)' }}
                />
              )}
              {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
            </button>

            <button
              onClick={() => router.push('/select-tenant')}
              className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm central-transition"
              style={{ color: 'var(--central-text-primary)' }}
              onMouseEnter={e => {
                e.currentTarget.style.background =
                  'var(--central-nav-hover-bg)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <ArrowLeft
                className="h-4 w-4"
                style={{ color: 'var(--central-text-secondary)' }}
              />
              Voltar ao App
            </button>

            <div
              className="h-px mx-2 my-1"
              style={{ background: 'var(--central-separator)' }}
            />

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm central-transition"
              style={{ color: '#f43f5e' }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(244, 63, 94, 0.08)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </aside>
  );
}

export { sidebarItems };
