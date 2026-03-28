/**
 * OpenSea OS - Onboarding Mutations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { onboardingService } from '@/services/hr/onboarding.service';
import type {
  CreateOnboardingChecklistData,
  OnboardingChecklist,
  UpdateOnboardingChecklistData,
} from '@/types/hr/onboarding.types';
import { toast } from 'sonner';
import { translateError } from '@/lib/errors';
import { onboardingKeys } from './keys';

/* ===========================================
   CREATE
   =========================================== */

export interface CreateOnboardingOptions {
  onSuccess?: (checklist: OnboardingChecklist) => void;
  onError?: (error: Error) => void;
}

export function useCreateOnboarding(options: CreateOnboardingOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: CreateOnboardingChecklistData
    ): Promise<OnboardingChecklist> => {
      const response = await onboardingService.createChecklist(data);
      return response.checklist;
    },
    onSuccess: checklist => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.all });
      toast.success('Checklist de onboarding criado com sucesso!');
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

export interface UpdateOnboardingVariables {
  id: string;
  data: UpdateOnboardingChecklistData;
}

export interface UpdateOnboardingOptions {
  onSuccess?: (checklist: OnboardingChecklist) => void;
  onError?: (error: Error) => void;
}

export function useUpdateOnboarding(options: UpdateOnboardingOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: UpdateOnboardingVariables): Promise<OnboardingChecklist> => {
      const response = await onboardingService.updateChecklist(id, data);
      return response.checklist;
    },
    onSuccess: (checklist, { id }) => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.all });
      queryClient.invalidateQueries({
        queryKey: onboardingKeys.detail(id),
      });
      toast.success('Checklist de onboarding atualizado!');
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

export interface DeleteOnboardingOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useDeleteOnboarding(options: DeleteOnboardingOptions = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await onboardingService.deleteChecklist(id);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: onboardingKeys.all });
      queryClient.removeQueries({ queryKey: onboardingKeys.detail(id) });
      toast.success('Checklist de onboarding excluído!');
      options.onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(translateError(error));
      options.onError?.(error);
    },
  });
}
