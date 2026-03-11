/**
 * OpenSea OS - Department Detail Page
 */

'use client';

import { companiesApi } from '@/app/(dashboard)/(modules)/admin/(entities)/companies/src/api';
import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { InfoField } from '@/components/shared/info-field';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatCNPJ } from '@/helpers';
import { employeesService } from '@/services/hr/employees.service';
import { positionsService } from '@/services/hr/positions.service';
import type { Company, Department, Employee, Position } from '@/types/hr';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  Briefcase,
  Building2,
  Calendar,
  Clock,
  Edit,
  Factory,
  NotebookText,
  Trash,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { departmentsApi, deleteDepartment } from '../src';
import { logger } from '@/lib/logger';

export default function DepartmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const departmentId = params.id as string;

  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!department) return;

    setIsDeleting(true);
    try {
      await deleteDepartment(department.id);
      await queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Departamento excluído com sucesso!');
      router.push('/hr/departments');
    } catch (error) {
      logger.error(
        'Erro ao excluir departamento',
        error instanceof Error ? error : undefined
      );
      toast.error('Erro ao excluir departamento');
    } finally {
      setIsDeleting(false);
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
              { label: 'Recursos Humanos', href: '/hr' },
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
            { label: 'Recursos Humanos', href: '/hr' },
            { label: 'Departamentos', href: '/hr/departments' },
            { label: department.name },
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
        <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4">
            <NotebookText className="h-5 w-5" />
            Dados do Departamento
          </h3>
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
                <Badge variant={department.isActive ? 'success' : 'secondary'}>
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
        </Card>

        {/* Empresa Vinculada */}
        <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4">
            <Factory className="h-5 w-5" />
            Empresa
          </h3>
          {isLoadingCompany ? (
            <p className="text-muted-foreground">Carregando empresa...</p>
          ) : linkedCompany ? (
            <Link
              href={`/hr/companies/${linkedCompany.id}`}
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
        </Card>

        {/* Cargos */}
        <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg uppercase font-semibold flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Cargos neste Departamento
              <Badge variant="secondary" className="ml-2">
                {positions.length}
              </Badge>
            </h3>
            <Link href={`/hr/positions?departmentId=${departmentId}`}>
              <Button variant="outline" size="sm">
                Ver todos
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
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
        </Card>

        {/* Funcionários */}
        <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg uppercase font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" />
              Funcionários neste Departamento
              <Badge variant="secondary" className="ml-2">
                {employees.length}
              </Badge>
            </h3>
            <Link href={`/hr/employees?departmentId=${departmentId}`}>
              <Button variant="outline" size="sm">
                Ver todos
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
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
        </Card>
      </PageBody>

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Excluir departamento"
        description={`Tem certeza que deseja excluir o departamento "${department.name}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </PageLayout>
  );
}
