/**
 * Company Edit Page
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { logger } from '@/lib/logger';
import { EntityForm } from '@/core';
import type { Company } from '@/types/hr';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BookUser,
  Building2,
  FileCheck,
  FileText,
  MapPinHouse,
  Save,
  X,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  AddressesEditTab,
  CnaesEditTab,
  companiesApi,
  companiesConfig,
  FiscalEditTab,
  normalizeCompanyData,
  StakeholdersEditTab,
} from '../../src';

export default function CompanyEditPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const companyId = params.id as string;
  const [activeTab, setActiveTab] = useState('general');
  const formRef = useRef<HTMLFormElement>(null);

  const { data: company, isLoading } = useQuery<Company>({
    queryKey: ['companies', companyId],
    queryFn: async () => {
      return companiesApi.get(companyId);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Company>) => {
      const updateData = normalizeCompanyData(data);
      return companiesApi.update(companyId, updateData);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Empresa atualizada com sucesso');
      router.push(`/admin/companies/${companyId}`);
    },
    onError: error => {
      logger.error(
        'Erro ao atualizar empresa',
        error instanceof Error ? error : undefined
      );
      toast.error('Não foi possível atualizar a empresa');
    },
  });

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Recursos Humanos', href: '/hr' },
              { label: 'Empresas', href: '/hr/companies' },
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
              { label: 'Recursos Humanos', href: '/hr' },
              { label: 'Empresas', href: '/hr/companies' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <Card className="bg-white/5 p-12 text-center">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">
              Empresa não encontrada
            </h2>
            <Button
              onClick={() => router.push('/admin/companies')}
              className="mt-4"
            >
              Voltar para Empresas
            </Button>
          </Card>
        </PageBody>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Administração', href: '/admin' },
            { label: 'Empresas', href: '/admin/companies' },
            {
              label: company.legalName,
              href: `/admin/companies/${companyId}`,
            },
            { label: 'Editar' },
          ]}
          buttons={[
            {
              id: 'cancel',
              title: 'Cancelar',
              icon: X,
              onClick: () => router.push(`/admin/companies/${companyId}`),
              variant: 'outline',
            },
            {
              id: 'save',
              title: 'Salvar',
              icon: Save,
              onClick: () => {
                if (formRef.current) {
                  formRef.current.dispatchEvent(
                    new Event('submit', { cancelable: true, bubbles: true })
                  );
                }
              },
              disabled: updateMutation.isPending,
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
              <h1 className="text-2xl font-bold tracking-tight">
                {company.legalName}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Editar Empresa
              </p>
            </div>
            <Badge variant="secondary">Editando</Badge>
          </div>
        </Card>
      </PageHeader>

      <PageBody>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 mb-4 p-2 h-12 overflow-x-auto">
            <TabsTrigger value="general" className="gap-2">
              <Building2 className="h-4 w-4 hidden sm:inline" />
              <span>Dados</span>
            </TabsTrigger>
            <TabsTrigger value="addresses" className="gap-2">
              <MapPinHouse className="h-4 w-4 hidden sm:inline" />
              <span>Endereços</span>
            </TabsTrigger>
            <TabsTrigger value="stakeholders" className="gap-2">
              <BookUser className="h-4 w-4 hidden sm:inline" />
              <span>Sócios</span>
            </TabsTrigger>
            <TabsTrigger value="cnaes" className="gap-2">
              <FileCheck className="h-4 w-4 hidden sm:inline" />
              <span>CNAEs</span>
            </TabsTrigger>
            <TabsTrigger value="fiscal" className="gap-2">
              <FileText className="h-4 w-4 hidden sm:inline" />
              <span>Fiscal</span>
            </TabsTrigger>
          </TabsList>

          {/* General Tab - Company Data */}
          <TabsContent value="general" className="w-full">
            <Card className="w-full p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
              <EntityForm
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                config={companiesConfig.form! as any}
                mode="edit"
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                initialData={company as any}
                isSubmitting={updateMutation.isPending}
                onSubmit={async data => {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  await updateMutation.mutateAsync(data as any);
                }}
                hideActions
                ref={formRef}
              />
            </Card>
          </TabsContent>

          {/* Addresses Tab */}
          <AddressesEditTab companyId={companyId} />

          {/* Stakeholders Tab */}
          <StakeholdersEditTab companyId={companyId} />

          {/* CNAEs Tab */}
          <CnaesEditTab companyId={companyId} />

          {/* Fiscal Tab */}
          <FiscalEditTab companyId={companyId} />
        </Tabs>
      </PageBody>
    </PageLayout>
  );
}
