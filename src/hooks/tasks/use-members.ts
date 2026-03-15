import { membersService } from '@/services/tasks';
import type {
  AddBoardMemberRequest,
  UpdateBoardMemberRequest,
} from '@/types/tasks';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BOARD_QUERY_KEYS } from './use-boards';

export const MEMBER_QUERY_KEYS = {
  MEMBERS: (boardId: string) => ['task-members', boardId],
} as const;

export function useInviteMember(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: AddBoardMemberRequest) =>
      membersService.invite(boardId, data),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: BOARD_QUERY_KEYS.BOARD(boardId) });
    },
  });
}

export function useUpdateMemberRole(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      memberId,
      data,
    }: {
      memberId: string;
      data: UpdateBoardMemberRequest;
    }) => membersService.updateRole(boardId, memberId, data),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: BOARD_QUERY_KEYS.BOARD(boardId) });
    },
  });
}

export function useRemoveMember(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => membersService.remove(boardId, memberId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: BOARD_QUERY_KEYS.BOARD(boardId) });
    },
  });
}
