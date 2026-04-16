/**
 * Key Result Check-in Modal (HR)
 * Modal de check-in para atualizar progresso de um Key Result, com input de
 * novo valor, status (radio On Track/At Risk/Off Track), comentário e
 * indicador de variação. Inspirado em 15Five / Lattice check-in flow.
 */

'use client';

import { Button } from '@/components/ui/button';
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
import { useCheckInKeyResult } from '@/app/(dashboard)/(modules)/hr/(entities)/okrs/src/api';
import { cn } from '@/lib/utils';
import type { CheckInConfidence, OKRKeyResult } from '@/types/hr';
import { Loader2, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

interface KeyResultCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  keyResult: OKRKeyResult | null;
}

const HEALTH_OPTIONS: {
  value: 'ON_TRACK' | 'AT_RISK' | 'OFF_TRACK';
  label: string;
  description: string;
  confidence: CheckInConfidence;
}[] = [
  {
    value: 'ON_TRACK',
    label: 'No caminho',
    description: 'Atingirei a meta no prazo',
    confidence: 'HIGH',
  },
  {
    value: 'AT_RISK',
    label: 'Em risco',
    description: 'Há obstáculos, mas posso recuperar',
    confidence: 'MEDIUM',
  },
  {
    value: 'OFF_TRACK',
    label: 'Fora do caminho',
    description: 'Pouco provável atingir',
    confidence: 'LOW',
  },
];

function formatValue(value: number, unit?: string | null): string {
  const formatted = Number.isInteger(value)
    ? value.toLocaleString('pt-BR')
    : value.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
  return unit ? `${formatted} ${unit}` : formatted;
}

export function KeyResultCheckinModal({
  isOpen,
  onClose,
  keyResult,
}: KeyResultCheckinModalProps) {
  const checkInMutation = useCheckInKeyResult();

  const [newValueInput, setNewValueInput] = useState('');
  const [note, setNote] = useState('');
  const [healthStatus, setHealthStatus] = useState<
    'ON_TRACK' | 'AT_RISK' | 'OFF_TRACK'
  >('ON_TRACK');

  useEffect(() => {
    if (isOpen && keyResult) {
      setNewValueInput(String(keyResult.currentValue));
      setNote('');
      setHealthStatus(
        keyResult.status === 'AT_RISK'
          ? 'AT_RISK'
          : keyResult.status === 'BEHIND'
            ? 'OFF_TRACK'
            : 'ON_TRACK'
      );
    }
  }, [isOpen, keyResult]);

  // ============================================================================
  // COMPUTED
  // ============================================================================

  const parsedValue = useMemo(() => {
    const numeric = parseFloat(newValueInput);
    return Number.isFinite(numeric) ? numeric : null;
  }, [newValueInput]);

  const variation = useMemo(() => {
    if (!keyResult || parsedValue == null) return null;
    return parsedValue - keyResult.currentValue;
  }, [parsedValue, keyResult]);

  const projectedProgress = useMemo(() => {
    if (!keyResult || parsedValue == null) return null;
    const range = keyResult.targetValue - keyResult.startValue;
    if (range === 0) return parsedValue >= keyResult.targetValue ? 100 : 0;
    const pct = ((parsedValue - keyResult.startValue) / range) * 100;
    return Math.max(0, Math.min(100, Math.round(pct)));
  }, [parsedValue, keyResult]);

  // ============================================================================
  // SUBMIT
  // ============================================================================

  const handleSubmit = useCallback(() => {
    if (!keyResult || parsedValue == null) return;

    const selectedConfidence =
      HEALTH_OPTIONS.find(option => option.value === healthStatus)
        ?.confidence ?? 'MEDIUM';

    checkInMutation.mutate(
      {
        keyResultId: keyResult.id,
        data: {
          newValue: parsedValue,
          note: note.trim() || undefined,
          confidence: selectedConfidence,
        },
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  }, [keyResult, parsedValue, healthStatus, note, checkInMutation, onClose]);

  if (!keyResult) return null;

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent
        className="sm:max-w-md"
        data-testid="key-result-checkin-modal"
      >
        <DialogHeader>
          <DialogTitle>Registrar Check-in</DialogTitle>
          <DialogDescription>
            Atualizar progresso de &quot;{keyResult.title}&quot;
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Snapshot atual */}
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3 space-y-1.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Valor atual</span>
              <span className="font-medium">
                {formatValue(keyResult.currentValue, keyResult.unit)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Meta</span>
              <span className="font-medium">
                {formatValue(keyResult.targetValue, keyResult.unit)}
              </span>
            </div>
          </div>

          {/* Novo valor */}
          <div className="space-y-2">
            <Label htmlFor="checkin-new-value">
              Novo valor <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="checkin-new-value"
              type="number"
              inputMode="decimal"
              step="any"
              value={newValueInput}
              onChange={event => setNewValueInput(event.target.value)}
              placeholder="Digite o novo valor"
            />
            {variation != null && variation !== 0 && (
              <div
                className={cn(
                  'flex items-center text-xs gap-1',
                  variation > 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                )}
              >
                {variation > 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>
                  {variation > 0 ? '+' : ''}
                  {formatValue(variation, keyResult.unit)} desde o último valor
                  {projectedProgress != null
                    ? ` — ${projectedProgress}% da meta`
                    : ''}
                </span>
              </div>
            )}
            {variation === 0 && (
              <div className="flex items-center text-xs gap-1 text-muted-foreground">
                <Minus className="h-3 w-3" />
                <span>Sem variação desde o último valor</span>
              </div>
            )}
          </div>

          {/* Status (radio) */}
          <div className="space-y-2">
            <Label>
              Status <span className="text-rose-500">*</span>
            </Label>
            <div
              role="radiogroup"
              aria-label="Status de saúde"
              className="space-y-2"
            >
              {HEALTH_OPTIONS.map(option => {
                const isSelected = healthStatus === option.value;
                const accentClass =
                  option.value === 'ON_TRACK'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/8 dark:text-emerald-300'
                    : option.value === 'AT_RISK'
                      ? 'border-amber-500 bg-amber-50 text-amber-700 dark:bg-amber-500/8 dark:text-amber-300'
                      : 'border-rose-500 bg-rose-50 text-rose-700 dark:bg-rose-500/8 dark:text-rose-300';
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setHealthStatus(option.value)}
                    data-testid={`checkin-status-${option.value.toLowerCase()}`}
                    className={cn(
                      'w-full rounded-lg border p-2.5 text-left text-sm transition-colors',
                      isSelected
                        ? accentClass
                        : 'border-border hover:bg-accent'
                    )}
                  >
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {option.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comentário */}
          <div className="space-y-2">
            <Label htmlFor="checkin-note">Comentário</Label>
            <Textarea
              id="checkin-note"
              value={note}
              onChange={event => setNote(event.target.value)}
              placeholder="Contexto, bloqueios, próximos passos (opcional)"
              rows={3}
              maxLength={2000}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            size="sm"
            className="h-9 px-2.5"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={checkInMutation.isPending || parsedValue == null}
            size="sm"
            className="h-9 px-2.5"
            data-testid="checkin-submit"
          >
            {checkInMutation.isPending && (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            )}
            Registrar Check-in
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default KeyResultCheckinModal;
