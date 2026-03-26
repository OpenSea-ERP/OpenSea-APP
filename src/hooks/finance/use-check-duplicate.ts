import { useMutation } from '@tanstack/react-query';
import { financeEntriesService } from '@/services/finance/finance-entries.service';
import type {
  CheckDuplicateData,
  CheckDuplicateResponse,
} from '@/types/finance';

export function useCheckDuplicate() {
  return useMutation<CheckDuplicateResponse, Error, CheckDuplicateData>({
    mutationFn: data => financeEntriesService.checkDuplicate(data),
  });
}
