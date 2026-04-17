/**
 * Public signing portal hooks — consumed by /sign/[token] and /verify/[code].
 *
 * These hooks do NOT require JWT authentication. They wrap the signingService
 * which hits public endpoints without an Authorization header.
 */

import { signingService } from '@/services/signature';
import type {
  SigningPageResponse,
  SignDocumentPayload,
  RejectDocumentPayload,
  VerifyByCodeResponse,
} from '@/services/signature';
import { useMutation, useQuery } from '@tanstack/react-query';

const SIGNING_PORTAL_KEYS = {
  signingPage: (token: string) => ['signature', 'public', 'sign', token],
  verifyByCode: (code: string) => ['signature', 'public', 'verify', code],
} as const;

export function useSigningPage(token: string | undefined) {
  return useQuery<SigningPageResponse>({
    queryKey: SIGNING_PORTAL_KEYS.signingPage(token ?? ''),
    queryFn: () => signingService.getSigningPage(token as string),
    enabled: Boolean(token),
    retry: false,
    staleTime: 30_000,
  });
}

export function useRequestOtp(token: string) {
  return useMutation({
    mutationKey: ['signature', 'public', 'request-otp', token],
    mutationFn: () => signingService.requestOtp(token),
  });
}

export function useVerifyOtp(token: string) {
  return useMutation({
    mutationKey: ['signature', 'public', 'verify-otp', token],
    mutationFn: (otpCode: string) => signingService.verifyOtp(token, otpCode),
  });
}

export function useSignDocument(token: string) {
  return useMutation({
    mutationKey: ['signature', 'public', 'sign', token],
    mutationFn: (payload: SignDocumentPayload) =>
      signingService.signDocument(token, payload),
  });
}

export function useRejectDocument(token: string) {
  return useMutation({
    mutationKey: ['signature', 'public', 'reject', token],
    mutationFn: (payload: RejectDocumentPayload) =>
      signingService.rejectDocument(token, payload),
  });
}

export function useVerifyByCode(code: string | undefined) {
  return useQuery<VerifyByCodeResponse>({
    queryKey: SIGNING_PORTAL_KEYS.verifyByCode(code ?? ''),
    queryFn: () => signingService.verifyByCode(code as string),
    enabled: Boolean(code),
    retry: false,
  });
}
