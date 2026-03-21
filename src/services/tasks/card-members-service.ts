import { API_ENDPOINTS } from '@/config/api';
import { apiClient } from '@/lib/api-client';

export interface CardMember {
  userId: string;
  userName: string | null;
  userEmail: string | null;
  userAvatarUrl: string | null;
  addedAt: string;
}

export interface CardMembersResponse {
  members: CardMember[];
}

export interface CardMemberResponse {
  member: CardMember;
}

export const cardMembersService = {
  async list(
    boardId: string,
    cardId: string
  ): Promise<CardMembersResponse> {
    return apiClient.get<CardMembersResponse>(
      API_ENDPOINTS.TASKS.MEMBERS.LIST(boardId, cardId)
    );
  },

  async add(
    boardId: string,
    cardId: string,
    data: { userId: string }
  ): Promise<CardMemberResponse> {
    return apiClient.post<CardMemberResponse>(
      API_ENDPOINTS.TASKS.MEMBERS.ADD(boardId, cardId),
      data
    );
  },

  async remove(
    boardId: string,
    cardId: string,
    userId: string
  ): Promise<void> {
    await apiClient.delete<void>(
      API_ENDPOINTS.TASKS.MEMBERS.REMOVE(boardId, cardId, userId)
    );
  },
};
