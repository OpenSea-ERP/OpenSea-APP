'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  Trash2,
  AlertTriangle,
  Loader2,
  Package,
  LayoutGrid,
  CheckCircle,
  ArrowRightLeft,
} from 'lucide-react';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useZoneItemStats, useDeleteZone } from '../api/zones.queries';
import type { Zone } from '@/types/stock';

// ============================================
// TYPES
// ============================================

export interface ZoneDeleteWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zone: Zone;
  warehouseId: string;
  warehouseName?: string;
  onSuccess?: () => void;
  onRelocate?: () => void;
}

// ============================================
// COMPONENT
// ============================================

export function ZoneDeleteWizard({
  open,
  onOpenChange,
  zone,
  warehouseId,
  warehouseName,
  onSuccess,
  onRelocate,
}: ZoneDeleteWizardProps) {
  const [showPin, setShowPin] = useState(false);

  const { data: stats, isLoading } = useZoneItemStats(open ? zone.id : '');
  const deleteZone = useDeleteZone();

  const handleClose = useCallback(() => {
    setShowPin(false);
    onOpenChange(false);
  }, [onOpenChange]);

  const handleDeleteConfirm = useCallback(async () => {
    try {
      await deleteZone.mutateAsync({ id: zone.id, warehouseId });
      onSuccess?.();
      handleClose();
    } catch {
      toast.error('Erro ao excluir zona. Tente novamente.');
    }
  }, [zone.id, warehouseId, deleteZone, onSuccess, handleClose]);

  const handleRelocate = useCallback(() => {
    onRelocate?.();
    handleClose();
  }, [onRelocate, handleClose]);

  const hasItems = (stats?.totalItems ?? 0) > 0;

  // ============================================
  // STEP TITLE
  // ============================================

  const stepTitle = (
    <span className="inline-flex items-center gap-2 flex-wrap">
      Excluir Zona
      {warehouseName && (
        <span className="inline-flex items-center rounded-md border border-border bg-muted/50 px-2 py-0.5 text-[11px] font-medium uppercase text-muted-foreground">
          {warehouseName}
        </span>
      )}
      <span className="inline-flex items-center rounded-md border border-border bg-muted/50 px-2 py-0.5 text-[11px] font-medium uppercase text-muted-foreground">
        {zone.name}
      </span>
    </span>
  );

  // ============================================
  // STEP
  // ============================================

  const steps = useMemo<WizardStep[]>(() => {
    const step: WizardStep = {
      title: stepTitle,
      description: 'Revise o impacto antes de excluir esta zona.',
      icon: <Trash2 className="h-16 w-16 text-rose-500/60" />,
      content: (
        <div className="flex flex-col gap-3 h-full overflow-hidden">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-14 w-full rounded-lg" />
            </div>
          ) : !hasItems ? (
            /* Safe to delete — no items */
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/8 border border-emerald-200 dark:border-emerald-500/20">
                <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-sm text-emerald-700 dark:text-emerald-300">
                  Esta zona não possui itens. A exclusão é segura.
                </span>
              </div>

              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-muted/60 border border-border">
                <LayoutGrid className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-foreground">
                    Nichos a remover
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Todos os nichos desta zona serão excluídos
                  </p>
                </div>
                <span className="text-lg font-bold text-foreground">
                  {stats?.totalBins ?? 0}
                </span>
              </div>
            </div>
          ) : (
            /* Has items — show warning */
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-rose-50 dark:bg-rose-500/8 border border-rose-200 dark:border-rose-500/20">
                <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-rose-700 dark:text-rose-300">
                    Esta zona possui{' '}
                    {stats!.totalItems === 1
                      ? '1 item'
                      : `${stats!.totalItems} itens`}{' '}
                    em{' '}
                    {stats!.occupiedBins === 1
                      ? '1 nicho'
                      : `${stats!.occupiedBins} nichos`}
                    .
                  </span>
                  <p className="text-xs text-rose-600/80 dark:text-rose-400/70 mt-0.5">
                    Ao excluir, todos os itens serão desvinculados dos seus
                    nichos.
                  </p>
                </div>
              </div>

              {/* Stats cards */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    label: 'Total de Nichos',
                    value: stats!.totalBins,
                    icon: LayoutGrid,
                  },
                  {
                    label: 'Nichos Ocupados',
                    value: stats!.occupiedBins,
                    icon: Package,
                  },
                  {
                    label: 'Total de Itens',
                    value: stats!.totalItems,
                    icon: Package,
                  },
                ].map(card => (
                  <div
                    key={card.label}
                    className="flex flex-col items-center gap-1 rounded-lg bg-muted/60 border border-border px-3 py-3"
                  >
                    <card.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-lg font-bold text-foreground">
                      {card.value}
                    </span>
                    <span className="text-[10px] text-muted-foreground text-center leading-tight">
                      {card.label}
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-muted-foreground px-1">
                Recomendamos relocar os itens antes de excluir.
              </p>
            </div>
          )}
        </div>
      ),
      isValid: !isLoading,
      footer: (
        <div className="flex items-center justify-between w-full">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>

          <div className="flex items-center gap-2">
            {hasItems && !isLoading && onRelocate && (
              <Button
                type="button"
                variant="outline"
                onClick={handleRelocate}
                className="gap-1.5 text-blue-600 border-blue-300 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-500/30 dark:hover:bg-blue-500/10"
              >
                <ArrowRightLeft className="h-4 w-4" />
                Relocar Itens
              </Button>
            )}
            <Button
              type="button"
              onClick={() => setShowPin(true)}
              disabled={isLoading || deleteZone.isPending}
              className="gap-1.5 bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-500 text-white"
            >
              {deleteZone.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              <Trash2 className="h-4 w-4" />
              Excluir Zona
            </Button>
          </div>
        </div>
      ),
    };

    return [step];
  }, [
    stepTitle,
    isLoading,
    hasItems,
    stats,
    handleClose,
    handleRelocate,
    onRelocate,
    deleteZone.isPending,
  ]);

  return (
    <>
      <StepWizardDialog
        open={open}
        onOpenChange={onOpenChange}
        steps={steps}
        currentStep={1}
        onStepChange={() => {}}
        onClose={handleClose}
      />

      <VerifyActionPinModal
        isOpen={showPin}
        onClose={() => setShowPin(false)}
        onSuccess={handleDeleteConfirm}
        title="Confirmar Exclusão"
        description={`Digite seu PIN para excluir a zona ${zone.code}. Todos os nichos associados serão removidos.`}
      />
    </>
  );
}
