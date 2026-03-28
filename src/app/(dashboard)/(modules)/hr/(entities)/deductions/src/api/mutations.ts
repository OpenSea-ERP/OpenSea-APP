/**
 * OpenSea OS - Deduction Mutations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deductionsService } from '@/services/hr/deductions.service';
import type { UpdateDeductionRequest } from '@/services/hr/deductions.service';
import type { Deduction, CreateDeductionData } from '@/types/hr';
import { toast } from 'sonner';
import { translateError } from '@/lib/errors';
import { deductionKeys } from './keys';

/* ===========================================
   CREATE
   =========================================== */

export interface CreateDeductionOptions {
  onSuccess?: (deduction: Deduction) => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export function useCreateDeduction(options: CreateDeductionOptions = {}) {
  const queryClient = useQueryClient();
  const {
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  return useMutation({
    mutationFn: async (data: CreateDeductionData): Promise<Deduction> => {
      const response = await deductionsService.create(data);
      return response.deduction;
    },
    onSuccess: deduction => {
      queryClient.invalidateQueries({ queryKey: deductionKeys.all });
      if (showSuccessToast) {
        toast.success(`Dedução "${deduction.name}" criada com sucesso!`);
      }
      onSuccess?.(deduction);
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

export interface UpdateDeductionOptions {
  onSuccess?: (deduction: Deduction) => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export function useUpdateDeduction(options: UpdateDeductionOptions = {}) {
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
      data: UpdateDeductionRequest;
    }): Promise<Deduction> => {
      const response = await deductionsService.update(id, data);
      return response.deduction;
    },
    onSuccess: deduction => {
      queryClient.invalidateQueries({ queryKey: deductionKeys.all });
      queryClient.invalidateQueries({
        queryKey: deductionKeys.detail(deduction.id),
      });
      if (showSuccessToast) {
        toast.success(`Dedução "${deduction.name}" atualizada com sucesso!`);
      }
      onSuccess?.(deduction);
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

export interface DeleteDeductionOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export function useDeleteDeduction(options: DeleteDeductionOptions = {}) {
  const queryClient = useQueryClient();
  const {
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await deductionsService.delete(id);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: deductionKeys.all });
      queryClient.removeQueries({ queryKey: deductionKeys.detail(id) });
      if (showSuccessToast) {
        toast.success('Dedução excluída com sucesso!');
      }
      onSuccess?.();
    },
    onError: (error: Error) => {
      if (showErrorToast) toast.error(translateError(error));
      onError?.(error);
    },
  });
}
