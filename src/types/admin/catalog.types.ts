export interface SkillDefinition {
  id: string;
  code: string;
  name: string;
  description: string | null;
  module: string | null;
  parentSkillCode: string | null;
  category: string;
  isCore: boolean;
  isVisible: boolean;
  iconUrl: string | null;
  requiresSetup: boolean;
  sortOrder: number;
  pricing?: SkillPricing;
}

export interface SkillPricing {
  id: string;
  skillCode: string;
  pricingType: 'FLAT' | 'PER_UNIT' | 'USAGE';
  flatPrice: number | null;
  unitPrice: number | null;
  unitMetric: string | null;
  unitMetricLabel: string | null;
  freeQuota: number | null;
  usageIncluded: number | null;
  usagePrice: number | null;
  usageMetric: string | null;
  usageMetricLabel: string | null;
  annualDiscount: number | null;
  isActive: boolean;
}

export interface SkillTreeNode {
  skill: SkillDefinition;
  pricing?: SkillPricing;
  children: SkillTreeNode[];
}
