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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { logger } from '@/lib/logger';
import type { Company, Department } from '@/types/hr';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Building2, Loader2, Save, Search, X } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { departmentsApi } from '../../src';

export default function DepartmentEditPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const departmentId = params.id as string;

  // Estados de edição
  const [showCompanySelector, setShowCompanySelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [departmentName, setDepartmentName] = useState('');
  const [departmentCode, setDepartmentCode] = useState('');
  const [departmentDescription, setDepartmentDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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
    if (!department || !departmentName || !departmentCode) return;

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
            { label: 'Recursos Humanos', href: '/hr' },
            { label: 'Departamentos', href: '/hr/departments' },
            {
              label: department.name,
              href: `/hr/departments/${departmentId}`,
            },
            { label: 'Editar' },
          ]}
          buttons={[
            {
              id: 'cancel',
              title: 'Cancelar',
              icon: X,
              onClick: () => router.push(`/hr/departments/${departmentId}`),
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
            <Badge variant={department.isActive ? 'success' : 'secondary'}>
              {department.isActive ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        </Card>
      </PageHeader>

      <PageBody className="space-y-6">
        {/* Dados Cadastrais */}
        <Card className="p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <h3 className="text-lg font-semibold mb-4">Dados do Departamento</h3>
          <div className="space-y-4">
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

            {/* Empresa Vinculada */}
            <div className="space-y-2 pt-4 border-t">
              <Label>Empresa Vinculada</Label>
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

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">Status</Label>
                <p className="text-sm text-muted-foreground">
                  {isActive ? 'Departamento ativo' : 'Departamento inativo'}
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
