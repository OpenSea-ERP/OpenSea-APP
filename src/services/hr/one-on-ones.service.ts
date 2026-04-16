/**
 * One-on-Ones Service (HR)
 * Serviço para gerenciamento de reuniões 1:1, talking points, action items e notes.
 */

import { apiClient } from '@/lib/api-client';
import type {
  AddActionItemData,
  AddTalkingPointData,
  ListOneOnOnesFilters,
  OneOnOneActionItem,
  OneOnOneMeeting,
  OneOnOneNote,
  ScheduleOneOnOneData,
  TalkingPoint,
  UpdateActionItemData,
  UpdateOneOnOneData,
  UpdateTalkingPointData,
  UpsertNoteData,
} from '@/types/hr';

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface OneOnOnesListResponse {
  meetings: OneOnOneMeeting[];
  meta: { total: number; page: number; perPage: number; totalPages: number };
}

export interface OneOnOneResponse {
  meeting: OneOnOneMeeting;
}

export interface TalkingPointResponse {
  talkingPoint: TalkingPoint;
}

export interface ActionItemResponse {
  actionItem: OneOnOneActionItem;
}

export interface NoteResponse {
  note: OneOnOneNote;
}

// ============================================================================
// HELPERS
// ============================================================================

function buildQueryString(params: Record<string, unknown>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    query.append(key, String(value));
  }
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

// ============================================================================
// SERVICE
// ============================================================================

export const oneOnOnesService = {
  // -------------------------- Meetings -------------------------------------

  async listMeetings(
    filters?: ListOneOnOnesFilters
  ): Promise<OneOnOnesListResponse> {
    const qs = buildQueryString({
      role: filters?.role,
      status: filters?.status,
      from: filters?.from,
      to: filters?.to,
      page: filters?.page,
      perPage: filters?.perPage,
    });
    return apiClient.get<OneOnOnesListResponse>(`/v1/hr/one-on-ones${qs}`);
  },

  async getMeeting(meetingId: string): Promise<OneOnOneResponse> {
    return apiClient.get<OneOnOneResponse>(`/v1/hr/one-on-ones/${meetingId}`);
  },

  async scheduleMeeting(
    payload: ScheduleOneOnOneData
  ): Promise<OneOnOneResponse> {
    const { recurrence: _r, occurrences: _o, ...body } = payload;
    void _r;
    void _o;
    return apiClient.post<OneOnOneResponse>(`/v1/hr/one-on-ones`, body);
  },

  async updateMeeting(
    meetingId: string,
    payload: UpdateOneOnOneData
  ): Promise<OneOnOneResponse> {
    return apiClient.patch<OneOnOneResponse>(
      `/v1/hr/one-on-ones/${meetingId}`,
      payload
    );
  },

  async deleteMeeting(meetingId: string): Promise<void> {
    return apiClient.delete<void>(`/v1/hr/one-on-ones/${meetingId}`);
  },

  // -------------------------- Talking Points -------------------------------

  async addTalkingPoint(
    meetingId: string,
    payload: AddTalkingPointData
  ): Promise<TalkingPointResponse> {
    return apiClient.post<TalkingPointResponse>(
      `/v1/hr/one-on-ones/${meetingId}/talking-points`,
      payload
    );
  },

  async updateTalkingPoint(
    talkingPointId: string,
    payload: UpdateTalkingPointData
  ): Promise<TalkingPointResponse> {
    return apiClient.patch<TalkingPointResponse>(
      `/v1/hr/one-on-ones/talking-points/${talkingPointId}`,
      payload
    );
  },

  async deleteTalkingPoint(talkingPointId: string): Promise<void> {
    return apiClient.delete<void>(
      `/v1/hr/one-on-ones/talking-points/${talkingPointId}`
    );
  },

  // -------------------------- Action Items ---------------------------------

  async addActionItem(
    meetingId: string,
    payload: AddActionItemData
  ): Promise<ActionItemResponse> {
    return apiClient.post<ActionItemResponse>(
      `/v1/hr/one-on-ones/${meetingId}/action-items`,
      payload
    );
  },

  async updateActionItem(
    actionItemId: string,
    payload: UpdateActionItemData
  ): Promise<ActionItemResponse> {
    return apiClient.patch<ActionItemResponse>(
      `/v1/hr/one-on-ones/action-items/${actionItemId}`,
      payload
    );
  },

  async deleteActionItem(actionItemId: string): Promise<void> {
    return apiClient.delete<void>(
      `/v1/hr/one-on-ones/action-items/${actionItemId}`
    );
  },

  // -------------------------- Notes ---------------------------------------

  async upsertNote(
    meetingId: string,
    payload: UpsertNoteData
  ): Promise<NoteResponse> {
    return apiClient.post<NoteResponse>(
      `/v1/hr/one-on-ones/${meetingId}/notes`,
      payload
    );
  },
};
