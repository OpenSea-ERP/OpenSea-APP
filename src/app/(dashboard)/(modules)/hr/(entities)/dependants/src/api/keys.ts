/**
 * OpenSea OS - Dependants Query Keys
 */

export interface DependantFilters {
  employeeId?: string;
}

export const dependantKeys = {
  all: ['dependants'] as const,
  lists: () => [...dependantKeys.all, 'list'] as const,
  list: (filters?: DependantFilters) =>
    [...dependantKeys.lists(), filters ?? {}] as const,
  details: () => [...dependantKeys.all, 'detail'] as const,
  detail: (id: string) => [...dependantKeys.details(), id] as const,
} as const;

type DependantKeyFunctions = {
  [K in keyof typeof dependantKeys]: (typeof dependantKeys)[K] extends (
    ...args: infer _Args
  ) => infer R
    ? R
    : (typeof dependantKeys)[K];
};

export type DependantQueryKey =
  DependantKeyFunctions[keyof DependantKeyFunctions];

export default dependantKeys;
