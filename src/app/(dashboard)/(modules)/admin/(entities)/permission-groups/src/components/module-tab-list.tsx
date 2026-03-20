'use client';

import { cn } from '@/lib/utils';

import type { MatrixTab } from '../config/permission-matrix-config';

interface ModuleTabListProps {
  tabs: MatrixTab[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
  /** Count of selected permissions per tab: { [tabId]: number } */
  selectedCounts: Record<string, number>;
  /** Total permissions per tab: { [tabId]: number } */
  totalCounts: Record<string, number>;
}

export function ModuleTabList({
  tabs,
  activeTabId,
  onTabChange,
  selectedCounts,
  totalCounts,
}: ModuleTabListProps) {
  return (
    <div className="w-[180px] shrink-0 border-r border-border pr-3 overflow-y-auto flex flex-col gap-1">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        const Icon = tab.icon;
        const selected = selectedCounts[tab.id] ?? 0;
        const total = totalCounts[tab.id] ?? 0;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-left transition-colors',
              isActive
                ? 'bg-blue-500/15 border border-blue-500/30 text-blue-700 dark:text-blue-300'
                : 'border border-transparent opacity-60 hover:opacity-100 hover:bg-muted/50',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{tab.label}</div>
              <div className="text-[11px] text-muted-foreground tabular-nums">
                {selected}/{total}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
