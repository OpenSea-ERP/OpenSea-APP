/**
 * OpenSea OS - Dependant Mutations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { dependantsService } from '@/services/hr/dependants.service';
import type { EmployeeDependant, CreateDependantData } from '@/types/hr';
import { toast } from 'sonner';
import { translateError } from '@/lib/error-messages';
import { dependantKeys } from './keys';

/* ===========================================
   CREATE
   =========================================== */

export interface CreateDependantMutationData extends CreateDependantData {
  employeeId: string;
}

export interface CreateDependantOptions {
  onSuccess?: (dependant: EmployeeDependant) => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export function useCreateDependant(options: CreateDependantOptions = {}) {
  const queryClient = useQueryClient();
  const {
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  return useMutation({
    mutationFn: async (
      data: CreateDependantMutationData
    ): Promise<EmployeeDependant> => {
      const { employeeId, ...dependantData } = data;
      const response = await dependantsService.create(
        employeeId,
        dependantData
      );
      return response.dependant;
    },
    onSuccess: dependant => {
      queryClient.invalidateQueries({ queryKey: dependantKeys.all });
      if (showSuccessToast) {
        toast.success(`Dependente "${dependant.name}" cadastrado com sucesso!`);
      }
      onSuccess?.(dependant);
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

export interface UpdateDependantMutationData {
  employeeId: string;
  dependantId: string;
  data: import('@/types/hr').UpdateDependantData;
}

export interface UpdateDependantOptions {
  onSuccess?: (dependant: EmployeeDependant) => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export function useUpdateDependant(options: UpdateDependantOptions = {}) {
  const queryClient = useQueryClient();
  const {
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  return useMutation({
    mutationFn: async (
      variables: UpdateDependantMutationData
    ): Promise<EmployeeDependant> => {
      const response = await dependantsService.update(
        variables.employeeId,
        variables.dependantId,
        variables.data
      );
      return response.dependant;
    },
    onSuccess: (dependant, variables) => {
      queryClient.invalidateQueries({ queryKey: dependantKeys.all });
      queryClient.invalidateQueries({
        queryKey: dependantKeys.detail(variables.dependantId),
      });
      if (showSuccessToast) {
        toast.success(`Dependente "${dependant.name}" atualizado com sucesso!`);
      }
      onSuccess?.(dependant);
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

export interface DeleteDependantMutationData {
  employeeId: string;
  dependantId: string;
}

export interface DeleteDependantOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export function useDeleteDependant(options: DeleteDependantOptions = {}) {
  const queryClient = useQueryClient();
  const {
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  return useMutation({
    mutationFn: async (data: DeleteDependantMutationData): Promise<void> => {
      await dependantsService.delete(data.employeeId, data.dependantId);
    },
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({ queryKey: dependantKeys.all });
      queryClient.removeQueries({
        queryKey: dependantKeys.detail(data.dependantId),
      });
      if (showSuccessToast) {
        toast.success('Dependente excluído com sucesso!');
      }
      onSuccess?.();
    },
    onError: (error: Error) => {
      if (showErrorToast) toast.error(translateError(error));
      onError?.(error);
    },
  });
}
