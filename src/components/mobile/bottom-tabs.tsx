'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Scan, ClipboardCheck, PackageOpen, Truck, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '/m/stock/scanner', icon: Scan, label: 'Scanner' },
  { href: '/m/stock/inventory', icon: ClipboardCheck, label: 'Conferência' },
  { href: '/m/stock/receiving', icon: PackageOpen, label: 'Recebimento' },
  { href: '/m/stock/volumes', icon: Truck, label: 'Volumes' },
  { href: '/m/stock', icon: Home, label: 'Início', exact: true },
] as const;

export function BottomTabs() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-700/50 bg-slate-900/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-lg items-center justify-around pb-[env(safe-area-inset-bottom)]">
        {tabs.map(({ href, icon: Icon, label, ...rest }) => {
          const exact = 'exact' in rest && rest.exact;
          const isActive = exact
            ? pathname === href
            : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition-colors',
                isActive ? 'text-indigo-400' : 'text-slate-500'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
