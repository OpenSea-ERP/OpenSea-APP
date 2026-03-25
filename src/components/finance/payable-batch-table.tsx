'use client';

import type { PayableWizardData } from './payable-wizard-modal';

interface PayableBatchTableProps {
  data: PayableWizardData;
  onChange: (partial: Partial<PayableWizardData>) => void;
}

export function PayableBatchTable({ data, onChange }: PayableBatchTableProps) {
  void data;
  void onChange;

  return (
    <div className="flex items-center justify-center h-full text-muted-foreground">
      <p className="text-sm">Layout B — Tabela em lote (em breve)</p>
    </div>
  );
}
