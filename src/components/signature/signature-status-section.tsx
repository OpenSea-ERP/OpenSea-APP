/**
 * SignatureStatusSection
 * Seção reutilizável de assinatura digital para qualquer entidade
 * (orçamentos, propostas, contratos de trabalho, etc.).
 *
 * Esta é a versão compartilhada: consumidores passam os callbacks de
 * request/status via props, em vez de hooks hardcoded. Isso evita duplicação
 * entre módulos (Sales, HR, etc.) e mantém o padrão visual.
 */

'use client';

import { useState, type ElementType } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type {
  EnvelopeStatus,
  SignatureEnvelopeSigner,
} from '@/types/signature/envelope.types';
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  FileSignature,
  Loader2,
  Mail,
  PenTool,
  User,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export interface SignatureStatusData {
  envelopeId?: string;
  status?: EnvelopeStatus;
  signers?: SignatureEnvelopeSigner[];
}

export interface RequestSignaturePayload {
  signerName?: string;
  signerEmail?: string;
  expiresInDays?: number;
}

export interface SignatureStatusSectionProps {
  signatureEnvelopeId?: string | null;
  canRequestSignature?: boolean;
  canCancelSignature?: boolean;
  defaultSignerName?: string;
  defaultSignerEmail?: string;
  /** Optional override for the dialog title (ex: "Enviar Contrato para Assinatura"). */
  requestDialogTitle?: string;
  requestDialogDescription?: string;
  /** Show the expiration days input (default false; HR contracts typically need it). */
  showExpirationInput?: boolean;
  /** React Query status data + loading flag. */
  statusData: SignatureStatusData | undefined;
  isStatusLoading: boolean;
  /** Callback that triggers the backend request-signature mutation. */
  onRequestSignature: (payload: RequestSignaturePayload) => Promise<void>;
  isRequestPending: boolean;
  /**
   * Optional callback for cancelling an active envelope. Receives an optional
   * reason string captured by the confirmation dialog — callers should forward
   * it to the backend so the audit log records why the envelope was cancelled.
   */
  onCancelSignature?: (reason?: string) => Promise<void>;
  isCancelPending?: boolean;
}

// ============================================================================
// STATUS LABELS & COLORS
// ============================================================================

const ENVELOPE_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Rascunho',
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em Andamento',
  COMPLETED: 'Concluída',
  CANCELLED: 'Cancelada',
  EXPIRED: 'Expirada',
  REJECTED: 'Rejeitada',
};

const ENVELOPE_STATUS_COLORS: Record<string, string> = {
  DRAFT:
    'border-gray-300 dark:border-white/[0.1] bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400',
  PENDING:
    'border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300',
  IN_PROGRESS:
    'border-sky-600/25 dark:border-sky-500/20 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300',
  COMPLETED:
    'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300',
  REJECTED:
    'border-rose-600/25 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300',
  CANCELLED:
    'border-slate-600/25 dark:border-slate-500/20 bg-slate-50 dark:bg-slate-500/8 text-slate-700 dark:text-slate-300',
  EXPIRED:
    'border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300',
};

const SIGNER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  NOTIFIED: 'Notificado',
  VIEWED: 'Visualizado',
  SIGNED: 'Assinado',
  REJECTED: 'Rejeitado',
  EXPIRED: 'Expirado',
};

const SIGNER_STATUS_ICONS: Record<string, ElementType> = {
  PENDING: Clock,
  NOTIFIED: Mail,
  VIEWED: User,
  SIGNED: CheckCircle2,
  REJECTED: XCircle,
  EXPIRED: Clock,
};

// ============================================================================
// COMPONENT
// ============================================================================

export function SignatureStatusSection({
  signatureEnvelopeId,
  canRequestSignature = false,
  canCancelSignature = false,
  defaultSignerName = '',
  defaultSignerEmail = '',
  requestDialogTitle = 'Solicitar Assinatura Digital',
  requestDialogDescription = 'Informe os dados do signatário para enviar o documento para assinatura digital.',
  showExpirationInput = false,
  statusData,
  isStatusLoading,
  onRequestSignature,
  isRequestPending,
  onCancelSignature,
  isCancelPending = false,
}: SignatureStatusSectionProps) {
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [signerName, setSignerName] = useState(defaultSignerName);
  const [signerEmail, setSignerEmail] = useState(defaultSignerEmail);
  const [expiresInDays, setExpiresInDays] = useState<number>(14);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const hasSignature = !!signatureEnvelopeId || !!statusData?.envelopeId;
  const envelopeId = signatureEnvelopeId || statusData?.envelopeId;
  const envelopeStatus = statusData?.status;
  const signers = statusData?.signers ?? [];
  const isActiveEnvelope =
    envelopeStatus === 'DRAFT' ||
    envelopeStatus === 'PENDING' ||
    envelopeStatus === 'IN_PROGRESS';

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleRequestSignature = async () => {
    try {
      await onRequestSignature({
        signerName: signerName || undefined,
        signerEmail: signerEmail || undefined,
        ...(showExpirationInput ? { expiresInDays } : {}),
      });
      toast.success('Assinatura digital solicitada com sucesso!');
      setShowRequestDialog(false);
    } catch {
      toast.error('Erro ao solicitar assinatura digital');
    }
  };

  const handleOpenCancelDialog = () => {
    setCancelReason('');
    setShowCancelDialog(true);
  };

  const handleConfirmCancel = async () => {
    if (!onCancelSignature) return;
    try {
      const trimmed = cancelReason.trim();
      await onCancelSignature(trimmed ? trimmed : undefined);
      toast.success('Envio de assinatura cancelado.');
      setShowCancelDialog(false);
    } catch {
      toast.error('Erro ao cancelar a assinatura digital');
    }
  };

  const handleOpenDialog = () => {
    setSignerName(defaultSignerName);
    setSignerEmail(defaultSignerEmail);
    setExpiresInDays(14);
    setShowRequestDialog(true);
  };

  // ============================================================================
  // RENDER — NO SIGNATURE
  // ============================================================================

  if (!hasSignature) {
    return (
      <>
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <PenTool className="h-5 w-5 text-foreground" />
                <div>
                  <h3 className="text-base font-semibold">
                    Assinatura Digital
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Solicite a assinatura digital deste documento
                  </p>
                </div>
              </div>
              <div className="border-b border-border" />
            </div>

            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileSignature className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-base font-semibold text-muted-foreground">
                Nenhuma assinatura solicitada
              </h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Este documento ainda não foi enviado para assinatura digital.
              </p>
              {canRequestSignature && (
                <Button
                  size="sm"
                  onClick={handleOpenDialog}
                  className="h-9 px-2.5"
                >
                  <PenTool className="h-4 w-4 mr-1.5" />
                  Enviar para Assinatura
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Request Signature Dialog */}
        <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{requestDialogTitle}</DialogTitle>
              <DialogDescription>{requestDialogDescription}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="signer-name">Nome do Signatário</Label>
                <Input
                  id="signer-name"
                  value={signerName}
                  onChange={e => setSignerName(e.target.value)}
                  placeholder="Nome completo do signatário"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signer-email">E-mail do Signatário</Label>
                <Input
                  id="signer-email"
                  type="email"
                  value={signerEmail}
                  onChange={e => setSignerEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>
              {showExpirationInput && (
                <div className="space-y-2">
                  <Label htmlFor="expires-in-days">
                    Prazo para assinatura (dias)
                  </Label>
                  <Input
                    id="expires-in-days"
                    type="number"
                    min={1}
                    max={365}
                    value={expiresInDays}
                    onChange={e =>
                      setExpiresInDays(
                        Math.max(1, Math.min(365, Number(e.target.value) || 14))
                      )
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    O envelope expirará automaticamente após esse período.
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowRequestDialog(false)}
                className="h-9 px-2.5"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleRequestSignature}
                disabled={isRequestPending}
                className="h-9 px-2.5"
              >
                {isRequestPending && (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                )}
                Enviar para Assinatura
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // ============================================================================
  // RENDER — WITH SIGNATURE
  // ============================================================================

  return (
    <Card className="bg-white/5 py-2 overflow-hidden">
      <div className="px-6 py-4 space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PenTool className="h-5 w-5 text-foreground" />
              <div>
                <h3 className="text-base font-semibold">Assinatura Digital</h3>
                <p className="text-sm text-muted-foreground">
                  Acompanhe o status da assinatura deste documento
                </p>
              </div>
            </div>
            {envelopeStatus && (
              <div
                className={cn(
                  'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border',
                  ENVELOPE_STATUS_COLORS[envelopeStatus] ??
                    ENVELOPE_STATUS_COLORS.PENDING
                )}
              >
                {ENVELOPE_STATUS_LABELS[envelopeStatus] ?? envelopeStatus}
              </div>
            )}
          </div>
          <div className="border-b border-border" />
        </div>

        {/* Signers List */}
        {signers.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Signatários
            </p>
            {signers.map((signer: SignatureEnvelopeSigner) => {
              const SignerIcon = SIGNER_STATUS_ICONS[signer.status] ?? Clock;
              const nameDisplay = signer.externalName || 'Signatário';
              const emailDisplay = signer.externalEmail || '';
              const statusLabel =
                SIGNER_STATUS_LABELS[signer.status] ?? signer.status;

              return (
                <div
                  key={signer.id}
                  className="flex items-center gap-3 rounded-lg border border-border bg-white p-3 dark:bg-slate-800/60"
                >
                  <SignerIcon
                    className={cn(
                      'h-5 w-5 shrink-0',
                      signer.status === 'SIGNED'
                        ? 'text-emerald-500'
                        : signer.status === 'REJECTED'
                          ? 'text-rose-500'
                          : 'text-muted-foreground'
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {nameDisplay}
                    </p>
                    {emailDisplay && (
                      <p className="text-xs text-muted-foreground truncate">
                        {emailDisplay}
                      </p>
                    )}
                  </div>
                  <div
                    className={cn(
                      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border',
                      signer.status === 'SIGNED'
                        ? 'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300'
                        : signer.status === 'REJECTED'
                          ? 'border-rose-600/25 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300'
                          : 'border-amber-600/25 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/8 text-amber-700 dark:text-amber-300'
                    )}
                  >
                    {statusLabel}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 pt-2">
          {envelopeId && (
            <Link
              href={`/signature/envelopes/${envelopeId}`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Ver Detalhes do Envelope
            </Link>
          )}

          {canCancelSignature && onCancelSignature && isActiveEnvelope && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenCancelDialog}
              disabled={isCancelPending}
              className="h-9 px-2.5 text-rose-600 hover:text-rose-700 border-rose-200 hover:bg-rose-50 dark:border-rose-500/20 dark:text-rose-400 dark:hover:bg-rose-500/10"
            >
              {isCancelPending && (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              )}
              Cancelar envio
            </Button>
          )}
        </div>

        {isStatusLoading && (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Cancel Signature Dialog — captures optional reason for audit trail */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancelar envio de assinatura</DialogTitle>
            <DialogDescription>
              O envelope será cancelado e os signatários não poderão mais
              assinar. O motivo informado ficará registrado na trilha de
              auditoria.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="cancel-reason">Motivo do cancelamento</Label>
            <Textarea
              id="cancel-reason"
              value={cancelReason}
              onChange={event => setCancelReason(event.target.value)}
              placeholder="Ex.: O contrato precisará ser reemitido com ajustes."
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              Opcional — até 500 caracteres.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              disabled={isCancelPending}
              className="h-9 px-2.5"
            >
              Voltar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={isCancelPending}
              className="h-9 px-2.5"
            >
              {isCancelPending && (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              )}
              Confirmar cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
