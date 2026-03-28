/**
 * OpenSea OS - Employee Mutations
 */

import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from '@tanstack/react-query';
import {
  employeesService,
  type CreateEmployeeRequest,
  type UpdateEmployeeRequest,
} from '@/services/hr/employees.service';
import type { Employee } from '@/types/hr';
import { toast } from 'sonner';
import { employeeKeys } from './keys';

/* ===========================================
   CREATE EMPLOYEE
   =========================================== */

export type CreateEmployeeData = CreateEmployeeRequest;

export interface CreateEmployeeOptions {
  onSuccess?: (employee: Employee) => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
}

export function useCreateEmployee(options: CreateEmployeeOptions = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, onError, showSuccessToast = true } = options;

  return useMutation({
    mutationFn: async (data: CreateEmployeeData): Promise<Employee> => {
      const response = await employeesService.createEmployee(data);
      return response.employee;
    },

    onSuccess: employee => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });

      if (showSuccessToast) {
        toast.success(`Funcionário "${employee.fullName}" criado com sucesso!`);
      }

      onSuccess?.(employee);
    },

    onError: (error: Error) => {
      toast.error('Erro ao criar funcionário', {
        description: error.message,
      });
      onError?.(error);
    },
  });
}

/* ===========================================
   CREATE EMPLOYEE WITH USER
   =========================================== */

export interface CreateEmployeeWithUserData extends CreateEmployeeRequest {
  permissionGroupId?: string;
  userEmail?: string;
  userPassword?: string;
}

export interface CreateEmployeeWithUserOptions {
  onSuccess?: (employee: Employee) => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
}

export function useCreateEmployeeWithUser(
  options: CreateEmployeeWithUserOptions = {}
) {
  const queryClient = useQueryClient();
  const { onSuccess, onError, showSuccessToast = true } = options;

  return useMutation({
    mutationFn: async (data: CreateEmployeeWithUserData): Promise<Employee> => {
      const response = await employeesService.createEmployeeWithUser(data);
      return response.employee;
    },

    onSuccess: employee => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });

      if (showSuccessToast) {
        toast.success(`Funcionário "${employee.fullName}" criado com usuário!`);
      }

      onSuccess?.(employee);
    },

    onError: (error: Error) => {
      toast.error('Erro ao criar funcionário com usuário', {
        description: error.message,
      });
      onError?.(error);
    },
  });
}

/* ===========================================
   UPDATE EMPLOYEE
   =========================================== */

export interface UpdateEmployeeVariables {
  id: string;
  data: UpdateEmployeeRequest;
}

export interface UpdateEmployeeOptions {
  onSuccess?: (employee: Employee) => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
}

export function useUpdateEmployee(options: UpdateEmployeeOptions = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, onError, showSuccessToast = true } = options;

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: UpdateEmployeeVariables): Promise<Employee> => {
      const response = await employeesService.updateEmployee(id, data);
      return response.employee;
    },

    onSuccess: employee => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });
      queryClient.invalidateQueries({
        queryKey: employeeKeys.detail(employee.id),
      });

      if (showSuccessToast) {
        toast.success(`Funcionário "${employee.fullName}" atualizado!`);
      }

      onSuccess?.(employee);
    },

    onError: (error: Error) => {
      toast.error('Erro ao atualizar funcionário', {
        description: error.message,
      });
      onError?.(error);
    },
  });
}

/* ===========================================
   DELETE EMPLOYEE
   =========================================== */

export interface DeleteEmployeeOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
}

export function useDeleteEmployee(options: DeleteEmployeeOptions = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, onError, showSuccessToast = true } = options;

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await employeesService.deleteEmployee(id);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.all });

      if (showSuccessToast) {
        toast.success('Funcionário removido com sucesso!');
      }

      onSuccess?.();
    },

    onError: (error: Error) => {
      toast.error('Erro ao remover funcionário', {
        description: error.message,
      });
      onError?.(error);
    },
  });
}

/* ===========================================
   CREATE USER FOR EMPLOYEE
   =========================================== */

export interface CreateUserForEmployeeVariables {
  employeeId: string;
  email: string;
  password: string;
  permissionGroupId: string;
}

export interface CreateUserForEmployeeOptions {
  onSuccess?: (employee: Employee) => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
}

export function useCreateUserForEmployee(
  options: CreateUserForEmployeeOptions = {}
) {
  const queryClient = useQueryClient();
  const { onSuccess, onError, showSuccessToast = true } = options;

  return useMutation({
    mutationFn: async ({
      employeeId,
      ...data
    }: CreateUserForEmployeeVariables): Promise<Employee> => {
      const response = await employeesService.createUserForEmployee(
        employeeId,
        data
      );
      return response.employee;
    },

    onSuccess: employee => {
      queryClient.invalidateQueries({
        queryKey: employeeKeys.detail(employee.id),
      });

      if (showSuccessToast) {
        toast.success(`Usuário criado para "${employee.fullName}"!`);
      }

      onSuccess?.(employee);
    },

    onError: (error: Error) => {
      toast.error('Erro ao criar usuário para funcionário', {
        description: error.message,
      });
      onError?.(error);
    },
  });
}
