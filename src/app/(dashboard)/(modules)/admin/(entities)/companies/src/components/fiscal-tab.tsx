/**
 * Fiscal Tab Component - Company Fiscal Settings
 */

'use client';

import { InfoField } from '@/components/shared/info-field';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import type { CompanyFiscalSettings } from '@/types/hr';
import { FileText } from 'lucide-react';

interface FiscalTabProps {
  fiscalSettings: CompanyFiscalSettings | null | undefined;
  isLoadingFiscal: boolean;
}

export function FiscalTab({ fiscalSettings, isLoadingFiscal }: FiscalTabProps) {
  const nfceStatus = fiscalSettings?.nfceEnabled
    ? 'Habilitado'
    : 'Desabilitado';

  return (
    <TabsContent value="fiscal" className="flex flex-col gap-4">
      <Card className="flex flex-col gap-10 p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
        {isLoadingFiscal ? (
          <p className="text-muted-foreground">Carregando dados fiscais...</p>
        ) : fiscalSettings ? (
          <div>
            <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4 text-white/60">
              <FileText className="h-6 w-6" />
              Configurações Fiscais
            </h3>
            <div className="grid md:grid-cols-3 gap-6">
              <InfoField
                label="Ambiente NFe"
                value={fiscalSettings.nfeEnvironment}
                showCopyButton
                copyTooltip="Copiar Ambiente NFe"
              />
              <InfoField
                label="Série NFe"
                value={fiscalSettings.nfeSeries}
                showCopyButton
                copyTooltip="Copiar Série NFe"
              />
              <InfoField
                label="Último Número NFe"
                value={fiscalSettings.nfeLastNumber}
                showCopyButton
                copyTooltip="Copiar Último Número NFe"
              />
              <InfoField
                label="CFOP Padrão"
                value={fiscalSettings.nfeDefaultCfop}
                showCopyButton
                copyTooltip="Copiar CFOP Padrão"
              />
              <InfoField
                label="Certificado Digital"
                value={fiscalSettings.digitalCertificateType}
                showCopyButton
                copyTooltip="Copiar Certificado Digital"
              />
              <InfoField
                label="NFC-e"
                value={nfceStatus}
                badge={
                  fiscalSettings.nfceEnabled ? (
                    <Badge variant="default">Ativo</Badge>
                  ) : undefined
                }
              />
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nenhuma configuração fiscal cadastrada.
          </p>
        )}
      </Card>
    </TabsContent>
  );
}
