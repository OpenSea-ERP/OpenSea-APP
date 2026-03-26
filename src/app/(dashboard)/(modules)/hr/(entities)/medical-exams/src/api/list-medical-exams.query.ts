/**
 * OpenSea OS - List Medical Exams Query
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';
import { medicalExamsService } from '@/services/hr/medical-exams.service';
import type { MedicalExam } from '@/types/hr';
import { medicalExamKeys, type MedicalExamFilters } from './keys';

export interface ListMedicalExamsResponse {
  medicalExams: MedicalExam[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
}

export type ListMedicalExamsOptions = Omit<
  UseQueryOptions<ListMedicalExamsResponse, Error>,
  'queryKey' | 'queryFn'
>;

export function useListMedicalExams(
  params?: MedicalExamFilters,
  options?: ListMedicalExamsOptions
) {
  return useQuery({
    queryKey: medicalExamKeys.list(params),

    queryFn: async (): Promise<ListMedicalExamsResponse> => {
      const response = await medicalExamsService.list({
        employeeId: params?.employeeId,
        type: params?.type,
        result: params?.result,
        startDate: params?.startDate,
        endDate: params?.endDate,
        page: params?.page,
        perPage: params?.perPage ?? 100,
      });

      const exams =
        (response as { medicalExams?: MedicalExam[] }).medicalExams ?? [];
      const page = params?.page ?? 1;
      const perPage = params?.perPage ?? 100;

      return {
        medicalExams: exams,
        total: exams.length,
        page,
        perPage,
        hasMore: exams.length >= perPage,
      };
    },

    staleTime: 5 * 60 * 1000,
    placeholderData: previousData => previousData,
    ...options,
  });
}

export default useListMedicalExams;
