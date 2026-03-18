'use client';

import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

import {
  useConfigureZoneStructure,
  useReconfigurationPreview,
  useWarehouse,
  useZone,
} from '../../api';
import { generateSampleAddressesFromAisles } from '../../utils';
import { WIZARD_STEP_LABELS, SUCCESS_MESSAGES } from '../../constants';
import { PHYSICAL_DEFAULTS } from '../../constants';
import type {
  WizardStep,
  CodePattern,
  ZoneStructure,
  AisleConfig,
} from '@/types/stock';
import { defaultAisleConfig } from '@/types/stock';

import { StepAisles } from './step-aisles';
import { StepCodePattern } from './step-code-pattern';
import { StepPreview } from './step-preview';
import { StepConfirm } from './step-confirm';

interface StructureWizardProps {
  warehouseId: string;
  zoneId: string;
  onComplete?: () => void;
}

const STEPS: WizardStep[] = [
  'dimensions',
  'code-pattern',
  'preview',
  'confirm',
];

export function StructureWizard({
  warehouseId,
  zoneId,
  onComplete,
}: StructureWizardProps) {
  const router = useRouter();

  // Data fetching
  const { data: warehouse } = useWarehouse(warehouseId);
  const { data: zone } = useZone(zoneId);

  // State - using independent aisles
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [aisles, setAisles] = useState<AisleConfig[]>([
    { ...defaultAisleConfig },
  ]);
  const [codePatternState, setCodePatternState] = useState({
    separator: '-' as '-' | '.' | '',
    aisleDigits: 1 as 1 | 2,
    shelfDigits: 2 as 2 | 3,
    binLabeling: 'LETTERS' as 'LETTERS' | 'NUMBERS',
    binDirection: 'BOTTOM_UP' as 'BOTTOM_UP' | 'TOP_DOWN',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [occupiedBinsAction, setOccupiedBinsAction] = useState<
    'block' | 'force'
  >('block');

  // Pre-populate from existing structure (when editing, not first config)
  const hasLoadedStructure = useRef(false);
  useEffect(() => {
    if (!zone?.structure || hasLoadedStructure.current) return;

    const structure = zone.structure;
    const hasConfig =
      (structure.aisleConfigs && structure.aisleConfigs.length > 0) ||
      structure.aisles > 0;

    if (!hasConfig) return;

    hasLoadedStructure.current = true;

    // Populate aisles
    if (structure.aisleConfigs && structure.aisleConfigs.length > 0) {
      setAisles(
        structure.aisleConfigs.map(c => ({
          aisleNumber: c.aisleNumber,
          shelvesCount: c.shelvesCount,
          binsPerShelf: c.binsPerShelf,
        }))
      );
    } else if (structure.aisles > 0) {
      // Legacy uniform mode - generate aisleConfigs from flat values
      setAisles(
        Array.from({ length: structure.aisles }, (_, i) => ({
          aisleNumber: i + 1,
          shelvesCount: structure.shelvesPerAisle,
          binsPerShelf: structure.binsPerShelf,
        }))
      );
    }

    // Populate code pattern
    if (structure.codePattern) {
      setCodePatternState({
        separator: structure.codePattern.separator,
        aisleDigits: structure.codePattern.aisleDigits,
        shelfDigits: structure.codePattern.shelfDigits,
        binLabeling: structure.codePattern.binLabeling,
        binDirection: structure.codePattern.binDirection,
      });
    }
  }, [zone]);

  // Mutations
  const configureStructure = useConfigureZoneStructure();

  // Computed
  const currentStep = STEPS[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === STEPS.length - 1;
  const isReconfiguration = hasLoadedStructure.current;

  const codePattern: CodePattern = codePatternState;

  // Calculate totals from aisles
  const totalBins = useMemo(
    () =>
      aisles.reduce(
        (sum, aisle) => sum + aisle.shelvesCount * aisle.binsPerShelf,
        0
      ),
    [aisles]
  );

  // For backward compatibility with existing components
  const formData = useMemo(() => {
    // Find max values for preview/sample generation
    const maxShelves = Math.max(...aisles.map(a => a.shelvesCount));
    const maxBins = Math.max(...aisles.map(a => a.binsPerShelf));
    return {
      aisles: aisles.length,
      shelvesPerAisle: maxShelves,
      binsPerShelf: maxBins,
      ...codePatternState,
    };
  }, [aisles, codePatternState]);

  // Build structure for reconfiguration preview (only on confirm step)
  const previewStructure = useMemo<ZoneStructure | null>(() => {
    if (currentStep !== 'confirm') return null;
    const maxShelves = Math.max(...aisles.map(a => a.shelvesCount));
    const maxBins = Math.max(...aisles.map(a => a.binsPerShelf));
    return {
      aisles: aisles.length,
      shelvesPerAisle: maxShelves,
      binsPerShelf: maxBins,
      aisleConfigs: aisles,
      codePattern,
      dimensions: { ...PHYSICAL_DEFAULTS },
    };
  }, [currentStep, aisles, codePattern]);

  const { data: reconfigPreview, isLoading: isLoadingPreview } =
    useReconfigurationPreview(zoneId, previewStructure);

  const sampleAddresses = useMemo(() => {
    if (!warehouse || !zone) return [];
    return generateSampleAddressesFromAisles(
      warehouse.code,
      zone.code,
      aisles,
      codePattern
    );
  }, [warehouse, zone, aisles, codePattern]);

  // Handlers
  const handleCodePatternChange = useCallback(
    (field: keyof typeof codePatternState, value: string | number) => {
      setCodePatternState(prev => ({ ...prev, [field]: value }));
    },
    []
  );

  const handleNext = useCallback(() => {
    // Validate aisles step
    if (currentStep === 'dimensions') {
      if (aisles.length === 0) {
        setFormErrors({ aisles: 'Adicione pelo menos um corredor' });
        return;
      }
      const invalidAisle = aisles.find(
        a => a.shelvesCount < 1 || a.binsPerShelf < 1
      );
      if (invalidAisle) {
        setFormErrors({
          [`aisle_${invalidAisle.aisleNumber - 1}`]: 'Valores inválidos',
        });
        return;
      }
      setFormErrors({});
    }

    if (!isLastStep) {
      setCurrentStepIndex(prev => prev + 1);
    }
  }, [currentStep, aisles, isLastStep]);

  const handleBack = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [isFirstStep]);

  const handleSubmit = useCallback(async () => {
    if (!zone) return;

    // Calcular valores máximos para compatibilidade com sistemas antigos
    const maxShelves = Math.max(...aisles.map(a => a.shelvesCount));
    const maxBins = Math.max(...aisles.map(a => a.binsPerShelf));

    const structure: ZoneStructure = {
      aisles: aisles.length,
      shelvesPerAisle: maxShelves,
      binsPerShelf: maxBins,
      // Incluir configurações independentes dos corredores
      aisleConfigs: aisles,
      codePattern,
      dimensions: { ...PHYSICAL_DEFAULTS },
    };

    try {
      const result = await configureStructure.mutateAsync({
        zoneId: zone.id,
        structure: { structure },
        forceRemoveOccupiedBins: occupiedBinsAction === 'force',
      });

      // Show appropriate success message
      if (result.binsBlocked > 0) {
        toast.success(
          `Estrutura reconfigurada. ${result.binsBlocked} nicho(s) bloqueado(s) para realocação manual.`
        );
      } else if (result.binsPreserved > 0) {
        toast.success(
          `Estrutura reconfigurada. ${result.binsCreated} nicho(s) criado(s), ${result.binsPreserved} preservado(s).`
        );
      } else {
        toast.success(SUCCESS_MESSAGES.ZONE_STRUCTURE_CONFIGURED);
      }

      if (onComplete) {
        onComplete();
      } else {
        router.push(`/stock/locations/${warehouseId}/zones/${zoneId}`);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Erro ao configurar estrutura'
      );
    }
  }, [
    zone,
    aisles,
    codePattern,
    occupiedBinsAction,
    configureStructure,
    onComplete,
    router,
    warehouseId,
    zoneId,
  ]);

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'dimensions':
        return (
          <StepAisles
            aisles={aisles}
            binDirection={codePatternState.binDirection}
            onAislesChange={setAisles}
            onBinDirectionChange={dir =>
              handleCodePatternChange('binDirection', dir)
            }
            formErrors={formErrors}
          />
        );
      case 'code-pattern':
        return (
          <StepCodePattern
            formData={formData}
            warehouseCode={warehouse?.code || '???'}
            zoneCode={zone?.code || '???'}
            onChange={handleCodePatternChange}
            sampleAddresses={sampleAddresses}
          />
        );
      case 'preview':
        return (
          <StepPreview
            formData={formData}
            warehouseCode={warehouse?.code || '???'}
            zoneCode={zone?.code || '???'}
            zoneName={zone?.name || 'Zona'}
            totalBins={totalBins}
            sampleAddresses={sampleAddresses}
            aisles={aisles}
          />
        );
      case 'confirm':
        return (
          <StepConfirm
            formData={formData}
            warehouseCode={warehouse?.code || '???'}
            warehouseName={warehouse?.name || 'Armazém'}
            zoneCode={zone?.code || '???'}
            zoneName={zone?.name || 'Zona'}
            totalBins={totalBins}
            firstAddress={sampleAddresses[0]}
            lastAddress={sampleAddresses[sampleAddresses.length - 1]}
            reconfigPreview={reconfigPreview}
            isLoadingPreview={isLoadingPreview}
            occupiedBinsAction={occupiedBinsAction}
            onOccupiedBinsActionChange={setOccupiedBinsAction}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const isActive = index === currentStepIndex;
          const isCompleted = index < currentStepIndex;

          return (
            <React.Fragment key={step}>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors',
                    isCompleted && 'bg-primary text-primary-foreground',
                    isActive &&
                      'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2',
                    !isActive &&
                      !isCompleted &&
                      'bg-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                <span
                  className={cn(
                    'text-sm font-medium hidden sm:inline',
                    isActive && 'text-foreground',
                    !isActive && 'text-muted-foreground'
                  )}
                >
                  {WIZARD_STEP_LABELS[step]}
                </span>
              </div>

              {index < STEPS.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 flex-1 mx-2',
                    index < currentStepIndex ? 'bg-primary' : 'bg-muted'
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">{renderStepContent()}</div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={isFirstStep || configureStructure.isPending}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        {isLastStep ? (
          <Button
            onClick={handleSubmit}
            disabled={configureStructure.isPending || isLoadingPreview}
            variant={
              reconfigPreview &&
              !reconfigPreview.isFirstConfiguration &&
              reconfigPreview.totalAffectedItems > 0 &&
              occupiedBinsAction === 'force'
                ? 'destructive'
                : 'default'
            }
          >
            {configureStructure.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {reconfigPreview && !reconfigPreview.isFirstConfiguration
                  ? 'Reconfigurando...'
                  : `Criando ${totalBins.toLocaleString()} nichos...`}
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                {reconfigPreview && !reconfigPreview.isFirstConfiguration
                  ? 'Confirmar Reconfiguração'
                  : 'Confirmar e Criar'}
              </>
            )}
          </Button>
        ) : (
          <Button onClick={handleNext}>
            Próximo
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default StructureWizard;
