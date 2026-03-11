/**
 * OpenSea OS - useEntityPage Hook
 * Hook orquestrador que gerencia todo o estado e operações de uma página de entidade
 */

import { useOptionalSelectionContext } from '@/core/selection';
import type { BaseEntity } from '@/core/types';
import { logger } from '@/lib/logger';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { useDebounce } from './use-debounce';
import { toast } from 'sonner';
import type { UseEntityCrudReturn } from './use-entity-crud';
import { useModals } from './use-modals';

// =============================================================================
// TYPES
// =============================================================================

export interface UseEntityPageConfig<T extends BaseEntity> {
  /** Nome da entidade (singular) */
  entityName: string;
  /** Nome da entidade (plural) */
  entityNamePlural: string;
  /** Query key do React Query */
  queryKey: string[];
  /** CRUD operations (do useEntityCrud) */
  crud: UseEntityCrudReturn<T>;
  /** Rota de criação (opcional) */
  createRoute?: string;
  /** Rota de edição (opcional, recebe ID como parâmetro) */
  editRoute?: (id: string) => string;
  /** Rota de visualização (opcional, recebe ID como parâmetro) */
  viewRoute?: (id: string) => string;

  // Configuração de busca
  /** Função de filtro de busca */
  filterFn?: (item: T, query: string) => boolean;

  // Configuração de duplicação
  duplicateConfig?: {
    /** Função para gerar novo nome ao duplicar */
    getNewName: (item: T) => string;
    /** Função para extrair dados ao duplicar */
    getData: (item: T) => Partial<T>;
  };

  // Callbacks
  onCreateSuccess?: (item: T) => void;
  onUpdateSuccess?: (item: T) => void;
  onDeleteSuccess?: (ids: string[]) => void;
  onDuplicateSuccess?: (item: T) => void;
}

export interface EntityPageHandlers<T extends BaseEntity = BaseEntity> {
  /** Handler de busca */
  handleSearch: (query: string) => void;
  /** Handler de clique em item */
  handleItemClick: (item: BaseEntity, event: React.MouseEvent) => void;
  /** Handler de duplo clique em item */
  handleItemDoubleClick: (item: BaseEntity) => void;
  /** Handler para visualizar itens */
  handleItemsView: (ids: string[]) => void;
  /** Handler para editar itens */
  handleItemsEdit: (ids: string[]) => void;
  /** Handler para duplicar itens */
  handleItemsDuplicate: (ids: string[]) => void;
  /** Handler para deletar itens */
  handleItemsDelete: (ids: string[]) => void;
  /** Handler de confirmação de deleção */
  handleDeleteConfirm: () => Promise<void>;
  /** Handler de confirmação de duplicação */
  handleDuplicateConfirm: () => Promise<void>;
  /** Handler de criação rápida */
  handleQuickCreate: (data: Partial<T>) => Promise<void>;
}

export interface UseEntityPageReturn<T extends BaseEntity> {
  // Data
  /** Lista de itens */
  items: T[];
  /** Itens filtrados pela busca */
  filteredItems: T[];
  /** Está carregando */
  isLoading: boolean;
  /** Erro */
  error: Error | null;
  /** Query de busca */
  searchQuery: string;
  /** Definir query de busca */
  setSearchQuery: (query: string) => void;
  /** Recarregar dados */
  refetch: () => void;

  // UI State
  /** Operação ativa */
  activeOperation: 'delete' | 'duplicate' | null;
  /** Gerenciador de modais */
  modals: ReturnType<typeof useModals<T>>;

  // CRUD Operations
  /** Operações CRUD */
  crud: UseEntityCrudReturn<T>;

  // Handlers
  /** Handlers padronizados */
  handlers: EntityPageHandlers<T>;

  // Selection (opcional, vem do context)
  /** Estado de seleção (se SelectionProvider estiver disponível) */
  selection: ReturnType<typeof useOptionalSelectionContext>;
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * Hook orquestrador para páginas de entidade
 *
 * Gerencia:
 * - Estado de busca e filtros
 * - Modais (criar, editar, deletar, etc)
 * - Seleção múltipla (via context)
 * - Operações CRUD
 * - Handlers padronizados
 *
 * @example
 * ```tsx
 * const products = useEntityPage({
 *   entityName: 'Produto',
 *   entityNamePlural: 'Produtos',
 *   queryKey: ['products'],
 *   crud: useEntityCrud(productCrudConfig),
 *   filterFn: (item, query) =>
 *     item.name.toLowerCase().includes(query.toLowerCase()),
 * });
 *
 * // Usar no componente
 * const items = products.filteredItems;
 * products.handlers.handleItemsDelete(['id1', 'id2']);
 * products.modals.open('create');
 * ```
 */
export function useEntityPage<T extends BaseEntity>(
  config: UseEntityPageConfig<T>
): UseEntityPageReturn<T> {
  const {
    entityName,
    entityNamePlural,
    queryKey,
    crud,
    createRoute,
    editRoute,
    viewRoute,
    filterFn,
    duplicateConfig,
    onCreateSuccess,
    onUpdateSuccess,
    onDeleteSuccess,
    onDuplicateSuccess,
  } = config;

  const router = useRouter();
  const queryClient = useQueryClient();

  // =============================================================================
  // ESTADO
  // =============================================================================

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [activeOperation, setActiveOperation] = useState<
    'delete' | 'duplicate' | null
  >(null);

  // Modais
  const modals = useModals<T>();

  // Seleção (opcional, vem do SelectionProvider)
  const selection = useOptionalSelectionContext();

  // =============================================================================
  // DADOS FILTRADOS
  // =============================================================================

  const items = Array.isArray(crud.items) ? crud.items : [];

  const filteredItems = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return items;
    }

    if (filterFn) {
      return items.filter(item => filterFn(item, debouncedSearchQuery));
    }

    // Filtro padrão simples (busca em todos os campos string)
    const query = debouncedSearchQuery.toLowerCase();
    return items.filter(item => {
      return Object.values(item).some(value => {
        if (typeof value === 'string') {
          return value.toLowerCase().includes(query);
        }
        return false;
      });
    });
  }, [items, debouncedSearchQuery, filterFn]);

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleItemClick = useCallback(
    (item: BaseEntity, event: React.MouseEvent) => {
      // Se tem Shift, faz seleção em range
      if (event.shiftKey && selection) {
        // Implementado no EntityGrid
        return;
      }

      // Se tem Ctrl/Cmd, toggle selection
      if ((event.ctrlKey || event.metaKey) && selection) {
        selection.actions.toggle(item.id);
        return;
      }

      // Click normal - apenas selecionar o item (Windows Explorer behavior)
      // Navegação acontece no duplo clique
      if (selection) {
        selection.actions.select(item.id);
      }
    },
    [selection]
  );

  const handleItemDoubleClick = useCallback(
    (item: BaseEntity) => {
      // Duplo clique navega para visualização do item
      if (viewRoute) {
        router.push(viewRoute(item.id));
      } else {
        // Fallback: abrir modal de visualização
        modals.setViewingItem(item as T);
        modals.open('view');
      }
    },
    [router, viewRoute, modals]
  );

  const handleItemsView = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;

      if (ids.length === 1) {
        if (viewRoute) {
          router.push(viewRoute(ids[0]));
        } else {
          const item = items.find(i => i.id === ids[0]);
          if (item) {
            modals.setViewingItem(item);
            modals.open('view');
          }
        }
      } else {
        // Multi-view
        modals.setItemsToView(ids);
        modals.open('multiView');
      }
    },
    [items, modals, viewRoute, router]
  );

  const handleItemsEdit = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;

      if (ids.length === 1) {
        const item = items.find(i => i.id === ids[0]);
        if (item) {
          if (editRoute) {
            router.push(editRoute(item.id));
          } else {
            modals.setEditingItem(item);
            modals.open('edit');
          }
        }
      } else {
        // Bulk edit
        modals.setItemsToEdit(ids);
        modals.open('bulkEdit');
      }
    },
    [items, editRoute, router, modals]
  );

  const handleItemsDuplicate = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;

      setActiveOperation('duplicate');
      modals.setItemsToDuplicate(ids);
      modals.open('duplicate');
    },
    [modals]
  );

  const handleItemsDelete = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;

      setActiveOperation('delete');
      modals.setItemsToDelete(ids);
      modals.open('delete');
    },
    [modals]
  );

  const handleDeleteConfirm = useCallback(async () => {
    const ids = modals.itemsToDelete;
    if (ids.length === 0) return;

    logger.debug('[handleDeleteConfirm] Starting deletion', { ids });

    try {
      // Deletar todos os itens em modo silencioso (sem toast individual)
      // O onMutate do useEntityCrud remove cada item otimisticamente do cache
      for (const id of ids) {
        logger.debug('[handleDeleteConfirm] Deleting item', { id });
        await crud.deleteItem(id, true);
        logger.debug('[handleDeleteConfirm] Item deleted successfully', { id });
      }

      // Mostrar toast consolidado
      toast.success(
        ids.length === 1
          ? `${entityName} excluído com sucesso!`
          : `${ids.length} ${entityNamePlural.toLowerCase()} excluídos com sucesso!`
      );

      // Callback
      onDeleteSuccess?.(ids);

      // Limpar seleção
      if (selection) {
        selection.actions.clear();
      }

      // Fechar modal
      modals.close('delete');
      setActiveOperation(null);
    } catch (error) {
      logger.error(
        'Erro ao deletar',
        error instanceof Error ? error : undefined
      );
      // Erro já é tratado no useEntityCrud
    }
  }, [modals, crud, onDeleteSuccess, selection, entityName, entityNamePlural]);

  const handleDuplicateConfirm = useCallback(async () => {
    const ids = modals.itemsToDuplicate;
    if (ids.length === 0 || !crud.duplicate || !duplicateConfig) return;

    try {
      // Duplicar cada item
      for (const id of ids) {
        const item = items.find(i => i.id === id);
        if (item) {
          const newData = duplicateConfig.getData(item);
          await crud.duplicate(id, newData);
        }
      }

      // Toast já é chamado no useEntityCrud para cada item

      // Callback
      if (ids.length === 1) {
        const item = items.find(i => i.id === ids[0]);
        if (item) {
          onDuplicateSuccess?.(item);
        }
      }

      // Limpar seleção
      if (selection) {
        selection.actions.clear();
      }

      // Fechar modal
      modals.close('duplicate');
      setActiveOperation(null);
    } catch (error) {
      logger.error(
        'Erro ao duplicar',
        error instanceof Error ? error : undefined
      );
      toast.error(`Erro ao duplicar ${entityName.toLowerCase()}`);
    }
  }, [
    modals,
    crud,
    items,
    duplicateConfig,
    entityName,
    onDuplicateSuccess,
    selection,
  ]);

  const handleQuickCreate = useCallback(
    async (data: Partial<T>) => {
      try {
        const created = await crud.create(data);
        onCreateSuccess?.(created);
        modals.close('create');
      } catch (error) {
        logger.error(
          'Erro ao criar',
          error instanceof Error ? error : undefined
        );
        // Erro já é tratado pelo useEntityCrud
      }
    },
    [crud, onCreateSuccess, modals]
  );

  // =============================================================================
  // RETURN
  // =============================================================================

  const handlers: EntityPageHandlers<T> = {
    handleSearch,
    handleItemClick,
    handleItemDoubleClick,
    handleItemsView,
    handleItemsEdit,
    handleItemsDuplicate,
    handleItemsDelete,
    handleDeleteConfirm,
    handleDuplicateConfirm,
    handleQuickCreate,
  };

  return {
    // Data
    items,
    filteredItems,
    isLoading: crud.isLoading,
    error: crud.error,
    searchQuery,
    setSearchQuery,
    refetch: crud.refetch,

    // UI State
    activeOperation,
    modals,

    // CRUD
    crud,

    // Handlers
    handlers,

    // Selection (opcional)
    selection,
  };
}

export default useEntityPage;
