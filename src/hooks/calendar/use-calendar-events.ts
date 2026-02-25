import { calendarEventsService } from '@/services/calendar';
import type { CalendarEventsResponse } from '@/services/calendar/calendar-events.service';
import type {
  CalendarEventsQuery,
  CreateCalendarEventData,
  UpdateCalendarEventData,
  InviteParticipantsData,
  RespondToEventData,
  ManageRemindersData,
} from '@/types/calendar';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const QUERY_KEYS = {
  CALENDAR_EVENTS: ['calendar-events'],
  CALENDAR_EVENT: (id: string) => ['calendar-events', id],
} as const;

export function useCalendarEvents(params: CalendarEventsQuery) {
  return useQuery({
    queryKey: [...QUERY_KEYS.CALENDAR_EVENTS, params],
    queryFn: () => calendarEventsService.list(params),
    enabled: !!params.startDate && !!params.endDate,
  });
}

export function useCalendarEvent(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.CALENDAR_EVENT(id),
    queryFn: () => calendarEventsService.get(id),
    enabled: !!id,
  });
}

export function useCreateCalendarEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCalendarEventData) =>
      calendarEventsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CALENDAR_EVENTS });
    },
  });
}

export function useUpdateCalendarEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCalendarEventData }) =>
      calendarEventsService.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.CALENDAR_EVENTS });
      const previousQueries = queryClient.getQueriesData<CalendarEventsResponse>({
        queryKey: QUERY_KEYS.CALENDAR_EVENTS,
      });

      queryClient.setQueriesData<CalendarEventsResponse>(
        { queryKey: QUERY_KEYS.CALENDAR_EVENTS },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            events: old.events.map((e) =>
              e.id === id ? { ...e, ...data } : e,
            ),
          };
        },
      );

      return { previousQueries };
    },
    onError: (_, __, context) => {
      if (context?.previousQueries) {
        for (const [key, data] of context.previousQueries) {
          queryClient.setQueryData(key, data);
        }
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CALENDAR_EVENTS });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CALENDAR_EVENT(variables.id),
      });
    },
  });
}

export function useDeleteCalendarEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => calendarEventsService.delete(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.CALENDAR_EVENTS });
      const previousQueries = queryClient.getQueriesData<CalendarEventsResponse>({
        queryKey: QUERY_KEYS.CALENDAR_EVENTS,
      });

      queryClient.setQueriesData<CalendarEventsResponse>(
        { queryKey: QUERY_KEYS.CALENDAR_EVENTS },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            events: old.events.filter((e) => e.id !== id),
          };
        },
      );

      return { previousQueries };
    },
    onError: (_, __, context) => {
      if (context?.previousQueries) {
        for (const [key, data] of context.previousQueries) {
          queryClient.setQueryData(key, data);
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CALENDAR_EVENTS });
    },
  });
}

export function useInviteParticipants() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, data }: { eventId: string; data: InviteParticipantsData }) =>
      calendarEventsService.inviteParticipants(eventId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CALENDAR_EVENTS });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CALENDAR_EVENT(variables.eventId),
      });
    },
  });
}

export function useRespondToEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, data }: { eventId: string; data: RespondToEventData }) =>
      calendarEventsService.respondToEvent(eventId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CALENDAR_EVENTS });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CALENDAR_EVENT(variables.eventId),
      });
    },
  });
}

export function useRemoveParticipant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, userId }: { eventId: string; userId: string }) =>
      calendarEventsService.removeParticipant(eventId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CALENDAR_EVENTS });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CALENDAR_EVENT(variables.eventId),
      });
    },
  });
}

export function useManageReminders() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, data }: { eventId: string; data: ManageRemindersData }) =>
      calendarEventsService.manageReminders(eventId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CALENDAR_EVENTS });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CALENDAR_EVENT(variables.eventId),
      });
    },
  });
}
