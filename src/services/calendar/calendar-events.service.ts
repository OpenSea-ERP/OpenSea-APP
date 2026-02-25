import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  CalendarEvent,
  CalendarEventsQuery,
  CreateCalendarEventData,
  UpdateCalendarEventData,
  InviteParticipantsData,
  InviteParticipantsResponse,
  RespondToEventData,
  RespondToEventResponse,
  ManageRemindersData,
  ManageRemindersResponse,
} from '@/types/calendar';

export interface CalendarEventsResponse {
  events: CalendarEvent[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface CalendarEventResponse {
  event: CalendarEvent;
}

export const calendarEventsService = {
  async list(params: CalendarEventsQuery): Promise<CalendarEventsResponse> {
    const query = new URLSearchParams({
      startDate: params.startDate,
      endDate: params.endDate,
    });

    if (params.type) query.append('type', params.type);
    if (params.search) query.append('search', params.search);
    if (params.includeSystemEvents !== undefined) {
      query.append('includeSystemEvents', String(params.includeSystemEvents));
    }
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));

    return apiClient.get<CalendarEventsResponse>(
      `${API_ENDPOINTS.CALENDAR.EVENTS.LIST}?${query.toString()}`
    );
  },

  async get(id: string): Promise<CalendarEventResponse> {
    return apiClient.get<CalendarEventResponse>(
      API_ENDPOINTS.CALENDAR.EVENTS.GET(id)
    );
  },

  async create(data: CreateCalendarEventData): Promise<CalendarEventResponse> {
    return apiClient.post<CalendarEventResponse>(
      API_ENDPOINTS.CALENDAR.EVENTS.CREATE,
      data
    );
  },

  async update(
    id: string,
    data: UpdateCalendarEventData
  ): Promise<CalendarEventResponse> {
    return apiClient.patch<CalendarEventResponse>(
      API_ENDPOINTS.CALENDAR.EVENTS.UPDATE(id),
      data
    );
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete<void>(API_ENDPOINTS.CALENDAR.EVENTS.DELETE(id));
  },

  async inviteParticipants(
    eventId: string,
    data: InviteParticipantsData,
  ): Promise<InviteParticipantsResponse> {
    return apiClient.post<InviteParticipantsResponse>(
      API_ENDPOINTS.CALENDAR.EVENTS.INVITE(eventId),
      data,
    );
  },

  async respondToEvent(
    eventId: string,
    data: RespondToEventData,
  ): Promise<RespondToEventResponse> {
    return apiClient.patch<RespondToEventResponse>(
      API_ENDPOINTS.CALENDAR.EVENTS.RESPOND(eventId),
      data,
    );
  },

  async removeParticipant(eventId: string, userId: string): Promise<void> {
    await apiClient.delete<void>(
      API_ENDPOINTS.CALENDAR.EVENTS.REMOVE_PARTICIPANT(eventId, userId),
    );
  },

  async manageReminders(
    eventId: string,
    data: ManageRemindersData,
  ): Promise<ManageRemindersResponse> {
    return apiClient.put<ManageRemindersResponse>(
      API_ENDPOINTS.CALENDAR.EVENTS.MANAGE_REMINDERS(eventId),
      data,
    );
  },
};
