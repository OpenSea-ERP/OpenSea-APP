/**
 * OpenSea OS - Absences API Module (HR)
 *
 * Exporta queries, mutations e utilitários de ausências.
 */

/* ===========================================
   QUERY KEYS
   =========================================== */
export { absenceKeys, type AbsenceFilters, type AbsenceQueryKey } from './keys';

/* ===========================================
   QUERIES
   =========================================== */
export {
  useListAbsences,
  type ListAbsencesParams,
  type ListAbsencesResponse,
  type ListAbsencesOptions,
} from './list-absences.query';

/* ===========================================
   MUTATIONS
   =========================================== */
export {
  useRequestSickLeave,
  useApproveAbsence,
  useRejectAbsence,
  useCancelAbsence,
  useUpdateAbsence,
  useDeleteAbsence,
} from './mutations';

/* ===========================================
   API
   =========================================== */
export { absencesApi } from './absences.api';
