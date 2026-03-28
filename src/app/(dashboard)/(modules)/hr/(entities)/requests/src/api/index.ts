/**
 * OpenSea OS - Employee Requests API Module (HR)
 *
 * Exporta queries, mutations e utilitarios de solicitacoes.
 */

/* ===========================================
   QUERY KEYS
   =========================================== */
export { requestKeys, type RequestFilters, type RequestQueryKey } from './keys';

/* ===========================================
   QUERIES
   =========================================== */
export {
  useListMyRequests,
  useListPendingRequests,
  type ListRequestsParams,
  type ListRequestsResponse,
} from './list-requests.query';

/* ===========================================
   MUTATIONS
   =========================================== */
export {
  useCreateRequest,
  useApproveRequest,
  useRejectRequest,
  useCancelRequest,
} from './mutations';

/* ===========================================
   API
   =========================================== */
export { requestsApi } from './requests.api';
