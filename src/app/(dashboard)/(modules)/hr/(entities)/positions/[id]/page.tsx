/**
 * OpenSea OS - Position Detail Page
 */

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
import { usePermissions } from '@/hooks/use-permissions';
import { employeesService } from '@/services/hr/employees.service';
import type { Employee, Position } from '@/types/hr';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Briefcase,
  Building2,
  Calendar,
  Clock,
  DollarSign,
  Edit,
  Factory,
  Layers,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { formatLevel, getSalaryRange, positionsApi } from '../src';
import { HR_PERMISSIONS } from '../../../_shared/constants/hr-permissions';

export default function PositionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const positionId = params.id as string;

  const { hasPermission } = usePermissions();
  const canEdit = hasPermission(HR_PERMISSIONS.POSITIONS.UPDATE);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const { data: position, isLoading } = useQuery<Position>({
    queryKey: ['positions', positionId],
    queryFn: async () => {
      return positionsApi.get(positionId);
    },
  });

  const { data: employeesData } = useQuery({
    queryKey: ['employees', 'by-position', positionId],
    queryFn: async () => {
      const response = await employeesService.listEmployees({
        positionId,
        perPage: 50,
      });
      return response.employees;
    },
    enabled: !!positionId,
  });

  const employees = employeesData || [];

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleEdit = () => {
    router.push(`/hr/positions/${positionId}/edit`);
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
              { label: 'RH', href: '/hr' },
              { label: 'Cargos', href: '/hr/positions' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" size="md" />
        </PageBody>
      </PageLayout>
    );
  }

  if (!position) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Cargos', href: '/hr/positions' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <Card className="bg-white/5 p-12 text-center">
            <Briefcase className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">
              Cargo não encontrado
            </h2>
            <Button onClick={() => router.push('/hr/positions')}>
              Voltar para Cargos
            </Button>
          </Card>
        </PageBody>
      </PageLayout>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'RH', href: '/hr' },
            { label: 'Cargos', href: '/hr/positions' },
            { label: position.name },
          ]}
          buttons={
            canEdit
              ? [
                  {
                    id: 'edit',
                    title: 'Editar',
                    icon: Edit,
                    onClick: handleEdit,
                  },
                ]
              : []
          }
        />

        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl shrink-0 bg-linear-to-br from-indigo-500 to-purple-600">
              <Briefcase className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">
                  {position.name}
                </h1>
                <Badge variant={position.isActive ? 'success' : 'secondary'}>
                  {position.isActive ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Código: {position.code}
              </p>
            </div>
            <div className="flex flex-col gap-2 shrink-0 text-sm">
              {position.createdAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span>
                    {new Date(position.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
              {position.updatedAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span>
                    {new Date(position.updatedAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </PageHeader>

      <PageBody className="space-y-6">
        {/* Informações do Cargo */}
        <Card className="bg-white dark:bg-white/5 border border-border overflow-hidden py-0">
          <div className="flex items-center gap-3 px-4 pt-4 pb-2">
            <Briefcase className="h-5 w-5 text-foreground" />
            <div className="flex-1">
              <h3 className="text-base font-semibold">Informações do Cargo</h3>
              <p className="text-sm text-muted-foreground">
                Dados cadastrais e classificação
              </p>
            </div>
          </div>
          <div className="border-b border-border" />
          <div className="p-4 sm:p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <InfoField
                label="Nome"
                value={position.name}
                showCopyButton
                copyTooltip="Copiar nome"
              />
              <InfoField
                label="Código"
                value={position.code}
                showCopyButton
                copyTooltip="Copiar código"
              />
              <InfoField
                label="Descrição"
                value={position.description}
                className="md:col-span-2"
              />
              <InfoField
                label="Nível"
                value={formatLevel(position.level)}
                icon={<Layers className="h-4 w-4" />}
              />
              <InfoField
                label="Faixa Salarial"
                value={getSalaryRange(position)}
                icon={<DollarSign className="h-4 w-4" />}
              />
            </div>
          </div>
        </Card>

        {/* Hierarquia */}
        <Card className="bg-white dark:bg-white/5 border border-border overflow-hidden py-0">
          <div className="flex items-center gap-3 px-4 pt-4 pb-2">
            <Building2 className="h-5 w-5 text-foreground" />
            <div className="flex-1">
              <h3 className="text-base font-semibold">
                Hierarquia Organizacional
              </h3>
              <p className="text-sm text-muted-foreground">
                Departamento e empresa vinculados
              </p>
            </div>
          </div>
          <div className="border-b border-border" />
          <div className="p-4 sm:p-6">
            <div className="grid md:grid-cols-2 gap-6">
              {position.department && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Departamento
                  </p>
                  <Link
                    href={`/hr/departments/${position.department.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors group"
                  >
                    <span className="font-medium">
                      {position.department.name}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </Link>
                </div>
              )}
              {position.department?.company && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Factory className="h-4 w-4" />
                    Empresa
                  </p>
                  <Link
                    href={`/admin/companies/${position.department.company.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors group"
                  >
                    <span className="font-medium">
                      {position.department.company.tradeName ||
                        position.department.company.legalName}
                    </span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Funcionários */}
        <Card className="bg-white dark:bg-white/5 border border-border overflow-hidden py-0">
          <div className="flex items-center gap-3 px-4 pt-4 pb-2">
            <Users className="h-5 w-5 text-foreground" />
            <div className="flex-1">
              <h3 className="text-base font-semibold">
                Funcionários neste Cargo
              </h3>
              <p className="text-sm text-muted-foreground">
                {employees.length} funcionário
                {employees.length !== 1 ? 's' : ''} vinculado
                {employees.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Link href={`/hr/employees?positionId=${positionId}`}>
              <Button variant="outline" size="sm">
                Ver todos
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="border-b border-border" />
          <div className="p-4 sm:p-6">
            {employees.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4">
                Nenhum funcionário neste cargo.
              </p>
            ) : (
              <div className="space-y-2">
                {employees.slice(0, 5).map((employee: Employee) => (
                  <Link
                    key={employee.id}
                    href={`/hr/employees/${employee.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white text-sm font-medium">
                        {employee.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{employee.fullName}</p>
                        <p className="text-xs text-muted-foreground">
                          {employee.registrationNumber}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </Link>
                ))}
                {employees.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center pt-2">
                    + {employees.length - 5} outros funcionários
                  </p>
                )}
              </div>
            )}
          </div>
        </Card>
      </PageBody>
    </PageLayout>
  );
}
