/**
 * OpenSea OS - Medical Exams Query Keys
 */

export interface MedicalExamFilters {
  employeeId?: string;
  type?: string;
  result?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  perPage?: number;
}

export const medicalExamKeys = {
  all: ['medical-exams'] as const,
  lists: () => [...medicalExamKeys.all, 'list'] as const,
  list: (filters?: MedicalExamFilters) =>
    [...medicalExamKeys.lists(), filters ?? {}] as const,
  details: () => [...medicalExamKeys.all, 'detail'] as const,
  detail: (id: string) => [...medicalExamKeys.details(), id] as const,
} as const;

export default medicalExamKeys;
