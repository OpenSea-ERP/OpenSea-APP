/**
 * React Query hooks for the HR contract signature bridge.
 *
 * Backend endpoints:
 *   POST   /v1/hr/contracts/:id/signature
 *   GET    /v1/hr/contracts/:id/signature
 *   DELETE /v1/hr/contracts/:id/signature
 *   GET    /v1/hr/employees/:employeeId/contracts
 */

import {
  hrContractsService,
  type RequestContractSignaturePayload,
} from '@/services/hr/contracts.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const HR_CONTRACT_KEYS = {
  all: ['hr', 'contracts'] as const,
  byEmployee: (employeeId: string) =>
    ['hr', 'contracts', 'by-employee', employeeId] as const,
  signatureStatus: (contractId: string) =>
    ['hr', 'contracts', 'signature-status', contractId] as const,
} as const;

export function useEmployeeContracts(employeeId: string) {
  return useQuery({
    queryKey: HR_CONTRACT_KEYS.byEmployee(employeeId),
    queryFn: () => hrContractsService.listByEmployee(employeeId),
    enabled: !!employeeId,
  });
}

export function useContractSignatureStatus(
  contractId: string,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: HR_CONTRACT_KEYS.signatureStatus(contractId),
    queryFn: () => hrContractsService.getSignatureStatus(contractId),
    enabled: !!contractId && (options?.enabled ?? true),
  });
}

export function useRequestContractSignature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      contractId,
      data,
    }: {
      contractId: string;
      data?: RequestContractSignaturePayload;
    }) => hrContractsService.requestSignature(contractId, data),
    onSuccess: async (_result, variables) => {
      await queryClient.invalidateQueries({
        queryKey: HR_CONTRACT_KEYS.signatureStatus(variables.contractId),
      });
      await queryClient.invalidateQueries({
        queryKey: HR_CONTRACT_KEYS.all,
      });
    },
  });
}

export function useCancelContractSignature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      contractId,
      reason,
    }: {
      contractId: string;
      reason?: string;
    }) => hrContractsService.cancelSignature(contractId, reason),
    onSuccess: async (_result, variables) => {
      await queryClient.invalidateQueries({
        queryKey: HR_CONTRACT_KEYS.signatureStatus(variables.contractId),
      });
      await queryClient.invalidateQueries({
        queryKey: HR_CONTRACT_KEYS.all,
      });
    },
  });
}
