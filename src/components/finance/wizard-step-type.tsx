'use client';

import type { PayableSubType } from '@/types/finance';
import { PAYABLE_SUBTYPE_LABELS } from '@/types/finance';
import {
  ArrowRightLeft,
  Barcode,
  CreditCard,
  FileText,
  MoreHorizontal,
} from 'lucide-react';
import type { WizardData, WizardStep } from './payable-wizard-modal';

// ============================================================================
// CONSTANTS
// ============================================================================

const SUB_TYPE_CONFIG: {
  type: PayableSubType;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}[] = [
  {
    type: 'BOLETO',
    icon: Barcode,
    description: 'Pagamento via boleto bancário',
  },
  {
    type: 'NOTA_FISCAL',
    icon: FileText,
    description: 'Nota fiscal de serviço ou produto',
  },
  {
    type: 'TRANSFERENCIA',
    icon: ArrowRightLeft,
    description: 'Transferência bancária ou PIX',
  },
  {
    type: 'CARTAO',
    icon: CreditCard,
    description: 'Fatura de cartão de crédito',
  },
  {
    type: 'OUTROS',
    icon: MoreHorizontal,
    description: 'Outros tipos de despesa',
  },
];

// ============================================================================
// PROPS
// ============================================================================

interface WizardStepTypeProps {
  wizardData: WizardData;
  updateWizardData: (updates: Partial<WizardData>) => void;
  goToStep: (step: WizardStep) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function WizardStepType({
  wizardData,
  updateWizardData,
  goToStep,
}: WizardStepTypeProps) {
  const handleSelect = (subType: PayableSubType) => {
    updateWizardData({ subType });
    goToStep(2);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Selecione o tipo de conta a pagar:
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {SUB_TYPE_CONFIG.map(({ type, icon: Icon, description }) => {
          const isSelected = wizardData.subType === type;

          return (
            <button
              key={type}
              type="button"
              onClick={() => handleSelect(type)}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all hover:shadow-sm ${
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <Icon
                className={`h-8 w-8 ${
                  isSelected ? 'text-primary' : 'text-muted-foreground'
                }`}
              />
              <span className="text-sm font-medium">
                {PAYABLE_SUBTYPE_LABELS[type]}
              </span>
              <span className="text-xs text-muted-foreground text-center leading-tight">
                {description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
