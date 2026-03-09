import { apiClient } from '@/lib/api-client';
import type { Company } from '@/types/hr';
import { useQuery } from '@tanstack/react-query';

export interface AdminCompaniesQuery {
  page?: number;
  perPage?: number;
  search?: string;
  includeDeleted?: boolean;
}

const QUERY_KEYS = {
  ADMIN_COMPANIES: ['admin-companies'],
} as const;

async function fetchAdminCompanies(params?: AdminCompaniesQuery) {
  const query = new URLSearchParams({
    page: String(params?.page ?? 1),
    perPage: String(params?.perPage ?? 100),
    includeDeleted: String(params?.includeDeleted ?? false),
  });

  if (params?.search) query.append('search', params.search);

  const response = await apiClient.get<Company[]>(
    `/v1/admin/companies?${query.toString()}`
  );

  // Backend returns raw array
  const companies = Array.isArray(response) ? response : [];

  return { companies };
}

export function useAdminCompanies(params?: AdminCompaniesQuery) {
  return useQuery({
    queryKey: [...QUERY_KEYS.ADMIN_COMPANIES, params],
    queryFn: () => fetchAdminCompanies(params),
  });
}
