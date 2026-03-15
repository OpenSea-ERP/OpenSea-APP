'use client';

import { calendarsService } from '@/services/calendar';
import type { CalendarsResponse } from '@/services/calendar/calendars.service';
import type {
  Calendar,
  CreateTeamCalendarData,
  UpdateCalendarData,
  TeamCalendarPermissions,
} from '@/types/calendar';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const QUERY_KEYS = {
  MY_CALENDARS: ['my-calendars'],
} as const;

export function useMyCalendars() {
  return useQuery<CalendarsResponse>({
    queryKey: QUERY_KEYS.MY_CALENDARS,
    queryFn: () => calendarsService.listMyCalendars(),
    staleTime: 300_000,
  });
}

export function useCreateTeamCalendar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTeamCalendarData) =>
      calendarsService.createTeamCalendar(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MY_CALENDARS });
    },
  });
}

export function useUpdateCalendar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCalendarData }) =>
      calendarsService.updateCalendar(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MY_CALENDARS });
    },
  });
}

export function useDeleteCalendar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => calendarsService.deleteCalendar(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MY_CALENDARS });
    },
  });
}

export function useUpdateTeamCalendarPermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TeamCalendarPermissions }) =>
      calendarsService.updateTeamCalendarPermissions(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MY_CALENDARS });
    },
  });
}
