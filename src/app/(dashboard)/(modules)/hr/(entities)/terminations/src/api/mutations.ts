/**
 * OpenSea OS - Termination Mutations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { terminationsService } from '@/services/hr/terminations.service';
import type { Termination, CreateTerminationData } from '@/types/hr';
import { toast } from 'sonner';
import { translateError } from '@/lib/errors';
import { terminationKeys } from './keys';

/* ===========================================
   CREATE
   =========================================== */

export interface CreateTerminationOptions {
  onSuccess?: (termination: Termination) => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export function useCreateTermination(options: CreateTerminationOptions = {}) {
  const queryClient = useQueryClient();
  const {
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  return useMutation({
    mutationFn: async (data: CreateTerminationData): Promise<Termination> => {
      const response = await terminationsService.create(data);
      return response.termination;
    },
    onSuccess: termination => {
      queryClient.invalidateQueries({ queryKey: terminationKeys.lists() });
      if (showSuccessToast) {
        toast.success('Rescisão registrada com sucesso!');
      }
      onSuccess?.(termination);
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

export interface DeleteTerminationOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export function useDeleteTermination(options: DeleteTerminationOptions = {}) {
  const queryClient = useQueryClient();
  const {
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await terminationsService.delete(id);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: terminationKeys.lists() });
      queryClient.removeQueries({ queryKey: terminationKeys.detail(id) });
      if (showSuccessToast) {
        toast.success('Rescisão excluída com sucesso!');
      }
      onSuccess?.();
    },
    onError: (error: Error) => {
      if (showErrorToast) toast.error(translateError(error));
      onError?.(error);
    },
  });
}

/* ===========================================
   CALCULATE
   =========================================== */

export interface CalculateTerminationOptions {
  onSuccess?: (termination: Termination) => void;
  onError?: (error: Error) => void;
}

export function useCalculateTermination(
  options: CalculateTerminationOptions = {}
) {
  const queryClient = useQueryClient();
  const { onSuccess, onError } = options;

  return useMutation({
    mutationFn: async (id: string): Promise<Termination> => {
      const response = await terminationsService.calculate(id);
      return response.termination;
    },
    onSuccess: termination => {
      queryClient.invalidateQueries({ queryKey: terminationKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: terminationKeys.detail(termination.id),
      });
      toast.success('Verbas calculadas com sucesso!');
      onSuccess?.(termination);
    },
    onError: (error: Error) => {
      toast.error(translateError(error));
      onError?.(error);
    },
  });
}

/* ===========================================
   MARK AS PAID
   =========================================== */

export interface MarkAsPaidOptions {
  onSuccess?: (termination: Termination) => void;
  onError?: (error: Error) => void;
}

export function useMarkTerminationAsPaid(options: MarkAsPaidOptions = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, onError } = options;

  return useMutation({
    mutationFn: async (id: string): Promise<Termination> => {
      const response = await terminationsService.markAsPaid(id);
      return response.termination;
    },
    onSuccess: termination => {
      queryClient.invalidateQueries({ queryKey: terminationKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: terminationKeys.detail(termination.id),
      });
      toast.success('Rescisão marcada como paga!');
      onSuccess?.(termination);
    },
    onError: (error: Error) => {
      toast.error(translateError(error));
      onError?.(error);
    },
  });
}
