/**
 * OpenSea OS - Offboarding Mutations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { offboardingService } from '@/services/hr/offboarding.service';
import type {
  CreateOffboardingChecklistData,
  OffboardingChecklist,
  UpdateOffboardingChecklistData,
} from '@/types/hr/offboarding.types';
import { toast } from 'sonner';
import { translateError } from '@/lib/errors';
import { offboardingKeys } from './keys';

/* ===========================================
   CREATE
   =========================================== */

export interface CreateOffboardingOptions {
  onSuccess?: (checklist: OffboardingChecklist) => void;
  onError?: (error: Error) => void;
}

export function useCreateOffboarding(options: CreateOffboardingOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: CreateOffboardingChecklistData
    ): Promise<OffboardingChecklist> => {
      const response = await offboardingService.createChecklist(data);
      return response.checklist;
    },
    onSuccess: checklist => {
      queryClient.invalidateQueries({ queryKey: offboardingKeys.all });
      toast.success('Checklist de offboarding criado com sucesso!');
      options.onSuccess?.(checklist);
    },
    onError: (error: Error) => {
      toast.error(translateError(error));
      options.onError?.(error);
    },
  });
}

/* ===========================================
   UPDATE
   =========================================== */

export interface UpdateOffboardingVariables {
  id: string;
  data: UpdateOffboardingChecklistData;
}

export interface UpdateOffboardingOptions {
  onSuccess?: (checklist: OffboardingChecklist) => void;
  onError?: (error: Error) => void;
}

export function useUpdateOffboarding(options: UpdateOffboardingOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: UpdateOffboardingVariables): Promise<OffboardingChecklist> => {
      const response = await offboardingService.updateChecklist(id, data);
      return response.checklist;
    },
    onSuccess: (checklist, { id }) => {
      queryClient.invalidateQueries({ queryKey: offboardingKeys.all });
      queryClient.invalidateQueries({
        queryKey: offboardingKeys.detail(id),
      });
      toast.success('Checklist de offboarding atualizado!');
      options.onSuccess?.(checklist);
    },
    onError: (error: Error) => {
      toast.error(translateError(error));
      options.onError?.(error);
    },
  });
}

/* ===========================================
   DELETE
   =========================================== */

export interface DeleteOffboardingOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useDeleteOffboarding(options: DeleteOffboardingOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await offboardingService.deleteChecklist(id);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: offboardingKeys.all });
      queryClient.removeQueries({ queryKey: offboardingKeys.detail(id) });
      toast.success('Checklist de offboarding excluído!');
      options.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(translateError(error));
      options.onError?.(error);
    },
  });
}
