'use client';

import { useState, useCallback } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useConfigureZoneStructure } from '../api/zones.queries';
import type { Zone } from '@/types/stock';

// ============================================
// TYPES
// ============================================

export interface ZoneStructureConfigProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  zone: Zone;
  onSuccess?: () => void;
}

interface AisleEntry {
  shelves: number;
  bins: number;
}

// ============================================
// COMPONENT
// ============================================

export function ZoneStructureConfig({
  open,
  onOpenChange,
  zone,
  onSuccess,
}: ZoneStructureConfigProps) {
  const [aisles, setAisles] = useState<AisleEntry[]>(() => {
    // Pre-fill from existing structure if available
    if (zone.structure?.aisleConfigs && zone.structure.aisleConfigs.length > 0) {
      return zone.structure.aisleConfigs.map(a => ({
        shelves: a.shelvesCount,
        bins: a.binsPerShelf,
      }));
    }
    if (zone.structure?.aisles > 0) {
      return Array.from({ length: zone.structure.aisles }, () => ({
        shelves: zone.structure.shelvesPerAisle || 1,
        bins: zone.structure.binsPerShelf || 1,
      }));
    }
    return [{ shelves: 1, bins: 1 }];
  });

  const configureStructure = useConfigureZoneStructure();

  const updateAisle = useCallback(
    (index: number, field: 'shelves' | 'bins', value: number) => {
      setAisles(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
        return updated;
      });
    },
    []
  );

  const addAisle = useCallback(() => {
    setAisles(prev => [...prev, { shelves: 1, bins: 1 }]);
  }, []);

  const removeAisle = useCallback(
    (index: number) => {
      if (aisles.length <= 1) return;
      setAisles(prev => prev.filter((_, i) => i !== index));
    },
    [aisles.length]
  );

  const handleConfirm = useCallback(async () => {
    try {
      await configureStructure.mutateAsync({
        zoneId: zone.id,
        structure: {
          structure: {
            aisles: aisles.length,
            shelvesPerAisle: aisles[0]?.shelves ?? 1,
            binsPerShelf: aisles[0]?.bins ?? 1,
            aisleConfigs: aisles.map((a, i) => ({
              aisleNumber: i + 1,
              shelvesCount: a.shelves,
              binsPerShelf: a.bins,
            })),
            codePattern: zone.structure?.codePattern ?? {
              separator: '-',
              aisleDigits: 1,
              shelfDigits: 2,
              binLabeling: 'LETTERS' as const,
              binDirection: 'BOTTOM_UP' as const,
            },
            dimensions: zone.structure?.dimensions ?? {
              aisleWidth: 100,
              aisleSpacing: 200,
              shelfWidth: 100,
              shelfHeight: 200,
              binHeight: 40,
            },
          },
        },
      });
      toast.success('Estrutura configurada com sucesso!');
      onSuccess?.();
      onOpenChange(false);
    } catch {
      toast.error('Erro ao configurar estrutura. Tente novamente.');
    }
  }, [
    aisles,
    zone.id,
    zone.structure,
    configureStructure,
    onSuccess,
    onOpenChange,
  ]);

  // Calculate totals
  const totalAisles = aisles.length;
  const totalShelves = aisles.reduce((sum, a) => sum + a.shelves, 0);
  const totalBins = aisles.reduce((sum, a) => sum + a.shelves * a.bins, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Configurar Estrutura — Zona {zone.code}
          </DialogTitle>
          <DialogDescription>
            Defina os corredores, prateleiras e nichos desta zona
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {aisles.map((aisle, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
            >
              <span className="text-sm font-medium text-muted-foreground w-24 shrink-0">
                Corredor {index + 1}
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
                      index,
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
                      index,
                      'bins',
                      Math.max(1, Math.min(26, parseInt(e.target.value) || 1))
                    )
                  }
                  className="w-24"
                />
              </div>
              {aisles.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => removeAisle(index)}
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
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={configureStructure.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={configureStructure.isPending}
            className="gap-1.5"
          >
            {configureStructure.isPending && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {configureStructure.isPending ? 'Configurando...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
