/**
 * OpenSea OS - Department Edit Page
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
import type { HeaderButton } from '@/components/layout/types/header.types';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { usePermissions } from '@/hooks/use-permissions';
import { HR_PERMISSIONS } from '../../../../_shared/constants/hr-permissions';
import { logger } from '@/lib/logger';
import type { Company, Department } from '@/types/hr';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  Building2,
  Factory,
  Loader2,
  NotebookText,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { departmentsApi, deleteDepartment } from '../../src';

export default function DepartmentEditPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const departmentId = params.id as string;
  const { hasPermission } = usePermissions();
  const canDelete = hasPermission(HR_PERMISSIONS.DEPARTMENTS.DELETE);

  // Estados de edição
  const [showCompanySelector, setShowCompanySelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [departmentName, setDepartmentName] = useState('');
  const [departmentCode, setDepartmentCode] = useState('');
  const [departmentDescription, setDepartmentDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const { data: department, isLoading } = useQuery<Department>({
    queryKey: ['departments', departmentId],
    queryFn: async () => {
      return departmentsApi.get(departmentId);
    },
  });

  // Busca a empresa vinculada ao departamento
  const { data: linkedCompany } = useQuery<Company | null>({
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

  // Busca lista de empresas para seleção
  const { data: companiesData, isLoading: isLoadingCompanies } = useQuery({
    queryKey: ['companies', 'list'],
    queryFn: async () => {
      const response = await companiesApi.list({
        perPage: 100,
        includeDeleted: false,
      });
      const companies = Array.isArray(response)
        ? response
        : response?.companies || [];
      return companies.filter((company: Company) => !company.deletedAt);
    },
    enabled: showCompanySelector,
  });

  const companies = companiesData || [];

  const filteredCompanies = companies.filter(company => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      company.legalName.toLowerCase().includes(query) ||
      company.tradeName?.toLowerCase().includes(query) ||
      company.cnpj.includes(query)
    );
  });

  // Sincroniza os estados com o department quando carrega
  useEffect(() => {
    if (department) {
      setDepartmentName(department.name);
      setDepartmentCode(department.code);
      setDepartmentDescription(department.description || '');
      setIsActive(department.isActive);
    }
  }, [department]);

  // Sincroniza a empresa vinculada
  useEffect(() => {
    if (linkedCompany && !selectedCompany) {
      setSelectedCompany(linkedCompany);
    }
  }, [linkedCompany, selectedCompany]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSelectCompany = (company: Company) => {
    setSelectedCompany(company);
    setShowCompanySelector(false);
    setSearchQuery('');
  };

  const handleSave = async () => {
    if (!department || !departmentName.trim() || !departmentCode.trim()) return;

    setIsSaving(true);
    try {
      await departmentsApi.update(departmentId, {
        name: departmentName,
        code: departmentCode,
        description: departmentDescription || undefined,
        companyId: selectedCompany?.id || department.companyId,
        isActive,
      });
      await queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Departamento atualizado com sucesso!');
      router.push(`/hr/departments/${departmentId}`);
    } catch (error) {
      logger.error(
        'Erro ao salvar departamento',
        error instanceof Error ? error : undefined
      );
      toast.error('Erro ao salvar departamento');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!department) return;
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

  const companyName =
    selectedCompany?.tradeName || selectedCompany?.legalName || null;

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
            {
              label: department.name,
              href: `/hr/departments/${departmentId}`,
            },
            { label: 'Editar' },
          ]}
          buttons={
            [
              canDelete && {
                id: 'delete',
                title: 'Excluir',
                icon: Trash2,
                onClick: () => setIsDeleteOpen(true),
                variant: 'default' as const,
                className:
                  'bg-slate-200 text-slate-700 border-transparent hover:bg-rose-600 hover:text-white dark:bg-[#334155] dark:text-white dark:hover:bg-rose-600',
                disabled: isSaving,
              },
              {
                id: 'save',
                title: isSaving ? 'Salvando...' : 'Salvar',
                icon: isSaving ? Loader2 : Save,
                onClick: handleSave,
                disabled:
                  isSaving || !departmentName.trim() || !departmentCode.trim(),
              },
            ].filter(Boolean) as HeaderButton[]
          }
        />

        {/* Identity Card with Active/Inactive Switch */}
        <Card className="bg-white/5 p-5">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl shrink-0 bg-linear-to-br from-blue-500 to-cyan-600">
              <Building2 className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold tracking-tight">
                Editar Departamento
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {department.name} - {department.code}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-3 rounded-lg bg-white/5 px-4 py-2">
                <div className="text-right">
                  <p className="text-xs font-semibold">Status</p>
                  <p className="text-[11px] text-muted-foreground">
                    {isActive ? 'Ativo' : 'Inativo'}
                  </p>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={setIsActive}
                  aria-label="Alternar status ativo/inativo"
                />
              </div>
            </div>
          </div>
        </Card>
      </PageHeader>

      <PageBody className="space-y-6">
        {/* Dados Cadastrais */}
        <Card className="bg-white/5 border border-border overflow-hidden py-0">
          <div className="flex items-center gap-3 px-4 pt-4 pb-2">
            <NotebookText className="h-5 w-5 text-foreground" />
            <div className="flex-1">
              <h3 className="text-base font-semibold">Dados do Departamento</h3>
              <p className="text-sm text-muted-foreground">
                Informações cadastrais básicas
              </p>
            </div>
          </div>
          <div className="border-b border-border" />
          <div className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Recursos Humanos"
                  value={departmentName}
                  onChange={e => setDepartmentName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Código *</Label>
                <Input
                  id="code"
                  placeholder="Ex: RH"
                  value={departmentCode}
                  onChange={e =>
                    setDepartmentCode(e.target.value.toUpperCase())
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                placeholder="Descrição do departamento (opcional)"
                value={departmentDescription}
                onChange={e => setDepartmentDescription(e.target.value)}
              />
            </div>

            {/* Mobile-only status switch */}
            <div className="flex items-center justify-between pt-4 border-t sm:hidden">
              <div className="space-y-0.5">
                <Label htmlFor="isActiveMobile">Status</Label>
                <p className="text-sm text-muted-foreground">
                  {isActive ? 'Departamento ativo' : 'Departamento inativo'}
                </p>
              </div>
              <Switch
                id="isActiveMobile"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>
        </Card>

        {/* Empresa Vinculada */}
        <Card className="bg-white/5 border border-border overflow-hidden py-0">
          <div className="flex items-center gap-3 px-4 pt-4 pb-2">
            <Factory className="h-5 w-5 text-foreground" />
            <div className="flex-1">
              <h3 className="text-base font-semibold">Empresa Vinculada</h3>
              <p className="text-sm text-muted-foreground">
                Empresa associada ao departamento
              </p>
            </div>
          </div>
          <div className="border-b border-border" />
          <div className="p-4 sm:p-6">
            {showCompanySelector ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Selecione a empresa
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCompanySelector(false)}
                  >
                    Cancelar
                  </Button>
                </div>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar empresa por nome ou CNPJ..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <div className="space-y-2 max-h-[240px] overflow-y-auto">
                  {isLoadingCompanies ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredCompanies.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      {searchQuery
                        ? 'Nenhuma empresa encontrada'
                        : 'Nenhuma empresa cadastrada'}
                    </div>
                  ) : (
                    filteredCompanies.map(company => (
                      <div
                        key={company.id}
                        className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors"
                        role="button"
                        tabIndex={0}
                        onClick={() => handleSelectCompany(company)}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleSelectCompany(company);
                          }
                        }}
                      >
                        <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-linear-to-br from-emerald-500 to-teal-600 shrink-0">
                          <Building2 className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {company.tradeName || company.legalName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {company.cnpj}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-lg border">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-linear-to-br from-emerald-500 to-teal-600 shrink-0">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {companyName || 'Nenhuma empresa selecionada'}
                  </p>
                  {selectedCompany?.cnpj && (
                    <p className="text-xs text-muted-foreground">
                      {selectedCompany.cnpj}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCompanySelector(true)}
                >
                  Alterar
                </Button>
              </div>
            )}
          </div>
        </Card>
      </PageBody>

      {/* Delete Confirmation */}
      <VerifyActionPinModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onSuccess={handleDelete}
        title="Excluir Departamento"
        description={`Digite seu PIN de ação para excluir o departamento "${department.name}". Esta ação não pode ser desfeita.`}
      />
    </PageLayout>
  );
}
