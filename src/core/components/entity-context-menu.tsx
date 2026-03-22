/**
 * OpenSea OS - EntityContextMenu Component
 * Context menu robusto para grids de entidades com suporte a multi-seleção
 */

'use client';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { useOptionalSelectionContext } from '@/core/selection';
import { cn } from '@/lib/utils';
import { Copy, Edit, Eye, LucideIcon, Trash2 } from 'lucide-react';
import React, { useCallback, useState } from 'react';

// =============================================================================
// TYPES
// =============================================================================

export interface ContextMenuAction {
  id?: string;
  label: string;
  icon?: LucideIcon;
  onClick: ((ids: string[]) => void) | (() => void);
  variant?: 'default' | 'destructive';
  separator?: 'before' | 'after';
  /** Oculta a ação dinamicamente com base nos IDs selecionados */
  hidden?: (ids: string[]) => boolean;
}

export interface EntityContextMenuProps {
  /** ID do item atual */
  itemId?: string;
  /** Filhos (o card/item que será envolvido) */
  children: React.ReactNode;
  /** Ações customizadas do context menu */
  actions?: ContextMenuAction[];
  /** Callbacks padrão */
  onView?: (ids: string[]) => void;
  onEdit?: (ids: string[]) => void;
  onDuplicate?: (ids: string[]) => void;
  onDelete?: (ids: string[]) => void;
  /** Se deve mostrar ações padrão */
  showDefaultActions?: boolean;
  /** Labels customizados */
  labels?: {
    view?: string;
    edit?: string;
    duplicate?: string;
    delete?: string;
  };
  /** Classes extras para o ContextMenuContent */
  contentClassName?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function EntityContextMenu({
  itemId,
  children,
  actions = [],
  onView,
  onEdit,
  onDuplicate,
  onDelete,
  showDefaultActions = true,
  labels = {},
  contentClassName,
}: EntityContextMenuProps) {
  const selectionContext = useOptionalSelectionContext();

  const effectiveItemId = itemId ?? '';

  // Estado para armazenar informações do menu quando aberto
  const [menuState, setMenuState] = useState<{
    isMultiple: boolean;
    count: number;
    actionIds: string[];
  }>({
    isMultiple: false,
    count: 1,
    actionIds: [effectiveItemId],
  });

  // Handler chamado quando o menu está prestes a abrir
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) return;

      // Pegar o estado atual da seleção
      const selectedIds = selectionContext?.state.selectedIds;
      const isItemSelected = selectedIds?.has(effectiveItemId) ?? false;

      if (!isItemSelected && selectionContext?.actions) {
        // Item não está selecionado - seleciona apenas ele
        selectionContext.actions.select(effectiveItemId);
        setMenuState({
          isMultiple: false,
          count: 1,
          actionIds: [effectiveItemId],
        });
      } else if (selectedIds) {
        // Item está selecionado - usa a seleção atual
        const currentIds = Array.from(selectedIds);
        const isMultiple = currentIds.length > 1;
        setMenuState({
          isMultiple,
          count: currentIds.length,
          actionIds: isMultiple ? currentIds : [effectiveItemId],
        });
      }
    },
    [effectiveItemId, selectionContext]
  );

  // Ações padrão
  const defaultActions: ContextMenuAction[] = [];

  if (showDefaultActions) {
    if (onView) {
      defaultActions.push({
        id: 'view',
        label: labels.view || 'Visualizar',
        icon: Eye,
        onClick: onView,
      });
    }
    if (onEdit) {
      defaultActions.push({
        id: 'edit',
        label: labels.edit || 'Editar',
        icon: Edit,
        onClick: onEdit,
      });
    }
    if (onDuplicate) {
      defaultActions.push({
        id: 'duplicate',
        label: labels.duplicate || 'Duplicar',
        icon: Copy,
        onClick: onDuplicate,
      });
    }
    if (onDelete) {
      defaultActions.push({
        id: 'delete',
        label: labels.delete || 'Excluir',
        icon: Trash2,
        onClick: onDelete,
        variant: 'destructive',
        separator: 'before',
      });
    }
  }

  // Combinar ações padrão com customizadas, filtrando as ocultas
  const allActions = [...defaultActions, ...actions].filter(
    action => !action.hidden?.(menuState.actionIds)
  );

  return (
    <ContextMenu onOpenChange={handleOpenChange} modal={false}>
      <ContextMenuTrigger asChild>
        <div className="w-full h-full">{children}</div>
      </ContextMenuTrigger>
      <ContextMenuContent className={cn('overflow-hidden', contentClassName)}>
        {menuState.isMultiple && (
          <>
            <ContextMenuLabel className="text-xs text-muted-foreground font-normal">
              {menuState.count} itens selecionados
            </ContextMenuLabel>
            <ContextMenuSeparator />
          </>
        )}
        {allActions.map((action, index) => (
          <React.Fragment key={action.id}>
            {action.separator === 'before' && index > 0 && (
              <ContextMenuSeparator />
            )}
            <ContextMenuItem
              onClick={() => action.onClick(menuState.actionIds)}
              className={
                action.variant === 'destructive'
                  ? 'text-destructive focus:text-destructive focus:bg-destructive/10'
                  : ''
              }
            >
              {action.icon && (
                <action.icon
                  className={cn(
                    'w-4 h-4 mr-2',
                    action.variant === 'destructive' &&
                      'text-[rgb(var(--color-destructive))]!'
                  )}
                />
              )}
              {action.label}
            </ContextMenuItem>
            {action.separator === 'after' && index < allActions.length - 1 && (
              <ContextMenuSeparator />
            )}
          </React.Fragment>
        ))}
      </ContextMenuContent>
    </ContextMenu>
  );
}

export default EntityContextMenu;
