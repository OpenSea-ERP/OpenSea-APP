'use client';

import { useCallback, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { usePermissions } from '@/hooks/use-permissions';
import { esocialService } from '@/services/hr/esocial.service';
import { cn } from '@/lib/utils';
import type { EsocialEventStatus } from '@/types/esocial';

const RETRY_PERMISSIONS = ['hr.esocial.modify', 'hr.esocial.admin'] as const;

interface EsocialRetryButtonProps {
  eventId: string;
  status: EsocialEventStatus;
  /**
   * Quando true, exige confirmação por PIN antes de reenviar.
   * Recomendado em ações em massa ou de impacto fiscal alto.
   */
  requirePin?: boolean;
  /** Callback opcional após sucesso (refetch específico, fechar modal, etc.) */
  onSuccess?: () => void;
  /** Tamanho do botão (default `sm`) */
  size?: 'sm' | 'default';
  /** Classe extra (override visual) */
  className?: string;
  /** Variante do botão (default `outline`) */
  variant?: 'outline' | 'ghost' | 'default';
  /** Rótulo customizado (default "Reenviar") */
  label?: string;
}

/**
 * Botão inline para retentar transmissão de um evento eSocial rejeitado
 * ou em erro. Apenas renderizado quando o status é REJECTED ou ERROR
 * E o usuário possui `hr.esocial.modify` ou `hr.esocial.admin`.
 *
 * A ação chama `PATCH /v1/esocial/events/:id/status` com `action=rectify`,
 * que cria um novo evento DRAFT vinculado ao original (retificação).
 *
 * data-testid: `esocial-retry-{eventId}` para testes E2E.
 */
export function EsocialRetryButton({
  eventId,
  status,
  requirePin = false,
  onSuccess,
  size = 'sm',
  className,
  variant = 'outline',
  label = 'Reenviar',
}: EsocialRetryButtonProps) {
  const queryClient = useQueryClient();
  const { hasAnyPermission } = usePermissions();
  const [pinModalOpen, setPinModalOpen] = useState(false);

  const canRetry = hasAnyPermission(...RETRY_PERMISSIONS);
  const isRetryableStatus = status === 'REJECTED' || status === 'ERROR';

  const retryMutation = useMutation({
    mutationFn: () => esocialService.updateEventStatus(eventId, 'rectify'),
    onSuccess: () => {
      toast.success(
        'Evento de retificação criado em rascunho. Revise e aprove para reenvio.',
      );
      queryClient.invalidateQueries({ queryKey: ['esocial'] });
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Não foi possível reenviar o evento.');
    },
  });

  const handleClick = useCallback(() => {
    if (requirePin) {
      setPinModalOpen(true);
      return;
    }
    retryMutation.mutate();
  }, [requirePin, retryMutation]);

  const handlePinSuccess = useCallback(() => {
    retryMutation.mutate();
  }, [retryMutation]);

  if (!isRetryableStatus || !canRetry) {
    return null;
  }

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        data-testid={`esocial-retry-${eventId}`}
        onClick={handleClick}
        disabled={retryMutation.isPending}
        className={cn(
          'gap-1.5 border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800',
          'dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/8 dark:hover:text-rose-200',
          size === 'sm' && 'h-8 px-2.5',
          className,
        )}
        aria-label="Reenviar evento eSocial"
      >
        {retryMutation.isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <RotateCcw className="h-3.5 w-3.5" />
        )}
        <span>{label}</span>
      </Button>

      {requirePin && (
        <VerifyActionPinModal
          isOpen={pinModalOpen}
          onClose={() => setPinModalOpen(false)}
          onSuccess={handlePinSuccess}
          title="Confirmar reenvio ao eSocial"
          description="Digite seu PIN de Ação para autorizar a retificação do evento rejeitado."
        />
      )}
    </>
  );
}
