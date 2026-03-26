/**
 * OpenSea OS - CIPA Query Keys
 */

export interface CipaMandateFilters {
  status?: string;
  page?: number;
  perPage?: number;
}

export const cipaKeys = {
  all: ['cipa'] as const,
  mandates: () => [...cipaKeys.all, 'mandates'] as const,
  mandateList: (filters?: CipaMandateFilters) =>
    [...cipaKeys.mandates(), 'list', filters ?? {}] as const,
  mandateDetails: () => [...cipaKeys.mandates(), 'detail'] as const,
  mandateDetail: (id: string) => [...cipaKeys.mandateDetails(), id] as const,
  members: (mandateId: string) =>
    [...cipaKeys.all, 'members', mandateId] as const,
} as const;

export default cipaKeys;
