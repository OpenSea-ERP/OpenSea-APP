'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, FileWarning } from 'lucide-react';
import type { ValidationResult } from '../types';

interface ValidationErrorsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  validationResult: ValidationResult | null;
  headers?: { key: string; label?: string; customLabel?: string }[];
}

export function ValidationErrorsDialog({
  isOpen,
  onClose,
  validationResult,
  headers = [],
}: ValidationErrorsDialogProps) {
  if (!validationResult || validationResult.valid) return null;

  const errors = validationResult.errors;

  // Group errors by row
  const errorsByRow = new Map<number, typeof errors>();
  for (const error of errors) {
    const existing = errorsByRow.get(error.row) ?? [];
    existing.push(error);
    errorsByRow.set(error.row, existing);
  }

  // Build a field key → label map
  const fieldLabelMap = new Map<string, string>();
  for (const h of headers) {
    fieldLabelMap.set(h.key, h.customLabel || h.label || h.key);
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileWarning className="h-5 w-5 text-rose-500" />
            Erros de Validação
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-3 text-sm text-muted-foreground border-b pb-3">
          <span>
            {validationResult.totalRows} linha(s) analisada(s)
          </span>
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="w-3 h-3" />
            {validationResult.invalidRows} com erro
          </Badge>
          <Badge
            variant="secondary"
            className="gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
          >
            {validationResult.validRows} válida(s)
          </Badge>
        </div>

        <ScrollArea className="max-h-[400px] pr-3">
          <div className="space-y-3">
            {[...errorsByRow.entries()]
              .sort(([a], [b]) => a - b)
              .map(([row, rowErrors]) => (
                <div
                  key={row}
                  className="rounded-lg border border-rose-200 dark:border-rose-500/20 bg-rose-50/50 dark:bg-rose-500/5 p-3"
                >
                  <div className="text-sm font-medium text-rose-700 dark:text-rose-400 mb-1.5">
                    Linha {row}
                  </div>
                  <ul className="space-y-1">
                    {rowErrors.map((error, i) => {
                      const fieldLabel =
                        fieldLabelMap.get(error.fieldKey) || error.fieldKey;
                      return (
                        <li
                          key={i}
                          className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2"
                        >
                          <span className="text-rose-400 mt-0.5 shrink-0">
                            &bull;
                          </span>
                          <span>
                            <span className="font-medium">{fieldLabel}:</span>{' '}
                            {error.message}
                            {error.value && (
                              <span className="text-muted-foreground ml-1">
                                (valor: &quot;{error.value}&quot;)
                              </span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
