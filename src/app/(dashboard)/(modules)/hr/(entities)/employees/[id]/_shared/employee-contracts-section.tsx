/**
 * EmployeeContractsSection
 * Lista todos os contratos de trabalho gerados do colaborador e permite
 * disparar/verificar/cancelar o fluxo de assinatura digital (Lei 14.063 §2).
 */

'use client';

import { SignatureStatusSection } from '@/components/signature/signature-status-section';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { usePermissions } from '@/hooks/use-permissions';
import {
  useCancelContractSignature,
  useContractSignatureStatus,
  useEmployeeContracts,
  useRequestContractSignature,
} from '@/hooks/hr/use-contract-signatures';
import { HR_PERMISSIONS } from '@/config/rbac/permission-codes';
import type { GeneratedContract } from '@/services/hr/contracts.service';
import type {
  EnvelopeStatus,
  SignatureEnvelopeSigner,
} from '@/types/signature/envelope.types';
import { Download, FileSignature, FileText } from 'lucide-react';

interface EmployeeContractsSectionProps {
  employeeId: string;
  employeeName: string;
  employeeEmail?: string | null;
}

export function EmployeeContractsSection({
  employeeId,
  employeeName,
  employeeEmail,
}: EmployeeContractsSectionProps) {
  const { hasPermission } = usePermissions();
  const canRequestSignature = hasPermission(HR_PERMISSIONS.CONTRACTS.MODIFY);
  const canCancelSignature = hasPermission(HR_PERMISSIONS.CONTRACTS.MODIFY);

  const {
    data: contractsData,
    isLoading,
    error,
    refetch,
  } = useEmployeeContracts(employeeId);

  if (isLoading) {
    return <GridLoading count={3} layout="list" size="md" />;
  }

  if (error) {
    return (
      <GridError
        message="Não foi possível carregar os contratos de trabalho."
        action={{
          label: 'Tentar novamente',
          onClick: () => {
            void refetch();
          },
        }}
      />
    );
  }

  const contracts = contractsData?.contracts ?? [];

  if (contracts.length === 0) {
    return (
      <Card className="bg-white dark:bg-white/5 border border-border overflow-hidden">
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-base font-semibold text-muted-foreground">
            Nenhum contrato gerado
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Gere um contrato de trabalho a partir de um modelo para que apareça
            aqui e possa ser enviado para assinatura digital.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {contracts.map(contract => (
        <ContractCard
          key={contract.id}
          contract={contract}
          employeeName={employeeName}
          employeeEmail={employeeEmail}
          canRequestSignature={canRequestSignature}
          canCancelSignature={canCancelSignature}
        />
      ))}
    </div>
  );
}

interface ContractCardProps {
  contract: GeneratedContract;
  employeeName: string;
  employeeEmail?: string | null;
  canRequestSignature: boolean;
  canCancelSignature: boolean;
}

function ContractCard({
  contract,
  employeeName,
  employeeEmail,
  canRequestSignature,
  canCancelSignature,
}: ContractCardProps) {
  const requestMutation = useRequestContractSignature();
  const cancelMutation = useCancelContractSignature();
  const statusQuery = useContractSignatureStatus(contract.id, {
    enabled: !!contract.signatureEnvelopeId,
  });

  const statusData = extractStatusData(statusQuery.data);

  return (
    <Card className="bg-white dark:bg-white/5 border border-border overflow-hidden py-0">
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <FileSignature className="h-5 w-5 text-foreground" />
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold truncate">
            Contrato {contract.id.slice(0, 8)}
          </h3>
          <p className="text-sm text-muted-foreground">
            Gerado em{' '}
            {new Date(contract.createdAt).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            })}
          </p>
        </div>
        {contract.pdfUrl && (
          <a
            href={contract.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0"
          >
            <Button variant="outline" size="sm" className="h-9 px-2.5 gap-1.5">
              <Download className="h-4 w-4" />
              Baixar PDF
            </Button>
          </a>
        )}
      </div>
      <div className="border-b border-border" />

      <div className="p-4 sm:p-6">
        <SignatureStatusSection
          signatureEnvelopeId={contract.signatureEnvelopeId}
          canRequestSignature={canRequestSignature}
          canCancelSignature={canCancelSignature}
          defaultSignerName={employeeName}
          defaultSignerEmail={employeeEmail ?? ''}
          requestDialogTitle="Enviar Contrato para Assinatura"
          requestDialogDescription={`O contrato será enviado para assinatura de ${employeeName}. Informe um e-mail alternativo se desejar.`}
          showExpirationInput
          statusData={statusData}
          isStatusLoading={statusQuery.isLoading}
          onRequestSignature={async payload => {
            await requestMutation.mutateAsync({
              contractId: contract.id,
              data: payload,
            });
          }}
          isRequestPending={requestMutation.isPending}
          onCancelSignature={async reason => {
            await cancelMutation.mutateAsync({
              contractId: contract.id,
              reason,
            });
          }}
          isCancelPending={cancelMutation.isPending}
        />
      </div>
    </Card>
  );
}

function extractStatusData(
  raw: { envelope: Record<string, unknown> } | undefined
):
  | {
      envelopeId?: string;
      status?: EnvelopeStatus;
      signers?: SignatureEnvelopeSigner[];
    }
  | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const envelope = raw.envelope;
  if (!envelope) return undefined;

  return {
    envelopeId: typeof envelope.id === 'string' ? envelope.id : undefined,
    status: envelope.status as EnvelopeStatus | undefined,
    signers: Array.isArray(envelope.signers)
      ? (envelope.signers as SignatureEnvelopeSigner[])
      : [],
  };
}
