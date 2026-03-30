/**
 * OpenSea OS - Finance Compliance Hooks
 *
 * React Query hooks para funcionalidades de compliance fiscal.
 */

import { complianceService } from '@/services/finance';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// =============================================================================
// QUERY KEYS
// =============================================================================

const QUERY_KEYS = {
  SIMPLES_NACIONAL: (year: number) => ['compliance', 'simples-nacional', year],
  TAX_CALENDAR: (year: number, month: number) => [
    'compliance',
    'tax-calendar',
    year,
    month,
  ],
} as const;

export { QUERY_KEYS as complianceKeys };

// =============================================================================
// QUERIES
// =============================================================================

export function useSimplesNacional(year: number) {
  return useQuery({
    queryKey: QUERY_KEYS.SIMPLES_NACIONAL(year),
    queryFn: () => complianceService.getSimplesNacional(year),
  });
}

export function useTaxCalendar(year: number, month: number) {
  return useQuery({
    queryKey: QUERY_KEYS.TAX_CALENDAR(year, month),
    queryFn: () => complianceService.getTaxCalendar(year, month),
  });
}

// =============================================================================
// MUTATIONS
// =============================================================================

export function useGenerateDarfs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { month: number; year: number }) =>
      complianceService.generateDarfs(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.TAX_CALENDAR(variables.year, variables.month),
      });
    },
  });
}

export function usePayObligation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => complianceService.payObligation(id),
    onSuccess: () => {
      // Invalidate all tax calendar queries
      queryClient.invalidateQueries({
        queryKey: ['compliance', 'tax-calendar'],
      });
    },
  });
}

export function useExportSpedEcd() {
  return useMutation({
    mutationFn: (year: number) => complianceService.exportSpedEcd(year),
  });
}
