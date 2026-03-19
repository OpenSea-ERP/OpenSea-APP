/**
 * OpenSea OS - EntityGrid Component
 * Grid genérico baseado em EntityConfig para qualquer entidade
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useOptionalSelectionContext } from '@/core/selection';
import type { BaseEntity, EntityConfig } from '@/core/types';
import { cn } from '@/lib/utils';

import {
  ArrowDownAZ,
  ArrowUpDown,
  Calendar,
  Clock,
  Grid3x3,
  List,
} from 'lucide-react';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

// =============================================================================
// TYPES
// =============================================================================

export type ViewMode = 'grid' | 'list';

export type SortField = 'name' | 'createdAt' | 'updatedAt' | 'custom';
export type SortDirection = 'asc' | 'desc';

export interface SortOption {
  field: SortField;
  direction: SortDirection;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface EntityGridProps<T extends BaseEntity> {
  /** Configuração da entidade */
  config: EntityConfig<T>;
  /** Lista de itens */
  items: T[];
  /** Render function para item em grid */
  renderGridItem: (item: T, isSelected: boolean) => React.ReactNode;
  /** Render function para item em lista */
  renderListItem: (item: T, isSelected: boolean) => React.ReactNode;
  /** Mensagem quando vazio */
  emptyMessage?: string;
  /** Ícone customizado para estado vazio */
  emptyIcon?: React.ReactNode;
  /** View mode padrão */
  defaultView?: ViewMode;
  /** View mode controlado */
  viewMode?: ViewMode;
  /** Callback para mudar view mode */
  onViewModeChange?: (mode: ViewMode) => void;
  /** Se está carregando */
  isLoading?: boolean;
  /** Se está pesquisando (desabilita animações) */
  isSearching?: boolean;
  /** Callback ao clicar em item */
  onItemClick?: (item: T, event: React.MouseEvent) => void;
  /** Callback ao duplo clique */
  onItemDoubleClick?: (item: T) => void;
  /** Callback ao clicar com botão direito (context menu) */
  onContextMenu?: (item: T, event: React.MouseEvent) => void;
  /** Callbacks de ações batch */
  onItemsView?: (ids: string[]) => void;
  onItemsEdit?: (ids: string[]) => void;
  onItemsDuplicate?: (ids: string[]) => void;
  onItemsDelete?: (ids: string[]) => void;
  /** Habilitar drag selection */
  enableDragSelection?: boolean;
  /** Mostrar contador de itens */
  showItemCount?: boolean;
  /** Mostrar toggle de view mode */
  showViewToggle?: boolean;
  /** Mostrar ordenação */
  showSorting?: boolean;
  /** Campo de ordenação padrão */
  defaultSortField?: SortField;
  /** Direção de ordenação padrão */
  defaultSortDirection?: SortDirection;
  /** Opções de ordenação customizadas */
  customSortOptions?: SortOption[];
  /** Função de ordenação customizada (para campo 'custom') */
  customSortFn?: (a: T, b: T, direction: SortDirection) => number;
  /** Label do campo customizado */
  customSortLabel?: string;
  /** Classes customizadas */
  className?: string;
  /** Classes para o container de itens */
  itemsClassName?: string;
  /** Grid columns classes */
  gridColumns?: string;
  /** Conteúdo renderizado no início da toolbar (ex: filtros) */
  toolbarStart?: React.ReactNode;
  /** Callback para sorting server-side. Quando presente, sorting interno é desabilitado. */
  onSortChange?: (sortField: SortField, sortDirection: SortDirection) => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function EntityGrid<T extends BaseEntity>({
  config,
  items,
  renderGridItem,
  renderListItem,
  emptyMessage,
  emptyIcon,
  defaultView = 'grid',
  viewMode: controlledViewMode,
  onViewModeChange,
  isLoading = false,
  isSearching = false,
  onItemClick,
  onItemDoubleClick,
  onContextMenu,
  onItemsView,
  onItemsEdit,
  onItemsDuplicate,
  onItemsDelete,
  enableDragSelection = true,
  showItemCount = true,
  showViewToggle = true,
  showSorting = false,
  defaultSortField = 'name',
  defaultSortDirection = 'asc',
  customSortOptions,
  customSortFn,
  customSortLabel = 'Tipo',
  className,
  itemsClassName,
  gridColumns = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  toolbarStart,
  onSortChange,
}: EntityGridProps<T>) {
  // Selection context (opcional)
  const selectionContext = useOptionalSelectionContext();
  const selectedIds = selectionContext?.state.selectedIds ?? new Set<string>();
  const selectionActions = selectionContext?.actions;

  // View mode (controlled ou uncontrolled)
  const [internalViewMode, setInternalViewMode] =
    useState<ViewMode>(defaultView);
  const viewMode = controlledViewMode ?? internalViewMode;
  const setViewMode = onViewModeChange ?? setInternalViewMode;

  // Sorting state
  const [sortField, setSortField] = useState<SortField>(defaultSortField);
  const [sortDirection, setSortDirection] =
    useState<SortDirection>(defaultSortDirection);

  // Keyboard navigation state
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);

  // Opções de ordenação padrão
  const defaultSortOptions: SortOption[] = useMemo(
    () => [
      {
        field: 'name',
        direction: 'asc',
        label: 'Nome (A-Z)',
        icon: ArrowDownAZ,
      },
      {
        field: 'name',
        direction: 'desc',
        label: 'Nome (Z-A)',
        icon: ArrowDownAZ,
      },
      {
        field: 'createdAt',
        direction: 'desc',
        label: 'Mais recentes',
        icon: Calendar,
      },
      {
        field: 'createdAt',
        direction: 'asc',
        label: 'Mais antigos',
        icon: Calendar,
      },
      {
        field: 'updatedAt',
        direction: 'desc',
        label: 'Última atualização',
        icon: Clock,
      },
      ...(customSortFn
        ? [
            {
              field: 'custom' as SortField,
              direction: 'asc' as SortDirection,
              label: customSortLabel,
              icon: ArrowUpDown,
            },
          ]
        : []),
    ],
    [customSortFn, customSortLabel]
  );

  const sortOptions = customSortOptions ?? defaultSortOptions;

  // Itens ordenados (skip sorting when server-side via onSortChange)
  const sortedItems = useMemo(() => {
    if (!items || items.length === 0) return items;
    if (onSortChange) return items;

    return [...items].sort((a, b) => {
      const multiplier = sortDirection === 'asc' ? 1 : -1;

      switch (sortField) {
        case 'name': {
          const nameA = (a as { name?: string }).name?.toLowerCase() ?? '';
          const nameB = (b as { name?: string }).name?.toLowerCase() ?? '';
          return nameA.localeCompare(nameB, 'pt-BR') * multiplier;
        }
        case 'createdAt': {
          const dateA = new Date(
            (a as { createdAt?: string }).createdAt ?? 0
          ).getTime();
          const dateB = new Date(
            (b as { createdAt?: string }).createdAt ?? 0
          ).getTime();
          return (dateA - dateB) * multiplier;
        }
        case 'updatedAt': {
          const dateA = new Date(
            (a as { updatedAt?: string }).updatedAt ?? 0
          ).getTime();
          const dateB = new Date(
            (b as { updatedAt?: string }).updatedAt ?? 0
          ).getTime();
          return (dateA - dateB) * multiplier;
        }
        case 'custom': {
          if (customSortFn) {
            return customSortFn(a, b, sortDirection);
          }
          return 0;
        }
        default:
          return 0;
      }
    });
  }, [items, sortField, sortDirection, customSortFn]);

  // Handler para mudar ordenação
  const handleSortChange = useCallback((value: string) => {
    const [field, direction] = value.split('-') as [SortField, SortDirection];
    setSortField(field);
    setSortDirection(direction);
    onSortChange?.(field, direction);
  }, [onSortChange]);

  // Valor atual da ordenação
  const currentSortValue = `${sortField}-${sortDirection}`;

  // Drag selection state
  const [isDragging, setIsDragging] = useState(false);
  const [isDragStarted, setIsDragStarted] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragEndRef = useRef<{ x: number; y: number } | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const DRAG_THRESHOLD = 5;

  // Update available IDs quando sortedItems mudam (usa ordem ordenada!)
  useEffect(() => {
    if (selectionContext) {
      const ids = sortedItems.map(item => item.id);
      selectionContext.setAvailableIds(ids);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedItems]);

  // Ref para rastrear onde o mousedown ocorreu
  const mouseDownTargetRef = useRef<HTMLElement | null>(null);

  // Handler for click outside cards to clear selection
  const handleContainerClick = useCallback(
    (e: React.MouseEvent) => {
      // Se o drag foi iniciado, não processa como click
      if (isDragStarted) return;

      const target = e.target as HTMLElement;

      // Verifica se clicou em um card ou dentro de um card
      const clickedOnCard = target.closest('[data-item-card]');

      // Verifica também se clicou em um context menu (que está em um portal)
      const clickedOnContextMenu = target.closest('[data-radix-menu-content]');

      // Se clicou em um card ou context menu, não faz nada aqui
      if (clickedOnCard || clickedOnContextMenu) return;

      // Verifica se o mousedown também foi fora de um card (para evitar casos de drag)
      if (mouseDownTargetRef.current) {
        const mouseDownOnCard =
          mouseDownTargetRef.current.closest('[data-item-card]');
        if (mouseDownOnCard) {
          mouseDownTargetRef.current = null;
          return;
        }
      }
      mouseDownTargetRef.current = null;

      // Clique fora de um card limpa a seleção (Windows Explorer behavior)
      if (selectionActions && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        selectionActions.clear();
      }
    },
    [selectionActions, isDragStarted]
  );

  // Drag selection handlers
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Salva o target do mousedown para verificar no click
      mouseDownTargetRef.current = e.target as HTMLElement;

      if (!enableDragSelection) return;

      // Só ativa drag selection com botão esquerdo
      if (e.button !== 0) return;

      // Sempre previne o comportamento padrão de drag nativo
      e.preventDefault();

      // Inicia drag selection de qualquer lugar (inclusive de cima de cards)
      setIsDragging(true);
      setIsDragStarted(false);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      dragEndRef.current = { x: e.clientX, y: e.clientY };
    },
    [enableDragSelection]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging && dragStartRef.current) {
        dragEndRef.current = { x: e.clientX, y: e.clientY };

        const deltaX = Math.abs(e.clientX - dragStartRef.current.x);
        const deltaY = Math.abs(e.clientY - dragStartRef.current.y);
        const movedEnough = deltaX > DRAG_THRESHOLD || deltaY > DRAG_THRESHOLD;

        if (movedEnough && !isDragStarted) {
          setIsDragStarted(true);
          selectionActions?.clear();
        }

        if (isDragStarted) {
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
          }

          animationFrameRef.current = requestAnimationFrame(() => {
            if (dragStartRef.current && dragEndRef.current) {
              const x = Math.min(dragStartRef.current.x, dragEndRef.current.x);
              const y = Math.min(dragStartRef.current.y, dragEndRef.current.y);
              const width = Math.abs(
                dragEndRef.current.x - dragStartRef.current.x
              );
              const height = Math.abs(
                dragEndRef.current.y - dragStartRef.current.y
              );
              setSelectionBox({ x, y, width, height });
            }
          });
        }
      }
    },
    [isDragging, isDragStarted, selectionActions]
  );

  const handleMouseUp = useCallback(() => {
    if (
      isDragging &&
      isDragStarted &&
      dragStartRef.current &&
      dragEndRef.current &&
      selectionActions
    ) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      const selectionRect = {
        left: Math.min(dragStartRef.current.x, dragEndRef.current.x),
        top: Math.min(dragStartRef.current.y, dragEndRef.current.y),
        right: Math.max(dragStartRef.current.x, dragEndRef.current.x),
        bottom: Math.max(dragStartRef.current.y, dragEndRef.current.y),
      };

      const selectedInDrag: string[] = [];

      // Seleciona qualquer item que a área de seleção tocar (sem margem)
      itemRefs.current.forEach((element, id) => {
        const rect = element.getBoundingClientRect();

        const hasIntersection =
          rect.left < selectionRect.right &&
          rect.right > selectionRect.left &&
          rect.top < selectionRect.bottom &&
          rect.bottom > selectionRect.top;

        if (hasIntersection) {
          selectedInDrag.push(id);
        }
      });

      if (selectedInDrag.length > 0) {
        selectionActions.selectMultiple(selectedInDrag);
      }
    }

    setIsDragging(false);
    setIsDragStarted(false);
    setSelectionBox(null);
    dragStartRef.current = null;
    dragEndRef.current = null;
  }, [isDragging, isDragStarted, selectionActions]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      // Set crosshair cursor during drag to prevent "not-allowed" cursor
      if (isDragStarted) {
        document.body.style.cursor = 'crosshair';
      }

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      };
    }
  }, [isDragging, isDragStarted, handleMouseMove, handleMouseUp]);

  // Item click handlers
  const handleItemClick = useCallback(
    (item: T, e: React.MouseEvent) => {
      e.stopPropagation();

      // Se tem shift key e selection context, faz range selection
      if (
        e.shiftKey &&
        selectionActions &&
        selectionContext?.state.lastSelectedId
      ) {
        selectionActions.selectRange(
          selectionContext.state.lastSelectedId,
          item.id
        );
        return;
      }

      // Se tem ctrl/cmd key, toggle (multi-select)
      if ((e.ctrlKey || e.metaKey) && selectionActions) {
        selectionActions.toggle(item.id);
        return;
      }

      // Single click: Select this item (clear others) - Windows Explorer behavior
      if (selectionActions) {
        selectionActions.select(item.id);
      }

      // Call custom handler if provided
      if (onItemClick) {
        onItemClick(item, e);
      }
    },
    [onItemClick, selectionActions, selectionContext]
  );

  const handleItemDoubleClick = useCallback(
    (item: T, e: React.MouseEvent) => {
      e.stopPropagation();
      if (onItemDoubleClick) {
        onItemDoubleClick(item);
      }
    },
    [onItemDoubleClick]
  );

  const handleContextMenu = useCallback(
    (item: T, e: React.MouseEvent) => {
      // Se não há callback onContextMenu, deixa o evento propagar
      // para que ContextMenu do Radix UI funcione
      if (!onContextMenu) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      // If item not selected, select it first
      if (selectionActions && !selectedIds.has(item.id)) {
        selectionActions.select(item.id);
      }

      onContextMenu(item, e);
    },
    [onContextMenu, selectionActions, selectedIds]
  );

  // Keyboard navigation handler
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (sortedItems.length === 0) return;

      let newIndex = focusedIndex;
      let shouldPreventDefault = false;

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown': {
          shouldPreventDefault = true;
          newIndex =
            focusedIndex === -1
              ? 0
              : Math.min(focusedIndex + 1, sortedItems.length - 1);
          break;
        }
        case 'ArrowLeft':
        case 'ArrowUp': {
          shouldPreventDefault = true;
          newIndex = focusedIndex === -1 ? 0 : Math.max(focusedIndex - 1, 0);
          break;
        }
        case 'Home': {
          shouldPreventDefault = true;
          newIndex = 0;
          break;
        }
        case 'End': {
          shouldPreventDefault = true;
          newIndex = sortedItems.length - 1;
          break;
        }
        case ' ':
        case 'Enter': {
          if (
            focusedIndex >= 0 &&
            focusedIndex < sortedItems.length &&
            selectionActions
          ) {
            shouldPreventDefault = true;
            const item = sortedItems[focusedIndex];
            if (e.shiftKey && selectionContext?.state.lastSelectedId) {
              selectionActions.selectRange(
                selectionContext.state.lastSelectedId,
                item.id
              );
            } else if (e.ctrlKey || e.metaKey) {
              selectionActions.toggle(item.id);
            } else {
              selectionActions.select(item.id);
            }
          }
          break;
        }
        case 'Escape': {
          shouldPreventDefault = true;
          if (selectionActions) {
            selectionActions.clear();
          }
          setFocusedIndex(-1);
          break;
        }
      }

      if (shouldPreventDefault) {
        e.preventDefault();
      }

      if (
        newIndex !== focusedIndex &&
        newIndex >= 0 &&
        newIndex < sortedItems.length
      ) {
        setFocusedIndex(newIndex);
        const item = sortedItems[newIndex];
        const element = itemRefs.current.get(item.id);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    },
    [focusedIndex, sortedItems, selectionActions, selectionContext]
  );

  const setItemRef = useCallback(
    (id: string, element: HTMLDivElement | null) => {
      if (element) {
        itemRefs.current.set(id, element);
      } else {
        itemRefs.current.delete(id);
      }
    },
    []
  );

  // Empty message
  const finalEmptyMessage =
    emptyMessage ??
    config.display.labels.emptyState ??
    'Nenhum item encontrado';

  // Empty state
  if (items.length === 0 && !isLoading) {
    return (
      <Card className="p-12 text-center bg-white/90 dark:bg-white/5 border-gray-200/50 dark:border-white/10">
        <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
          {emptyIcon ?? <Grid3x3 className="w-8 h-8 text-gray-400" />}
        </div>
        <p className="text-gray-600 dark:text-white/60">{finalEmptyMessage}</p>
      </Card>
    );
  }

  return (
    <div className={cn('entity-grid', className)}>
      {/* Header: Filters + Count + View Toggle */}
      {(showItemCount || showViewToggle || toolbarStart) && (
        <div className="flex items-center justify-between mb-4 select-none gap-4 flex-wrap">
          {/* Left: Filters + Item count */}
          <div className="flex items-center gap-3 flex-wrap">
            {toolbarStart}
            {showItemCount && (
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                {items.length}{' '}
                {items.length === 1
                  ? config.display.labels.singular
                  : config.display.labels.plural}
                {selectedIds.size > 0 &&
                  ` · ${selectedIds.size} selecionado${selectedIds.size > 1 ? 's' : ''}`}
              </p>
            )}
          </div>

          {/* Right: Sort + View toggle */}
          {showViewToggle && (
            <div className="flex items-center gap-3">
              {/* Sort Select */}
              {showSorting && (
                <Select
                  value={currentSortValue}
                  onValueChange={handleSortChange}
                >
                  <SelectTrigger className="h-11 cursor-pointer bg-white/90 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 rounded-xl">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map(option => {
                      const Icon = option.icon;
                      return (
                        <SelectItem
                          key={`${option.field}-${option.direction}`}
                          value={`${option.field}-${option.direction}`}
                        >
                          <span className="flex items-center gap-2">
                            {Icon && <Icon className="w-4 h-4" />}
                            {option.label}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}

              {/* View Mode Toggle */}
              <div className="flex items-center gap-2 bg-white/90 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 rounded-xl p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  aria-label="Visualização em grade"
                  className={cn(
                    'rounded-lg',
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-white/10 shadow-sm'
                      : 'hover:bg-gray-100 dark:hover:bg-white/5'
                  )}
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('list')}
                  aria-label="Visualização em lista"
                  className={cn(
                    'rounded-lg',
                    viewMode === 'list'
                      ? 'bg-white dark:bg-white/10 shadow-sm'
                      : 'hover:bg-gray-100 dark:hover:bg-white/5'
                  )}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Items Container */}
      <div
        ref={containerRef}
        data-entity-grid
        onMouseDown={handleMouseDown}
        onClick={handleContainerClick}
        onDragStart={e => e.preventDefault()}
        onKeyDown={handleKeyDown}
        className={cn('relative', itemsClassName)}
        style={{ userSelect: 'none' }}
        tabIndex={0}
        role="grid"
        aria-label={`Grade de ${config.display.labels.plural}`}
      >
        {viewMode === 'grid' ? (
          <div className={cn('grid gap-4', gridColumns)}>
            {sortedItems.map((item, index) => {
              const isSelected = selectedIds.has(item.id);
              const isFocused = index === focusedIndex;

              return (
                <div
                  key={item.id}
                  data-item-card
                  ref={(el: HTMLDivElement | null) => setItemRef(item.id, el)}
                  onClick={(e: React.MouseEvent) => handleItemClick(item, e)}
                  onDoubleClick={(e: React.MouseEvent) =>
                    handleItemDoubleClick(item, e)
                  }
                  {...(onContextMenu
                    ? {
                        onContextMenu: (e: React.MouseEvent) =>
                          handleContextMenu(item, e),
                      }
                    : {})}
                  tabIndex={isFocused ? 0 : -1}
                  role="gridcell"
                  aria-selected={isSelected}
                >
                  {renderGridItem(item, isSelected)}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {sortedItems.map((item, index) => {
              const isSelected = selectedIds.has(item.id);
              const isFocused = index === focusedIndex;

              return (
                <div
                  key={item.id}
                  data-item-card
                  ref={(el: HTMLDivElement | null) => setItemRef(item.id, el)}
                  onClick={(e: React.MouseEvent) => handleItemClick(item, e)}
                  onDoubleClick={(e: React.MouseEvent) =>
                    handleItemDoubleClick(item, e)
                  }
                  {...(onContextMenu
                    ? {
                        onContextMenu: (e: React.MouseEvent) =>
                          handleContextMenu(item, e),
                      }
                    : {})}
                  tabIndex={isFocused ? 0 : -1}
                  role="gridcell"
                  aria-selected={isSelected}
                >
                  {renderListItem(item, isSelected)}
                </div>
              );
            })}
          </div>
        )}

        {/* Drag Selection Rectangle */}
        {isDragging &&
          isDragStarted &&
          selectionBox &&
          selectionBox.width > 0 &&
          selectionBox.height > 0 && (
            <div
              className="fixed pointer-events-none border-2 border-blue-500 bg-blue-500/10 z-50 transition-none"
              style={{
                left: selectionBox.x,
                top: selectionBox.y,
                width: selectionBox.width,
                height: selectionBox.height,
                willChange: 'transform',
              }}
            />
          )}
      </div>
    </div>
  );
}

export default EntityGrid;
