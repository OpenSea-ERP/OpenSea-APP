'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { PageBreadcrumb, type BreadcrumbItemData } from './page-breadcrumb';
import type { HeaderButton } from './types/header.types';

/**
 * Tipo para action buttons que serão renderizados
 */
export interface ActionButtonConfig {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
  variant?: 'default' | 'outline';
  permission?: string;
}

/**
 * Props do componente PageActionBar
 */
export interface PageActionBarProps {
  /** Items do breadcrumb */
  breadcrumbItems?: BreadcrumbItemData[];
  /** Botões a serem exibidos na action bar */
  buttons?: HeaderButton[];
  /** Action buttons com permissões e navegação */
  actionButtons?: ActionButtonConfig[];
  /** Função para verificar permissões */
  hasPermission?: (permission: string) => boolean;
  /** Classes customizadas para o container */
  className?: string;
  /** Classes customizadas para a seção de buttons */
  buttonsClassName?: string;
}

/**
 * Componente PageActionBar reutilizável
 *
 * Renderiza uma barra de ação no topo da página com:
 * - Breadcrumb à esquerda
 * - Botões de ação à direita
 *
 * @example
 * <PageActionBar
 *   breadcrumbItems={breadcrumbItems}
 *   actionButtons={actionButtons}
 *   hasPermission={hasPermission}
 * />
 */
export function PageActionBar({
  breadcrumbItems = [],
  buttons,
  actionButtons,
  hasPermission,
  className,
  buttonsClassName,
}: PageActionBarProps) {
  return (
    <div
      className={cn('flex w-full justify-between items-center h-9', className)}
    >
      {/* Breadcrumb */}
      <PageBreadcrumb items={breadcrumbItems} />

      {/* Botões de Ação */}
      <div className={cn('flex items-center gap-2', buttonsClassName)}>
        {/* Renderiza ActionButtons se fornecidos */}
        {actionButtons && hasPermission
          ? actionButtons
              .filter(btn => !btn.permission || hasPermission(btn.permission))
              .map(btn => (
                <Link key={btn.id} href={btn.href}>
                  <Button
                    size="sm"
                    variant={btn.variant || 'default'}
                    className="gap-2 min-h-0"
                  >
                    <btn.icon className="h-4 w-4" />
                    {btn.label}
                  </Button>
                </Link>
              ))
          : null}

        {/* Renderiza HeaderButtons se fornecidos */}
        {buttons
          ? buttons.map(button => (
              <Button
                key={button.id}
                variant={button.variant || 'default'}
                size="sm"
                onClick={button.onClick}
                title={button.title}
                disabled={button.disabled}
                className="min-h-0"
              >
                {button.icon && (
                  <button.icon
                    className={cn('h-4 w-4', {
                      'text-primary': button.variant === 'ghost',
                      'text-white':
                        !button.variant ||
                        button.variant === 'default' ||
                        button.variant === 'destructive',
                    })}
                  />
                )}
                <span className="hidden lg:inline">{button.title}</span>
              </Button>
            ))
          : null}
      </div>
    </div>
  );
}
