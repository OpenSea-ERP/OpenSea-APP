/**
 * Benefits CRUD Operations
 */

import { logger } from '@/lib/logger';
import type { BenefitPlan, CreateBenefitPlanData, UpdateBenefitPlanData } from '@/types/hr';
import { benefitPlansApi } from '../api';

/**
 * Criar novo plano de benefício
 */
export async function createBenefitPlan(
  data: Partial<BenefitPlan>
): Promise<BenefitPlan> {
  const createData: CreateBenefitPlanData = {
    name: data.name ?? '',
    type: data.type ?? 'VR',
    provider: data.provider ?? undefined,
    policyNumber: data.policyNumber ?? undefined,
    description: data.description ?? undefined,
    isActive: data.isActive ?? true,
    rules: data.rules ?? {},
  };
  return benefitPlansApi.create(createData);
}

/**
 * Atualizar plano de benefício existente
 */
export async function updateBenefitPlan(
  id: string,
  data: Partial<BenefitPlan>
): Promise<BenefitPlan> {
  const cleanData: UpdateBenefitPlanData = {};

  if (data.name !== undefined && data.name !== null) cleanData.name = data.name;
  if (data.type !== undefined && data.type !== null) cleanData.type = data.type;
  if (data.provider !== undefined) cleanData.provider = data.provider ?? undefined;
  if (data.policyNumber !== undefined) cleanData.policyNumber = data.policyNumber ?? undefined;
  if (data.description !== undefined) cleanData.description = data.description ?? undefined;
  if (data.isActive !== undefined && data.isActive !== null) cleanData.isActive = data.isActive;
  if (data.rules !== undefined) cleanData.rules = data.rules;

  return benefitPlansApi.update(id, cleanData);
}

/**
 * Deletar plano de benefício
 */
export async function deleteBenefitPlan(id: string): Promise<void> {
  return benefitPlansApi.delete(id);
}

/**
 * Duplicar plano de benefício existente
 */
export async function duplicateBenefitPlan(
  id: string,
  data?: Partial<BenefitPlan>
): Promise<BenefitPlan> {
  const original = await benefitPlansApi.get(id);

  const duplicateData: CreateBenefitPlanData = {
    name: data?.name || `${original.name} (cópia)`,
    type: original.type,
    provider: original.provider ?? undefined,
    policyNumber: undefined,
    description: original.description ?? undefined,
    isActive: original.isActive,
    rules: original.rules,
  };

  try {
    return benefitPlansApi.create(duplicateData);
  } catch (error) {
    logger.error(
      '[Benefits] Duplication failed',
      error instanceof Error ? error : undefined,
      { originalId: id }
    );
    throw error;
  }
}
