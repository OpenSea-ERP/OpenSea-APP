'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  Warehouse,
  LayoutGrid,
  CheckCircle2,
  Plus,
  X,
  ArrowLeft,
  Loader2,
  Info,
} from 'lucide-react';
import {
  StepWizardDialog,
  type WizardStep,
} from '@/components/ui/step-wizard-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useLocationSetup } from '../api/setup.queries';

// ============================================
// TYPES
// ============================================

export interface LocationSetupWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (warehouseId: string) => void;
}

interface ZoneEntry {
  code: string;
  name: string;
}

interface AisleEntry {
  shelves: number;
  bins: number;
}

interface ZoneStructureConfig {
  aisles: AisleEntry[];
}

// ============================================
// COMPONENT
// ============================================

export function LocationSetupWizard({
  open,
  onOpenChange,
  onSuccess,
}: LocationSetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const locationSetup = useLocationSetup();

  // Step 1 - Warehouse
  const [warehouseCode, setWarehouseCode] = useState('');
  const [warehouseName, setWarehouseName] = useState('');
  const [warehouseDescription, setWarehouseDescription] = useState('');

  // Step 2 - Zones
  const [zones, setZones] = useState<ZoneEntry[]>([{ code: '', name: '' }]);

  // Step 3 - Zone structures
  const [zoneStructures, setZoneStructures] = useState<
    Record<number, ZoneStructureConfig>
  >({});
  const [configuringZoneIndex, setConfiguringZoneIndex] = useState<
    number | null
  >(null);

  // ============================================
  // HANDLERS
  // ============================================

  const handleClose = useCallback(() => {
    setCurrentStep(1);
    setWarehouseCode('');
    setWarehouseName('');
    setWarehouseDescription('');
    setZones([{ code: '', name: '' }]);
    setZoneStructures({});
    setConfiguringZoneIndex(null);
    onOpenChange(false);
  }, [onOpenChange]);

  const handleCodeChange = useCallback((value: string) => {
    setWarehouseCode(value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5));
  }, []);

  const handleZoneCodeChange = useCallback(
    (index: number, value: string) => {
      const updated = [...zones];
      updated[index] = {
        ...updated[index],
        code: value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5),
      };
      setZones(updated);
    },
    [zones]
  );

  const handleZoneNameChange = useCallback(
    (index: number, value: string) => {
      const updated = [...zones];
      updated[index] = { ...updated[index], name: value };
      setZones(updated);
    },
    [zones]
  );

  const addZone = useCallback(() => {
    setZones(prev => [...prev, { code: '', name: '' }]);
  }, []);

  const removeZone = useCallback(
    (index: number) => {
      if (zones.length <= 1) return;
      setZones(prev => prev.filter((_, i) => i !== index));
      // Clean up structure config for removed zone
      setZoneStructures(prev => {
        const updated = { ...prev };
        delete updated[index];
        // Re-index remaining
        const reindexed: Record<number, ZoneStructureConfig> = {};
        Object.entries(updated).forEach(([key, val]) => {
          const k = parseInt(key);
          if (k > index) {
            reindexed[k - 1] = val;
          } else {
            reindexed[k] = val;
          }
        });
        return reindexed;
      });
    },
    [zones.length]
  );

  // Zone structure config handlers
  const getOrCreateStructure = useCallback(
    (zoneIndex: number): ZoneStructureConfig => {
      return zoneStructures[zoneIndex] || { aisles: [{ shelves: 1, bins: 1 }] };
    },
    [zoneStructures]
  );

  const updateStructure = useCallback(
    (zoneIndex: number, structure: ZoneStructureConfig) => {
      setZoneStructures(prev => ({ ...prev, [zoneIndex]: structure }));
    },
    []
  );

  const handleFinalize = useCallback(async () => {
    const validZones = zones.filter(z => z.code && z.name);

    try {
      const result = await locationSetup.mutateAsync({
        warehouse: {
          code: warehouseCode,
          name: warehouseName,
          description: warehouseDescription || undefined,
        },
        zones: validZones.map((zone, index) => {
          const structure = zoneStructures[index];
          return {
            code: zone.code,
            name: zone.name,
            structure: structure
              ? {
                  aisleConfigs: structure.aisles.map(a => ({
                    shelvesPerAisle: a.shelves,
                    binsPerShelf: a.bins,
                  })),
                }
              : undefined,
          };
        }),
      });

      toast.success('Armazém criado com sucesso!');
      onSuccess?.(result.warehouse.id);
      handleClose();
    } catch {
      toast.error('Erro ao criar armazém. Tente novamente.');
    }
  }, [
    zones,
    warehouseCode,
    warehouseName,
    warehouseDescription,
    zoneStructures,
    locationSetup,
    onSuccess,
    handleClose,
  ]);

  // ============================================
  // VALIDATION
  // ============================================

  const step1Valid = warehouseCode.length >= 2 && warehouseName.length > 0;

  const step2Valid = useMemo(() => {
    const filledZones = zones.filter(z => z.code.length >= 2 && z.name.length > 0);
    if (filledZones.length === 0) return false;
    // Check for unique codes
    const codes = filledZones.map(z => z.code);
    return new Set(codes).size === codes.length;
  }, [zones]);

  // ============================================
  // STEP 3 SUB-FLOW: Zone Structure Config
  // ============================================

  const renderZoneStructureConfig = useCallback(
    (zoneIndex: number) => {
      const zone = zones[zoneIndex];
      const structure = getOrCreateStructure(zoneIndex);

      const updateAisle = (aisleIndex: number, field: 'shelves' | 'bins', value: number) => {
        const updated = { ...structure };
        updated.aisles = [...updated.aisles];
        updated.aisles[aisleIndex] = { ...updated.aisles[aisleIndex], [field]: value };
        updateStructure(zoneIndex, updated);
      };

      const addAisle = () => {
        const updated = { ...structure };
        updated.aisles = [...updated.aisles, { shelves: 1, bins: 1 }];
        updateStructure(zoneIndex, updated);
      };

      const removeAisle = (aisleIndex: number) => {
        if (structure.aisles.length <= 1) return;
        const updated = { ...structure };
        updated.aisles = updated.aisles.filter((_, i) => i !== aisleIndex);
        updateStructure(zoneIndex, updated);
      };

      // Calculate totals
      const totalAisles = structure.aisles.length;
      const totalShelves = structure.aisles.reduce((sum, a) => sum + a.shelves, 0);
      const totalBins = structure.aisles.reduce(
        (sum, a) => sum + a.shelves * a.bins,
        0
      );

      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setConfiguringZoneIndex(null)}
              className="gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <span className="text-sm font-medium">
              Configurando Zona {zone.code}
            </span>
          </div>

          <div className="space-y-3">
            {structure.aisles.map((aisle, aisleIndex) => (
              <div
                key={aisleIndex}
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
              >
                <span className="text-sm font-medium text-muted-foreground w-24 shrink-0">
                  Corredor {aisleIndex + 1}
                </span>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">
                    Prateleiras
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    max={999}
                    value={aisle.shelves}
                    onChange={e =>
                      updateAisle(
                        aisleIndex,
                        'shelves',
                        Math.max(1, Math.min(999, parseInt(e.target.value) || 1))
                      )
                    }
                    className="w-24"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">
                    Nichos
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    max={26}
                    value={aisle.bins}
                    onChange={e =>
                      updateAisle(
                        aisleIndex,
                        'bins',
                        Math.max(1, Math.min(26, parseInt(e.target.value) || 1))
                      )
                    }
                    className="w-24"
                  />
                </div>
                {structure.aisles.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => removeAisle(aisleIndex)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addAisle}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Adicionar Corredor
          </Button>

          <p className="text-sm text-muted-foreground">
            Total: {totalAisles} corredor(es) · {totalShelves} prateleira(s) ·{' '}
            {totalBins} bin(s)
          </p>

          <Button
            type="button"
            onClick={() => {
              updateStructure(zoneIndex, structure);
              setConfiguringZoneIndex(null);
            }}
          >
            Confirmar Configuração
          </Button>
        </div>
      );
    },
    [zones, getOrCreateStructure, updateStructure]
  );

  // ============================================
  // STEP CONTENT
  // ============================================

  const step1Content = (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="warehouse-code">Código</Label>
        <Input
          id="warehouse-code"
          value={warehouseCode}
          onChange={e => handleCodeChange(e.target.value)}
          placeholder="EX: FAB"
          maxLength={5}
          className="uppercase"
        />
        <p className="text-xs text-muted-foreground">
          2 a 5 caracteres (letras e números)
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="warehouse-name">Nome</Label>
        <Input
          id="warehouse-name"
          value={warehouseName}
          onChange={e => setWarehouseName(e.target.value)}
          placeholder="Ex: Fábrica Principal"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="warehouse-description">Descrição (opcional)</Label>
        <Textarea
          id="warehouse-description"
          value={warehouseDescription}
          onChange={e => setWarehouseDescription(e.target.value)}
          placeholder="Descrição do armazém..."
          rows={3}
        />
      </div>
    </div>
  );

  const step2Content = (
    <div className="space-y-4">
      {zones.map((zone, index) => (
        <div key={index} className="flex items-center gap-3">
          <Input
            value={zone.code}
            onChange={e => handleZoneCodeChange(index, e.target.value)}
            placeholder="Código"
            maxLength={5}
            className="w-32 uppercase"
          />
          <Input
            value={zone.name}
            onChange={e => handleZoneNameChange(index, e.target.value)}
            placeholder="Nome da zona"
            className="flex-1"
          />
          {zones.length > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => removeZone(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addZone}
        className="gap-1.5"
      >
        <Plus className="h-4 w-4" />
        Adicionar Zona
      </Button>
    </div>
  );

  const step3Content =
    configuringZoneIndex !== null ? (
      renderZoneStructureConfig(configuringZoneIndex)
    ) : (
      <div className="space-y-4">
        {/* Warehouse summary */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="font-mono font-medium text-lg">{warehouseCode}</div>
          <div className="text-sm text-muted-foreground">{warehouseName}</div>
        </div>

        <Separator />

        {/* Zone list */}
        <div className="space-y-3">
          {zones
            .filter(z => z.code && z.name)
            .map((zone, displayIndex) => {
              // Find original index for structure lookup
              const originalIndex = zones.findIndex(
                z => z.code === zone.code && z.name === zone.name
              );
              const structure = zoneStructures[originalIndex];
              const isConfigured = !!structure;

              let totalAisles = 0;
              let totalBins = 0;
              if (structure) {
                totalAisles = structure.aisles.length;
                totalBins = structure.aisles.reduce(
                  (sum, a) => sum + a.shelves * a.bins,
                  0
                );
              }

              return (
                <div
                  key={displayIndex}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="font-mono font-medium">{zone.code}</span>
                      <span className="text-muted-foreground mx-2">—</span>
                      <span className="text-sm">{zone.name}</span>
                    </div>
                    {isConfigured ? (
                      <Badge className="bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border-0">
                        Configurada — {totalAisles} corredor(es), {totalBins}{' '}
                        bin(s)
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border-0">
                        Pendente
                      </Badge>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setConfiguringZoneIndex(originalIndex)}
                  >
                    Configurar
                  </Button>
                </div>
              );
            })}
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Você pode configurar a estrutura das zonas depois, diretamente na
            página do armazém.
          </AlertDescription>
        </Alert>
      </div>
    );

  // ============================================
  // STEPS
  // ============================================

  const steps: WizardStep[] = [
    {
      title: 'Novo Armazém',
      description: 'Defina o armazém principal',
      icon: <Warehouse className="h-16 w-16 text-muted-foreground/50" />,
      content: step1Content,
      isValid: step1Valid,
    },
    {
      title: 'Zonas do Armazém',
      description: 'Adicione as zonas de armazenamento',
      icon: <LayoutGrid className="h-16 w-16 text-muted-foreground/50" />,
      content: step2Content,
      isValid: step2Valid,
    },
    {
      title: 'Resumo',
      description: 'Revise e configure as zonas',
      icon: <CheckCircle2 className="h-16 w-16 text-muted-foreground/50" />,
      content: step3Content,
      isValid: true,
      footer: configuringZoneIndex !== null ? (
        <></>
      ) : (
        <>
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleFinalize}
            disabled={locationSetup.isPending}
            className="gap-1.5"
          >
            {locationSetup.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {locationSetup.isPending ? 'Criando...' : 'Finalizar'}
          </Button>
        </>
      ),
    },
  ];

  return (
    <StepWizardDialog
      open={open}
      onOpenChange={val => {
        if (!val) handleClose();
      }}
      steps={steps}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      onClose={handleClose}
    />
  );
}
