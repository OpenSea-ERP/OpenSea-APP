/**
 * OpenSea OS - Employee Requests Mutations (HR)
 *
 * Hooks de mutacao para operacoes de solicitacoes do colaborador.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { EmployeeRequest, CreateEmployeeRequestData } from '@/types/hr';
import { toast } from 'sonner';
import { translateError } from '@/lib/errors';
import { requestsApi } from './requests.api';
import { requestKeys } from './keys';

/* ===========================================
   CREATE REQUEST
   =========================================== */

export function useCreateRequest(options?: {
  onSuccess?: (request: EmployeeRequest) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: CreateEmployeeRequestData
    ): Promise<EmployeeRequest> => {
      const response = await requestsApi.create(data);
      return response.employeeRequest;
    },

    onSuccess: (request) => {
      queryClient.invalidateQueries({ queryKey: requestKeys.all });
      toast.success('Solicitação criada com sucesso!');
      options?.onSuccess?.(request);
    },

    onError: (error: Error) => {
      toast.error(translateError(error));
      options?.onError?.(error);
    },
  });
}

/* ===========================================
   APPROVE REQUEST
   =========================================== */

export function useApproveRequest(options?: {
  onSuccess?: (request: EmployeeRequest) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<EmployeeRequest> => {
      const response = await requestsApi.approve(id);
      return response.employeeRequest;
    },

    onSuccess: (request) => {
      queryClient.invalidateQueries({ queryKey: requestKeys.all });
      queryClient.invalidateQueries({
        queryKey: requestKeys.detail(request.id),
      });
      toast.success('Solicitação aprovada com sucesso!');
      options?.onSuccess?.(request);
    },

    onError: (error: Error) => {
      toast.error(translateError(error));
      options?.onError?.(error);
    },
  });
}

/* ===========================================
   REJECT REQUEST
   =========================================== */

export function useRejectRequest(options?: {
  onSuccess?: (request: EmployeeRequest) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      reason,
    }: {
      id: string;
      reason: string;
    }): Promise<EmployeeRequest> => {
      const response = await requestsApi.reject(id, reason);
      return response.employeeRequest;
    },

    onSuccess: (request) => {
      queryClient.invalidateQueries({ queryKey: requestKeys.all });
      queryClient.invalidateQueries({
        queryKey: requestKeys.detail(request.id),
      });
      toast.success('Solicitação rejeitada.');
      options?.onSuccess?.(request);
    },

    onError: (error: Error) => {
      toast.error(translateError(error));
      options?.onError?.(error);
    },
  });
}

/* ===========================================
   CANCEL REQUEST
   =========================================== */

export function useCancelRequest(options?: {
  onSuccess?: (request: EmployeeRequest) => void;
  onError?: (error: Error) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<EmployeeRequest> => {
      const response = await requestsApi.cancel(id);
      return response.employeeRequest;
    },

    onSuccess: (request) => {
      queryClient.invalidateQueries({ queryKey: requestKeys.all });
      queryClient.invalidateQueries({
        queryKey: requestKeys.detail(request.id),
      });
      toast.success('Solicitação cancelada.');
      options?.onSuccess?.(request);
    },

    onError: (error: Error) => {
      toast.error(translateError(error));
      options?.onError?.(error);
    },
  });
}
