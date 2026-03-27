/**
 * OpenSea OS - Admissions Query Keys
 */

export interface AdmissionFilters {
  status?: string;
  search?: string;
  page?: number;
  perPage?: number;
}

export const admissionKeys = {
  all: ['admissions'] as const,
  lists: () => [...admissionKeys.all, 'list'] as const,
  list: (filters?: AdmissionFilters) =>
    [...admissionKeys.lists(), filters ?? {}] as const,
  details: () => [...admissionKeys.all, 'detail'] as const,
  detail: (id: string) => [...admissionKeys.details(), id] as const,
} as const;

export default admissionKeys;
