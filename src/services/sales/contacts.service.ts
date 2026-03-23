import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  ContactResponse,
  ContactsQuery,
  CreateContactRequest,
  PaginatedContactsResponse,
  UpdateContactRequest,
} from '@/types/sales';

export const contactsService = {
  // GET /v1/contacts with pagination and filters
  async list(query?: ContactsQuery): Promise<PaginatedContactsResponse> {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.sortBy) params.append('sortBy', query.sortBy);
    if (query?.sortOrder) params.append('sortOrder', query.sortOrder);
    if (query?.search) params.append('search', query.search);
    if (query?.customerId) params.append('customerId', query.customerId);
    if (query?.lifecycleStage)
      params.append('lifecycleStage', query.lifecycleStage);
    if (query?.leadTemperature)
      params.append('leadTemperature', query.leadTemperature);
    if (query?.source) params.append('source', query.source);
    if (query?.assignedToUserId)
      params.append('assignedToUserId', query.assignedToUserId);

    const url = params.toString()
      ? `${API_ENDPOINTS.CONTACTS.LIST}?${params.toString()}`
      : API_ENDPOINTS.CONTACTS.LIST;

    return apiClient.get<PaginatedContactsResponse>(url);
  },

  // GET /v1/contacts/:contactId
  async get(contactId: string): Promise<ContactResponse> {
    return apiClient.get<ContactResponse>(
      API_ENDPOINTS.CONTACTS.GET(contactId)
    );
  },

  // POST /v1/contacts
  async create(data: CreateContactRequest): Promise<ContactResponse> {
    return apiClient.post<ContactResponse>(API_ENDPOINTS.CONTACTS.CREATE, data);
  },

  // PUT /v1/contacts/:contactId
  async update(
    contactId: string,
    data: UpdateContactRequest
  ): Promise<ContactResponse> {
    return apiClient.put<ContactResponse>(
      API_ENDPOINTS.CONTACTS.UPDATE(contactId),
      data
    );
  },

  // DELETE /v1/contacts/:contactId
  async delete(contactId: string): Promise<void> {
    return apiClient.delete<void>(API_ENDPOINTS.CONTACTS.DELETE(contactId));
  },
};
