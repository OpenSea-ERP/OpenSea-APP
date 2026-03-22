'use client';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { Check, CheckCheck, ChevronsUpDown, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';

export interface FilterOption {
  id?: string;
  value?: string;
  label: string;
}

export interface FilterFooterAction {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  color?: 'default' | 'violet' | 'cyan' | 'emerald' | 'blue';
}

export interface FilterDropdownProps {
  label: string;
  icon?: LucideIcon;
  options: FilterOption[];
  selected?: string[];
  onSelectionChange?: (ids: string[]) => void;
  /** Single-value mode (alternative to selected/onSelectionChange) */
  value?: string;
  onChange?: (value: string) => void;
  activeColor?: 'violet' | 'cyan' | 'emerald' | 'blue';
  searchPlaceholder?: string;
  emptyText?: string;
  width?: number;
  /** Optional footer action button */
  footerAction?: FilterFooterAction;
}

const colorMap = {
  violet: {
    border: 'border-violet-500 dark:border-violet-400',
    text: 'text-violet-700 dark:text-violet-300',
    badgeBg:
      'bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300',
    itemBg: 'bg-violet-50 dark:bg-violet-500/10',
    check: 'text-violet-600 dark:text-violet-400',
    clear:
      'text-violet-600 hover:text-violet-800 dark:text-violet-400 dark:hover:text-violet-200',
  },
  cyan: {
    border: 'border-cyan-500 dark:border-cyan-400',
    text: 'text-cyan-700 dark:text-cyan-300',
    badgeBg: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300',
    itemBg: 'bg-cyan-50 dark:bg-cyan-500/10',
    check: 'text-cyan-600 dark:text-cyan-400',
    clear:
      'text-cyan-600 hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-200',
  },
  emerald: {
    border: 'border-emerald-500 dark:border-emerald-400',
    text: 'text-emerald-700 dark:text-emerald-300',
    badgeBg:
      'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
    itemBg: 'bg-emerald-50 dark:bg-emerald-500/10',
    check: 'text-emerald-600 dark:text-emerald-400',
    clear:
      'text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-200',
  },
  blue: {
    border: 'border-blue-500 dark:border-blue-400',
    text: 'text-blue-700 dark:text-blue-300',
    badgeBg: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300',
    itemBg: 'bg-blue-50 dark:bg-blue-500/10',
    check: 'text-blue-600 dark:text-blue-400',
    clear:
      'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200',
  },
} as const;

// Footer action button color map
const footerColorMap = {
  default:
    'text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800',
  violet:
    'text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:text-violet-400 dark:hover:text-violet-300 dark:hover:bg-violet-500/10',
  cyan: 'text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 dark:text-cyan-400 dark:hover:text-cyan-300 dark:hover:bg-cyan-500/10',
  emerald:
    'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:text-emerald-300 dark:hover:bg-emerald-500/10',
  blue: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-500/10',
} as const;

function capitalizeLabel(text: string): string {
  return text
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function FilterDropdown({
  label,
  icon: Icon,
  options,
  selected,
  onSelectionChange,
  value,
  onChange,
  activeColor = 'blue',
  searchPlaceholder = 'Buscar...',
  emptyText = 'Nenhum encontrado.',
  width = 280,
  footerAction,
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const colors = colorMap[activeColor];
  const effectiveSelected = selected ?? (value ? [value] : []);
  const hasSelection = effectiveSelected.length > 0;
  const selectedSet = useMemo(
    () => new Set(effectiveSelected),
    [effectiveSelected]
  );

  const { selectedOptions, unselectedOptions } = useMemo(() => {
    const query = searchQuery.toLowerCase();
    const sel: FilterOption[] = [];
    const unsel: FilterOption[] = [];

    for (const option of options) {
      if (query && !option.label.toLowerCase().includes(query)) continue;
      if (selectedSet.has(option.id ?? option.value ?? '')) {
        sel.push(option);
      } else {
        unsel.push(option);
      }
    }

    return { selectedOptions: sel, unselectedOptions: unsel };
  }, [options, selectedSet, searchQuery]);

  const handleSelectionChange = (ids: string[]) => {
    if (onSelectionChange) {
      onSelectionChange(ids);
    } else if (onChange) {
      onChange(ids[0] ?? '');
    }
  };

  const toggleOption = (id: string) => {
    if (selectedSet.has(id)) {
      handleSelectionChange(effectiveSelected.filter(s => s !== id));
    } else {
      handleSelectionChange([...effectiveSelected, id]);
    }
  };

  const clearAll = () => {
    handleSelectionChange([]);
  };

  const selectAll = () => {
    handleSelectionChange(options.map(o => o.id ?? o.value ?? ''));
  };

  const totalFiltered = selectedOptions.length + unselectedOptions.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-9 gap-2 text-sm',
            hasSelection && [colors.border, colors.text]
          )}
        >
          {Icon && <Icon className="w-3.5 h-3.5" />}
          {label}
          {hasSelection && (
            <span
              className={cn(
                'text-[11px] font-semibold px-1.5 py-0.5 rounded-md',
                colors.badgeBg
              )}
            >
              {effectiveSelected.length}
            </span>
          )}
          <ChevronsUpDown className="w-3.5 h-3.5 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className=" shadow-xl rounded-xl p-0 border-0"
        style={{ width }}
        align="start"
        onOpenAutoFocus={e => e.preventDefault()}
      >
        {/* Search input */}
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 opacity-40" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full h-8 pl-8 pr-3 text-sm bg-white/50 dark:bg-white/10 rounded-lg outline-none placeholder:opacity-50"
            />
          </div>
        </div>

        {/* Selection count + clear / select all */}
        <hr className="border-[rgb(var(--glass-border)/0.15)]" />
        <div className="flex items-center justify-between px-3 py-1.5">
          {hasSelection ? (
            <>
              <span className="text-xs opacity-60">
                {effectiveSelected.length} selecionado
                {effectiveSelected.length > 1 ? 's' : ''}
              </span>
              <button
                onClick={clearAll}
                className={cn(
                  'flex items-center gap-1 text-xs font-medium cursor-pointer',
                  colors.clear
                )}
              >
                Limpar
                <X className="w-3 h-3" />
              </button>
            </>
          ) : (
            <>
              <span className="text-xs opacity-60">
                {options.length} disponíve{options.length !== 1 ? 'is' : 'l'}
              </span>
              <button
                onClick={selectAll}
                className={cn(
                  'flex items-center gap-1 text-xs font-medium cursor-pointer',
                  colors.clear
                )}
              >
                Selecionar tudo
                <CheckCheck className="w-3 h-3" />
              </button>
            </>
          )}
        </div>

        <hr className="border-[rgb(var(--glass-border)/0.15)]" />

        {/* Options list - max 8 items visible (8 * 32px = 256px) */}
        <div className="max-h-64 overflow-y-auto py-1">
          {totalFiltered === 0 ? (
            <div className="px-3 py-4 text-sm text-center opacity-50">
              {emptyText}
            </div>
          ) : (
            <>
              {/* Selected items first */}
              {selectedOptions.map(option => (
                <button
                  key={option.id ?? option.value ?? ''}
                  onClick={() => toggleOption(option.id ?? option.value ?? '')}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left cursor-pointer hover:opacity-80 transition-opacity',
                    colors.itemBg
                  )}
                >
                  <Check className={cn('w-4 h-4 shrink-0', colors.check)} />
                  <span className="truncate">
                    {capitalizeLabel(option.label)}
                  </span>
                </button>
              ))}

              {/* Visual gap between groups */}
              {selectedOptions.length > 0 && unselectedOptions.length > 0 && (
                <div className="my-1 mx-3 border-b border-dashed border-[rgb(var(--glass-border)/0.15)]" />
              )}

              {/* Unselected items */}
              {unselectedOptions.map(option => (
                <button
                  key={option.id ?? option.value ?? ''}
                  onClick={() => toggleOption(option.id ?? option.value ?? '')}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <Check className="w-4 h-4 shrink-0 opacity-0" />
                  <span className="truncate">
                    {capitalizeLabel(option.label)}
                  </span>
                </button>
              ))}
            </>
          )}
        </div>

        {/* Footer action button */}
        {footerAction && (
          <>
            <hr className="border-[rgb(var(--glass-border)/0.15)]" />
            <div className="p-1">
              <button
                onClick={() => {
                  footerAction.onClick();
                  setOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer',
                  footerColorMap[footerAction.color || 'default']
                )}
              >
                <footerAction.icon className="w-4 h-4" />
                <span>{footerAction.label}</span>
              </button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
