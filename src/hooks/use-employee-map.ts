'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { employeesService } from '@/services/hr/employees.service';

/**
 * Batch-resolves employee IDs to display names.
 * Uses the label-data endpoint for a single API call.
 *
 * @param employeeIds - Array of employee UUIDs to resolve
 * @returns Map<employeeId, fullName> and loading state
 */
export function useEmployeeMap(employeeIds: string[]) {
  const uniqueIds = useMemo(() => {
    const set = new Set(employeeIds.filter(Boolean));
    return Array.from(set).sort();
  }, [employeeIds]);

  const { data, isLoading } = useQuery({
    queryKey: ['employees', 'label-data', uniqueIds],
    queryFn: () => employeesService.getLabelData(uniqueIds),
    enabled: uniqueIds.length > 0,
    staleTime: 5 * 60_000, // 5 min — employee names rarely change
  });

  const employeeMap = useMemo(() => {
    const map = new Map<string, string>();
    if (data?.labelData) {
      for (const item of data.labelData) {
        map.set(item.employee.id, item.employee.fullName);
      }
    }
    return map;
  }, [data]);

  const getName = (id: string) => employeeMap.get(id) ?? id.slice(0, 8) + '…';

  return { employeeMap, getName, isLoading };
}
