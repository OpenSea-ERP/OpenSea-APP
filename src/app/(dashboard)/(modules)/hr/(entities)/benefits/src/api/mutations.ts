/**
 * OpenSea OS - Benefits Mutations
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { benefitsService } from '@/services/hr/benefits.service';
import type {
  BenefitPlan,
  CreateBenefitPlanData,
  UpdateBenefitPlanData,
  EnrollEmployeeData,
  BenefitEnrollment,
} from '@/types/hr';
import { toast } from 'sonner';
import { translateError } from '@/lib/errors';
import { benefitKeys } from './keys';

/* ===========================================
   CREATE PLAN
   =========================================== */

export interface CreateBenefitPlanOptions {
  onSuccess?: (plan: BenefitPlan) => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export function useCreateBenefitPlan(options: CreateBenefitPlanOptions = {}) {
  const queryClient = useQueryClient();
  const {
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  return useMutation({
    mutationFn: async (data: CreateBenefitPlanData): Promise<BenefitPlan> => {
      const response = await benefitsService.createPlan(data);
      return response.benefitPlan;
    },
    onSuccess: plan => {
      queryClient.invalidateQueries({ queryKey: benefitKeys.all });
      if (showSuccessToast) {
        toast.success(`Plano "${plan.name}" criado com sucesso!`);
      }
      onSuccess?.(plan);
    },
    onError: (error: Error) => {
      if (showErrorToast) toast.error(translateError(error));
      onError?.(error);
    },
  });
}

/* ===========================================
   UPDATE PLAN
   =========================================== */

export interface UpdateBenefitPlanVariables {
  id: string;
  data: UpdateBenefitPlanData;
}

export interface UpdateBenefitPlanOptions {
  onSuccess?: (plan: BenefitPlan) => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export function useUpdateBenefitPlan(options: UpdateBenefitPlanOptions = {}) {
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
    }: UpdateBenefitPlanVariables): Promise<BenefitPlan> => {
      const response = await benefitsService.updatePlan(id, data);
      return response.benefitPlan;
    },
    onSuccess: (plan, { id }) => {
      queryClient.invalidateQueries({ queryKey: benefitKeys.all });
      queryClient.invalidateQueries({ queryKey: benefitKeys.detail(id) });
      if (showSuccessToast) {
        toast.success(`Plano "${plan.name}" atualizado!`);
      }
      onSuccess?.(plan);
    },
    onError: (error: Error) => {
      if (showErrorToast) toast.error(translateError(error));
      onError?.(error);
    },
  });
}

/* ===========================================
   DELETE PLAN
   =========================================== */

export interface DeleteBenefitPlanOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export function useDeleteBenefitPlan(options: DeleteBenefitPlanOptions = {}) {
  const queryClient = useQueryClient();
  const {
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await benefitsService.deletePlan(id);
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: benefitKeys.all });
      queryClient.removeQueries({ queryKey: benefitKeys.detail(id) });
      if (showSuccessToast) {
        toast.success('Plano excluído com sucesso!');
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
   ENROLL EMPLOYEE
   =========================================== */

export interface EnrollEmployeeOptions {
  onSuccess?: (enrollment: BenefitEnrollment) => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export function useEnrollEmployee(options: EnrollEmployeeOptions = {}) {
  const queryClient = useQueryClient();
  const {
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  return useMutation({
    mutationFn: async (
      data: EnrollEmployeeData
    ): Promise<BenefitEnrollment> => {
      const response = await benefitsService.enrollEmployee(data);
      return response.enrollment;
    },
    onSuccess: enrollment => {
      queryClient.invalidateQueries({
        queryKey: benefitKeys.enrollments(),
      });
      queryClient.invalidateQueries({ queryKey: benefitKeys.all });
      if (showSuccessToast) {
        toast.success('Funcionário inscrito com sucesso!');
      }
      onSuccess?.(enrollment);
    },
    onError: (error: Error) => {
      if (showErrorToast) toast.error(translateError(error));
      onError?.(error);
    },
  });
}

/* ===========================================
   CANCEL ENROLLMENT
   =========================================== */

export interface CancelEnrollmentOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export function useCancelEnrollment(options: CancelEnrollmentOptions = {}) {
  const queryClient = useQueryClient();
  const {
    onSuccess,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await benefitsService.cancelEnrollment(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: benefitKeys.enrollments(),
      });
      queryClient.invalidateQueries({ queryKey: benefitKeys.all });
      if (showSuccessToast) {
        toast.success('Inscrição cancelada com sucesso!');
      }
      onSuccess?.();
    },
    onError: (error: Error) => {
      if (showErrorToast) toast.error(translateError(error));
      onError?.(error);
    },
  });
}
