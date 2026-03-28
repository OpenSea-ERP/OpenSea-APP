/**
 * OpenSea OS - List Employees Query (Infinite Scroll)
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { employeesService } from '@/services/hr/employees.service';
import type { Employee } from '@/types/hr';
import { employeeKeys, type EmployeeFilters } from './keys';

export type ListEmployeesParams = Omit<EmployeeFilters, 'page' | 'perPage'>;

const PAGE_SIZE = 20;

export function useListEmployees(params?: ListEmployeesParams) {
  const result = useInfiniteQuery({
    queryKey: employeeKeys.list(params),

    queryFn: async ({ pageParam = 1 }) => {
      const response = await employeesService.listEmployees({
        page: pageParam,
        perPage: PAGE_SIZE,
        search: params?.search || undefined,
        status: params?.status || undefined,
        departmentId: params?.departmentId || undefined,
        positionId: params?.positionId || undefined,
        supervisorId: params?.supervisorId || undefined,
        companyId: params?.companyId || undefined,
        includeDeleted: params?.includeDeleted ?? false,
      });

      return response;
    },

    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const currentPage = lastPage.page ?? 1;
      const totalPages = lastPage.totalPages ?? 1;
      if (currentPage < totalPages) {
        return currentPage + 1;
      }
      return undefined;
    },

    staleTime: 5 * 60 * 1000,
  });

  // Flatten pages into single array
  const employees =
    result.data?.pages.flatMap((p) => {
      const items = p.employees ?? [];
      return params?.includeDeleted
        ? items
        : items.filter((e: Employee) => !e.deletedAt);
    }) ?? [];

  const total = result.data?.pages[0]?.total ?? 0;

  return {
    ...result,
    employees,
    total,
  };
}

export default useListEmployees;
