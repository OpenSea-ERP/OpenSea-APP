/**
 * Company Detail Page
 */

'use client';

import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { FileManager } from '@/components/storage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { departmentsService } from '@/services/hr/departments.service';
import { employeesService } from '@/services/hr/employees.service';
import type {
  Company,
  CompanyAddress,
  CompanyCnae,
  CompanyFiscalSettings,
  CompanyStakeholder,
  Department,
  Employee,
} from '@/types/hr';
import { logger } from '@/lib/logger';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  Briefcase,
  Building2,
  Calendar,
  Clock,
  Edit,
  FileText,
  FolderOpen,
  Trash,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import {
  companiesApi,
  companyAddressesApi,
  companyCnaesApi,
  companyFiscalSettingsApi,
  companyStakeholdersApi,
  deleteCompany,
} from '../src';
import { CnaesTab } from '../src/components/cnaes-tab';
import { FiscalTab } from '../src/components/fiscal-tab';
import { GeneralTab } from '../src/components/general-tab';

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const companyId = params.id as string;

  const [activeTab, setActiveTab] = useState('general');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: company, isLoading } = useQuery<Company>({
    queryKey: ['companies', companyId],
    queryFn: async () => {
      const result = await companiesApi.get(companyId);
      if (result && typeof result === 'object' && 'id' in result) {
        return result as Company;
      }
      throw new Error('Estrutura de resposta inválida');
    },
  });

  const { data: addresses, isLoading: isLoadingAddresses } = useQuery<
    CompanyAddress[]
  >({
    queryKey: ['companies', companyId, 'addresses'],
    queryFn: async () => {
      const response = await companyAddressesApi.list(companyId);
      return response.addresses;
    },
    enabled: !!companyId,
  });

  const { data: cnaes, isLoading: isLoadingCnaes } = useQuery<CompanyCnae[]>({
    queryKey: ['companies', companyId, 'cnaes'],
    queryFn: async () => {
      const response = await companyCnaesApi.list(companyId, { perPage: 50 });
      const items =
        (response as unknown as { cnaes?: CompanyCnae[] })?.cnaes ??
        (Array.isArray(response) ? response : []);
      return items as CompanyCnae[];
    },
    enabled: !!companyId,
  });

  const { data: stakeholders, isLoading: isLoadingStakeholders } = useQuery<
    CompanyStakeholder[]
  >({
    queryKey: ['companies', companyId, 'stakeholders'],
    queryFn: async () => {
      try {
        const response = await companyStakeholdersApi.list(companyId, {
          includeInactive: true,
        });
        const items =
          (response as unknown as { stakeholders?: CompanyStakeholder[] })
            ?.stakeholders ?? (Array.isArray(response) ? response : []);
        return items as CompanyStakeholder[];
      } catch {
        return [];
      }
    },
    enabled: !!companyId,
    throwOnError: false,
    retry: false,
  });

  const { data: fiscalSettings, isLoading: isLoadingFiscal } =
    useQuery<CompanyFiscalSettings | null>({
      queryKey: ['companies', companyId, 'fiscal-settings'],
      queryFn: async () => {
        try {
          const response = await companyFiscalSettingsApi.get(companyId);
          if (response && 'id' in response)
            return response as CompanyFiscalSettings;

          const typedResponse = response as unknown as {
            fiscalSettings?: CompanyFiscalSettings;
          };

          if (typedResponse?.fiscalSettings) {
            return typedResponse.fiscalSettings;
          }

          return null;
        } catch {
          return null;
        }
      },
      enabled: !!companyId,
      throwOnError: false,
      retry: false,
    });

  // Buscar departamentos desta empresa
  const { data: departmentsData } = useQuery({
    queryKey: ['departments', 'by-company', companyId],
    queryFn: async () => {
      const response = await departmentsService.listDepartments({
        companyId,
        perPage: 50,
      });
      return response.departments;
    },
    enabled: !!companyId,
  });

  // Buscar funcionários desta empresa
  const { data: employeesData } = useQuery({
    queryKey: ['employees', 'by-company', companyId],
    queryFn: async () => {
      const response = await employeesService.listEmployees({
        companyId,
        perPage: 50,
      });
      return response.employees;
    },
    enabled: !!companyId,
  });

  const departments = departmentsData || [];
  const employees = employeesData || [];

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Administração', href: '/admin' },
              { label: 'Empresas', href: '/admin/companies' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" size="md" />
        </PageBody>
      </PageLayout>
    );
  }

  if (!company) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Administração', href: '/admin' },
              { label: 'Empresas', href: '/admin/companies' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <Card className="bg-white/5 p-12 text-center">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">
              Empresa não encontrada
            </h2>
            <p className="text-muted-foreground mb-6">
              A empresa que você está procurando não existe ou foi removida.
            </p>
            <Button onClick={() => router.push('/admin/companies')}>
              Voltar para Empresas
            </Button>
          </Card>
        </PageBody>
      </PageLayout>
    );
  }

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteCompany(companyId);
      await queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Empresa excluída com sucesso!');
      router.push('/admin/companies');
    } catch (error) {
      logger.error(
        'Erro ao excluir empresa',
        error instanceof Error ? error : undefined
      );
      toast.error('Erro ao excluir empresa');
    }
  };

  const handleEdit = () => {
    router.push(`/admin/companies/${companyId}/edit`);
  };

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Administração', href: '/admin' },
            { label: 'Empresas', href: '/admin/companies' },
            { label: company.legalName },
          ]}
          buttons={[
            {
              id: 'delete',
              title: 'Excluir',
              icon: Trash,
              onClick: handleDelete,
              variant: 'outline',
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
            <div className="flex h-14 w-14 items-center justify-center rounded-xl shrink-0 bg-linear-to-br from-emerald-500 to-teal-600">
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">
                  {company.legalName}
                </h1>
                <Badge variant="success">{company.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {company.tradeName || 'Sem nome fantasia'}
              </p>
            </div>
            <div className="flex flex-col gap-2 shrink-0 text-sm">
              {company.createdAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span>
                    {new Date(company.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
              {company.updatedAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span>
                    {new Date(company.updatedAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </PageHeader>

      <PageBody>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 mb-4 p-2 h-12 overflow-x-auto">
            <TabsTrigger value="general" className="gap-2">
              <Building2 className="h-4 w-4 hidden sm:inline" />
              <span>Geral</span>
            </TabsTrigger>
            <TabsTrigger value="team" className="gap-2">
              <Users className="h-4 w-4 hidden sm:inline" />
              <span>Equipe</span>
              <Badge variant="secondary" className="ml-1 hidden sm:inline">
                {departments.length + employees.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="cnaes" className="gap-2">
              <FileText className="h-4 w-4 hidden sm:inline" />
              <span>CNAEs</span>
            </TabsTrigger>
            <TabsTrigger value="fiscal" className="gap-2">
              <FileText className="h-4 w-4 hidden sm:inline" />
              <span>Fiscal</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2">
              <FolderOpen className="h-4 w-4 hidden sm:inline" />
              <span>Documentos</span>
            </TabsTrigger>
          </TabsList>

          <GeneralTab
            company={company}
            addresses={addresses}
            isLoadingAddresses={isLoadingAddresses}
            stakeholders={stakeholders}
            isLoadingStakeholders={isLoadingStakeholders}
          />

          {/* Aba Equipe */}
          <TabsContent value="team" className="space-y-6 w-full flex flex-col">
            {/* Departamentos */}
            <Card className="p-4 w-full sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg uppercase font-semibold flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Departamentos
                  <Badge variant="secondary" className="ml-2">
                    {departments.length}
                  </Badge>
                </h3>
                <Link href={`/hr/departments?companyId=${companyId}`}>
                  <Button variant="outline" size="sm">
                    Ver todos
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
              {departments.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4">
                  Nenhum departamento nesta empresa.
                </p>
              ) : (
                <div className="space-y-2">
                  {departments.slice(0, 5).map((department: Department) => (
                    <Link
                      key={department.id}
                      href={`/hr/departments/${department.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-linear-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                          <Building2 className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="font-medium">{department.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {department._count?.positions ?? 0} cargo(s) •{' '}
                            {department._count?.employees ?? 0} funcionário(s)
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </Link>
                  ))}
                  {departments.length > 5 && (
                    <p className="text-sm text-muted-foreground text-center pt-2">
                      + {departments.length - 5} outros departamentos
                    </p>
                  )}
                </div>
              )}
            </Card>

            {/* Funcionários */}
            <Card className="p-4 sm:p-6 w-full bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg uppercase font-semibold flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Funcionários
                  <Badge variant="secondary" className="ml-2">
                    {employees.length}
                  </Badge>
                </h3>
                <Link href={`/hr/employees?companyId=${companyId}`}>
                  <Button variant="outline" size="sm">
                    Ver todos
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </div>
              {employees.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4">
                  Nenhum funcionário nesta empresa.
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
                            {employee.department?.name || 'Sem departamento'}
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
          </TabsContent>

          <CnaesTab cnaes={cnaes} isLoadingCnaes={isLoadingCnaes} />

          <FiscalTab
            fiscalSettings={fiscalSettings}
            isLoadingFiscal={isLoadingFiscal}
          />

          {/* Aba Documentos */}
          <TabsContent
            value="documents"
            className="space-y-6 w-full flex flex-col"
          >
            <FileManager
              entityType="company"
              entityId={companyId}
              className="h-[600px]"
            />
          </TabsContent>
        </Tabs>
      </PageBody>

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Excluir empresa"
        description={`Tem certeza que deseja excluir a empresa "${company.legalName}"? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </PageLayout>
  );
}
