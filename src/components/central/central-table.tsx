import { cn } from '@/lib/utils';

export interface CentralTableProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Tabela limpa com hover rows para o Central.
 * Usa CSS variables do tema para cores de fundo e texto.
 */
export function CentralTable({ children, className }: CentralTableProps) {
  return (
    <div
      className={cn('central-card overflow-hidden', className)}
      style={{ padding: 0 }}
    >
      <div className="overflow-x-auto">
        <table className="w-full">{children}</table>
      </div>
    </div>
  );
}

export function CentralTableHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <thead
      className={cn('border-b', className)}
      style={{ borderColor: 'var(--central-separator)' }}
    >
      {children}
    </thead>
  );
}

export function CentralTableBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <tbody className={className}>{children}</tbody>;
}

export function CentralTableRow({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'border-b central-transition',
        'hover:brightness-95 [data-central-theme="dark"]_&:hover:brightness-110',
        className
      )}
      style={{ borderColor: 'var(--central-separator)' }}
      {...props}
    >
      {children}
    </tr>
  );
}

export function CentralTableHead({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <th
      className={cn(
        'px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider',
        className
      )}
      style={{ color: 'var(--central-text-muted)' }}
    >
      {children}
    </th>
  );
}

export function CentralTableCell({
  children,
  className,
  colSpan,
}: {
  children: React.ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      className={cn('px-6 py-4 text-sm', className)}
      style={{ color: 'var(--central-text-primary)' }}
    >
      {children}
    </td>
  );
}
