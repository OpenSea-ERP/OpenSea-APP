'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

interface ColorPickerProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  /** Show a 7-char hex code (`#8b5cf6`) caption next to the swatch. */
  showHex?: boolean;
  /** Optional override for the curated palette. */
  palette?: readonly string[];
}

/**
 * Curated palette aligned with the OpenSea visual language (no yellow/orange,
 * destructive = rose, see CLAUDE.md). Picking is one-tap; freeform input has
 * been omitted so module colors stay consistent across the system.
 */
const DEFAULT_PALETTE = [
  '#8b5cf6', // violet — default
  '#7c3aed', // violet deep
  '#0ea5e9', // sky
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#22c55e', // green
  '#14b8a6', // teal
  '#f43f5e', // rose (destructive)
  '#ec4899', // pink
  '#a855f7', // purple
  '#6366f1', // indigo
  '#3b82f6', // blue
  '#64748b', // slate
  '#475569', // slate deep
  '#0f172a', // navy
  '#737373', // neutral
] as const;

export function ColorPicker({
  value,
  onChange,
  disabled = false,
  className,
  showHex = true,
  palette = DEFAULT_PALETTE,
}: ColorPickerProps) {
  const [open, setOpen] = React.useState(false);
  const current = value || palette[0];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start gap-3 h-9 font-normal',
            className
          )}
        >
          <span
            className="inline-block h-5 w-5 shrink-0 rounded-md border border-border shadow-sm"
            style={{ backgroundColor: current }}
            aria-hidden
          />
          {showHex && (
            <span className="font-mono text-xs text-muted-foreground">
              {current.toUpperCase()}
            </span>
          )}
          <span className="ml-auto text-xs text-muted-foreground">Trocar</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[260px] p-3 z-[60]"
        align="start"
        onOpenAutoFocus={e => e.preventDefault()}
      >
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
          Paleta
        </p>
        <div className="grid grid-cols-8 gap-2">
          {palette.map(color => {
            const isSelected = current.toLowerCase() === color.toLowerCase();
            return (
              <button
                key={color}
                type="button"
                onClick={() => {
                  onChange(color);
                  setOpen(false);
                }}
                className={cn(
                  'relative h-7 w-7 rounded-md border border-border shadow-sm transition-all',
                  'hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring',
                  isSelected && 'ring-2 ring-foreground'
                )}
                style={{ backgroundColor: color }}
                aria-label={`Selecionar cor ${color}`}
              >
                {isSelected && (
                  <Check className="absolute inset-0 m-auto h-3.5 w-3.5 text-white drop-shadow" />
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export type { ColorPickerProps };
