export function formatCurrency(
  value: number | null | undefined,
  currency: string = 'BRL',
): string {
  if (value === null || value === undefined) {
    if (currency === 'BRL') return 'R$ 0,00';
    try {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(0);
    } catch {
      return `${currency} 0,00`;
    }
  }

  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency,
    }).format(value);
  } catch {
    // Fallback for invalid currency codes
    return `${currency} ${value.toFixed(2)}`;
  }
}
