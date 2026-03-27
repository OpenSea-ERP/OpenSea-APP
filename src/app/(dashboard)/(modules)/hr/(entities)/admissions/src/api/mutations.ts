/**
 * OpenSea OS - Admission Mutations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { admissionsService } from '@/services/hr/admissions.service';
import type {
  AdmissionInvite,
  CreateAdmissionData,
  UpdateAdmissionData,
} from '@/types/hr';
import { toast } from 'sonner';
import { translateError } from '@/lib/errors';
import { admissionKeys } from './keys';

/* ===========================================
   CREATE
   =========================================== */

export interface CreateAdmissionOptions {
  onSuccess?: (admission: AdmissionInvite) => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export function useCreateAdmission(options: CreateAdmissionOptions = {}) {
  const queryClient = useQueryClient();
  const {
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  return useMutation({
    mutationFn: async (data: CreateAdmissionData): Promise<AdmissionInvite> => {
      const response = await admissionsService.create(data);
      return response.admission;
    },
    onSuccess: admission => {
      queryClient.invalidateQueries({ queryKey: admissionKeys.lists() });
      if (showSuccessToast) {
        toast.success('Convite de admissão criado com sucesso!');
      }
      onSuccess?.(admission);
    },
    onError: (error: Error) => {
      if (showErrorToast) toast.error(translateError(error));
      onError?.(error);
    },
  });
}

/* ===========================================
   UPDATE
   =========================================== */

export interface UpdateAdmissionOptions {
  onSuccess?: (admission: AdmissionInvite) => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export function useUpdateAdmission(options: UpdateAdmissionOptions = {}) {
  const queryClient = useQueryClient();
  const {
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateAdmissionData;
    }): Promise<AdmissionInvite> => {
      const response = await admissionsService.update(id, data);
      return response.admission;
    },
    onSuccess: admission => {
      queryClient.invalidateQueries({ queryKey: admissionKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: admissionKeys.detail(admission.id),
      });
      if (showSuccessToast) {
        toast.success('Convite de admissão atualizado com sucesso!');
      }
      onSuccess?.(admission);
    },
    onError: (error: Error) => {
      if (showErrorToast) toast.error(translateError(error));
      onError?.(error);
    },
  });
}

/* ===========================================
   CANCEL
   =========================================== */

export interface CancelAdmissionOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export function useCancelAdmission(options: CancelAdmissionOptions = {}) {
  const queryClient = useQueryClient();
  const {
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await admissionsService.cancel(id);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: admissionKeys.lists() });
      queryClient.removeQueries({ queryKey: admissionKeys.detail(id) });
      if (showSuccessToast) {
        toast.success('Convite de admissão cancelado.');
      }
      onSuccess?.();
    },
    onError: (error: Error) => {
      if (showErrorToast) toast.error(translateError(error));
      onError?.(error);
    },
  });
}

/* ===========================================
   APPROVE
   =========================================== */

export interface ApproveAdmissionOptions {
  onSuccess?: (admission: AdmissionInvite) => void;
  onError?: (error: Error) => void;
}

export function useApproveAdmission(options: ApproveAdmissionOptions = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, onError } = options;

  return useMutation({
    mutationFn: async (id: string): Promise<AdmissionInvite> => {
      const response = await admissionsService.approve(id);
      return response.admission;
    },
    onSuccess: admission => {
      queryClient.invalidateQueries({ queryKey: admissionKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: admissionKeys.detail(admission.id),
      });
      toast.success('Admissão aprovada! Funcionário criado com sucesso.');
      onSuccess?.(admission);
    },
    onError: (error: Error) => {
      toast.error(translateError(error));
      onError?.(error);
    },
  });
}

/* ===========================================
   REJECT
   =========================================== */

export interface RejectAdmissionOptions {
  onSuccess?: (admission: AdmissionInvite) => void;
  onError?: (error: Error) => void;
}

export function useRejectAdmission(options: RejectAdmissionOptions = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, onError } = options;

  return useMutation({
    mutationFn: async ({
      id,
      reason,
    }: {
      id: string;
      reason: string;
    }): Promise<AdmissionInvite> => {
      const response = await admissionsService.reject(id, reason);
      return response.admission;
    },
    onSuccess: admission => {
      queryClient.invalidateQueries({ queryKey: admissionKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: admissionKeys.detail(admission.id),
      });
      toast.success('Admissão rejeitada.');
      onSuccess?.(admission);
    },
    onError: (error: Error) => {
      toast.error(translateError(error));
      onError?.(error);
    },
  });
}

/* ===========================================
   RESEND
   =========================================== */

export interface ResendAdmissionOptions {
  onSuccess?: (admission: AdmissionInvite) => void;
  onError?: (error: Error) => void;
}

export function useResendAdmission(options: ResendAdmissionOptions = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, onError } = options;

  return useMutation({
    mutationFn: async (id: string): Promise<AdmissionInvite> => {
      const response = await admissionsService.resend(id);
      return response.admission;
    },
    onSuccess: admission => {
      queryClient.invalidateQueries({
        queryKey: admissionKeys.detail(admission.id),
      });
      toast.success('Convite reenviado com sucesso!');
      onSuccess?.(admission);
    },
    onError: (error: Error) => {
      toast.error(translateError(error));
      onError?.(error);
    },
  });
}
