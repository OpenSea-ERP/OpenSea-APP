/**
 * General Tab Component - Company Details
 */

'use client';

import { InfoField } from '@/components/shared/info-field';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import { formatCEP, formatCNPJ, formatPhone } from '@/helpers';
import type { Company, CompanyAddress, CompanyStakeholder } from '@/types/hr';
import { BookUser, MapPinHouse, Notebook, NotebookText } from 'lucide-react';

interface GeneralTabProps {
  company: Company;
  addresses: CompanyAddress[] | undefined;
  isLoadingAddresses: boolean;
  stakeholders: CompanyStakeholder[] | undefined;
  isLoadingStakeholders: boolean;
}

export function GeneralTab({
  company,
  addresses,
  isLoadingAddresses,
  stakeholders,
  isLoadingStakeholders,
}: GeneralTabProps) {
  return (
    <TabsContent value="general" className="flex flex-col gap-4">
      {/* Contact Section */}
      <Card className="flex flex-col gap-10 p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
        <div>
          <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4 text-white/60">
            <NotebookText className="h-6 w-6" />
            Dados da Empresa
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <InfoField
              label="CNPJ"
              value={company.cnpj ? formatCNPJ(company.cnpj) : null}
              showCopyButton
              copyTooltip="Copiar CNPJ"
            />
            <InfoField
              label="Inscrição Estadual"
              value={company.stateRegistration}
              showCopyButton
              copyTooltip="Copiar Inscrição Estadual"
            />
            <InfoField
              label="Inscrição Municipal"
              value={company.municipalRegistration}
              showCopyButton
              copyTooltip="Copiar Inscrição Municipal"
            />
          </div>
        </div>
        <div>
          <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4 text-white/60">
            <Notebook className="h-6 w-6" />
            Contatos
          </h3>
          {!company.email && !company.phoneMain && !company.phoneAlt ? (
            <p className="text-sm text-muted-foreground">
              Nenhum contato cadastrado.
            </p>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {company.email && (
                <InfoField
                  label="E-mail"
                  value={company.email}
                  showCopyButton
                  copyTooltip="Copiar E-mail"
                />
              )}
              {company.phoneMain && (
                <InfoField
                  label="Telefone Principal"
                  value={formatPhone(company.phoneMain)}
                  showCopyButton
                  copyTooltip="Copiar Telefone Principal"
                />
              )}
              {company.phoneAlt && (
                <InfoField
                  label="Telefone Alternativo"
                  value={formatPhone(company.phoneAlt)}
                  showCopyButton
                  copyTooltip="Copiar Telefone Alternativo"
                />
              )}
            </div>
          )}
        </div>
        <div>
          <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4 text-white/60">
            <MapPinHouse className="h-6 w-6" />
            Endereços
          </h3>

          {isLoadingAddresses ? (
            <p className="text-muted-foreground">Carregando endereços...</p>
          ) : addresses && addresses.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {addresses.map(address => (
                <InfoField
                  key={address.id}
                  label={`Endereço ${address.type}`}
                  value={`${address.street}, ${address.number} , ${address.district} - ${address.city}/${address.state}, ${formatCEP(address.zip)}`}
                  badge={
                    address.isPrimary ? (
                      <Badge variant="default">Principal</Badge>
                    ) : undefined
                  }
                  showCopyButton
                  copyTooltip="Copiar Endereço"
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum endereço cadastrado.
            </p>
          )}
        </div>
        <div>
          <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4 text-white/60">
            <BookUser className="h-6 w-6" />
            Sócios e Representantes
          </h3>

          {isLoadingStakeholders ? (
            <p className="text-muted-foreground">Carregando sócios...</p>
          ) : stakeholders && stakeholders.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {stakeholders.map(stakeholder => (
                <InfoField
                  key={stakeholder.id}
                  label={`${stakeholder.role}`}
                  value={stakeholder.name}
                  badge={
                    stakeholder.isLegalRepresentative ? (
                      <Badge variant="default">Representante Legal</Badge>
                    ) : undefined
                  }
                  showCopyButton
                  copyTooltip="Copiar Nome"
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Nenhum sócio cadastrado.
            </p>
          )}
        </div>
      </Card>
    </TabsContent>
  );
}
