import {
  itemReservationsService,
  notificationPreferencesService,
  variantPromotionsService,
} from '@/services/sales';
import type {
  CreateItemReservationRequest,
  CreateNotificationPreferenceRequest,
  CreateVariantPromotionRequest,
  ReleaseItemReservationRequest,
  UpdateNotificationPreferenceRequest,
  UpdateVariantPromotionRequest,
} from '@/types/sales';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const QUERY_KEYS = {
  PROMOTIONS: ['variant-promotions'],
  PROMOTION: (id: string) => ['variant-promotions', id],
  RESERVATIONS: ['item-reservations'],
  RESERVATION: (id: string) => ['item-reservations', id],
  NOTIFICATIONS: ['notification-preferences'],
  NOTIFICATION: (id: string) => ['notification-preferences', id],
} as const;

// ==================== VARIANT PROMOTIONS ====================

export function useVariantPromotions() {
  return useQuery({
    queryKey: QUERY_KEYS.PROMOTIONS,
    queryFn: () => variantPromotionsService.listPromotions(),
  });
}

export function useVariantPromotion(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.PROMOTION(id),
    queryFn: () => variantPromotionsService.getPromotion(id),
    enabled: !!id,
  });
}

export function useCreateVariantPromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateVariantPromotionRequest) =>
      variantPromotionsService.createPromotion(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PROMOTIONS });
    },
  });
}

export function useUpdateVariantPromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateVariantPromotionRequest;
    }) => variantPromotionsService.updatePromotion(id, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PROMOTIONS });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.PROMOTION(variables.id),
      });
    },
  });
}

export function useDeleteVariantPromotion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => variantPromotionsService.deletePromotion(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PROMOTIONS });
    },
  });
}

// ==================== ITEM RESERVATIONS ====================

export function useItemReservations() {
  return useQuery({
    queryKey: QUERY_KEYS.RESERVATIONS,
    queryFn: () => itemReservationsService.listReservations(),
  });
}

export function useItemReservation(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.RESERVATION(id),
    queryFn: () => itemReservationsService.getReservation(id),
    enabled: !!id,
  });
}

export function useCreateItemReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateItemReservationRequest) =>
      itemReservationsService.createReservation(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.RESERVATIONS });
    },
  });
}

export function useReleaseItemReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: ReleaseItemReservationRequest;
    }) => itemReservationsService.releaseReservation(id, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.RESERVATIONS });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.RESERVATION(variables.id),
      });
    },
  });
}

// ==================== NOTIFICATION PREFERENCES ====================

export function useNotificationPreferences() {
  return useQuery({
    queryKey: QUERY_KEYS.NOTIFICATIONS,
    queryFn: () => notificationPreferencesService.listPreferences(),
  });
}

export function useNotificationPreference(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.NOTIFICATION(id),
    queryFn: () => notificationPreferencesService.getPreference(id),
    enabled: !!id,
  });
}

export function useCreateNotificationPreference() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateNotificationPreferenceRequest) =>
      notificationPreferencesService.createPreference(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS });
    },
  });
}

export function useUpdateNotificationPreference() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateNotificationPreferenceRequest;
    }) => notificationPreferencesService.updatePreference(id, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.NOTIFICATION(variables.id),
      });
    },
  });
}

export function useDeleteNotificationPreference() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      notificationPreferencesService.deletePreference(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS });
    },
  });
}
