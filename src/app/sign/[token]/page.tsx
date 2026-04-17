'use client';

/**
 * Public signing portal — /sign/[token]
 *
 * Signers arrive here via a per-signer link sent by email. No tenant auth is
 * required; access is granted by the token itself.
 *
 * Flow:
 *   1. Fetch the envelope + signer info via GET /v1/signature/sign/:token.
 *   2. Render an inline preview of the document (IDM-protected base64 POST).
 *   3. For ADVANCED level signers, require OTP verification before signing.
 *   4. Require an explicit consent checkbox before enabling the sign button.
 *   5. Attempt to capture geolocation (best-effort, non-blocking).
 *   6. On success, show a confirmation screen.
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import { PdfViewer } from '@/components/storage/pdf-viewer';
import {
  useRejectDocument,
  useRequestOtp,
  useSignDocument,
  useSigningPage,
  useVerifyOtp,
} from '@/hooks/signature';
import { signingService } from '@/services/signature';
import {
  AlertTriangle,
  CheckCircle2,
  FileSignature,
  Loader2,
  MailCheck,
  MapPin,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface Geolocation {
  latitude: number;
  longitude: number;
}

function useOptionalGeolocation(): {
  location: Geolocation | null;
  requestPermission: () => void;
  status: 'idle' | 'granted' | 'denied' | 'unavailable';
} {
  const [location, setLocation] = useState<Geolocation | null>(null);
  const [status, setStatus] = useState<
    'idle' | 'granted' | 'denied' | 'unavailable'
  >('idle');

  const requestPermission = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('unavailable');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      position => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setStatus('granted');
      },
      () => setStatus('denied'),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60_000 }
    );
  }, []);

  return { location, requestPermission, status };
}

export default function PublicSigningPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? '';

  const signingQuery = useSigningPage(token);
  const requestOtpMutation = useRequestOtp(token);
  const verifyOtpMutation = useVerifyOtp(token);
  const signMutation = useSignDocument(token);
  const rejectMutation = useRejectDocument(token);

  const [consentAccepted, setConsentAccepted] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpSentAt, setOtpSentAt] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [signed, setSigned] = useState(false);

  const {
    location,
    requestPermission: requestGeolocation,
    status: geoStatus,
  } = useOptionalGeolocation();

  // Best-effort geolocation — ask once as soon as the page is available.
  useEffect(() => {
    if (signingQuery.data && geoStatus === 'idle') {
      requestGeolocation();
    }
  }, [signingQuery.data, geoStatus, requestGeolocation]);

  // Document preview (IDM-protected, base64 POST /v1/storage/preview).
  const [documentBinary, setDocumentBinary] = useState<ArrayBuffer | null>(
    null
  );
  const [documentMime, setDocumentMime] = useState<string>('');
  const [documentLoadError, setDocumentLoadError] = useState<string | null>(
    null
  );

  useEffect(() => {
    const fileId = signingQuery.data?.signing.documentFileId;
    if (!fileId) return;

    let cancelled = false;
    setDocumentLoadError(null);
    signingService
      .fetchDocumentPreviewBase64(fileId, null)
      .then(({ data, mimeType }) => {
        if (cancelled) return;
        const binary = atob(data);
        const bytes = new Uint8Array(binary.length);
        for (let index = 0; index < binary.length; index += 1) {
          bytes[index] = binary.charCodeAt(index);
        }
        setDocumentBinary(bytes.buffer);
        setDocumentMime(mimeType);
      })
      .catch(() => {
        if (!cancelled) {
          setDocumentLoadError(
            'Não foi possível carregar o documento para pré-visualização.'
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [signingQuery.data?.signing.documentFileId]);

  const signerInfo = signingQuery.data?.signing;
  const isAdvanced = signerInfo?.signatureLevel === 'ADVANCED';
  const alreadyVerifiedByBackend = signerInfo?.otpVerified === true;
  const requiresOtp = isAdvanced && !alreadyVerifiedByBackend;
  const otpSatisfied = !requiresOtp || otpVerified;
  const signedAlready =
    signerInfo?.signerStatus === 'SIGNED' ||
    signerInfo?.signerStatus === 'REJECTED' ||
    signerInfo?.signerStatus === 'EXPIRED';

  const canSign = consentAccepted && otpSatisfied && !signMutation.isPending;

  const handleRequestOtp = useCallback(async () => {
    try {
      const response = await requestOtpMutation.mutateAsync();
      setOtpSentAt(response?.otpExpiresAt ?? new Date().toISOString());
      toast.success('Código enviado para o seu e-mail.');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível enviar o código.';
      toast.error(message);
    }
  }, [requestOtpMutation]);

  const handleVerifyOtp = useCallback(async () => {
    if (otpCode.length !== 6) {
      toast.error('Informe o código de 6 dígitos enviado para o seu e-mail.');
      return;
    }
    try {
      await verifyOtpMutation.mutateAsync(otpCode);
      setOtpVerified(true);
      toast.success('Código verificado com sucesso.');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Código inválido ou expirado.';
      toast.error(message);
    }
  }, [otpCode, verifyOtpMutation]);

  const handleSign = useCallback(async () => {
    try {
      await signMutation.mutateAsync({
        geoLatitude: location?.latitude,
        geoLongitude: location?.longitude,
      });
      setSigned(true);
      toast.success('Documento assinado com sucesso.');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível concluir a assinatura.';
      toast.error(message);
    }
  }, [location?.latitude, location?.longitude, signMutation]);

  const handleReject = useCallback(async () => {
    try {
      await rejectMutation.mutateAsync({
        reason: rejectReason.trim() || undefined,
      });
      setRejectOpen(false);
      toast.success('Documento recusado.');
      await signingQuery.refetch();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Não foi possível registrar a recusa.';
      toast.error(message);
    }
  }, [rejectMutation, rejectReason, signingQuery]);

  const documentKind = useMemo<'pdf' | 'image' | 'other'>(() => {
    if (documentMime.startsWith('image/')) return 'image';
    if (documentMime === 'application/pdf') return 'pdf';
    return 'other';
  }, [documentMime]);

  const documentBlobUrl = useMemo(() => {
    if (!documentBinary || documentKind !== 'image') return '';
    const blob = new Blob([documentBinary], { type: documentMime });
    return URL.createObjectURL(blob);
  }, [documentBinary, documentKind, documentMime]);

  useEffect(() => {
    return () => {
      if (documentBlobUrl) URL.revokeObjectURL(documentBlobUrl);
    };
  }, [documentBlobUrl]);

  if (signingQuery.isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (signingQuery.isError || !signerInfo) {
    return (
      <Card className="mx-auto mt-8 max-w-md p-8 text-center">
        <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-amber-500" />
        <h1 className="mb-2 text-xl font-semibold">
          Link de assinatura indisponível
        </h1>
        <p className="text-sm text-muted-foreground">
          O link pode ter expirado, já ter sido utilizado ou ser inválido. Entre
          em contato com quem solicitou a assinatura para receber um novo link.
        </p>
      </Card>
    );
  }

  if (signed || signerInfo.signerStatus === 'SIGNED') {
    return (
      <Card className="mx-auto mt-8 max-w-xl p-8 text-center">
        <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-emerald-500" />
        <h1 className="mb-2 text-2xl font-semibold">
          Documento assinado com sucesso!
        </h1>
        <p className="text-sm text-muted-foreground">
          Você receberá uma cópia do documento assinado por e-mail assim que
          todas as partes concluírem suas assinaturas.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:bg-emerald-500/8 dark:text-emerald-300">
          <Loader2 className="h-3 w-3 animate-spin" />
          Gerando PDF final com carimbo de autenticidade...
        </div>
      </Card>
    );
  }

  if (signerInfo.signerStatus === 'REJECTED') {
    return (
      <Card className="mx-auto mt-8 max-w-xl p-8 text-center">
        <XCircle className="mx-auto mb-4 h-14 w-14 text-rose-500" />
        <h1 className="mb-2 text-2xl font-semibold">Documento recusado</h1>
        <p className="text-sm text-muted-foreground">
          Esta assinatura foi recusada. Caso tenha sido um engano, entre em
          contato com o remetente do documento.
        </p>
      </Card>
    );
  }

  if (signerInfo.signerStatus === 'EXPIRED') {
    return (
      <Card className="mx-auto mt-8 max-w-xl p-8 text-center">
        <AlertTriangle className="mx-auto mb-4 h-14 w-14 text-amber-500" />
        <h1 className="mb-2 text-2xl font-semibold">Link expirado</h1>
        <p className="text-sm text-muted-foreground">
          O prazo para assinatura expirou. Solicite um novo link ao remetente do
          documento.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header — envelope + signer identity */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
            <FileSignature className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold leading-tight">
              {signerInfo.envelopeTitle}
            </h1>
            {signerInfo.envelopeDescription && (
              <p className="mt-1 text-sm text-muted-foreground">
                {signerInfo.envelopeDescription}
              </p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <Badge
                variant="secondary"
                className="bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300"
              >
                Signatário: {signerInfo.signerName}
              </Badge>
              <Badge
                variant="secondary"
                className="bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300"
              >
                {signerInfo.signerEmail}
              </Badge>
              <Badge
                variant="secondary"
                className="bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
              >
                Nível{' '}
                {signerInfo.signatureLevel === 'SIMPLE'
                  ? 'Simples'
                  : signerInfo.signatureLevel === 'ADVANCED'
                    ? 'Avançada'
                    : 'Qualificada (ICP-Brasil)'}
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Document preview */}
      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
          <h2 className="text-sm font-medium">Pré-visualização do documento</h2>
          {geoStatus === 'granted' && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" /> Localização capturada
            </span>
          )}
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/40">
          {documentLoadError ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <AlertTriangle className="h-10 w-10 text-amber-500" />
              <p className="text-sm text-muted-foreground">
                {documentLoadError}
              </p>
            </div>
          ) : !documentBinary ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Carregando documento...
              </p>
            </div>
          ) : documentKind === 'pdf' ? (
            <PdfViewer binaryData={documentBinary} />
          ) : documentKind === 'image' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={documentBlobUrl}
              alt={signerInfo.envelopeTitle}
              className="mx-auto max-h-[70vh] w-auto"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <FileSignature className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Formato não pré-visualizável diretamente. Prossiga com a
                assinatura se já revisou o conteúdo.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* OTP block — only when ADVANCED and not verified */}
      {requiresOtp && (
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-violet-600" />
            <h2 className="text-sm font-medium">
              Verificação em duas etapas obrigatória
            </h2>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            Este documento exige assinatura eletrônica avançada. Enviaremos um
            código de 6 dígitos para <strong>{signerInfo.signerEmail}</strong>.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label className="text-xs">Código recebido por e-mail</Label>
              <Input
                value={otpCode}
                onChange={event =>
                  setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                }
                inputMode="numeric"
                placeholder="000000"
                className="mt-1 tracking-[0.4em] text-center font-mono text-lg"
                disabled={otpVerified}
                maxLength={6}
              />
              {otpSentAt && !otpVerified && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Código enviado. Verifique sua caixa de entrada e a pasta de
                  spam.
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleRequestOtp}
                disabled={requestOtpMutation.isPending || otpVerified}
              >
                {requestOtpMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <MailCheck className="mr-2 h-4 w-4" />
                )}
                {otpSentAt ? 'Reenviar código' : 'Receber código por e-mail'}
              </Button>
              <Button
                type="button"
                onClick={handleVerifyOtp}
                disabled={
                  verifyOtpMutation.isPending ||
                  otpVerified ||
                  otpCode.length !== 6
                }
              >
                {verifyOtpMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="mr-2 h-4 w-4" />
                )}
                Verificar código
              </Button>
            </div>
          </div>

          {otpVerified && (
            <p className="mt-3 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs text-emerald-700 dark:bg-emerald-500/8 dark:text-emerald-300">
              <CheckCircle2 className="h-3 w-3" />
              Identidade confirmada.
            </p>
          )}
        </Card>
      )}

      {/* Consent + sign action */}
      <Card className="p-5">
        <label className="flex cursor-pointer items-start gap-3 text-sm">
          <Checkbox
            checked={consentAccepted}
            onCheckedChange={value => setConsentAccepted(Boolean(value))}
            className="mt-0.5"
            disabled={signedAlready}
          />
          <span>
            Li e concordo com o conteúdo do documento e autorizo a sua
            assinatura eletrônica em meu nome, nos termos da Lei nº 14.063/2020.
          </span>
        </label>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => setRejectOpen(true)}
            disabled={signMutation.isPending || signedAlready}
          >
            Rejeitar documento
          </Button>
          <Button
            type="button"
            onClick={handleSign}
            disabled={!canSign || signedAlready}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {signMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileSignature className="mr-2 h-4 w-4" />
            )}
            Assinar documento
          </Button>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Este ato de assinatura será registrado com data, horário, endereço IP
          {location ? ' e localização aproximada' : ''} para fins legais.
        </p>
      </Card>

      {/* Reject modal */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Recusar assinatura</DialogTitle>
            <DialogDescription>
              Informe o motivo da recusa. O remetente será notificado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-xs">Motivo (opcional)</Label>
            <Textarea
              value={rejectReason}
              onChange={event => setRejectReason(event.target.value)}
              placeholder="Ex.: O valor contratado está incorreto."
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectOpen(false)}
              disabled={rejectMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleReject}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Confirmar recusa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
