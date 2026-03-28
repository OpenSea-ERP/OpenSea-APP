/**
 * OpenSea OS - Overtime Mutations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { overtimeService } from '@/services/hr/overtime.service';
import type {
  Overtime,
  CreateOvertimeData,
  ApproveOvertimeData,
} from '@/types/hr';
import { toast } from 'sonner';
import { translateError } from '@/lib/errors';
import { overtimeKeys } from './keys';

/* ===========================================
   CREATE
   =========================================== */

export interface CreateOvertimeOptions {
  onSuccess?: (overtime: Overtime) => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export function useCreateOvertime(options: CreateOvertimeOptions = {}) {
  const queryClient = useQueryClient();
  const {
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  return useMutation({
    mutationFn: async (data: CreateOvertimeData): Promise<Overtime> => {
      const response = await overtimeService.create(data);
      return response.overtime;
    },
    onSuccess: overtime => {
      queryClient.invalidateQueries({ queryKey: overtimeKeys.all });
      if (showSuccessToast) {
        toast.success('Hora extra registrada com sucesso!');
      }
      onSuccess?.(overtime);
    },
    onError: (error: Error) => {
      if (showErrorToast) toast.error(translateError(error));
      onError?.(error);
    },
  });
}

/* ===========================================
   APPROVE
   =========================================== */

export interface ApproveOvertimeOptions {
  onSuccess?: (overtime: Overtime) => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export function useApproveOvertime(options: ApproveOvertimeOptions = {}) {
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
    }: {
      id: string;
      data?: ApproveOvertimeData;
    }): Promise<Overtime> => {
      const response = await overtimeService.approve(id, data);
      return response.overtime;
    },
    onSuccess: overtime => {
      queryClient.invalidateQueries({ queryKey: overtimeKeys.all });
      if (showSuccessToast) {
        toast.success('Hora extra aprovada!');
      }
      onSuccess?.(overtime);
    },
    onError: (error: Error) => {
      if (showErrorToast) toast.error(translateError(error));
      onError?.(error);
    },
  });
}
