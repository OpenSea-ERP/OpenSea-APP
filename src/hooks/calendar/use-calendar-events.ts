import { calendarEventsService } from '@/services/calendar';
import type {
  CalendarEventsResponse,
  CalendarEventResponse,
} from '@/services/calendar/calendar-events.service';
import type {
  CalendarEventsQuery,
  CalendarEvent,
  CreateCalendarEventData,
  UpdateCalendarEventData,
  InviteParticipantsData,
  RespondToEventData,
  ManageRemindersData,
} from '@/types/calendar';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const QUERY_KEYS = {
  CALENDAR_EVENTS: ['calendar-events'],
  CALENDAR_EVENT: (id: string) => ['calendar-events', id],
} as const;

export function useCalendarEvents(params: CalendarEventsQuery) {
  return useQuery({
    queryKey: [...QUERY_KEYS.CALENDAR_EVENTS, params],
    queryFn: () => calendarEventsService.list(params),
    enabled: !!params.startDate && !!params.endDate,
    placeholderData: keepPreviousData,
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
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.CALENDAR_EVENTS });
      const previousQueries = queryClient.getQueriesData<CalendarEventsResponse>({
        queryKey: QUERY_KEYS.CALENDAR_EVENTS,
      });

      const tempEvent: CalendarEvent = {
        id: `temp-${Date.now()}`,
        tenantId: '',
        calendarId: data.calendarId ?? null,
        title: data.title,
        description: data.description ?? null,
        location: data.location ?? null,
        startDate: data.startDate,
        endDate: data.endDate,
        isAllDay: data.isAllDay ?? false,
        type: data.type ?? 'CUSTOM',
        visibility: data.visibility ?? 'PUBLIC',
        color: data.color ?? null,
        rrule: data.rrule ?? null,
        timezone: data.timezone ?? null,
        systemSourceType: null,
        systemSourceId: null,
        metadata: {},
        createdBy: '',
        creatorName: null,
        participants: [],
        reminders: [],
        isRecurring: !!data.rrule,
        occurrenceDate: null,
        deletedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: null,
      };

      queryClient.setQueriesData<CalendarEventsResponse>(
        { queryKey: QUERY_KEYS.CALENDAR_EVENTS },
        (old) => {
          if (!old?.events) return old;
          return {
            ...old,
            events: [...old.events, tempEvent],
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
          if (!old?.events) return old;
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
          if (!old?.events) return old;
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
    onMutate: async ({ eventId, data }) => {
      await queryClient.cancelQueries({
        queryKey: QUERY_KEYS.CALENDAR_EVENT(eventId),
      });
      const previousEvent = queryClient.getQueryData<CalendarEventResponse>(
        QUERY_KEYS.CALENDAR_EVENT(eventId),
      );

      if (previousEvent) {
        const existingParticipants = previousEvent.event.participants ?? [];
        const newParticipants = data.participants.map((p) => ({
          id: `temp-${Date.now()}-${p.userId}`,
          eventId,
          userId: p.userId,
          role: (p.role ?? 'GUEST') as 'OWNER' | 'ASSIGNEE' | 'GUEST',
          status: 'PENDING' as const,
          respondedAt: null,
          userName: null,
          userEmail: null,
          createdAt: new Date().toISOString(),
          updatedAt: null,
        }));

        queryClient.setQueryData<CalendarEventResponse>(
          QUERY_KEYS.CALENDAR_EVENT(eventId),
          {
            ...previousEvent,
            event: {
              ...previousEvent.event,
              participants: [...existingParticipants, ...newParticipants],
            },
          },
        );
      }

      return { previousEvent };
    },
    onError: (_, variables, context) => {
      if (context?.previousEvent) {
        queryClient.setQueryData(
          QUERY_KEYS.CALENDAR_EVENT(variables.eventId),
          context.previousEvent,
        );
      }
    },
    onSettled: (_, __, variables) => {
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
    onMutate: async ({ eventId, data }) => {
      await queryClient.cancelQueries({
        queryKey: QUERY_KEYS.CALENDAR_EVENT(eventId),
      });
      const previousEvent = queryClient.getQueryData<CalendarEventResponse>(
        QUERY_KEYS.CALENDAR_EVENT(eventId),
      );

      if (previousEvent) {
        const existingParticipants = previousEvent.event.participants ?? [];
        queryClient.setQueryData<CalendarEventResponse>(
          QUERY_KEYS.CALENDAR_EVENT(eventId),
          {
            ...previousEvent,
            event: {
              ...previousEvent.event,
              participants: existingParticipants.map((p) => ({
                ...p,
                status: data.status,
                respondedAt: new Date().toISOString(),
              })),
            },
          },
        );
      }

      return { previousEvent };
    },
    onError: (_, variables, context) => {
      if (context?.previousEvent) {
        queryClient.setQueryData(
          QUERY_KEYS.CALENDAR_EVENT(variables.eventId),
          context.previousEvent,
        );
      }
    },
    onSettled: (_, __, variables) => {
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
    onMutate: async ({ eventId, userId }) => {
      await queryClient.cancelQueries({
        queryKey: QUERY_KEYS.CALENDAR_EVENT(eventId),
      });
      const previousEvent = queryClient.getQueryData<CalendarEventResponse>(
        QUERY_KEYS.CALENDAR_EVENT(eventId),
      );

      if (previousEvent) {
        const existingParticipants = previousEvent.event.participants ?? [];
        queryClient.setQueryData<CalendarEventResponse>(
          QUERY_KEYS.CALENDAR_EVENT(eventId),
          {
            ...previousEvent,
            event: {
              ...previousEvent.event,
              participants: existingParticipants.filter(
                (p) => p.userId !== userId,
              ),
            },
          },
        );
      }

      return { previousEvent };
    },
    onError: (_, variables, context) => {
      if (context?.previousEvent) {
        queryClient.setQueryData(
          QUERY_KEYS.CALENDAR_EVENT(variables.eventId),
          context.previousEvent,
        );
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CALENDAR_EVENTS });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CALENDAR_EVENT(variables.eventId),
      });
    },
  });
}

export function useShareEventWithUsers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, userIds }: { eventId: string; userIds: string[] }) =>
      calendarEventsService.shareWithUsers(eventId, userIds),
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CALENDAR_EVENTS });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CALENDAR_EVENT(variables.eventId),
      });
    },
  });
}

export function useShareEventWithTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, teamId }: { eventId: string; teamId: string }) =>
      calendarEventsService.shareWithTeam(eventId, teamId),
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CALENDAR_EVENTS });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CALENDAR_EVENT(variables.eventId),
      });
    },
  });
}

export function useUnshareUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, targetUserId }: { eventId: string; targetUserId: string }) =>
      calendarEventsService.unshareUser(eventId, targetUserId),
    onSettled: (_, __, variables) => {
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
    onMutate: async ({ eventId, data }) => {
      await queryClient.cancelQueries({
        queryKey: QUERY_KEYS.CALENDAR_EVENT(eventId),
      });
      const previousEvent = queryClient.getQueryData<CalendarEventResponse>(
        QUERY_KEYS.CALENDAR_EVENT(eventId),
      );

      if (previousEvent) {
        const newReminders = data.reminders.map((r, i) => ({
          id: `temp-${Date.now()}-${i}`,
          eventId,
          userId: '',
          minutesBefore: r.minutesBefore,
          isSent: false,
          sentAt: null,
          createdAt: new Date().toISOString(),
        }));

        queryClient.setQueryData<CalendarEventResponse>(
          QUERY_KEYS.CALENDAR_EVENT(eventId),
          {
            ...previousEvent,
            event: {
              ...previousEvent.event,
              reminders: newReminders,
            },
          },
        );
      }

      return { previousEvent };
    },
    onError: (_, variables, context) => {
      if (context?.previousEvent) {
        queryClient.setQueryData(
          QUERY_KEYS.CALENDAR_EVENT(variables.eventId),
          context.previousEvent,
        );
      }
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.CALENDAR_EVENTS });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CALENDAR_EVENT(variables.eventId),
      });
    },
  });
}
