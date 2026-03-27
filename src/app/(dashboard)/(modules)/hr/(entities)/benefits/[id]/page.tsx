/**
 * OpenSea OS - Benefit Plan Detail Page
 */

'use client';

import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { InfoField } from '@/components/shared/info-field';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { benefitsService } from '@/services/hr/benefits.service';
import type { BenefitPlan, BenefitEnrollment } from '@/types/hr';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  Calendar,
  Clock,
  Edit,
  Heart,
  NotebookText,
  ScrollText,
  Trash,
  UserPlus,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { benefitPlansApi, deleteBenefitPlan } from '../src';
import {
  BENEFIT_TYPE_LABELS,
  BENEFIT_TYPE_COLORS,
  getBenefitRuleDescription,
  formatCurrency,
  ENROLLMENT_STATUS_LABELS,
  ENROLLMENT_STATUS_COLORS,
} from '../src/utils/benefits.utils';
import { logger } from '@/lib/logger';
import dynamic from 'next/dynamic';

const EnrollModal = dynamic(
  () =>
    import('../src/modals/enroll-modal').then(m => ({
      default: m.EnrollModal,
    })),
  { ssr: false }
);

export default function BenefitPlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const planId = params.id as string;

  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const { data: plan, isLoading } = useQuery<BenefitPlan>({
    queryKey: ['benefit-plans', planId],
    queryFn: async () => {
      return benefitPlansApi.get(planId);
    },
  });

  const { data: enrollmentsData } = useQuery({
    queryKey: ['benefit-enrollments', 'by-plan', planId],
    queryFn: async () => {
      const response = await benefitsService.listEnrollments({
        benefitPlanId: planId,
        perPage: 50,
      });
      return response.enrollments;
    },
    enabled: !!planId,
  });

  const enrollments = enrollmentsData || [];

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleEdit = () => {
    router.push(`/hr/benefits/${planId}/edit`);
  };

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!plan) return;

    setIsDeleting(true);
    try {
      await deleteBenefitPlan(plan.id);
      await queryClient.invalidateQueries({ queryKey: ['benefit-plans'] });
      toast.success('Plano de benefício excluído com sucesso!');
      router.push('/hr/benefits');
    } catch (error) {
      logger.error(
        'Erro ao excluir plano',
        error instanceof Error ? error : undefined
      );
      toast.error('Erro ao excluir plano de benefício');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEnroll = async (employeeIds: string[], startDate: string) => {
    setIsEnrolling(true);
    try {
      if (employeeIds.length === 1) {
        await benefitsService.enrollEmployee({
          employeeId: employeeIds[0],
          benefitPlanId: planId,
          startDate,
        });
      } else {
        await benefitsService.bulkEnroll({
          employeeIds,
          benefitPlanId: planId,
          startDate,
        });
      }
      await queryClient.invalidateQueries({
        queryKey: ['benefit-enrollments'],
      });
      await queryClient.invalidateQueries({ queryKey: ['benefit-plans'] });
      toast.success(
        `${employeeIds.length} funcionário${employeeIds.length !== 1 ? 's' : ''} inscrito${employeeIds.length !== 1 ? 's' : ''} com sucesso!`
      );
    } catch (error) {
      logger.error(
        'Erro ao inscrever funcionários',
        error instanceof Error ? error : undefined
      );
      toast.error('Erro ao inscrever funcionários');
    } finally {
      setIsEnrolling(false);
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

  const colors = BENEFIT_TYPE_COLORS[plan.type];
  const typeLabel = BENEFIT_TYPE_LABELS[plan.type] || plan.type;
  const ruleDescription = getBenefitRuleDescription(plan.type);

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
            { label: plan.name },
          ]}
          buttons={[
            {
              id: 'delete',
              title: 'Excluir',
              icon: Trash,
              onClick: handleDelete,
              variant: 'outline',
              disabled: isDeleting,
            },
            {
              id: 'edit',
              title: 'Editar',
              icon: Edit,
              onClick: handleEdit,
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
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">
                  {plan.name}
                </h1>
                <Badge variant={plan.isActive ? 'success' : 'secondary'}>
                  {plan.isActive ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${colors.bg} ${colors.text}`}
                >
                  {typeLabel}
                </span>
                {plan.provider && (
                  <span className="text-sm text-muted-foreground">
                    {plan.provider}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 shrink-0 text-sm">
              {plan.createdAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 text-pink-500" />
                  <span>
                    {new Date(plan.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
              {plan.updatedAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span>
                    {new Date(plan.updatedAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </PageHeader>

      <PageBody className="space-y-6">
        {/* Detalhes do Plano */}
        <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4">
            <NotebookText className="h-5 w-5" />
            Detalhes do Plano
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <InfoField
              label="Nome"
              value={plan.name}
              showCopyButton
              copyTooltip="Copiar Nome"
            />
            <InfoField
              label="Tipo"
              value={typeLabel}
              badge={
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${colors.bg} ${colors.text}`}
                >
                  {typeLabel}
                </span>
              }
            />
            <InfoField
              label="Status"
              value={plan.isActive ? 'Ativo' : 'Inativo'}
              badge={
                <Badge variant={plan.isActive ? 'success' : 'secondary'}>
                  {plan.isActive ? 'Ativo' : 'Inativo'}
                </Badge>
              }
            />
            <InfoField
              label="Operadora/Fornecedor"
              value={plan.provider || 'Não informado'}
            />
            <InfoField
              label="Número da Apólice"
              value={plan.policyNumber || 'Não informado'}
              showCopyButton={!!plan.policyNumber}
              copyTooltip="Copiar Apólice"
            />
          </div>
          {plan.description && (
            <div className="mt-6">
              <InfoField
                label="Descrição"
                value={plan.description}
                showCopyButton
                copyTooltip="Copiar Descrição"
              />
            </div>
          )}
        </Card>

        {/* Regras */}
        <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4">
            <ScrollText className="h-5 w-5" />
            Regras do Tipo
          </h3>
          <div className="p-4 rounded-lg border bg-muted/30">
            <p className="text-sm font-medium mb-1">{typeLabel}</p>
            <p className="text-sm text-muted-foreground">{ruleDescription}</p>
          </div>
          {plan.rules && Object.keys(plan.rules).length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Regras Customizadas
              </p>
              <div className="grid md:grid-cols-2 gap-3">
                {Object.entries(plan.rules).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <span className="text-sm font-medium">{key}</span>
                    <span className="text-sm text-muted-foreground">
                      {typeof value === 'number'
                        ? formatCurrency(value)
                        : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Inscritos */}
        <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg uppercase font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" />
              Inscritos
              <Badge variant="secondary" className="ml-2">
                {enrollments.length}
              </Badge>
            </h3>
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsEnrollModalOpen(true)}
            >
              <UserPlus className="h-4 w-4 mr-1" />
              Inscrever Funcionários
            </Button>
          </div>
          {enrollments.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4">
              Nenhum funcionário inscrito neste plano.
            </p>
          ) : (
            <div className="space-y-2">
              {enrollments.slice(0, 10).map((enrollment: BenefitEnrollment) => (
                <Link
                  key={enrollment.id}
                  href={`/hr/employees/${enrollment.employeeId}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-linear-to-br from-pink-500 to-pink-600 flex items-center justify-center text-white text-sm font-medium">
                      {enrollment.employee?.fullName?.charAt(0)?.toUpperCase() ||
                        '?'}
                    </div>
                    <div>
                      <p className="font-medium">
                        {enrollment.employee?.fullName || 'Funcionário'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Desde{' '}
                        {new Date(enrollment.startDate).toLocaleDateString(
                          'pt-BR'
                        )}
                        {enrollment.employeeContribution > 0 &&
                          ` - Contribuição: ${formatCurrency(enrollment.employeeContribution)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        ENROLLMENT_STATUS_COLORS[enrollment.status]
                      }
                    >
                      {ENROLLMENT_STATUS_LABELS[enrollment.status]}
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                </Link>
              ))}
              {enrollments.length > 10 && (
                <p className="text-sm text-muted-foreground text-center pt-2">
                  + {enrollments.length - 10} outros inscritos
                </p>
              )}
            </div>
          )}
        </Card>
      </PageBody>

      <VerifyActionPinModal
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onSuccess={confirmDelete}
        title="Excluir Plano de Benefício"
        description={`Digite seu PIN de ação para excluir o plano "${plan.name}". Esta ação não pode ser desfeita.`}
      />

      <EnrollModal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        planId={planId}
        planName={plan.name}
        isSubmitting={isEnrolling}
        onSubmit={handleEnroll}
      />
    </PageLayout>
  );
}
