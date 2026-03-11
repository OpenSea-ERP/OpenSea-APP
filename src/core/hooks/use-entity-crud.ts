/**
 * OpenSea OS - useEntityCrud Hook
 * Hook genérico para operações CRUD de entidades
 */

import type { BaseEntity } from '@/core/types';
import { useAuth } from '@/contexts/auth-context';
import { logger } from '@/lib/logger';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';
import { toast } from 'sonner';

// =============================================================================
// TYPES
// =============================================================================

export interface EntityCrudConfig<T extends BaseEntity> {
  /** Nome da entidade (singular) para mensagens */
  entityName: string;
  /** Nome da entidade (plural) para mensagens */
  entityNamePlural: string;
  /** Chave base para React Query */
  queryKey: string[];
  /** URL base da API */
  baseUrl: string;

  // API Functions
  /** Função para listar entidades */
  listFn: () => Promise<T[]>;
  /** Função para buscar uma entidade por ID */
  getFn: (id: string) => Promise<T>;
  /** Função para criar uma entidade */
  createFn: (data: Partial<T>) => Promise<T>;
  /** Função para atualizar uma entidade */
  updateFn: (id: string, data: Partial<T>) => Promise<T>;
  /** Função para deletar uma entidade */
  deleteFn: (id: string) => Promise<void>;
  /** Função para duplicar uma entidade (opcional) */
  duplicateFn?: (id: string, data?: Partial<T>) => Promise<T>;

  // Callbacks
  /** Callback após sucesso de criação */
  onCreateSuccess?: (data: T) => void;
  /** Callback após sucesso de atualização */
  onUpdateSuccess?: (data: T) => void;
  /** Callback após sucesso de deleção */
  onDeleteSuccess?: (id: string) => void;
  /** Callback após sucesso de duplicação */
  onDuplicateSuccess?: (data: T) => void;
  /** Callback após erro */
  onError?: (error: Error) => void;

  // Mensagens customizadas
  messages?: {
    createSuccess?: string;
    updateSuccess?: string;
    deleteSuccess?: string;
    duplicateSuccess?: string;
    createError?: string;
    updateError?: string;
    deleteError?: string;
    duplicateError?: string;
  };
}

export interface UseEntityCrudReturn<T extends BaseEntity> {
  // Queries
  /** Lista de entidades */
  items: T[] | undefined;
  /** Está carregando a lista */
  isLoading: boolean;
  /** Erro ao carregar lista */
  error: Error | null;
  /** Recarregar lista */
  refetch: () => void;

  // Mutations
  /** Criar entidade */
  create: (data: Partial<T>) => Promise<T>;
  /** Está criando */
  isCreating: boolean;

  /** Atualizar entidade */
  update: (id: string, data: Partial<T>) => Promise<T>;
  /** Está atualizando */
  isUpdating: boolean;

  /** Deletar entidade */
  deleteItem: (id: string, silent?: boolean) => Promise<void>;
  /** Está deletando */
  isDeleting: boolean;

  /** Duplicar entidade */
  duplicate?: (id: string, data?: Partial<T>) => Promise<T>;
  /** Está duplicando */
  isDuplicating: boolean;

  /** Buscar entidade por ID */
  getById: (id: string) => Promise<T>;

  // Utils
  /** Invalidar queries */
  invalidate: () => Promise<void>;
  /** Limpar cache */
  clearCache: () => void;
}

// =============================================================================
// HOOK
// =============================================================================

/**
 * Hook genérico para operações CRUD de entidades
 *
 * @example
 * ```tsx
 * const products = useEntityCrud({
 *   entityName: 'Produto',
 *   entityNamePlural: 'Produtos',
 *   queryKey: ['products'],
 *   baseUrl: '/api/products',
 *   listFn: () => api.get('/api/products'),
 *   getFn: (id) => api.get(`/api/products/${id}`),
 *   createFn: (data) => api.post('/api/products', data),
 *   updateFn: (id, data) => api.put(`/api/products/${id}`, data),
 *   deleteFn: (id) => api.delete(`/api/products/${id}`),
 * });
 *
 * // Usar no componente
 * const items = products.items;
 * await products.create({ name: 'New Product' });
 * await products.update('id', { name: 'Updated' });
 * await products.deleteItem('id');
 * ```
 */
export function useEntityCrud<T extends BaseEntity>(
  config: EntityCrudConfig<T>
): UseEntityCrudReturn<T> {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const silentModeRef = useRef(false);

  const {
    entityName,
    queryKey,
    listFn,
    getFn,
    createFn,
    updateFn,
    deleteFn,
    duplicateFn,
    onCreateSuccess,
    onUpdateSuccess,
    onDeleteSuccess,
    onDuplicateSuccess,
    onError,
    messages = {},
  } = config;

  // =============================================================================
  // QUERIES
  // =============================================================================

  const {
    data: items,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: listFn,
    enabled: isAuthenticated,
  });

  // =============================================================================
  // HELPERS
  // =============================================================================

  /**
   * Força invalidação e refetch dos dados.
   * Usa refetchType: 'all' para ignorar staleTime global.
   */
  const forceRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey, refetchType: 'all' });
  }, [queryClient, queryKey]);

  // =============================================================================
  // MUTATIONS
  // =============================================================================

  // Create
  const createMutation = useMutation({
    mutationFn: createFn,
    onSuccess: async data => {
      await forceRefresh();
      toast.success(
        messages.createSuccess || `${entityName} criado com sucesso!`
      );
      onCreateSuccess?.(data);
    },
    onError: (error: Error) => {
      toast.error(
        messages.createError || `Erro ao criar ${entityName.toLowerCase()}`
      );
      onError?.(error);
    },
  });

  // Update
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<T> }) =>
      updateFn(id, data),
    onSuccess: async data => {
      await forceRefresh();
      toast.success(
        messages.updateSuccess || `${entityName} atualizado com sucesso!`
      );
      onUpdateSuccess?.(data);
    },
    onError: (error: Error) => {
      toast.error(
        messages.updateError || `Erro ao atualizar ${entityName.toLowerCase()}`
      );
      onError?.(error);
    },
  });

  // Delete (with optimistic removal)
  const deleteMutation = useMutation({
    mutationFn: deleteFn,
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey });
      const previousItems = queryClient.getQueryData<T[]>(queryKey);
      queryClient.setQueryData<T[]>(queryKey, old =>
        old ? old.filter(item => item.id !== id) : old
      );
      return { previousItems };
    },
    onSuccess: (_, id) => {
      if (!silentModeRef.current) {
        toast.success(
          messages.deleteSuccess || `${entityName} excluído com sucesso!`
        );
      }
      onDeleteSuccess?.(id);
    },
    onError: (error: Error, _, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(queryKey, context.previousItems);
      }
      if (!silentModeRef.current) {
        toast.error(
          messages.deleteError || `Erro ao excluir ${entityName.toLowerCase()}`
        );
      }
      onError?.(error);
    },
  });

  // Duplicate
  const duplicateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data?: Partial<T> }) =>
      duplicateFn!(id, data),
    onSuccess: async data => {
      await forceRefresh();
      toast.success(
        messages.duplicateSuccess || `${entityName} duplicado com sucesso!`
      );
      onDuplicateSuccess?.(data);
    },
    onError: (error: Error) => {
      toast.error(
        messages.duplicateError ||
          `Erro ao duplicar ${entityName.toLowerCase()}`
      );
      onError?.(error);
    },
  });

  // =============================================================================
  // WRAPPER FUNCTIONS
  // =============================================================================

  const create = useCallback(
    async (data: Partial<T>): Promise<T> => {
      return createMutation.mutateAsync(data);
    },
    [createMutation]
  );

  const update = useCallback(
    async (id: string, data: Partial<T>): Promise<T> => {
      return updateMutation.mutateAsync({ id, data });
    },
    [updateMutation]
  );

  const deleteItem = useCallback(
    async (id: string, silent = false): Promise<void> => {
      silentModeRef.current = silent;
      try {
        return await deleteMutation.mutateAsync(id);
      } finally {
        silentModeRef.current = false;
      }
    },
    [deleteMutation]
  );

  const duplicate = useCallback(
    async (id: string, data?: Partial<T>): Promise<T> => {
      if (!duplicateFn) throw new Error('Duplicate function not provided');
      return duplicateMutation.mutateAsync({ id, data });
    },
    [duplicateMutation, duplicateFn]
  );

  const getById = useCallback(
    async (id: string): Promise<T> => {
      // Tentar buscar do cache primeiro
      const cached = queryClient.getQueryData<T>([...queryKey, id]);
      if (cached) {
        return cached;
      }
      // Buscar da API
      return getFn(id);
    },
    [queryClient, queryKey, getFn]
  );

  const invalidate = useCallback(async () => {
    logger.debug('[invalidate] Force refreshing queries', { queryKey });
    await forceRefresh();
    logger.debug('[invalidate] Force refresh complete');
  }, [forceRefresh, queryKey]);

  const clearCache = useCallback(() => {
    queryClient.removeQueries({ queryKey });
  }, [queryClient, queryKey]);

  // =============================================================================
  // RETURN
  // =============================================================================

  return {
    // Queries
    items,
    isLoading,
    error: error as Error | null,
    refetch,

    // Mutations
    create,
    isCreating: createMutation.isPending,

    update,
    isUpdating: updateMutation.isPending,

    deleteItem,
    isDeleting: deleteMutation.isPending,

    duplicate,
    isDuplicating: duplicateMutation.isPending,

    getById,

    // Utils
    invalidate,
    clearCache,
  };
}

export default useEntityCrud;
