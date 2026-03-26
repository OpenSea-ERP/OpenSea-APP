import { financeEntriesService } from '@/services/finance';
import type {
  CreatePixChargeData,
  CreatePixChargeResponse,
  PayViaPixData,
  PayViaPixResponse,
} from '@/types/finance';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// ============================================================================
// CREATE PIX CHARGE
// ============================================================================

export function useCreatePixCharge() {
  const queryClient = useQueryClient();

  return useMutation<
    CreatePixChargeResponse,
    Error,
    { entryId: string; data?: CreatePixChargeData }
  >({
    mutationFn: async ({ entryId, data }) => {
      return financeEntriesService.createPixCharge(entryId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-entries'] });
    },
  });
}

// ============================================================================
// PAY VIA PIX
// ============================================================================

export function usePayViaPix() {
  const queryClient = useQueryClient();

  return useMutation<
    PayViaPixResponse,
    Error,
    { entryId: string; data?: PayViaPixData }
  >({
    mutationFn: async ({ entryId, data }) => {
      return financeEntriesService.payViaPix(entryId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-entries'] });
    },
  });
}
