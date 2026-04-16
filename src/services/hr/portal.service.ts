import { apiClient } from '@/lib/api-client';
import type {
  AnnouncementResponse,
  AnnouncementsResponse,
  CreateAnnouncementData,
  CreateEmployeeRequestData,
  CreateReplyData,
  EmployeeRequestResponse,
  EmployeeRequestsResponse,
  KudosFeedQueryParams,
  KudosListResponse,
  KudosReactionToggleResponse,
  KudosReactionsGroupedResponse,
  KudosRepliesResponse,
  KudosReplyResponse,
  KudosResponse,
  OnboardingResponse,
  HRPendingApprovalsResponse,
  SendKudosData,
  ToggleReactionData,
  UpdateAnnouncementData,
  UpdateReplyData,
} from '@/types/hr';

// ============================================================================
// List Params
// ============================================================================

export interface ListRequestsParams {
  type?: string;
  status?: string;
  page?: number;
  perPage?: number;
}

export interface ListAnnouncementsParams {
  page?: number;
  perPage?: number;
}

export interface ListKudosParams {
  page?: number;
  perPage?: number;
}

export interface ListKudosFeedParams {
  page?: number;
  perPage?: number;
  /** When true, returns only pinned items; when false, only non-pinned. */
  pinned?: boolean;
}

export interface ListPendingApprovalsParams {
  type?: string;
  employeeId?: string;
  page?: number;
  perPage?: number;
}

// ============================================================================
// Helper: Build query string
// ============================================================================

function buildQuery(params?: object): string {
  if (!params) return '';
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(
    params as Record<string, unknown>
  )) {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, String(value));
    }
  }
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

// ============================================================================
// Portal Service
// ============================================================================

export const portalService = {
  // --------------------------------------------------------------------------
  // Employee Requests
  // --------------------------------------------------------------------------

  async createRequest(
    data: CreateEmployeeRequestData
  ): Promise<EmployeeRequestResponse> {
    return apiClient.post<EmployeeRequestResponse>('/v1/hr/my/requests', data);
  },

  async listMyRequests(
    params?: ListRequestsParams
  ): Promise<EmployeeRequestsResponse> {
    const { perPage, ...rest } = params ?? {};
    const query = { ...rest, ...(perPage ? { limit: perPage } : {}) };
    return apiClient.get<EmployeeRequestsResponse>(
      `/v1/hr/my/requests${buildQuery(query)}`
    );
  },

  async getRequest(id: string): Promise<EmployeeRequestResponse> {
    return apiClient.get<EmployeeRequestResponse>(`/v1/hr/my/requests/${id}`);
  },

  async cancelRequest(id: string): Promise<EmployeeRequestResponse> {
    return apiClient.delete<EmployeeRequestResponse>(
      `/v1/hr/my/requests/${id}`
    );
  },

  // --------------------------------------------------------------------------
  // Announcements
  // --------------------------------------------------------------------------

  async listAnnouncements(
    params?: ListAnnouncementsParams
  ): Promise<AnnouncementsResponse> {
    return apiClient.get<AnnouncementsResponse>(
      `/v1/hr/announcements${buildQuery(params)}`
    );
  },

  async createAnnouncement(
    data: CreateAnnouncementData
  ): Promise<AnnouncementResponse> {
    return apiClient.post<AnnouncementResponse>('/v1/hr/announcements', data);
  },

  async updateAnnouncement(
    id: string,
    data: UpdateAnnouncementData
  ): Promise<AnnouncementResponse> {
    return apiClient.put<AnnouncementResponse>(
      `/v1/hr/announcements/${id}`,
      data
    );
  },

  async deleteAnnouncement(id: string): Promise<void> {
    return apiClient.delete<void>(`/v1/hr/announcements/${id}`);
  },

  // --------------------------------------------------------------------------
  // Kudos
  // --------------------------------------------------------------------------

  async sendKudos(data: SendKudosData): Promise<KudosResponse> {
    return apiClient.post<KudosResponse>('/v1/hr/kudos', data);
  },

  async listReceivedKudos(
    params?: ListKudosParams
  ): Promise<KudosListResponse> {
    return apiClient.get<KudosListResponse>(
      `/v1/hr/kudos/received${buildQuery(params)}`
    );
  },

  async listSentKudos(params?: ListKudosParams): Promise<KudosListResponse> {
    return apiClient.get<KudosListResponse>(
      `/v1/hr/kudos/sent${buildQuery(params)}`
    );
  },

  async listKudosFeed(
    params?: ListKudosFeedParams
  ): Promise<KudosListResponse> {
    const { perPage, pinned, ...rest } = params ?? {};
    const query: KudosFeedQueryParams & { page?: number } = { ...rest };
    if (perPage !== undefined) query.limit = perPage;
    if (pinned !== undefined) query.pinned = pinned;
    return apiClient.get<KudosListResponse>(
      `/v1/hr/kudos/feed${buildQuery(query)}`
    );
  },

  // --------------------------------------------------------------------------
  // Kudos Reactions
  // --------------------------------------------------------------------------

  async toggleKudosReaction(
    kudosId: string,
    reaction: ToggleReactionData
  ): Promise<KudosReactionToggleResponse> {
    return apiClient.post<KudosReactionToggleResponse>(
      `/v1/hr/kudos/${kudosId}/reactions`,
      reaction
    );
  },

  async listKudosReactions(
    kudosId: string
  ): Promise<KudosReactionsGroupedResponse> {
    return apiClient.get<KudosReactionsGroupedResponse>(
      `/v1/hr/kudos/${kudosId}/reactions`
    );
  },

  // --------------------------------------------------------------------------
  // Kudos Replies (thread)
  // --------------------------------------------------------------------------

  async listKudosReplies(kudosId: string): Promise<KudosRepliesResponse> {
    return apiClient.get<KudosRepliesResponse>(
      `/v1/hr/kudos/${kudosId}/replies`
    );
  },

  async createKudosReply(
    kudosId: string,
    reply: CreateReplyData
  ): Promise<KudosReplyResponse> {
    return apiClient.post<KudosReplyResponse>(
      `/v1/hr/kudos/${kudosId}/replies`,
      reply
    );
  },

  async updateKudosReply(
    replyId: string,
    reply: UpdateReplyData
  ): Promise<KudosReplyResponse> {
    return apiClient.patch<KudosReplyResponse>(
      `/v1/hr/kudos/replies/${replyId}`,
      reply
    );
  },

  async deleteKudosReply(replyId: string): Promise<void> {
    return apiClient.delete<void>(`/v1/hr/kudos/replies/${replyId}`);
  },

  // --------------------------------------------------------------------------
  // Kudos Pin / Unpin
  // --------------------------------------------------------------------------

  async pinKudos(kudosId: string): Promise<KudosResponse> {
    return apiClient.post<KudosResponse>(`/v1/hr/kudos/${kudosId}/pin`, {});
  },

  async unpinKudos(kudosId: string): Promise<KudosResponse> {
    return apiClient.post<KudosResponse>(`/v1/hr/kudos/${kudosId}/unpin`, {});
  },

  async deleteKudos(kudosId: string): Promise<void> {
    return apiClient.delete<void>(`/v1/hr/kudos/${kudosId}`);
  },

  // --------------------------------------------------------------------------
  // Onboarding
  // --------------------------------------------------------------------------

  async getMyOnboarding(): Promise<OnboardingResponse> {
    return apiClient.get<OnboardingResponse>('/v1/hr/my/onboarding');
  },

  async completeOnboardingItem(itemId: string): Promise<OnboardingResponse> {
    return apiClient.post<OnboardingResponse>(
      `/v1/hr/my/onboarding/${itemId}/complete`,
      {}
    );
  },

  // --------------------------------------------------------------------------
  // Approvals (Manager)
  // --------------------------------------------------------------------------

  async listPendingApprovals(
    params?: ListPendingApprovalsParams
  ): Promise<HRPendingApprovalsResponse> {
    const { perPage, ...rest } = params ?? {};
    const query = { ...rest, ...(perPage ? { limit: perPage } : {}) };
    return apiClient.get<HRPendingApprovalsResponse>(
      `/v1/hr/requests/pending-approvals${buildQuery(query)}`
    );
  },

  async approveRequest(
    id: string,
    reason?: string
  ): Promise<EmployeeRequestResponse> {
    return apiClient.post<EmployeeRequestResponse>(
      `/v1/hr/requests/${id}/approve`,
      { reason }
    );
  },

  async rejectRequest(
    id: string,
    reason: string
  ): Promise<EmployeeRequestResponse> {
    return apiClient.post<EmployeeRequestResponse>(
      `/v1/hr/requests/${id}/reject`,
      { rejectionReason: reason }
    );
  },
};
