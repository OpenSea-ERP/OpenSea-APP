/**
 * OpenSea OS - List Benefit Plans Query
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { benefitsService } from '@/services/hr/benefits.service';
import type { BenefitPlan } from '@/types/hr';
import { benefitKeys, type BenefitPlanFilters } from './keys';

export type ListBenefitPlansParams = BenefitPlanFilters;

export interface ListBenefitPlansResponse {
  benefitPlans: BenefitPlan[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
}

export type ListBenefitPlansOptions = Omit<
  UseQueryOptions<ListBenefitPlansResponse, Error>,
  'queryKey' | 'queryFn'
>;

export function useListBenefitPlans(
  params?: ListBenefitPlansParams,
  options?: ListBenefitPlansOptions
) {
  return useQuery({
    queryKey: benefitKeys.list(params),

    queryFn: async (): Promise<ListBenefitPlansResponse> => {
      const response = await benefitsService.listPlans({
        page: params?.page,
        perPage: params?.perPage ?? 100,
        search: params?.search,
        type: params?.type,
        isActive: params?.isActive,
      });

      const benefitPlans =
        (response as { benefitPlans?: BenefitPlan[] }).benefitPlans ?? [];
      const page = params?.page ?? 1;
      const perPage = params?.perPage ?? 100;

      return {
        benefitPlans,
        total: benefitPlans.length,
        page,
        perPage,
        hasMore: benefitPlans.length >= perPage,
      };
    },

    staleTime: 5 * 60 * 1000,
    placeholderData: previousData => previousData,
    ...options,
  });
}

export default useListBenefitPlans;
