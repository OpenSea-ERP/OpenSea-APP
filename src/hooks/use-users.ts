import { usersService } from '@/services';
import type {
  CreateUserRequest,
  MessageResponse,
  ProfileResponse,
  UpdateUserEmailRequest,
  UpdateUserPasswordRequest,
  UpdateUserProfileRequest,
  UpdateUserUsernameRequest,
  UserResponse,
  UsersResponse,
} from '@/types/auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Query Keys
export const usersKeys = {
  all: ['users'] as const,
  lists: () => [...usersKeys.all, 'list'] as const,
  list: (filters?: string) => [...usersKeys.lists(), filters] as const,
  details: () => [...usersKeys.all, 'detail'] as const,
  detail: (id: string) => [...usersKeys.details(), id] as const,
  byEmail: (email: string) => [...usersKeys.all, 'email', email] as const,
  byUsername: (username: string) =>
    [...usersKeys.all, 'username', username] as const,
  online: () => [...usersKeys.all, 'online'] as const,
};

// Queries

/**
 * Hook para listar todos os usuários
 * GET /v1/users
 * @requires core.users.list permission
 */
export function useUsers(enabled = true) {
  return useQuery<UsersResponse, Error>({
    queryKey: usersKeys.lists(),
    queryFn: () => usersService.listUsers(),
    enabled,
  });
}

/**
 * Hook para obter usuário por ID
 * GET /v1/users/:userId
 * @requires core.users.read permission
 */
export function useUser(userId: string, enabled = true) {
  return useQuery<UserResponse, Error>({
    queryKey: usersKeys.detail(userId),
    queryFn: () => usersService.getUser(userId),
    enabled: enabled && !!userId,
  });
}

/**
 * Hook para obter usuário por email
 * GET /v1/users/email/:email
 * @requires core.users.read permission
 */
export function useUserByEmail(email: string, enabled = true) {
  return useQuery<UserResponse, Error>({
    queryKey: usersKeys.byEmail(email),
    queryFn: () => usersService.getUserByEmail(email),
    enabled: enabled && !!email,
  });
}

/**
 * Hook para obter usuário por username
 * GET /v1/users/username/:username
 * @requires core.users.read permission
 */
export function useUserByUsername(username: string, enabled = true) {
  return useQuery<UserResponse, Error>({
    queryKey: usersKeys.byUsername(username),
    queryFn: () => usersService.getUserByUsername(username),
    enabled: enabled && !!username,
  });
}

/**
 * Hook para listar usuários online
 * GET /v1/users/online
 * @requires core.users.list permission
 */
export function useOnlineUsers(enabled = true) {
  return useQuery<UsersResponse, Error>({
    queryKey: usersKeys.online(),
    queryFn: () => usersService.getOnlineUsers(),
    enabled,
  });
}

// Mutations

/**
 * Hook para criar novo usuário
 * POST /v1/users
 * @requires core.users.create permission
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation<UserResponse, Error, CreateUserRequest>({
    mutationFn: data => usersService.createUser(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
    },
  });
}

/**
 * Hook para atualizar email de um usuário
 * PATCH /v1/users/:userId/email
 * @requires core.users.update permission
 */
export function useUpdateUserEmail() {
  const queryClient = useQueryClient();

  return useMutation<
    UserResponse,
    Error,
    { userId: string; data: UpdateUserEmailRequest }
  >({
    mutationFn: ({ userId, data }) =>
      usersService.updateUserEmail(userId, data),
    onSuccess: async (_, { userId }) => {
      await queryClient.invalidateQueries({
        queryKey: usersKeys.detail(userId),
      });
      await queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
    },
  });
}

/**
 * Hook para atualizar username de um usuário
 * PATCH /v1/users/:userId/username
 * @requires core.users.update permission
 */
export function useUpdateUserUsername() {
  const queryClient = useQueryClient();

  return useMutation<
    UserResponse,
    Error,
    { userId: string; data: UpdateUserUsernameRequest }
  >({
    mutationFn: ({ userId, data }) =>
      usersService.updateUserUsername(userId, data),
    onSuccess: async (_, { userId }) => {
      await queryClient.invalidateQueries({
        queryKey: usersKeys.detail(userId),
      });
      await queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
    },
  });
}

/**
 * Hook para atualizar senha de um usuário
 * PATCH /v1/users/:userId/password
 * @requires core.users.update permission
 */
export function useUpdateUserPassword() {
  return useMutation<
    MessageResponse,
    Error,
    { userId: string; data: UpdateUserPasswordRequest }
  >({
    mutationFn: ({ userId, data }) =>
      usersService.updateUserPassword(userId, data),
  });
}

/**
 * Hook para atualizar perfil de um usuário
 * PATCH /v1/users/:userId
 * @requires core.users.update permission
 */
export function useUpdateUserProfile() {
  const queryClient = useQueryClient();

  return useMutation<
    ProfileResponse,
    Error,
    { userId: string; data: UpdateUserProfileRequest }
  >({
    mutationFn: ({ userId, data }) =>
      usersService.updateUserProfile(userId, data),
    onSuccess: async (_, { userId }) => {
      await queryClient.invalidateQueries({
        queryKey: usersKeys.detail(userId),
      });
      await queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
    },
  });
}

/**
 * Hook para deletar um usuário
 * DELETE /v1/users/:userId
 * @requires core.users.delete permission
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: userId => usersService.deleteUser(userId),
    onSuccess: async (_, userId) => {
      await queryClient.invalidateQueries({ queryKey: usersKeys.lists() });
      queryClient.removeQueries({ queryKey: usersKeys.detail(userId) });
    },
  });
}
