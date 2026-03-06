/**
 * Formata uma data ISO como tempo relativo em português.
 * Ex: "há 2 horas", "há 1 dia", "ontem", "há 3 minutos"
 */
export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'agora mesmo';
  if (diffMins === 1) return 'há 1 minuto';
  if (diffMins < 60) return `há ${diffMins} minutos`;
  if (diffHours === 1) return 'há 1 hora';
  if (diffHours < 24) return `há ${diffHours} horas`;
  if (diffDays === 1) return 'ontem';
  if (diffDays < 7) return `há ${diffDays} dias`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? 'há 1 semana' : `há ${weeks} semanas`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return months === 1 ? 'há 1 mês' : `há ${months} meses`;
  }

  return date.toLocaleDateString('pt-BR');
}
