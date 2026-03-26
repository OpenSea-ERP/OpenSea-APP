/**
 * OpenSea OS - List Dependants Query
 * Fetches dependants from a specific employee or aggregated across all employees
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { dependantsService } from '@/services/hr/dependants.service';
import { employeesService } from '@/services/hr/employees.service';
import type { EmployeeDependant } from '@/types/hr';
import { dependantKeys, type DependantFilters } from './keys';

export type ListDependantsParams = DependantFilters;

export interface ListDependantsResponse {
  dependants: EmployeeDependant[];
  total: number;
}

export type ListDependantsOptions = Omit<
  UseQueryOptions<ListDependantsResponse, Error>,
  'queryKey' | 'queryFn'
>;

export function useListDependants(
  params?: ListDependantsParams,
  options?: ListDependantsOptions
) {
  return useQuery({
    queryKey: dependantKeys.list(params),

    queryFn: async (): Promise<ListDependantsResponse> => {
      // If a specific employee is selected, fetch dependants for that employee
      if (params?.employeeId) {
        const response = await dependantsService.list(params.employeeId);
        const dependants = response.dependants ?? [];
        return { dependants, total: dependants.length };
      }

      // Otherwise, fetch all active employees, then aggregate dependants from each
      const employeesResponse = await employeesService.listEmployees({
        perPage: 200,
        status: 'ACTIVE',
      });
      const employees = employeesResponse.employees ?? [];

      if (employees.length === 0) {
        return { dependants: [], total: 0 };
      }

      const allDependants: EmployeeDependant[] = [];
      for (const employee of employees) {
        try {
          const response = await dependantsService.list(employee.id);
          const dependants = response.dependants ?? [];
          allDependants.push(...dependants);
        } catch {
          // Skip employees that fail — they may not have dependants access
        }
      }

      return { dependants: allDependants, total: allDependants.length };
    },

    staleTime: 5 * 60 * 1000,
    placeholderData: previousData => previousData,
    ...options,
  });
}

export default useListDependants;
