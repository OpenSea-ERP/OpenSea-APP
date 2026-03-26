/**
 * OpenSea OS - CIPA Mutations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cipaService } from '@/services/hr/cipa.service';
import type {
  CipaMandate,
  CreateCipaMandateData,
  CipaMember,
  CreateCipaMemberData,
  UpdateCipaMemberData,
} from '@/types/hr';
import { toast } from 'sonner';
import { translateError } from '@/lib/errors';
import { cipaKeys } from './keys';

/* ===========================================
   CREATE MANDATE
   =========================================== */

export interface CreateCipaMandateOptions {
  onSuccess?: (mandate: CipaMandate) => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export function useCreateCipaMandate(options: CreateCipaMandateOptions = {}) {
  const queryClient = useQueryClient();
  const {
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  return useMutation({
    mutationFn: async (data: CreateCipaMandateData): Promise<CipaMandate> => {
      const response = await cipaService.createMandate(data);
      return response.mandate;
    },
    onSuccess: mandate => {
      queryClient.invalidateQueries({ queryKey: cipaKeys.mandates() });
      if (showSuccessToast) {
        toast.success('Mandato da CIPA criado com sucesso!');
      }
      onSuccess?.(mandate);
    },
    onError: (error: Error) => {
      if (showErrorToast) toast.error(translateError(error));
      onError?.(error);
    },
  });
}

/* ===========================================
   DELETE MANDATE
   =========================================== */

export interface DeleteCipaMandateOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export function useDeleteCipaMandate(options: DeleteCipaMandateOptions = {}) {
  const queryClient = useQueryClient();
  const {
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await cipaService.deleteMandate(id);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: cipaKeys.mandates() });
      queryClient.removeQueries({ queryKey: cipaKeys.mandateDetail(id) });
      if (showSuccessToast) {
        toast.success('Mandato da CIPA excluído com sucesso!');
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
   ADD MEMBER
   =========================================== */

export interface AddCipaMemberOptions {
  onSuccess?: (member: CipaMember) => void;
  onError?: (error: Error) => void;
}

export function useAddCipaMember(mandateId: string, options: AddCipaMemberOptions = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, onError } = options;

  return useMutation({
    mutationFn: async (data: CreateCipaMemberData): Promise<CipaMember> => {
      const response = await cipaService.addMember(mandateId, data);
      return response.member;
    },
    onSuccess: member => {
      queryClient.invalidateQueries({ queryKey: cipaKeys.members(mandateId) });
      toast.success('Membro adicionado com sucesso!');
      onSuccess?.(member);
    },
    onError: (error: Error) => {
      toast.error(translateError(error));
      onError?.(error);
    },
  });
}

/* ===========================================
   UPDATE MEMBER
   =========================================== */

export interface UpdateCipaMemberOptions {
  onSuccess?: (member: CipaMember) => void;
  onError?: (error: Error) => void;
}

export function useUpdateCipaMember(mandateId: string, options: UpdateCipaMemberOptions = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, onError } = options;

  return useMutation({
    mutationFn: async ({
      memberId,
      data,
    }: {
      memberId: string;
      data: UpdateCipaMemberData;
    }): Promise<CipaMember> => {
      const response = await cipaService.updateMember(mandateId, memberId, data);
      return response.member;
    },
    onSuccess: member => {
      queryClient.invalidateQueries({ queryKey: cipaKeys.members(mandateId) });
      toast.success('Membro atualizado com sucesso!');
      onSuccess?.(member);
    },
    onError: (error: Error) => {
      toast.error(translateError(error));
      onError?.(error);
    },
  });
}

/* ===========================================
   REMOVE MEMBER
   =========================================== */

export interface RemoveCipaMemberOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useRemoveCipaMember(mandateId: string, options: RemoveCipaMemberOptions = {}) {
  const queryClient = useQueryClient();
  const { onSuccess, onError } = options;

  return useMutation({
    mutationFn: async (memberId: string): Promise<void> => {
      await cipaService.removeMember(mandateId, memberId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cipaKeys.members(mandateId) });
      toast.success('Membro removido com sucesso!');
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(translateError(error));
      onError?.(error);
    },
  });
}
