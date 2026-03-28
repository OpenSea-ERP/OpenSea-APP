/**
 * OpenSea OS - Department Mutations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentsService } from '@/services/hr/departments.service';
import type {
  Department,
  CreateDepartmentData,
  UpdateDepartmentData,
} from '@/types/hr';
import { toast } from 'sonner';
import { translateError } from '@/lib/errors';
import { departmentKeys } from './keys';

/* ===========================================
   CREATE
   =========================================== */

export interface CreateDepartmentOptions {
  onSuccess?: (department: Department) => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export function useCreateDepartment(options: CreateDepartmentOptions = {}) {
  const queryClient = useQueryClient();
  const {
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  return useMutation({
    mutationFn: async (data: CreateDepartmentData): Promise<Department> => {
      const response = await departmentsService.createDepartment(data);
      return response.department;
    },
    onSuccess: department => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.all });
      if (showSuccessToast) {
        toast.success(`Departamento "${department.name}" criado com sucesso!`);
      }
      onSuccess?.(department);
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

export interface UpdateDepartmentVariables {
  id: string;
  data: UpdateDepartmentData;
}

export interface UpdateDepartmentOptions {
  onSuccess?: (department: Department) => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export function useUpdateDepartment(options: UpdateDepartmentOptions = {}) {
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
    }: UpdateDepartmentVariables): Promise<Department> => {
      const response = await departmentsService.updateDepartment(id, data);
      return response.department;
    },
    onSuccess: (department, { id }) => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.all });
      queryClient.invalidateQueries({ queryKey: departmentKeys.detail(id) });
      if (showSuccessToast) {
        toast.success(`Departamento "${department.name}" atualizado!`);
      }
      onSuccess?.(department);
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

export interface DeleteDepartmentOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export function useDeleteDepartment(options: DeleteDepartmentOptions = {}) {
  const queryClient = useQueryClient();
  const {
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await departmentsService.deleteDepartment(id);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: departmentKeys.all });
      queryClient.removeQueries({ queryKey: departmentKeys.detail(id) });
      if (showSuccessToast) {
        toast.success('Departamento excluído com sucesso!');
      }
      onSuccess?.();
    },
    onError: (error: Error) => {
      if (showErrorToast) toast.error(translateError(error));
      onError?.(error);
    },
  });
}
