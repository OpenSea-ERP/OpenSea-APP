import {
  manufacturersService,
  purchaseOrdersService,
  suppliersService,
  tagsService,
  templatesService,
} from '@/services/stock';
import { apiClient } from '@/lib/api-client';
import type {
  CreateManufacturerRequest,
  CreatePurchaseOrderRequest,
  CreateSupplierRequest,
  CreateTagRequest,
  CreateTemplateRequest,
  UpdateManufacturerRequest,
  UpdateSupplierRequest,
  UpdateTagRequest,
  UpdateTemplateRequest,
  LocationsResponse,
} from '@/types/stock';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const QUERY_KEYS = {
  MANUFACTURERS: ['manufacturers'],
  MANUFACTURER: (id: string) => ['manufacturers', id],
  SUPPLIERS: ['suppliers'],
  SUPPLIER: (id: string) => ['suppliers', id],
  TAGS: ['tags'],
  TAG: (id: string) => ['tags', id],
  TEMPLATES: ['templates'],
  TEMPLATE: (id: string) => ['templates', id],
  PURCHASE_ORDERS: ['purchase-orders'],
  PURCHASE_ORDER: (id: string) => ['purchase-orders', id],
  LOCATIONS: ['locations'],
} as const;

// ==================== MANUFACTURERS ====================

export function useManufacturers() {
  return useQuery({
    queryKey: QUERY_KEYS.MANUFACTURERS,
    queryFn: () => manufacturersService.listManufacturers(),
  });
}

export function useManufacturer(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.MANUFACTURER(id),
    queryFn: () => manufacturersService.getManufacturer(id),
    enabled: !!id,
  });
}

export function useCreateManufacturer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateManufacturerRequest) =>
      manufacturersService.createManufacturer(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MANUFACTURERS });
    },
  });
}

export function useUpdateManufacturer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateManufacturerRequest;
    }) => manufacturersService.updateManufacturer(id, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MANUFACTURERS });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.MANUFACTURER(variables.id),
      });
    },
  });
}

export function useDeleteManufacturer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => manufacturersService.deleteManufacturer(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MANUFACTURERS });
    },
  });
}

// ==================== SUPPLIERS ====================

export function useSuppliers() {
  return useQuery({
    queryKey: QUERY_KEYS.SUPPLIERS,
    queryFn: () => suppliersService.listSuppliers(),
  });
}

export function useSupplier(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.SUPPLIER(id),
    queryFn: () => suppliersService.getSupplier(id),
    enabled: !!id,
  });
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSupplierRequest) =>
      suppliersService.createSupplier(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SUPPLIERS });
    },
  });
}

export function useUpdateSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSupplierRequest }) =>
      suppliersService.updateSupplier(id, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SUPPLIERS });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.SUPPLIER(variables.id),
      });
    },
  });
}

export function useDeleteSupplier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => suppliersService.deleteSupplier(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SUPPLIERS });
    },
  });
}

// ==================== TAGS ====================

export function useTags() {
  return useQuery({
    queryKey: QUERY_KEYS.TAGS,
    queryFn: () => tagsService.listTags(),
  });
}

export function useTag(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.TAG(id),
    queryFn: () => tagsService.getTag(id),
    enabled: !!id,
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTagRequest) => tagsService.createTag(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TAGS });
    },
  });
}

export function useUpdateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTagRequest }) =>
      tagsService.updateTag(id, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TAGS });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.TAG(variables.id),
      });
    },
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => tagsService.deleteTag(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TAGS });
    },
  });
}

// ==================== TEMPLATES ====================

export function useTemplates() {
  return useQuery({
    queryKey: QUERY_KEYS.TEMPLATES,
    queryFn: async () => {
      const response = await templatesService.listTemplates();
      return response.templates;
    },
  });
}

export function useTemplate(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.TEMPLATE(id),
    queryFn: async () => {
      const response = await templatesService.getTemplate(id);
      return response.template;
    },
    enabled: !!id,
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTemplateRequest) => {
      const response = await templatesService.createTemplate(data);
      return response.template;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TEMPLATES });
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateTemplateRequest;
    }) => {
      const response = await templatesService.updateTemplate(id, data);
      return response.template;
    },
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TEMPLATES });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.TEMPLATE(variables.id),
      });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => templatesService.deleteTemplate(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TEMPLATES });
    },
  });
}

// ==================== PURCHASE ORDERS ====================

export function usePurchaseOrders() {
  return useQuery({
    queryKey: QUERY_KEYS.PURCHASE_ORDERS,
    queryFn: () => purchaseOrdersService.listAll(),
  });
}

export function usePurchaseOrder(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.PURCHASE_ORDER(id),
    queryFn: () => purchaseOrdersService.get(id),
    enabled: !!id,
  });
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePurchaseOrderRequest) =>
      purchaseOrdersService.create(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PURCHASE_ORDERS });
    },
  });
}

export function useUpdatePurchaseOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: import('@/types/stock').PurchaseOrderStatus;
    }) => purchaseOrdersService.updateStatus(id, status),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PURCHASE_ORDERS });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.PURCHASE_ORDER(variables.id),
      });
    },
  });
}

// ==================== LOCATIONS ====================

export function useLocations() {
  return useQuery({
    queryKey: QUERY_KEYS.LOCATIONS,
    queryFn: async () => {
      const response = await apiClient.get<LocationsResponse>('/v1/locations');
      return response;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
