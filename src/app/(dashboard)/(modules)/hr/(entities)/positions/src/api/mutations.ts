/**
 * OpenSea OS - Position Mutations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { positionsService } from '@/services/hr/positions.service';
import type {
  Position,
  CreatePositionData,
  UpdatePositionData,
} from '@/types/hr';
import { toast } from 'sonner';
import { translateError } from '@/lib/errors';
import { positionKeys } from './keys';

/* ===========================================
   CREATE
   =========================================== */

export interface CreatePositionOptions {
  onSuccess?: (position: Position) => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export function useCreatePosition(options: CreatePositionOptions = {}) {
  const queryClient = useQueryClient();
  const {
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  return useMutation({
    mutationFn: async (data: CreatePositionData): Promise<Position> => {
      const response = await positionsService.createPosition(data);
      return response.position;
    },
    onSuccess: position => {
      queryClient.invalidateQueries({ queryKey: positionKeys.all });
      if (showSuccessToast) {
        toast.success(`Cargo "${position.name}" criado com sucesso!`);
      }
      onSuccess?.(position);
    },
    onError: (error: Error) => {
      if (showErrorToast) toast.error(translateError(error));
      onError?.(error);
    },
  });
}

/* ===========================================
   UPDATE
   =========================================== */

export interface UpdatePositionVariables {
  id: string;
  data: UpdatePositionData;
}

export interface UpdatePositionOptions {
  onSuccess?: (position: Position) => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export function useUpdatePosition(options: UpdatePositionOptions = {}) {
  const queryClient = useQueryClient();
  const {
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: UpdatePositionVariables): Promise<Position> => {
      const response = await positionsService.updatePosition(id, data);
      return response.position;
    },
    onSuccess: (position, { id }) => {
      queryClient.invalidateQueries({ queryKey: positionKeys.all });
      queryClient.invalidateQueries({ queryKey: positionKeys.detail(id) });
      if (showSuccessToast) {
        toast.success(`Cargo "${position.name}" atualizado!`);
      }
      onSuccess?.(position);
    },
    onError: (error: Error) => {
      if (showErrorToast) toast.error(translateError(error));
      onError?.(error);
    },
  });
}

/* ===========================================
   DELETE
   =========================================== */

export interface DeletePositionOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export function useDeletePosition(options: DeletePositionOptions = {}) {
  const queryClient = useQueryClient();
  const {
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await positionsService.deletePosition(id);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: positionKeys.all });
      queryClient.removeQueries({ queryKey: positionKeys.detail(id) });
      if (showSuccessToast) {
        toast.success('Cargo excluído com sucesso!');
      }
      onSuccess?.();
    },
    onError: (error: Error) => {
      if (showErrorToast) toast.error(translateError(error));
      onError?.(error);
    },
  });
}
