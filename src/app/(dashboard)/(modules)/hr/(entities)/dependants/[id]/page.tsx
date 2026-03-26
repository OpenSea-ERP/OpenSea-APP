'use client';

import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { InfoField } from '@/components/shared/info-field';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { EmployeeDependant } from '@/types/hr';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Clock,
  CreditCard,
  Heart,
  Shield,
  Trash,
  User,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { dependantsService } from '@/services/hr/dependants.service';
import { employeesService } from '@/services/hr/employees.service';
import {
  dependantKeys,
  formatDate,
  formatCpf,
  calculateAge,
  getRelationshipLabel,
  getRelationshipColor,
  getDependantBadges,
} from '../src';

export default function DependantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const dependantId = params.id as string;

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // ============================================================================
  // DATA FETCHING
  // We need to find the dependant across all employees since we only have the ID
  // ============================================================================

  const { data: detailData, isLoading } = useQuery<{
    dependant: EmployeeDependant;
    employeeName: string;
  } | null>({
    queryKey: dependantKeys.detail(dependantId),
    queryFn: async () => {
      // Fetch all employees, then search for the dependant in each
      const employeesResponse = await employeesService.listEmployees({
        perPage: 200,
        status: 'ACTIVE',
      });
      const employees = employeesResponse.employees ?? [];

      for (const employee of employees) {
        try {
          const response = await dependantsService.list(employee.id);
          const dependants = response.dependants ?? [];
          const found = dependants.find(
            (d: EmployeeDependant) => d.id === dependantId
          );
          if (found) {
            return {
              dependant: found,
              employeeName: employee.fullName,
            };
          }
        } catch {
          // Skip employees that fail
        }
      }

      return null;
    },
    staleTime: 5 * 60 * 1000,
  });

  const dependant = detailData?.dependant;
  const employeeName = detailData?.employeeName;

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleDelete = useCallback(async () => {
    if (!dependant) return;
    await dependantsService.delete(dependant.employeeId, dependant.id);
    queryClient.invalidateQueries({ queryKey: dependantKeys.lists() });
    setIsDeleteModalOpen(false);
    router.push('/hr/dependants');
  }, [dependant, queryClient, router]);

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Dependentes', href: '/hr/dependants' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" size="md" />
        </PageBody>
      </PageLayout>
    );
  }

  if (!dependant) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Dependentes', href: '/hr/dependants' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <Card className="bg-white/5 p-12 text-center">
            <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">
              Dependente não encontrado
            </h2>
            <Button onClick={() => router.push('/hr/dependants')}>
              Voltar para Dependentes
            </Button>
          </Card>
        </PageBody>
      </PageLayout>
    );
  }

  const age = calculateAge(dependant.birthDate);
  const badges = getDependantBadges(dependant);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'RH', href: '/hr' },
            { label: 'Dependentes', href: '/hr/dependants' },
            { label: dependant.name },
          ]}
          buttons={[
            {
              id: 'delete',
              title: 'Excluir',
              icon: Trash,
              onClick: () => setIsDeleteModalOpen(true),
              variant: 'outline',
            },
          ]}
        />

        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl shrink-0 bg-linear-to-br from-pink-500 to-pink-600">
              <Heart className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight">
                  {dependant.name}
                </h1>
                {badges.map((badge, i) => (
                  <Badge key={i} variant={badge.variant}>
                    {badge.label}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Funcionário: {employeeName ?? 'Desconhecido'}
              </p>
            </div>
            <div className="flex flex-col gap-2 shrink-0 text-sm">
              {dependant.createdAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 text-pink-500" />
                  <span>{formatDate(dependant.createdAt)}</span>
                </div>
              )}
              {dependant.updatedAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 text-pink-500" />
                  <span>{formatDate(dependant.updatedAt)}</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </PageHeader>

      <PageBody className="space-y-6">
        {/* Dados Pessoais */}
        <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4">
            <User className="h-5 w-5" />
            Dados Pessoais
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <InfoField label="Nome Completo" value={dependant.name} />
            <InfoField
              label="CPF"
              value={formatCpf(dependant.cpf)}
              icon={<CreditCard className="h-4 w-4" />}
            />
            <InfoField
              label="Data de Nascimento"
              value={
                formatDate(dependant.birthDate) +
                (age !== null ? ` (${age} anos)` : '')
              }
              icon={<Calendar className="h-4 w-4" />}
            />
            <InfoField
              label="Parentesco"
              value={getRelationshipLabel(dependant.relationship)}
              badge={
                <Badge variant={getRelationshipColor(dependant.relationship)}>
                  {getRelationshipLabel(dependant.relationship)}
                </Badge>
              }
            />
          </div>
        </Card>

        {/* Benefícios Fiscais */}
        <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4">
            <Shield className="h-5 w-5" />
            Benefícios Fiscais
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <InfoField
              label="Dependente IRRF"
              value={dependant.isIrrfDependant ? 'Sim' : 'Não'}
              badge={
                <Badge
                  variant={dependant.isIrrfDependant ? 'default' : 'outline'}
                >
                  {dependant.isIrrfDependant ? 'Sim' : 'Não'}
                </Badge>
              }
            />
            <InfoField
              label="Salário Família"
              value={dependant.isSalarioFamilia ? 'Sim' : 'Não'}
              badge={
                <Badge
                  variant={dependant.isSalarioFamilia ? 'default' : 'outline'}
                >
                  {dependant.isSalarioFamilia ? 'Sim' : 'Não'}
                </Badge>
              }
            />
            <InfoField
              label="Pessoa com Deficiência"
              value={dependant.hasDisability ? 'Sim' : 'Não'}
              badge={
                <Badge
                  variant={dependant.hasDisability ? 'secondary' : 'outline'}
                >
                  {dependant.hasDisability ? 'Sim' : 'Não'}
                </Badge>
              }
            />
          </div>
        </Card>

        {/* Funcionário Vinculado */}
        <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4">
            <User className="h-5 w-5" />
            Funcionário Vinculado
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <InfoField
              label="Funcionário"
              value={employeeName ?? 'Desconhecido'}
            />
          </div>
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                router.push(`/hr/employees/${dependant.employeeId}`)
              }
            >
              Ver Funcionário
            </Button>
          </div>
        </Card>

        {/* Metadados */}
        <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4">
            <Clock className="h-5 w-5" />
            Metadados
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <InfoField
              label="Criado em"
              value={formatDate(dependant.createdAt)}
            />
            <InfoField
              label="Atualizado em"
              value={formatDate(dependant.updatedAt)}
            />
          </div>
        </Card>
      </PageBody>

      {/* Delete PIN Modal */}
      <VerifyActionPinModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={handleDelete}
        title="Excluir Dependente"
        description={`Digite seu PIN de ação para excluir o dependente "${dependant.name}". Esta ação não pode ser desfeita.`}
      />
    </PageLayout>
  );
}
