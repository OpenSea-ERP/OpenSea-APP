'use client';

import * as React from 'react';
import { Delete, X } from 'lucide-react';

import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

interface NumpadShortcut {
  label: string;
  value: number;
}

interface NumpadProps {
  /** Current value in cents (integer) */
  value: number;
  /** Callback when value changes (value in cents) */
  onChange: (value: number) => void;
  /** Quick-value shortcut buttons */
  shortcuts?: NumpadShortcut[];
  /** Maximum allowed value in cents */
  maxValue?: number;
  className?: string;
}

// =============================================================================
// HELPERS
// =============================================================================

function formatCentsDisplay(cents: number): string {
  const reais = cents / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(reais);
}

// =============================================================================
// NUMPAD COMPONENT
// =============================================================================

const DIGIT_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'] as const;

function Numpad({
  value,
  onChange,
  shortcuts,
  maxValue,
  className,
}: NumpadProps) {
  const handleDigit = React.useCallback(
    (digit: string) => {
      const next = value * 10 + parseInt(digit, 10);
      if (maxValue !== undefined && next > maxValue) return;
      onChange(next);
    },
    [value, onChange, maxValue]
  );

  const handleClear = React.useCallback(() => {
    onChange(0);
  }, [onChange]);

  const handleBackspace = React.useCallback(() => {
    onChange(Math.floor(value / 10));
  }, [value, onChange]);

  const handleShortcut = React.useCallback(
    (shortcutValue: number) => {
      if (maxValue !== undefined && shortcutValue > maxValue) return;
      onChange(shortcutValue);
    },
    [onChange, maxValue]
  );

  // Keyboard support
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (DIGIT_KEYS.includes(e.key as (typeof DIGIT_KEYS)[number])) {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape' || e.key === 'Delete') {
        handleClear();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleBackspace, handleClear]);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Display */}
      <div className="flex items-center justify-center rounded-xl bg-zinc-100 px-4 py-4 dark:bg-zinc-800">
        <span className="text-3xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
          {formatCentsDisplay(value)}
        </span>
      </div>

      {/* Shortcuts */}
      {shortcuts && shortcuts.length > 0 && (
        <div className="flex gap-2">
          {shortcuts.map((shortcut) => (
            <button
              key={shortcut.label}
              type="button"
              onClick={() => handleShortcut(shortcut.value)}
              className={cn(
                'flex-1 rounded-lg border border-violet-200 bg-violet-50 px-3 py-3 text-sm font-medium text-violet-700',
                'transition-all duration-150 active:scale-95',
                'dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300',
                'min-h-[48px]'
              )}
            >
              {shortcut.label}
            </button>
          ))}
        </div>
      )}

      {/* Numpad Grid */}
      <div className="grid grid-cols-3 gap-2">
        {/* Row 1 */}
        {['1', '2', '3'].map((d) => (
          <NumpadButton key={d} onClick={() => handleDigit(d)}>
            {d}
          </NumpadButton>
        ))}
        {/* Row 2 */}
        {['4', '5', '6'].map((d) => (
          <NumpadButton key={d} onClick={() => handleDigit(d)}>
            {d}
          </NumpadButton>
        ))}
        {/* Row 3 */}
        {['7', '8', '9'].map((d) => (
          <NumpadButton key={d} onClick={() => handleDigit(d)}>
            {d}
          </NumpadButton>
        ))}
        {/* Row 4 */}
        <NumpadButton
          onClick={handleClear}
          variant="clear"
          aria-label="Limpar"
        >
          <X className="size-5" />
        </NumpadButton>
        <NumpadButton onClick={() => handleDigit('0')}>0</NumpadButton>
        <NumpadButton
          onClick={handleBackspace}
          variant="backspace"
          aria-label="Apagar"
        >
          <Delete className="size-5" />
        </NumpadButton>
      </div>
    </div>
  );
}

// =============================================================================
// NUMPAD BUTTON
// =============================================================================

function NumpadButton({
  children,
  onClick,
  variant = 'default',
  className,
  ...props
}: React.ComponentProps<'button'> & {
  variant?: 'default' | 'clear' | 'backspace';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-14 w-full items-center justify-center rounded-lg text-xl font-semibold',
        'select-none transition-all duration-150 active:scale-95',
        variant === 'default' &&
          'bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700',
        variant === 'clear' &&
          'bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:hover:bg-rose-500/25',
        variant === 'backspace' &&
          'bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export { Numpad, type NumpadProps, type NumpadShortcut };
