/**
 * OpenSea OS - CRUD Hooks Factory
 * Factory para criação de hooks React Query para operações CRUD
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Service interface com métodos CRUD básicos
 */
export interface CrudService<
  TEntity,
  TCreateRequest = Partial<TEntity>,
  TUpdateRequest = Partial<TEntity>,
> {
  list?: () => Promise<TEntity[]>;
  get?: (id: string) => Promise<TEntity>;
  create?: (data: TCreateRequest) => Promise<TEntity>;
  update?: (id: string, data: TUpdateRequest) => Promise<TEntity>;
  delete?: (id: string) => Promise<void>;
}

/**
 * Configuração do factory de hooks
 */
export interface CrudHooksConfig<
  TEntity,
  TCreateRequest = Partial<TEntity>,
  TUpdateRequest = Partial<TEntity>,
> {
  /** Nome da entidade no singular (ex: 'product', 'category') */
  entityName: string;
  /** Nome da entidade no plural (ex: 'products', 'categories') */
  pluralEntityName: string;
  /** Service com métodos CRUD */
  service: CrudService<TEntity, TCreateRequest, TUpdateRequest>;
}

/**
 * Resultado do factory com todos os hooks CRUD
 */
export interface CrudHooks<
  TEntity,
  TCreateRequest = Partial<TEntity>,
  TUpdateRequest = Partial<TEntity>,
> {
  /** Hook para listar todas as entidades */
  useList: (
    options?: Omit<UseQueryOptions<TEntity[], Error>, 'queryKey' | 'queryFn'>
  ) => ReturnType<typeof useQuery<TEntity[], Error>>;

  /** Hook para buscar uma entidade por ID */
  useGet: (
    id: string,
    options?: Omit<UseQueryOptions<TEntity, Error>, 'queryKey' | 'queryFn'>
  ) => ReturnType<typeof useQuery<TEntity, Error>>;

  /** Hook para criar uma nova entidade */
  useCreate: (
    options?: Omit<
      UseMutationOptions<TEntity, Error, TCreateRequest>,
      'mutationFn'
    >
  ) => ReturnType<typeof useMutation<TEntity, Error, TCreateRequest>>;

  /** Hook para atualizar uma entidade */
  useUpdate: (
    options?: Omit<
      UseMutationOptions<TEntity, Error, { id: string; data: TUpdateRequest }>,
      'mutationFn'
    >
  ) => ReturnType<
    typeof useMutation<TEntity, Error, { id: string; data: TUpdateRequest }>
  >;

  /** Hook para deletar uma entidade */
  useDelete: (
    options?: Omit<UseMutationOptions<void, Error, string>, 'mutationFn'>
  ) => ReturnType<typeof useMutation<void, Error, string>>;

  /** Query keys para uso manual */
  queryKeys: {
    all: readonly [string];
    lists: readonly [string, string];
    list: () => readonly [string, string];
    details: readonly [string, string];
    detail: (id: string) => readonly [string, string, string];
  };
}

// =============================================================================
// FACTORY
// =============================================================================

/**
 * Cria hooks React Query para operações CRUD básicas
 *
 * @example
 * ```ts
 * // Definir service
 * const productsService = {
 *   list: () => api.get('/products'),
 *   get: (id: string) => api.get(`/products/${id}`),
 *   create: (data: CreateProductRequest) => api.post('/products', data),
 *   update: (id: string, data: UpdateProductRequest) => api.patch(`/products/${id}`, data),
 *   delete: (id: string) => api.delete(`/products/${id}`),
 * };
 *
 * // Criar hooks
 * const productHooks = createCrudHooks<Product, CreateProductRequest, UpdateProductRequest>({
 *   entityName: 'product',
 *   pluralEntityName: 'products',
 *   service: productsService,
 * });
 *
 * // Usar hooks
 * const { data: products } = productHooks.useList();
 * const { data: product } = productHooks.useGet(productId);
 * const createMutation = productHooks.useCreate();
 * const updateMutation = productHooks.useUpdate();
 * const deleteMutation = productHooks.useDelete();
 * ```
 */
export function createCrudHooks<
  TEntity,
  TCreateRequest = Partial<TEntity>,
  TUpdateRequest = Partial<TEntity>,
>(
  config: CrudHooksConfig<TEntity, TCreateRequest, TUpdateRequest>
): CrudHooks<TEntity, TCreateRequest, TUpdateRequest> {
  const { entityName, pluralEntityName, service } = config;

  // Query keys seguindo padrão de organização hierárquica
  const queryKeys = {
    all: [pluralEntityName] as const,
    lists: [pluralEntityName, 'list'] as const,
    list: () => [pluralEntityName, 'list'] as const,
    details: [pluralEntityName, 'detail'] as const,
    detail: (id: string) => [pluralEntityName, 'detail', id] as const,
  };

  // =============================================================================
  // QUERY HOOKS
  // =============================================================================

  function useList(
    options?: Omit<UseQueryOptions<TEntity[], Error>, 'queryKey' | 'queryFn'>
  ) {
    if (!service.list) {
      throw new Error(
        `Service for ${entityName} does not implement list() method`
      );
    }

    return useQuery<TEntity[], Error>({
      queryKey: queryKeys.list(),
      queryFn: service.list,
      ...options,
    });
  }

  function useGet(
    id: string,
    options?: Omit<UseQueryOptions<TEntity, Error>, 'queryKey' | 'queryFn'>
  ) {
    if (!service.get) {
      throw new Error(
        `Service for ${entityName} does not implement get() method`
      );
    }

    return useQuery<TEntity, Error>({
      queryKey: queryKeys.detail(id),
      queryFn: () => service.get!(id),
      enabled: !!id,
      ...options,
    });
  }

  // =============================================================================
  // MUTATION HOOKS
  // =============================================================================

  function useCreate(
    options?: Omit<
      UseMutationOptions<TEntity, Error, TCreateRequest>,
      'mutationFn'
    >
  ) {
    if (!service.create) {
      throw new Error(
        `Service for ${entityName} does not implement create() method`
      );
    }

    const queryClient = useQueryClient();

    return useMutation<TEntity, Error, TCreateRequest>({
      mutationFn: service.create,
      ...options,
      onSuccess: async (...args) => {
        // Invalidar lista após criar
        await queryClient.invalidateQueries({ queryKey: queryKeys.all });
        // Chamar onSuccess customizado se existir
        options?.onSuccess?.(...args);
      },
    });
  }

  function useUpdate(
    options?: Omit<
      UseMutationOptions<TEntity, Error, { id: string; data: TUpdateRequest }>,
      'mutationFn'
    >
  ) {
    if (!service.update) {
      throw new Error(
        `Service for ${entityName} does not implement update() method`
      );
    }

    const queryClient = useQueryClient();

    return useMutation<TEntity, Error, { id: string; data: TUpdateRequest }>({
      mutationFn: ({ id, data }) => service.update!(id, data),
      ...options,
      onSuccess: async (...args) => {
        const [, variables] = args;
        // Invalidar lista e detalhe específico
        await queryClient.invalidateQueries({ queryKey: queryKeys.all });
        await queryClient.invalidateQueries({
          queryKey: queryKeys.detail(variables.id),
        });
        // Chamar onSuccess customizado se existir
        options?.onSuccess?.(...args);
      },
    });
  }

  function useDelete(
    options?: Omit<UseMutationOptions<void, Error, string>, 'mutationFn'>
  ) {
    if (!service.delete) {
      throw new Error(
        `Service for ${entityName} does not implement delete() method`
      );
    }

    const queryClient = useQueryClient();

    return useMutation<void, Error, string>({
      mutationFn: service.delete,
      ...options,
      onSuccess: async (...args) => {
        const [, id] = args;
        // Invalidar lista e detalhe específico
        await queryClient.invalidateQueries({ queryKey: queryKeys.all });
        await queryClient.invalidateQueries({ queryKey: queryKeys.detail(id) });
        // Chamar onSuccess customizado se existir
        options?.onSuccess?.(...args);
      },
    });
  }

  // =============================================================================
  // RETURN
  // =============================================================================

  return {
    useList,
    useGet,
    useCreate,
    useUpdate,
    useDelete,
    queryKeys,
  };
}
