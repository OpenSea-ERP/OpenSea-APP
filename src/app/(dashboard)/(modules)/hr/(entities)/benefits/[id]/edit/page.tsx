/**
 * OpenSea OS - Benefit Plan Edit Page
 */

'use client';

import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { logger } from '@/lib/logger';
import type { BenefitPlan, BenefitType } from '@/types/hr';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart, Loader2, Save, X } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { benefitPlansApi } from '../../src';
import {
  BENEFIT_TYPE_LABELS,
  BENEFIT_TYPE_COLORS,
  BENEFIT_TYPE_OPTIONS,
} from '../../src/utils/benefits.utils';

export default function BenefitPlanEditPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const planId = params.id as string;

  // Form states
  const [planName, setPlanName] = useState('');
  const [planType, setPlanType] = useState<BenefitType>('VR');
  const [planProvider, setPlanProvider] = useState('');
  const [planPolicyNumber, setPlanPolicyNumber] = useState('');
  const [planDescription, setPlanDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const { data: plan, isLoading } = useQuery<BenefitPlan>({
    queryKey: ['benefit-plans', planId],
    queryFn: async () => {
      return benefitPlansApi.get(planId);
    },
  });

  // Sync states with plan data
  useEffect(() => {
    if (plan) {
      setPlanName(plan.name);
      setPlanType(plan.type);
      setPlanProvider(plan.provider || '');
      setPlanPolicyNumber(plan.policyNumber || '');
      setPlanDescription(plan.description || '');
      setIsActive(plan.isActive);
    }
  }, [plan]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSave = async () => {
    if (!plan || !planName) return;

    setIsSaving(true);
    try {
      await benefitPlansApi.update(planId, {
        name: planName,
        type: planType,
        provider: planProvider || undefined,
        policyNumber: planPolicyNumber || undefined,
        description: planDescription || undefined,
        isActive,
      });
      await queryClient.invalidateQueries({ queryKey: ['benefit-plans'] });
      toast.success('Plano de benefício atualizado com sucesso!');
      router.push(`/hr/benefits/${planId}`);
    } catch (error) {
      logger.error(
        'Erro ao salvar plano',
        error instanceof Error ? error : undefined
      );
      toast.error('Erro ao salvar plano de benefício');
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Recursos Humanos', href: '/hr' },
              { label: 'Benefícios', href: '/hr/benefits' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" size="md" />
        </PageBody>
      </PageLayout>
    );
  }

  if (!plan) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Recursos Humanos', href: '/hr' },
              { label: 'Benefícios', href: '/hr/benefits' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <Card className="bg-white/5 p-12 text-center">
            <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">
              Plano não encontrado
            </h2>
            <Button onClick={() => router.push('/hr/benefits')}>
              Voltar para Benefícios
            </Button>
          </Card>
        </PageBody>
      </PageLayout>
    );
  }

  const colors = BENEFIT_TYPE_COLORS[planType] || BENEFIT_TYPE_COLORS.FLEX;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Recursos Humanos', href: '/hr' },
            { label: 'Benefícios', href: '/hr/benefits' },
            {
              label: plan.name,
              href: `/hr/benefits/${planId}`,
            },
            { label: 'Editar' },
          ]}
          buttons={[
            {
              id: 'cancel',
              title: 'Cancelar',
              icon: X,
              onClick: () => router.push(`/hr/benefits/${planId}`),
              variant: 'outline',
              disabled: isSaving,
            },
            {
              id: 'save',
              title: 'Salvar',
              icon: Save,
              onClick: handleSave,
              disabled: isSaving,
            },
          ]}
        />

        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-xl shrink-0 bg-linear-to-br ${colors.gradient}`}
            >
              <Heart className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold tracking-tight">
                Editar Plano de Benefício
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {plan.name} - {BENEFIT_TYPE_LABELS[plan.type]}
              </p>
            </div>
            <Badge variant={plan.isActive ? 'success' : 'secondary'}>
              {plan.isActive ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        </Card>
      </PageHeader>

      <PageBody className="space-y-6">
        {/* Dados do Plano */}
        <Card className="p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <h3 className="text-lg font-semibold mb-4">Dados do Plano</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Plano Saúde Básico"
                  value={planName}
                  onChange={e => setPlanName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Tipo *</Label>
                <Select
                  value={planType}
                  onValueChange={(v: string) => setPlanType(v as BenefitType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {BENEFIT_TYPE_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="provider">Operadora/Fornecedor</Label>
                <Input
                  id="provider"
                  placeholder="Ex: Unimed, Alelo"
                  value={planProvider}
                  onChange={e => setPlanProvider(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="policyNumber">Número da Apólice</Label>
                <Input
                  id="policyNumber"
                  placeholder="Número do contrato"
                  value={planPolicyNumber}
                  onChange={e => setPlanPolicyNumber(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                placeholder="Descrição do plano (opcional)"
                value={planDescription}
                onChange={e => setPlanDescription(e.target.value)}
              />
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">Status</Label>
                <p className="text-sm text-muted-foreground">
                  {isActive ? 'Plano ativo' : 'Plano inativo'}
                </p>
              </div>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>
        </Card>
      </PageBody>
    </PageLayout>
  );
}
