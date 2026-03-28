/**
 * OpenSea OS - Payroll Mutations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { payrollService } from '@/services/hr/payroll.service';
import type { Payroll, CreatePayrollData } from '@/types/hr';
import { toast } from 'sonner';
import { translateError } from '@/lib/errors';
import { payrollKeys } from './keys';

/* ===========================================
   CREATE
   =========================================== */

export interface CreatePayrollOptions {
  onSuccess?: (payroll: Payroll) => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export function useCreatePayroll(options: CreatePayrollOptions = {}) {
  const queryClient = useQueryClient();
  const {
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  return useMutation({
    mutationFn: async (data: CreatePayrollData): Promise<Payroll> => {
      const response = await payrollService.create(data);
      return response.payroll;
    },
    onSuccess: payroll => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.all });
      if (showSuccessToast) {
        toast.success('Folha de pagamento criada!');
      }
      onSuccess?.(payroll);
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

export interface CalculatePayrollOptions {
  onSuccess?: (payroll: Payroll) => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export function useCalculatePayroll(options: CalculatePayrollOptions = {}) {
  const queryClient = useQueryClient();
  const {
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  return useMutation({
    mutationFn: async (id: string): Promise<Payroll> => {
      const response = await payrollService.calculate(id);
      return response.payroll;
    },
    onSuccess: payroll => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.all });
      if (showSuccessToast) {
        toast.success('Folha calculada!');
      }
      onSuccess?.(payroll);
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

export interface ApprovePayrollOptions {
  onSuccess?: (payroll: Payroll) => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export function useApprovePayroll(options: ApprovePayrollOptions = {}) {
  const queryClient = useQueryClient();
  const {
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  return useMutation({
    mutationFn: async (id: string): Promise<Payroll> => {
      const response = await payrollService.approve(id);
      return response.payroll;
    },
    onSuccess: payroll => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.all });
      if (showSuccessToast) {
        toast.success('Folha aprovada!');
      }
      onSuccess?.(payroll);
    },
    onError: (error: Error) => {
      if (showErrorToast) toast.error(translateError(error));
      onError?.(error);
    },
  });
}

/* ===========================================
   PAY
   =========================================== */

export interface PayPayrollOptions {
  onSuccess?: (payroll: Payroll) => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export function usePayPayroll(options: PayPayrollOptions = {}) {
  const queryClient = useQueryClient();
  const {
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  return useMutation({
    mutationFn: async (id: string): Promise<Payroll> => {
      const response = await payrollService.pay(id);
      return response.payroll;
    },
    onSuccess: payroll => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.all });
      if (showSuccessToast) {
        toast.success('Pagamento realizado!');
      }
      onSuccess?.(payroll);
    },
    onError: (error: Error) => {
      if (showErrorToast) toast.error(translateError(error));
      onError?.(error);
    },
  });
}

/* ===========================================
   CANCEL
   =========================================== */

export interface CancelPayrollOptions {
  onSuccess?: (payroll: Payroll) => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export function useCancelPayroll(options: CancelPayrollOptions = {}) {
  const queryClient = useQueryClient();
  const {
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  return useMutation({
    mutationFn: async (id: string): Promise<Payroll> => {
      const response = await payrollService.cancel(id);
      return response.payroll;
    },
    onSuccess: payroll => {
      queryClient.invalidateQueries({ queryKey: payrollKeys.all });
      if (showSuccessToast) {
        toast.success('Folha cancelada!');
      }
      onSuccess?.(payroll);
    },
    onError: (error: Error) => {
      if (showErrorToast) toast.error(translateError(error));
      onError?.(error);
    },
  });
}
