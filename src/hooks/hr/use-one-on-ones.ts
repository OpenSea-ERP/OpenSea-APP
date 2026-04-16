/**
 * One-on-One Meetings — React Query hooks
 *
 * Cobre listagem (infinite), detalhe, agendamento, atualização, cancelamento,
 * exclusão e CRUD aninhado de talking points e action items.
 */

import { oneOnOnesService } from '@/services/hr';
import type {
  AddActionItemData,
  AddTalkingPointData,
  ListOneOnOnesFilters,
  OneOnOneRecurrence,
  ScheduleOneOnOneData,
  UpdateActionItemData,
  UpdateOneOnOneData,
  UpdateTalkingPointData,
  UpsertNoteData,
} from '@/types/hr';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const ONE_ON_ONES_QUERY_KEYS = {
  all: ['hr', 'one-on-ones'] as const,
  list: (filters?: ListOneOnOnesFilters) =>
    ['hr', 'one-on-ones', 'list', filters ?? {}] as const,
  detail: (meetingId: string) =>
    ['hr', 'one-on-ones', 'detail', meetingId] as const,
};

const DEFAULT_PAGE_SIZE = 20;

// ============================================================================
// LIST (infinite)
// ============================================================================

export interface UseOneOnOnesOptions {
  filters?: Omit<ListOneOnOnesFilters, 'page' | 'perPage'>;
  perPage?: number;
  enabled?: boolean;
}

export function useOneOnOnes({
  filters,
  perPage = DEFAULT_PAGE_SIZE,
  enabled = true,
}: UseOneOnOnesOptions = {}) {
  return useInfiniteQuery({
    queryKey: ONE_ON_ONES_QUERY_KEYS.list({ ...filters, perPage }),
    queryFn: async ({ pageParam = 1 }) =>
      oneOnOnesService.listMeetings({
        ...filters,
        page: pageParam as number,
        perPage,
      }),
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      const currentPage = lastPage.meta?.page ?? 1;
      const totalPages = lastPage.meta?.totalPages ?? 1;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    enabled,
  });
}

// ============================================================================
// DETAIL
// ============================================================================

export function useOneOnOne(meetingId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ONE_ON_ONES_QUERY_KEYS.detail(meetingId ?? ''),
    queryFn: () => oneOnOnesService.getMeeting(meetingId as string),
    enabled: enabled && !!meetingId,
  });
}

// ============================================================================
// MEETING MUTATIONS
// ============================================================================

const RECURRENCE_DAY_OFFSET: Record<OneOnOneRecurrence, number> = {
  ONE_TIME: 0,
  WEEKLY: 7,
  BIWEEKLY: 14,
  MONTHLY: 30,
};

/**
 * Schedules a single 1:1, or a series when recurrence/occurrences are provided.
 * The backend exposes only single-meeting creation, so we simply chain the POSTs.
 */
export function useScheduleOneOnOne() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ScheduleOneOnOneData) => {
      const recurrence = payload.recurrence ?? 'ONE_TIME';
      const occurrences =
        recurrence === 'ONE_TIME'
          ? 1
          : Math.max(1, payload.occurrences ?? 1);
      const offset = RECURRENCE_DAY_OFFSET[recurrence];
      const baseDate = new Date(payload.scheduledAt);

      const created = [] as Awaited<
        ReturnType<typeof oneOnOnesService.scheduleMeeting>
      >[];
      for (let occurrenceIndex = 0; occurrenceIndex < occurrences; occurrenceIndex++) {
        const scheduledAt = new Date(baseDate);
        scheduledAt.setDate(scheduledAt.getDate() + occurrenceIndex * offset);
        const single = await oneOnOnesService.scheduleMeeting({
          reportId: payload.reportId,
          scheduledAt: scheduledAt.toISOString(),
          durationMinutes: payload.durationMinutes,
        });
        created.push(single);
      }
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ONE_ON_ONES_QUERY_KEYS.all });
    },
  });
}

export function useUpdateOneOnOne() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      meetingId,
      payload,
    }: {
      meetingId: string;
      payload: UpdateOneOnOneData;
    }) => oneOnOnesService.updateMeeting(meetingId, payload),
    onSuccess: (_data, { meetingId }) => {
      queryClient.invalidateQueries({
        queryKey: ONE_ON_ONES_QUERY_KEYS.detail(meetingId),
      });
      queryClient.invalidateQueries({ queryKey: ONE_ON_ONES_QUERY_KEYS.all });
    },
  });
}

/** Convenience wrapper that flips status to CANCELLED. */
export function useCancelOneOnOne() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (meetingId: string) =>
      oneOnOnesService.updateMeeting(meetingId, { status: 'CANCELLED' }),
    onSuccess: (_data, meetingId) => {
      queryClient.invalidateQueries({
        queryKey: ONE_ON_ONES_QUERY_KEYS.detail(meetingId),
      });
      queryClient.invalidateQueries({ queryKey: ONE_ON_ONES_QUERY_KEYS.all });
    },
  });
}

/** Convenience wrapper that flips status to COMPLETED. */
export function useCompleteOneOnOne() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (meetingId: string) =>
      oneOnOnesService.updateMeeting(meetingId, { status: 'COMPLETED' }),
    onSuccess: (_data, meetingId) => {
      queryClient.invalidateQueries({
        queryKey: ONE_ON_ONES_QUERY_KEYS.detail(meetingId),
      });
      queryClient.invalidateQueries({ queryKey: ONE_ON_ONES_QUERY_KEYS.all });
    },
  });
}

export function useDeleteOneOnOne() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (meetingId: string) =>
      oneOnOnesService.deleteMeeting(meetingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ONE_ON_ONES_QUERY_KEYS.all });
    },
  });
}

// ============================================================================
// TALKING POINT MUTATIONS
// ============================================================================

export function useAddTalkingPoint(meetingId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddTalkingPointData) =>
      oneOnOnesService.addTalkingPoint(meetingId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ONE_ON_ONES_QUERY_KEYS.detail(meetingId),
      });
    },
  });
}

export function useUpdateTalkingPoint(meetingId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      talkingPointId,
      payload,
    }: {
      talkingPointId: string;
      payload: UpdateTalkingPointData;
    }) => oneOnOnesService.updateTalkingPoint(talkingPointId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ONE_ON_ONES_QUERY_KEYS.detail(meetingId),
      });
    },
  });
}

export function useDeleteTalkingPoint(meetingId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (talkingPointId: string) =>
      oneOnOnesService.deleteTalkingPoint(talkingPointId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ONE_ON_ONES_QUERY_KEYS.detail(meetingId),
      });
    },
  });
}

// ============================================================================
// ACTION ITEM MUTATIONS
// ============================================================================

export function useAddActionItem(meetingId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddActionItemData) =>
      oneOnOnesService.addActionItem(meetingId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ONE_ON_ONES_QUERY_KEYS.detail(meetingId),
      });
    },
  });
}

export function useUpdateActionItem(meetingId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      actionItemId,
      payload,
    }: {
      actionItemId: string;
      payload: UpdateActionItemData;
    }) => oneOnOnesService.updateActionItem(actionItemId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ONE_ON_ONES_QUERY_KEYS.detail(meetingId),
      });
    },
  });
}

export function useDeleteActionItem(meetingId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (actionItemId: string) =>
      oneOnOnesService.deleteActionItem(actionItemId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ONE_ON_ONES_QUERY_KEYS.detail(meetingId),
      });
    },
  });
}

// ============================================================================
// NOTES MUTATION (debounced auto-save lives in the page)
// ============================================================================

export function useUpsertOneOnOneNote(meetingId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpsertNoteData) =>
      oneOnOnesService.upsertNote(meetingId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ONE_ON_ONES_QUERY_KEYS.detail(meetingId),
      });
    },
  });
}
