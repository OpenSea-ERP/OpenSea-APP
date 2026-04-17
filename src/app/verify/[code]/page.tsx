'use client';

/**
 * Public verification page — /verify/[code]
 *
 * Anyone in possession of the 12-character verification code printed on a
 * signed document can confirm its authenticity here. No authentication.
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useVerifyByCode } from '@/hooks/signature';
import type { SignerStatus } from '@/types/signature';
import {
  CheckCircle2,
  Copy,
  FileQuestion,
  FileSignature,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { useCallback } from 'react';
import { toast } from 'sonner';

const SIGNER_STATUS_LABEL: Record<SignerStatus, string> = {
  PENDING: 'Pendente',
  NOTIFIED: 'Notificado',
  VIEWED: 'Visualizado',
  SIGNED: 'Assinado',
  REJECTED: 'Rejeitado',
  EXPIRED: 'Expirado',
};

const SIGNER_STATUS_COLOR: Record<SignerStatus, string> = {
  PENDING: 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300',
  NOTIFIED: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
  VIEWED: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300',
  SIGNED:
    'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
  REJECTED: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
  EXPIRED: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
};

function formatDateTime(isoString: string | null): string {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function PublicVerifyPage() {
  const params = useParams<{ code: string }>();
  const code = params?.code ?? '';
  const verifyQuery = useVerifyByCode(code);

  const handleCopyHash = useCallback(() => {
    if (!verifyQuery.data?.documentHash) return;
    navigator.clipboard.writeText(verifyQuery.data.documentHash);
    toast.success('Hash copiado.');
  }, [verifyQuery.data?.documentHash]);

  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(code);
    toast.success('Código copiado.');
  }, [code]);

  if (verifyQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Card className="p-6">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="mt-4 h-20 w-full" />
        </Card>
        <Card className="p-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="mt-4 h-32 w-full" />
        </Card>
      </div>
    );
  }

  if (verifyQuery.isError || !verifyQuery.data) {
    return (
      <Card className="mt-8 p-8 text-center">
        <FileQuestion className="mx-auto mb-4 h-14 w-14 text-amber-500" />
        <h1 className="mb-2 text-xl font-semibold">Código não encontrado</h1>
        <p className="text-sm text-muted-foreground">
          O código informado não corresponde a nenhum documento assinado em
          nossa plataforma. Verifique se digitou corretamente.
        </p>
        <p className="mt-4 font-mono text-xs text-muted-foreground">{code}</p>
      </Card>
    );
  }

  const verification = verifyQuery.data;
  const isValid = verification.isValid;

  return (
    <div className="space-y-4">
      {/* Status header */}
      <Card
        className={
          isValid
            ? 'border-emerald-200 p-6 dark:border-emerald-900/40'
            : 'border-rose-200 p-6 dark:border-rose-900/40'
        }
      >
        <div className="flex items-start gap-4">
          <div
            className={
              isValid
                ? 'flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300'
                : 'flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300'
            }
          >
            {isValid ? (
              <ShieldCheck className="h-7 w-7" />
            ) : (
              <XCircle className="h-7 w-7" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <Badge
              variant="secondary"
              className={
                isValid
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'
              }
            >
              {isValid ? 'Documento Verificado' : 'Não Verificado'}
            </Badge>
            <h1 className="mt-2 text-xl font-semibold leading-tight">
              {verification.envelopeTitle}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Concluído em {formatDateTime(verification.completedAt)}
            </p>
          </div>
        </div>
      </Card>

      {/* Document integrity */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <FileSignature className="h-5 w-5 text-violet-600" />
          <h2 className="text-sm font-medium">Integridade do documento</h2>
        </div>
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">
              Hash SHA-256 do documento original
            </p>
            <div className="mt-1 flex items-center gap-2">
              <code className="flex-1 overflow-x-auto rounded-md bg-slate-100 px-3 py-2 font-mono text-xs dark:bg-slate-800/60">
                {verification.documentHash}
              </code>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={handleCopyHash}
                aria-label="Copiar hash"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Código de verificação</p>
            <div className="mt-1 flex items-center gap-2">
              <code className="flex-1 rounded-md bg-slate-100 px-3 py-2 font-mono text-xs dark:bg-slate-800/60">
                {verification.verificationCode ?? code}
              </code>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                onClick={handleCopyCode}
                aria-label="Copiar código"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Signers */}
      <Card className="p-6">
        <h2 className="mb-4 text-sm font-medium">
          Signatários ({verification.signers.length})
        </h2>
        <div className="divide-y divide-border">
          {verification.signers.map(signer => (
            <div
              key={`${signer.name}-${signer.signedAt ?? 'unsigned'}`}
              className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-medium">{signer.name}</p>
                <p className="text-xs text-muted-foreground">
                  Papel: {signer.role}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {signer.signedAt && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    {formatDateTime(signer.signedAt)}
                  </span>
                )}
                <Badge
                  variant="secondary"
                  className={SIGNER_STATUS_COLOR[signer.status]}
                >
                  {SIGNER_STATUS_LABEL[signer.status]}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Legal footer */}
      <p className="px-2 text-center text-xs text-muted-foreground">
        Emitido sob a Lei 14.063/2020 — Assinatura Eletrônica Avançada.
      </p>
    </div>
  );
}
