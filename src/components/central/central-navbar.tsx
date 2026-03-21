'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useAuth } from '@/contexts/auth-context';
import { useCentralTheme } from '@/contexts/central-theme-context';
import { cn } from '@/lib/utils';
import { ArrowLeft, LogOut, Menu, Moon, Sun } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { sidebarItems } from './central-sidebar';

/**
 * Navbar do Central — versão mobile (hamburger + drawer).
 * No desktop, a navegação é feita pela CentralSidebar.
 * A navbar mobile contém: hamburger, logo, toggle de tema, botão voltar.
 */
export function CentralNavbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useCentralTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile top bar — hidden on desktop since sidebar handles nav */}
      <nav
        className="md:hidden h-14 px-4 flex items-center justify-between"
        style={{
          background: 'var(--central-sidebar-bg)',
          borderBottom: '1px solid var(--central-sidebar-border)',
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex items-center justify-center w-9 h-9 rounded-lg central-transition"
            style={{
              color: 'var(--central-text-primary)',
            }}
            aria-label="Abrir menu de navegação"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link href="/central" className="flex items-center gap-2">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold"
              style={{
                background: 'var(--central-logo-bg)',
                color: 'var(--central-logo-text)',
              }}
            >
              OS
            </div>
            <span
              className="font-bold text-sm"
              style={{ color: 'var(--central-text-primary)' }}
            >
              Central
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center w-8 h-8 rounded-lg central-transition"
            style={{ color: 'var(--central-text-secondary)' }}
            title={`Alternar para tema ${theme === 'dark' ? 'claro' : 'escuro'}`}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>

          <button
            onClick={() => router.push('/select-tenant')}
            className="flex items-center justify-center w-8 h-8 rounded-lg central-transition"
            style={{ color: 'var(--central-text-secondary)' }}
            title="Voltar ao app"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        </div>
      </nav>

      {/* Mobile navigation drawer */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent
          side="left"
          className="w-72 p-0 border-r"
          style={{
            background: 'var(--central-sidebar-bg)',
            borderColor: 'var(--central-sidebar-border)',
          }}
        >
          <SheetHeader className="p-6 pb-4">
            <SheetTitle className="flex items-center gap-3">
              <div
                className="flex items-center justify-center w-9 h-9 rounded-xl text-sm font-bold"
                style={{
                  background: 'var(--central-logo-bg)',
                  color: 'var(--central-logo-text)',
                }}
              >
                OS
              </div>
              <span
                className="font-bold text-lg"
                style={{ color: 'var(--central-text-primary)' }}
              >
                OpenSea Central
              </span>
            </SheetTitle>
          </SheetHeader>

          <div className="px-4 space-y-1">
            {sidebarItems.map(item => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/central' && pathname?.startsWith(item.href));

              return (
                <div key={item.href}>
                  {item.separator && (
                    <div
                      className="h-px mx-2 my-2"
                      style={{ background: 'var(--central-separator)' }}
                    />
                  )}
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium central-transition'
                    )}
                    style={{
                      background: isActive
                        ? 'var(--central-nav-active-bg)'
                        : 'transparent',
                      color: isActive
                        ? 'var(--central-nav-active-text)'
                        : 'var(--central-nav-text)',
                    }}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                    {isActive && (
                      <div
                        className="ml-auto w-1.5 h-1.5 rounded-full"
                        style={{ background: 'var(--central-nav-active-text)' }}
                      />
                    )}
                  </Link>
                </div>
              );
            })}
          </div>

          <div
            className="absolute bottom-0 left-0 right-0 p-4 border-t"
            style={{ borderColor: 'var(--central-separator)' }}
          >
            <button
              onClick={() => {
                router.push('/select-tenant');
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm central-transition"
              style={{ color: 'var(--central-text-secondary)' }}
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao app
            </button>
            <button
              onClick={() => {
                logout();
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-rose-500 central-transition"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
