/**
 * OpenSea OS - Time Bank Mutations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { timeBankService } from '@/services/hr/time-bank.service';
import type { TimeBank } from '@/types/hr';
import type {
  CreditDebitTimeBankRequest,
  AdjustTimeBankRequest,
} from '@/services/hr/time-bank.service';
import { toast } from 'sonner';
import { translateError } from '@/lib/errors';
import { timeBankKeys } from './keys';

/* ===========================================
   CREDIT
   =========================================== */

export interface CreditTimeBankOptions {
  onSuccess?: (timeBank: TimeBank) => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export function useCreditTimeBank(options: CreditTimeBankOptions = {}) {
  const queryClient = useQueryClient();
  const {
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  return useMutation({
    mutationFn: async (data: CreditDebitTimeBankRequest): Promise<TimeBank> => {
      const response = await timeBankService.credit(data);
      return response.timeBank;
    },
    onSuccess: timeBank => {
      queryClient.invalidateQueries({ queryKey: timeBankKeys.all });
      if (showSuccessToast) {
        toast.success('Horas creditadas com sucesso!');
      }
      onSuccess?.(timeBank);
    },
    onError: (error: Error) => {
      if (showErrorToast) toast.error(translateError(error));
      onError?.(error);
    },
  });
}

/* ===========================================
   DEBIT
   =========================================== */

export interface DebitTimeBankOptions {
  onSuccess?: (timeBank: TimeBank) => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export function useDebitTimeBank(options: DebitTimeBankOptions = {}) {
  const queryClient = useQueryClient();
  const {
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  return useMutation({
    mutationFn: async (data: CreditDebitTimeBankRequest): Promise<TimeBank> => {
      const response = await timeBankService.debit(data);
      return response.timeBank;
    },
    onSuccess: timeBank => {
      queryClient.invalidateQueries({ queryKey: timeBankKeys.all });
      if (showSuccessToast) {
        toast.success('Horas debitadas com sucesso!');
      }
      onSuccess?.(timeBank);
    },
    onError: (error: Error) => {
      if (showErrorToast) toast.error(translateError(error));
      onError?.(error);
    },
  });
}

/* ===========================================
   ADJUST
   =========================================== */

export interface AdjustTimeBankOptions {
  onSuccess?: (timeBank: TimeBank) => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export function useAdjustTimeBank(options: AdjustTimeBankOptions = {}) {
  const queryClient = useQueryClient();
  const {
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  return useMutation({
    mutationFn: async (data: AdjustTimeBankRequest): Promise<TimeBank> => {
      const response = await timeBankService.adjust(data);
      return response.timeBank;
    },
    onSuccess: timeBank => {
      queryClient.invalidateQueries({ queryKey: timeBankKeys.all });
      if (showSuccessToast) {
        toast.success('Saldo ajustado com sucesso!');
      }
      onSuccess?.(timeBank);
    },
    onError: (error: Error) => {
      if (showErrorToast) toast.error(translateError(error));
      onError?.(error);
    },
  });
}
