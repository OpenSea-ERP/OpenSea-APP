import { authService } from '@/services';
import type {
  AuthResponse,
  LoginCredentials,
  MessageResponse,
  RegisterData,
  RegisterResponse,
  ResetPasswordRequest,
  SendPasswordResetRequest,
} from '@/types/auth';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// Query Keys
export const authKeys = {
  all: ['auth'] as const,
  login: () => [...authKeys.all, 'login'] as const,
  register: () => [...authKeys.all, 'register'] as const,
  sendPasswordReset: () => [...authKeys.all, 'send-password-reset'] as const,
  resetPassword: () => [...authKeys.all, 'reset-password'] as const,
  refresh: () => [...authKeys.all, 'refresh'] as const,
};

// Mutations

/**
 * Hook para fazer login
 * POST /v1/auth/login/password
 */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation<AuthResponse, Error, LoginCredentials>({
    mutationKey: authKeys.login(),
    mutationFn: credentials => authService.login(credentials),
    onSuccess: async () => {
      // Invalidate user queries after successful login
      await queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

/**
 * Hook para registrar novo usuário
 * POST /v1/auth/register/password
 */
export function useRegister() {
  return useMutation<RegisterResponse, Error, RegisterData>({
    mutationKey: authKeys.register(),
    mutationFn: data => authService.register(data),
  });
}

/**
 * Hook para enviar email de recuperação de senha
 * POST /v1/auth/send/password
 */
export function useSendPasswordReset() {
  return useMutation<MessageResponse, Error, SendPasswordResetRequest>({
    mutationKey: authKeys.sendPasswordReset(),
    mutationFn: data => authService.sendPasswordReset(data),
  });
}

/**
 * Hook para resetar senha com token
 * POST /v1/auth/reset/password
 */
export function useResetPassword() {
  return useMutation<MessageResponse, Error, ResetPasswordRequest>({
    mutationKey: authKeys.resetPassword(),
    mutationFn: data => authService.resetPassword(data),
  });
}

/**
 * Hook para renovar token de acesso
 * POST /v1/sessions/refresh
 */
export function useRefreshToken() {
  const queryClient = useQueryClient();

  return useMutation<AuthResponse, Error, void>({
    mutationKey: authKeys.refresh(),
    mutationFn: () => authService.refreshToken(),
    onSuccess: async () => {
      // Invalidate user queries after successful refresh
      await queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}
