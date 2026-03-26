/**
 * OpenSea OS - Medical Exams API Module
 */

// Query Keys
export { medicalExamKeys, type MedicalExamFilters } from './keys';

// Queries
export {
  useListMedicalExams,
  type ListMedicalExamsResponse,
  type ListMedicalExamsOptions,
} from './list-medical-exams.query';

// Mutations
export {
  useCreateMedicalExam,
  useDeleteMedicalExam,
  type CreateMedicalExamOptions,
  type DeleteMedicalExamOptions,
} from './mutations';

// Legacy API
export * from './medical-exams.api';
