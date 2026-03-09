export const COLOR_PRESETS = [
  { value: '#3b82f6', label: 'Azul' },
  { value: '#10b981', label: 'Verde' },
  { value: '#f59e0b', label: 'Amarelo' },
  { value: '#ef4444', label: 'Vermelho' },
  { value: '#8b5cf6', label: 'Roxo' },
  { value: '#ec4899', label: 'Rosa' },
  { value: '#06b6d4', label: 'Ciano' },
  { value: '#f97316', label: 'Laranja' },
];

export function getTimezoneOffset(tz: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'shortOffset',
    });
    const parts = formatter.formatToParts(now);
    const offsetPart = parts.find((p) => p.type === 'timeZoneName');
    if (!offsetPart) return '';
    // Convert "GMT+3" or "GMT-5:30" to "+3:00" or "-5:30"
    const raw = offsetPart.value.replace('GMT', '');
    if (!raw || raw === '') return 'UTC';
    // Add :00 if no minutes
    if (!raw.includes(':')) return `${raw}:00`;
    return raw;
  } catch {
    return '';
  }
}
