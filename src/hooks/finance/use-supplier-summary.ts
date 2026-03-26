import { financeEntriesService } from '@/services/finance';
import type { SupplierSummaryParams } from '@/types/finance';
import { useQuery } from '@tanstack/react-query';

const QUERY_KEY = 'supplier-summary';

export function useSupplierSummary(params: SupplierSummaryParams) {
  const hasAtLeastOneParam = !!(
    params.supplierName ||
    params.supplierId ||
    params.customerName ||
    params.customerId
  );

  return useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: () => financeEntriesService.getSupplierSummary(params),
    enabled: hasAtLeastOneParam,
    staleTime: 30_000,
  });
}
