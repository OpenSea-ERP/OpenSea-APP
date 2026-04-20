'use client';

/**
 * OpenSea OS - BulkJobProgressDrawer
 *
 * Bottom-anchored vaul Drawer that renders live progress for a BullMQ bulk
 * rotation job. Subscribes to `useQrRotationProgress(jobId)` which reads the
 * `punch.qr_rotation.progress` and `punch.qr_rotation.completed` Socket.IO
 * events on the `tenant:{id}:hr` room (plan 05-04 contract).
 *
 * UX contract (UI-SPEC §K6):
 *   - Height ~320px, anchored bottom, NON-modal — the admin can close the
 *     drawer and continue navigating; the job keeps running and the user is
 *     notified through the normal notification tray.
 *   - Closing the drawer does NOT cancel the job (only the Cancelar button
 *     does). On unmount we tear down the Socket.IO handlers, never the job.
 *   - On completion (percent=100 OR completed event), render a success
 *     heading and — if the admin asked for PDFs — show the "Baixar PDF
 *     consolidado" link (the URL arrives via the notification tray; this
 *     component is intentionally forward-only and only shows the state it
 *     got from the socket).
 *
 * Copy is locked verbatim to UI-SPEC §Copywriting §/hr/crachas.
 */

import { useEffect, useMemo, useState } from 'react';
import { useQrRotationProgress } from '@/hooks/hr/use-qr-rotation-progress';
import { useCancelQrRotationBulk } from '@/app/(dashboard)/hr/crachas/mutations';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Loader2, X } from 'lucide-react';

export interface BulkJobProgressDrawerProps {
  /** Null = drawer hidden. String jobId = drawer open + subscribed. */
  jobId: string | null;
  /** True when the admin ticked "Gerar PDFs dos novos crachás" on submit. */
  generatePdfs: boolean;
  /** Total resolved server-side when the bulk job was enqueued. */
  total: number;
  onClose: () => void;
}

function formatElapsed(startedAt: number): string {
  const elapsedMs = Date.now() - startedAt;
  const seconds = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes === 0) return `${secs}s`;
  return `${minutes}min ${secs.toString().padStart(2, '0')}s`;
}

export function BulkJobProgressDrawer({
  jobId,
  generatePdfs,
  total,
  onClose,
}: BulkJobProgressDrawerProps) {
  const { progress, jobDone } = useQrRotationProgress(jobId);
  const cancelBulk = useCancelQrRotationBulk();

  const [cancelRequested, setCancelRequested] = useState(false);
  const [startedAt, setStartedAt] = useState<number>(() => Date.now());
  const [elapsedLabel, setElapsedLabel] = useState<string>('0s');

  // Reset timer when a new job starts.
  useEffect(() => {
    if (jobId) {
      setStartedAt(Date.now());
      setCancelRequested(false);
    }
  }, [jobId]);

  // Tick every second while the drawer is open and the job is running.
  useEffect(() => {
    if (!jobId || jobDone) return;
    const interval = setInterval(() => {
      setElapsedLabel(formatElapsed(startedAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [jobId, jobDone, startedAt]);

  const percent = progress?.percent ?? 0;
  const processed = progress?.processed ?? 0;
  const effectiveTotal = progress?.total ?? total;

  const heading = useMemo(() => {
    if (jobDone) return 'Rotação concluída';
    if (cancelRequested) return 'Rotação em andamento';
    return 'Rotação em andamento';
  }, [jobDone, cancelRequested]);

  const bodyLine = useMemo(() => {
    if (jobDone) {
      return generatePdfs
        ? `${processed || effectiveTotal} funcionários rotacionados. Baixar PDF consolidado.`
        : `${processed || effectiveTotal} funcionários rotacionados.`;
    }
    if (cancelRequested) {
      return 'Cancelando rotação…';
    }
    return `${processed} de ${effectiveTotal} processados · ${percent}%`;
  }, [
    jobDone,
    cancelRequested,
    processed,
    effectiveTotal,
    percent,
    generatePdfs,
  ]);

  const handleCancel = () => {
    if (!jobId) return;
    setCancelRequested(true);
    cancelBulk.mutate(jobId);
  };

  const isOpen = jobId !== null;

  return (
    <Drawer
      open={isOpen}
      onOpenChange={next => {
        if (!next) onClose();
      }}
      modal={false}
      dismissible
    >
      <DrawerContent
        className="h-[320px]"
        data-testid="bulk-job-progress-drawer"
      >
        <DrawerHeader className="relative">
          <DrawerTitle className="flex items-center gap-2">
            {jobDone ? (
              <CheckCircle2 className="w-5 h-5 text-success" />
            ) : (
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            )}
            {heading}
          </DrawerTitle>
          <DrawerDescription className="mt-1">{bodyLine}</DrawerDescription>
          <DrawerClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3"
              aria-label="Fechar painel"
            >
              <X className="w-4 h-4" />
            </Button>
          </DrawerClose>
        </DrawerHeader>

        <div className="flex flex-col gap-4 px-4 pb-6 flex-1 mx-auto w-full max-w-2xl">
          <Progress value={percent} />

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {processed} de {effectiveTotal} processados · {percent}%
            </span>
            {!jobDone ? (
              <span aria-live="polite">Tempo decorrido: {elapsedLabel}</span>
            ) : (
              <span>Concluído em {elapsedLabel}</span>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 mt-auto">
            {!jobDone ? (
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={cancelRequested || cancelBulk.isPending}
                className="gap-2"
              >
                {cancelBulk.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null}
                Cancelar
              </Button>
            ) : (
              <>
                {generatePdfs ? (
                  <Button
                    variant="default"
                    onClick={onClose}
                    className="gap-2"
                    // The signed URL lands in the notification tray
                    // (see punch.qr_rotation.completed manifest) so the
                    // button here is intentionally a passthrough that
                    // dismisses the drawer after the admin reads the
                    // completion state.
                  >
                    Baixar PDF consolidado
                  </Button>
                ) : null}
                <Button variant="outline" onClick={onClose}>
                  Fechar
                </Button>
              </>
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
