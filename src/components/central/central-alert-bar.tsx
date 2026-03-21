import { cn } from '@/lib/utils';

export interface CentralAlertItem {
  text: string;
}

export interface CentralAlertBarProps {
  items: CentralAlertItem[];
  className?: string;
}

/**
 * Barra de alertas exibida abaixo do hero banner.
 * Mostra uma lista horizontal de alertas com indicadores visuais.
 */
export function CentralAlertBar({ items, className }: CentralAlertBarProps) {
  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-4 rounded-xl px-4 py-2.5 text-xs font-medium',
        className
      )}
      style={{
        background: 'var(--central-alert-bg)',
        border: '1px solid var(--central-alert-border)',
        color: 'var(--central-alert-text)',
      }}
    >
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: 'var(--central-alert-dot)' }}
          />
          <span>{item.text}</span>
        </div>
      ))}
    </div>
  );
}
