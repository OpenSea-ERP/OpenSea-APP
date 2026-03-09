'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LayoutGrid, List, Table2, CalendarDays } from 'lucide-react';
import { useCallback } from 'react';

interface ViewToggleProps {
  currentView: string;
}

const VIEWS = [
  { key: 'kanban', label: 'Kanban', icon: LayoutGrid },
  { key: 'lista', label: 'Lista', icon: List },
  { key: 'tabela', label: 'Tabela', icon: Table2 },
  { key: 'calendario', label: 'Calendário', icon: CalendarDays },
] as const;

export function ViewToggle({ currentView }: ViewToggleProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleViewChange = useCallback(
    (view: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('view', view);
      router.replace(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="flex items-center gap-0.5 border-b border-transparent">
      {VIEWS.map(({ key, label, icon: Icon }) => {
        const isActive = currentView === key;
        return (
          <button
            key={key}
            type="button"
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors relative',
              isActive
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={() => handleViewChange(key)}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
