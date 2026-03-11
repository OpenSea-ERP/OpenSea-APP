'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TabsContent } from '@/components/ui/tabs';
import type {
  CompanyFiscalSettings,
  CreateCompanyFiscalSettingsData,
} from '@/types/hr';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { toast } from 'sonner';
import { companyFiscalSettingsApi } from '../api';

const FiscalSettingsModal = dynamic(() => import('../modals/fiscal-settings-modal').then(m => ({ default: m.FiscalSettingsModal })), { ssr: false });

interface FiscalEditTabProps {
  companyId: string;
}

export function FiscalEditTab({ companyId }: FiscalEditTabProps) {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: fiscalSettings, isLoading } =
    useQuery<CompanyFiscalSettings | null>({
      queryKey: ['company-fiscal-settings', companyId],
      queryFn: async () => {
        try {
          return await companyFiscalSettingsApi.get(companyId);
        } catch (error) {
          return null;
        }
      },
      throwOnError: false,
      retry: false,
    });

  const createMutation = useMutation({
    mutationFn: (data: Partial<CreateCompanyFiscalSettingsData>) =>
      companyFiscalSettingsApi.create(
        companyId,
        data as CreateCompanyFiscalSettingsData
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['company-fiscal-settings', companyId],
        refetchType: 'all',
      });
      toast.success('Configurações fiscais criadas com sucesso');
      setIsModalOpen(false);
    },
    onError: (error: Error) => {
      const message = error.message || 'Erro ao criar configurações fiscais';
      toast.error(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<CreateCompanyFiscalSettingsData>) =>
      companyFiscalSettingsApi.update(companyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['company-fiscal-settings', companyId],
        refetchType: 'all',
      });
      toast.success('Configurações fiscais atualizadas com sucesso');
      setIsModalOpen(false);
    },
    onError: (error: Error) => {
      const message =
        error.message || 'Erro ao atualizar configurações fiscais';
      toast.error(message);
    },
  });

  const handleSubmit = async (
    data: Partial<CreateCompanyFiscalSettingsData>
  ) => {
    if (fiscalSettings) {
      await updateMutation.mutateAsync(data);
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  if (isLoading) {
    return (
      <TabsContent value="fiscal" className="w-full">
        <Card className="p-4 sm:p-6">
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </Card>
      </TabsContent>
    );
  }

  return (
    <TabsContent value="fiscal" className="w-full">
      <Card className="w-full p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="h-5 w-5 text-white/60" />
          <h3 className="text-lg font-semibold uppercase tracking-wider text-white/60">
            Configurações Fiscais
          </h3>
        </div>

        {!fiscalSettings ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma configuração fiscal cadastrada
            </p>
            <div className="flex justify-center">
              <Button onClick={() => setIsModalOpen(true)}>
                Criar Configuração Fiscal
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {/* NFe Environment */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">
                Ambiente NF-e
              </label>
              <div className="p-3 rounded-md border bg-muted/20">
                <p className="text-sm font-medium">
                  {fiscalSettings.nfeEnvironment === 'PRODUCTION'
                    ? 'Produção'
                    : 'Homologação'}
                </p>
              </div>
            </div>

            {/* NFe Series */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">
                Série NF-e
              </label>
              <div className="p-3 rounded-md border bg-muted/20">
                <p className="text-sm font-medium">
                  {fiscalSettings.nfeSeries || '-'}
                </p>
              </div>
            </div>

            {/* NFe Last Number */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">
                Último Número NF-e
              </label>
              <div className="p-3 rounded-md border bg-muted/20">
                <p className="text-sm font-medium">
                  {fiscalSettings.nfeLastNumber || '-'}
                </p>
              </div>
            </div>

            {/* CFOP */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">
                CFOP Padrão
              </label>
              <div className="p-3 rounded-md border bg-muted/20">
                <p className="text-sm font-medium">
                  {fiscalSettings.nfeDefaultCfop || '-'}
                </p>
              </div>
            </div>

            {/* Certificate Type */}
            {fiscalSettings.digitalCertificateType &&
              fiscalSettings.digitalCertificateType !== 'NONE' && (
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs text-muted-foreground">
                    Certificado Digital
                  </label>
                  <div className="p-3 rounded-md border bg-muted/20">
                    <p className="text-sm font-medium">
                      {fiscalSettings.digitalCertificateType}
                      {fiscalSettings.certificateA1ExpiresAt &&
                        ` - Expira em ${new Date(fiscalSettings.certificateA1ExpiresAt).toLocaleDateString('pt-BR')}`}
                    </p>
                  </div>
                </div>
              )}

            {/* NFC-e Enabled */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">
                NFC-e Ativo
              </label>
              <div className="p-3 rounded-md border bg-muted/20 flex items-center">
                {fiscalSettings.nfceEnabled ? (
                  <Badge variant="default">Ativo</Badge>
                ) : (
                  <p className="text-sm font-medium text-muted-foreground">
                    Inativo
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end mt-6">
          <Button onClick={() => setIsModalOpen(true)}>
            Editar Configurações
          </Button>
        </div>
      </Card>

      <FiscalSettingsModal
        isOpen={isModalOpen}
        fiscalSettings={fiscalSettings}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />
    </TabsContent>
  );
}
