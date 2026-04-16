'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface CurrencyInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'value' | 'onChange' | 'type' | 'inputMode'
  > {
  /** Numeric value in major units (e.g., 1234.5 for R$ 1.234,50). */
  value: number | null | undefined;
  /** Called whenever the parsed numeric value changes. */
  onChange: (value: number | null) => void;
  /** Currency symbol prefix. Defaults to "R$". */
  symbol?: string;
  /** Optional negative-value handling. Defaults to allowing negative input. */
  allowNegative?: boolean;
  /** Number of decimal places (default 2). */
  decimals?: number;
}

const NBSP = '\u00A0';

const formatBR = (value: number, decimals: number) =>
  new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);

/**
 * Strip non-digits, treat the *last* `decimals` digits as the fractional part.
 * Mirrors the calculator-style entry pattern most BR financial UIs use:
 * digits accumulate as cents and the decimal point auto-walks left.
 */
function digitsToNumber(digits: string, decimals: number): number {
  if (!digits) return 0;
  const cleaned = digits.replace(/\D/g, '');
  if (!cleaned) return 0;
  const intPart = cleaned.slice(0, -decimals) || '0';
  const fracPart = cleaned.slice(-decimals).padStart(decimals, '0');
  return Number(`${intPart}.${fracPart}`);
}

function formatFromInput(
  raw: string,
  decimals: number,
  allowNegative: boolean,
  symbol: string
): { display: string; numeric: number | null } {
  const isNegative = allowNegative && raw.trim().startsWith('-');
  const digitsOnly = raw.replace(/\D/g, '');
  if (!digitsOnly) {
    return { display: '', numeric: null };
  }
  const absoluteValue = digitsToNumber(digitsOnly, decimals);
  const value = isNegative ? -absoluteValue : absoluteValue;
  return {
    display: `${symbol}${NBSP}${isNegative ? '-' : ''}${formatBR(absoluteValue, decimals)}`,
    numeric: value,
  };
}

export function CurrencyInput({
  value,
  onChange,
  symbol = 'R$',
  allowNegative = true,
  decimals = 2,
  className,
  onBlur,
  onFocus,
  disabled,
  ...rest
}: CurrencyInputProps) {
  const [display, setDisplay] = React.useState(() => {
    if (value == null || Number.isNaN(value)) return '';
    return `${symbol}${NBSP}${formatBR(value, decimals)}`;
  });

  // Resync when a new external value flows in (e.g., form reset / data load).
  React.useEffect(() => {
    if (value == null || Number.isNaN(value)) {
      setDisplay('');
      return;
    }
    const expected = `${symbol}${NBSP}${formatBR(value, decimals)}`;
    setDisplay(prev => {
      const prevNumeric = formatFromInput(
        prev,
        decimals,
        allowNegative,
        symbol
      ).numeric;
      // Avoid clobbering mid-typing if the parsed numeric already matches.
      if (prevNumeric === value) return prev;
      return expected;
    });
  }, [value, symbol, decimals, allowNegative]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { display: nextDisplay, numeric } = formatFromInput(
      e.target.value,
      decimals,
      allowNegative,
      symbol
    );
    setDisplay(nextDisplay);
    onChange(numeric);
  };

  return (
    <input
      {...rest}
      type="text"
      inputMode="decimal"
      value={display}
      onChange={handleChange}
      onBlur={onBlur}
      onFocus={onFocus}
      disabled={disabled}
      className={cn(
        'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors',
        'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
        'disabled:cursor-not-allowed disabled:opacity-50 font-mono',
        className
      )}
    />
  );
}

export type { CurrencyInputProps };
