/**
 * OpenSea OS - Terminations Query Keys
 */

export interface TerminationFilters {
  employeeId?: string;
  type?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  perPage?: number;
}

export const terminationKeys = {
  all: ['terminations'] as const,
  lists: () => [...terminationKeys.all, 'list'] as const,
  list: (filters?: TerminationFilters) =>
    [...terminationKeys.lists(), filters ?? {}] as const,
  details: () => [...terminationKeys.all, 'detail'] as const,
  detail: (id: string) => [...terminationKeys.details(), id] as const,
} as const;

export default terminationKeys;
