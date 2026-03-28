/**
 * OpenSea OS - Geofence Zones Mutations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  CreateGeofenceZoneData,
  UpdateGeofenceZoneData,
} from '@/types/hr';
import { toast } from 'sonner';
import { translateError } from '@/lib/errors';
import { geofenceZoneKeys } from './keys';
import { geofenceZonesApi } from './geofence-zones.api';

/* ===========================================
   CREATE
   =========================================== */

export function useCreateGeofenceZone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateGeofenceZoneData) => {
      return geofenceZonesApi.create(data);
    },
    onSuccess: zone => {
      queryClient.invalidateQueries({ queryKey: geofenceZoneKeys.all });
      toast.success(`Zona "${zone.name}" criada com sucesso!`);
    },
    onError: (error: Error) => {
      toast.error(translateError(error));
    },
  });
}

/* ===========================================
   UPDATE
   =========================================== */

export interface UpdateGeofenceZoneVariables {
  id: string;
  data: UpdateGeofenceZoneData;
}

export function useUpdateGeofenceZone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: UpdateGeofenceZoneVariables) => {
      return geofenceZonesApi.update(id, data);
    },
    onSuccess: (zone, { id }) => {
      queryClient.invalidateQueries({ queryKey: geofenceZoneKeys.all });
      queryClient.invalidateQueries({ queryKey: geofenceZoneKeys.detail(id) });
      toast.success(`Zona "${zone.name}" atualizada com sucesso!`);
    },
    onError: (error: Error) => {
      toast.error(translateError(error));
    },
  });
}

/* ===========================================
   DELETE
   =========================================== */

export function useDeleteGeofenceZone() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await geofenceZonesApi.delete(id);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: geofenceZoneKeys.all });
      queryClient.removeQueries({ queryKey: geofenceZoneKeys.detail(id) });
      toast.success('Zona de geofencing excluída com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(translateError(error));
    },
  });
}
