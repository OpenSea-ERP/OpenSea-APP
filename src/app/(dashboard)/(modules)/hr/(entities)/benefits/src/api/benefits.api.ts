import { benefitsService } from '@/services/hr';
import type {
  BenefitPlan,
  BenefitEnrollment,
  CreateBenefitPlanData,
  UpdateBenefitPlanData,
  EnrollEmployeeData,
  BulkEnrollData,
  UpdateEnrollmentData,
} from '@/types/hr';
import type {
  BenefitPlansResponse,
  ListBenefitPlansParams,
  BenefitEnrollmentsResponse,
  ListEnrollmentsParams,
} from '@/services/hr/benefits.service';

export const benefitPlansApi = {
  async list(params?: ListBenefitPlansParams): Promise<BenefitPlansResponse> {
    return benefitsService.listPlans(params);
  },

  async get(id: string): Promise<BenefitPlan> {
    const { benefitPlan } = await benefitsService.getPlan(id);
    return benefitPlan;
  },

  async create(data: CreateBenefitPlanData): Promise<BenefitPlan> {
    const { benefitPlan } = await benefitsService.createPlan(data);
    return benefitPlan;
  },

  async update(
    id: string,
    data: UpdateBenefitPlanData
  ): Promise<BenefitPlan> {
    const { benefitPlan } = await benefitsService.updatePlan(id, data);
    return benefitPlan;
  },

  async delete(id: string): Promise<void> {
    await benefitsService.deletePlan(id);
  },
};

export const enrollmentsApi = {
  async list(
    params?: ListEnrollmentsParams
  ): Promise<BenefitEnrollmentsResponse> {
    return benefitsService.listEnrollments(params);
  },

  async enroll(data: EnrollEmployeeData): Promise<BenefitEnrollment> {
    const { enrollment } = await benefitsService.enrollEmployee(data);
    return enrollment;
  },

  async bulkEnroll(data: BulkEnrollData) {
    return benefitsService.bulkEnroll(data);
  },

  async update(
    id: string,
    data: UpdateEnrollmentData
  ): Promise<BenefitEnrollment> {
    const { enrollment } = await benefitsService.updateEnrollment(id, data);
    return enrollment;
  },

  async cancel(id: string): Promise<void> {
    await benefitsService.cancelEnrollment(id);
  },
};

export type { BenefitPlansResponse, ListBenefitPlansParams };
