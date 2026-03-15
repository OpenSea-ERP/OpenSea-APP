import { authService } from '@/services/auth/auth.service';
import { meService } from '@/services/auth/me.service';
import { usersService } from '@/services/auth/users.service';
import type {
  LoginWithPinCredentials,
  SetAccessPinRequest,
  SetActionPinRequest,
  VerifyActionPinRequest,
} from '@/types/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { meKeys } from './use-me';

export function useLoginWithPin() {
  return useMutation({
    mutationFn: (credentials: LoginWithPinCredentials) =>
      authService.loginWithPin(credentials),
  });
}

export function useSetAccessPin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SetAccessPinRequest) => meService.setAccessPin(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: meKeys.all });
    },
  });
}

export function useSetActionPin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SetActionPinRequest) => meService.setActionPin(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: meKeys.all });
    },
  });
}

export function useVerifyActionPin() {
  return useMutation({
    mutationFn: (data: VerifyActionPinRequest) =>
      meService.verifyActionPin(data),
  });
}

export function useForceAccessPinReset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => usersService.forceAccessPinReset(userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useForceActionPinReset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => usersService.forceActionPinReset(userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
