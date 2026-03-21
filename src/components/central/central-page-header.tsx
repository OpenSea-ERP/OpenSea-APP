import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

export interface CentralPageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * Cabeçalho reutilizável para páginas não-dashboard do Central.
 * Exibe título, descrição opcional e slot para botão de ação.
 */
export function CentralPageHeader({
  title,
  description,
  action,
  className,
}: CentralPageHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div>
        <h1
          className="text-lg font-bold"
          style={{ color: 'var(--central-text-primary)' }}
        >
          {title}
        </h1>
        {description && (
          <p
            className="text-sm mt-0.5"
            style={{ color: 'var(--central-text-secondary)' }}
          >
            {description}
          </p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
