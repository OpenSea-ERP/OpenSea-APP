'use client';

import { cn } from '@/lib/utils';

export type ScanMode = 'lookup' | 'entry' | 'exit' | 'transfer' | 'inventory';

interface ModeOption {
  value: ScanMode;
  label: string;
  activeClasses: string;
}

const MODES: ModeOption[] = [
  {
    value: 'lookup',
    label: 'Consultar',
    activeClasses:
      'bg-indigo-500 border-indigo-400 text-white shadow-indigo-500/30',
  },
  {
    value: 'entry',
    label: 'Entrada',
    activeClasses:
      'bg-green-500 border-green-400 text-white shadow-green-500/30',
  },
  {
    value: 'exit',
    label: 'Saída',
    activeClasses: 'bg-rose-500 border-rose-400 text-white shadow-rose-500/30',
  },
  {
    value: 'transfer',
    label: 'Transferir',
    activeClasses: 'bg-sky-500 border-sky-400 text-white shadow-sky-500/30',
  },
  {
    value: 'inventory',
    label: 'Inventário',
    activeClasses:
      'bg-amber-500 border-amber-400 text-white shadow-amber-500/30',
  },
];

interface ScanModeChipsProps {
  value: ScanMode;
  onChange: (mode: ScanMode) => void;
}

export function ScanModeChips({ value, onChange }: ScanModeChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-2 no-scrollbar">
      {MODES.map(mode => {
        const isActive = value === mode.value;
        return (
          <button
            key={mode.value}
            onClick={() => onChange(mode.value)}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-all',
              isActive
                ? cn(mode.activeClasses, 'shadow-sm')
                : 'border-slate-600 bg-transparent text-slate-400 active:bg-slate-700/50'
            )}
          >
            {mode.label}
          </button>
        );
      })}
    </div>
  );
}
