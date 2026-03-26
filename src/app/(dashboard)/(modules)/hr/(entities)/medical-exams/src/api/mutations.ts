/**
 * OpenSea OS - Medical Exam Mutations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { medicalExamsService } from '@/services/hr/medical-exams.service';
import type { MedicalExam, CreateMedicalExamData } from '@/types/hr';
import { toast } from 'sonner';
import { translateError } from '@/lib/errors';
import { medicalExamKeys } from './keys';

/* ===========================================
   CREATE
   =========================================== */

export interface CreateMedicalExamOptions {
  onSuccess?: (exam: MedicalExam) => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export function useCreateMedicalExam(options: CreateMedicalExamOptions = {}) {
  const queryClient = useQueryClient();
  const {
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  return useMutation({
    mutationFn: async (data: CreateMedicalExamData): Promise<MedicalExam> => {
      const response = await medicalExamsService.create(data);
      return response.medicalExam;
    },
    onSuccess: exam => {
      queryClient.invalidateQueries({ queryKey: medicalExamKeys.lists() });
      if (showSuccessToast) {
        toast.success('Exame médico registrado com sucesso!');
      }
      onSuccess?.(exam);
    },
    onError: (error: Error) => {
      if (showErrorToast) toast.error(translateError(error));
      onError?.(error);
    },
  });
}

/* ===========================================
   DELETE
   =========================================== */

export interface DeleteMedicalExamOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export function useDeleteMedicalExam(options: DeleteMedicalExamOptions = {}) {
  const queryClient = useQueryClient();
  const {
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await medicalExamsService.delete(id);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: medicalExamKeys.lists() });
      queryClient.removeQueries({ queryKey: medicalExamKeys.detail(id) });
      if (showSuccessToast) {
        toast.success('Exame médico excluído com sucesso!');
      }
      onSuccess?.();
    },
    onError: (error: Error) => {
      if (showErrorToast) toast.error(translateError(error));
      onError?.(error);
    },
  });
}
