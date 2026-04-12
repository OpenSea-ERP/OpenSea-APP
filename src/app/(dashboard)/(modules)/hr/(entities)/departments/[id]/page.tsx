/**
 * OpenSea OS - Department Detail Page
 */

'use client';

import { companiesApi } from '@/app/(dashboard)/(modules)/admin/(entities)/companies/src/api';
import { HR_PERMISSIONS } from '../../../_shared/constants/hr-permissions';
import { departmentsApi } from '../src';
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
import { formatCNPJ } from '@/helpers';
import { usePermissions } from '@/hooks/use-permissions';
import { employeesService } from '@/services/hr/employees.service';
import { positionsService } from '@/services/hr/positions.service';
import type { Company, Department, Employee, Position } from '@/types/hr';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Briefcase,
  Building2,
  Calendar,
  Clock,
  Edit,
  Factory,
  NotebookText,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

export default function DepartmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const departmentId = params.id as string;
  const { hasPermission } = usePermissions();

  const canEdit = hasPermission(HR_PERMISSIONS.DEPARTMENTS.UPDATE);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const { data: department, isLoading } = useQuery<Department>({
    queryKey: ['departments', departmentId],
    queryFn: async () => {
      return departmentsApi.get(departmentId);
    },
  });

  const { data: company, isLoading: isLoadingCompany } =
    useQuery<Company | null>({
      queryKey: ['companies', department?.companyId],
      queryFn: async () => {
        if (!department?.companyId) return null;
        try {
          return await companiesApi.get(department.companyId);
        } catch {
          return null;
        }
      },
      enabled: !!department?.companyId,
    });

  const { data: positionsData } = useQuery({
    queryKey: ['positions', 'by-department', departmentId],
    queryFn: async () => {
      const response = await positionsService.listPositions({
        departmentId,
        perPage: 50,
      });
      return response.positions;
    },
    enabled: !!departmentId,
  });

  const { data: employeesData } = useQuery({
    queryKey: ['employees', 'by-department', departmentId],
    queryFn: async () => {
      const response = await employeesService.listEmployees({
        departmentId,
        perPage: 50,
      });
      return response.employees;
    },
    enabled: !!departmentId,
  });

  const positions = positionsData || [];
  const employees = employeesData || [];

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleEdit = () => {
    router.push(`/hr/departments/${departmentId}/edit`);
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
              { label: 'Departamentos', href: '/hr/departments' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" size="md" />
        </PageBody>
      </PageLayout>
    );
  }

  if (!department) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Departamentos', href: '/hr/departments' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <Card className="bg-white/5 p-12 text-center">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">
              Departamento não encontrado
            </h2>
            <Button onClick={() => router.push('/hr/departments')}>
              Voltar para Departamentos
            </Button>
          </Card>
        </PageBody>
      </PageLayout>
    );
  }

  const linkedCompany = department.company || company;
  const companyName = linkedCompany?.tradeName || linkedCompany?.legalName;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'RH', href: '/hr' },
            { label: 'Departamentos', href: '/hr/departments' },
            { label: department.name },
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
            <div className="flex h-14 w-14 items-center justify-center rounded-xl shrink-0 bg-linear-to-br from-blue-500 to-cyan-600">
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">
                  {department.name}
                </h1>
                <Badge variant={department.isActive ? 'success' : 'secondary'}>
                  {department.isActive ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Código: {department.code}
              </p>
            </div>
            <div className="flex flex-col gap-2 shrink-0 text-sm">
              {department.createdAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span>
                    {new Date(department.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
              {department.updatedAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span>
                    {new Date(department.updatedAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </PageHeader>

      <PageBody className="space-y-6">
        {/* Dados do Departamento */}
        <Card className="bg-white/5 border border-border overflow-hidden py-0">
          <div className="flex items-center gap-3 px-4 pt-4 pb-2">
            <NotebookText className="h-5 w-5 text-foreground" />
            <div className="flex-1">
              <h3 className="text-base font-semibold">Dados do Departamento</h3>
              <p className="text-sm text-muted-foreground">
                Informações cadastrais e status
              </p>
            </div>
          </div>
          <div className="border-b border-border" />
          <div className="p-4 sm:p-6">
            <div className="grid md:grid-cols-3 gap-6">
              <InfoField
                label="Nome"
                value={department.name}
                showCopyButton
                copyTooltip="Copiar Nome"
              />
              <InfoField
                label="Código"
                value={department.code}
                showCopyButton
                copyTooltip="Copiar Código"
              />
              <InfoField
                label="Status"
                value={department.isActive ? 'Ativo' : 'Inativo'}
                badge={
                  <Badge
                    variant={department.isActive ? 'success' : 'secondary'}
                  >
                    {department.isActive ? 'Ativo' : 'Inativo'}
                  </Badge>
                }
              />
            </div>
            {department.description && (
              <div className="mt-6">
                <InfoField
                  label="Descrição"
                  value={department.description}
                  showCopyButton
                  copyTooltip="Copiar Descrição"
                />
              </div>
            )}
          </div>
        </Card>

        {/* Empresa Vinculada */}
        <Card className="bg-white/5 border border-border overflow-hidden py-0">
          <div className="flex items-center gap-3 px-4 pt-4 pb-2">
            <Factory className="h-5 w-5 text-foreground" />
            <div className="flex-1">
              <h3 className="text-base font-semibold">Empresa</h3>
              <p className="text-sm text-muted-foreground">
                Empresa vinculada ao departamento
              </p>
            </div>
          </div>
          <div className="border-b border-border" />
          <div className="p-4 sm:p-6">
            {isLoadingCompany ? (
              <p className="text-muted-foreground">Carregando empresa...</p>
            ) : linkedCompany ? (
              <Link
                href={`/admin/companies/${linkedCompany.id}`}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-linear-to-br from-emerald-500 to-teal-600 shrink-0">
                    <Factory className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-lg">{companyName}</p>
                    <p className="text-sm text-muted-foreground">
                      CNPJ:{' '}
                      {linkedCompany.cnpj
                        ? formatCNPJ(linkedCompany.cnpj)
                        : 'Não informado'}
                    </p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground py-4">
                Nenhuma empresa vinculada.
              </p>
            )}
          </div>
        </Card>

        {/* Cargos */}
        <Card className="bg-white/5 border border-border overflow-hidden py-0">
          <div className="flex items-center gap-3 px-4 pt-4 pb-2">
            <Briefcase className="h-5 w-5 text-foreground" />
            <div className="flex-1">
              <h3 className="text-base font-semibold">
                Cargos neste Departamento
              </h3>
              <p className="text-sm text-muted-foreground">
                {positions.length} cargo{positions.length !== 1 ? 's' : ''}{' '}
                cadastrado{positions.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Link href={`/hr/positions?departmentId=${departmentId}`}>
              <Button variant="outline" size="sm">
                Ver todos
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="border-b border-border" />
          <div className="p-4 sm:p-6">
            {positions.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4">
                Nenhum cargo neste departamento.
              </p>
            ) : (
              <div className="space-y-2">
                {positions.slice(0, 5).map((position: Position) => (
                  <Link
                    key={position.id}
                    href={`/hr/positions/${position.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                        <Briefcase className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">{position.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {position._count?.employees ?? 0} funcionário(s)
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </Link>
                ))}
                {positions.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center pt-2">
                    + {positions.length - 5} outros cargos
                  </p>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Funcionários */}
        <Card className="bg-white/5 border border-border overflow-hidden py-0">
          <div className="flex items-center gap-3 px-4 pt-4 pb-2">
            <Users className="h-5 w-5 text-foreground" />
            <div className="flex-1">
              <h3 className="text-base font-semibold">
                Funcionários neste Departamento
              </h3>
              <p className="text-sm text-muted-foreground">
                {employees.length} funcionário
                {employees.length !== 1 ? 's' : ''} vinculado
                {employees.length !== 1 ? 's' : ''}
              </p>
            </div>
            <Link href={`/hr/employees?departmentId=${departmentId}`}>
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
                Nenhum funcionário neste departamento.
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
                          {employee.position?.name || 'Sem cargo'} •{' '}
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
