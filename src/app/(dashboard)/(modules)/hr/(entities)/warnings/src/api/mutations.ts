/**
 * OpenSea OS - Warnings Mutations (HR)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  CreateWarningData,
  UpdateWarningData,
  RevokeWarningData,
} from '@/types/hr';
import { toast } from 'sonner';
import { warningsApi } from './warnings.api';
import { warningKeys } from './keys';

export function useCreateWarning() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateWarningData) => warningsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warningKeys.all });
      toast.success('Advertência registrada com sucesso');
    },
    onError: () => {
      toast.error('Erro ao registrar advertência');
    },
  });
}

export function useUpdateWarning() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateWarningData }) =>
      warningsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warningKeys.all });
      toast.success('Advertência atualizada com sucesso');
    },
    onError: () => {
      toast.error('Erro ao atualizar advertência');
    },
  });
}

export function useDeleteWarning() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => warningsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warningKeys.all });
      toast.success('Advertência excluída com sucesso');
    },
    onError: () => {
      toast.error('Erro ao excluir advertência');
    },
  });
}

export function useRevokeWarning() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RevokeWarningData }) =>
      warningsApi.revoke(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warningKeys.all });
      toast.success('Advertência revogada com sucesso');
    },
    onError: () => {
      toast.error('Erro ao revogar advertência');
    },
  });
}

export function useAcknowledgeWarning() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => warningsApi.acknowledge(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: warningKeys.all });
      toast.success('Advertência reconhecida com sucesso');
    },
    onError: () => {
      toast.error('Erro ao reconhecer advertência');
    },
  });
}
