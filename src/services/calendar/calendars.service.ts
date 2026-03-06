import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';
import type {
  CreateTeamCalendarData,
  UpdateCalendarData,
  TeamCalendarPermissions,
} from '@/types/calendar';

export interface CalendarsResponse {
  calendars: import('@/types/calendar').Calendar[];
}

export interface CalendarResponse {
  calendar: import('@/types/calendar').Calendar;
}

export const calendarsService = {
  async listMyCalendars(): Promise<CalendarsResponse> {
    return apiClient.get<CalendarsResponse>(
      API_ENDPOINTS.CALENDAR.CALENDARS.LIST,
    );
  },

  async createTeamCalendar(
    data: CreateTeamCalendarData,
  ): Promise<CalendarResponse> {
    return apiClient.post<CalendarResponse>(
      API_ENDPOINTS.CALENDAR.CALENDARS.CREATE_TEAM,
      data,
    );
  },

  async updateCalendar(
    id: string,
    data: UpdateCalendarData,
  ): Promise<CalendarResponse> {
    return apiClient.patch<CalendarResponse>(
      API_ENDPOINTS.CALENDAR.CALENDARS.UPDATE(id),
      data,
    );
  },

  async deleteCalendar(id: string): Promise<void> {
    await apiClient.delete<void>(API_ENDPOINTS.CALENDAR.CALENDARS.DELETE(id));
  },

  async updateTeamCalendarPermissions(
    id: string,
    data: TeamCalendarPermissions,
  ): Promise<void> {
    await apiClient.patch<void>(
      API_ENDPOINTS.CALENDAR.CALENDARS.UPDATE_PERMISSIONS(id),
      data,
    );
  },
};
