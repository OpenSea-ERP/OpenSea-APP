'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bookmark, Plus, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface FilterPreset {
  id: string;
  name: string;
  filters: Record<string, string | undefined>;
}

interface FilterPresetsProps {
  /** Unique page key for localStorage (e.g., 'payable', 'receivable') */
  pageKey: string;
  /** Currently active filters (to save as preset) */
  currentFilters: Record<string, string | undefined>;
  /** Apply a preset's filters */
  onApply: (filters: Record<string, string | undefined>) => void;
  /** Built-in quick presets */
  quickPresets?: { label: string; filters: Record<string, string | undefined> }[];
}

// ============================================================================
// HELPERS
// ============================================================================

function getStorageKey(pageKey: string): string {
  return `finance_filter_presets_${pageKey}`;
}

function loadPresets(pageKey: string): FilterPreset[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(getStorageKey(pageKey));
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return [];
}

function savePresets(pageKey: string, presets: FilterPreset[]): void {
  try {
    localStorage.setItem(getStorageKey(pageKey), JSON.stringify(presets));
  } catch {
    // ignore
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

export function FilterPresets({
  pageKey,
  currentFilters,
  onApply,
  quickPresets,
}: FilterPresetsProps) {
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [presetName, setPresetName] = useState('');

  useEffect(() => {
    setPresets(loadPresets(pageKey));
  }, [pageKey]);

  const hasActiveFilters = useMemo(
    () => Object.values(currentFilters).some((v) => v && v !== 'ALL'),
    [currentFilters]
  );

  const handleSave = useCallback(() => {
    if (!presetName.trim()) return;
    const newPreset: FilterPreset = {
      id: Date.now().toString(),
      name: presetName.trim(),
      filters: { ...currentFilters },
    };
    const updated = [...presets, newPreset];
    setPresets(updated);
    savePresets(pageKey, updated);
    setPresetName('');
    setSaveDialogOpen(false);
  }, [presetName, currentFilters, presets, pageKey]);

  const handleRemove = useCallback(
    (id: string) => {
      const updated = presets.filter((p) => p.id !== id);
      setPresets(updated);
      savePresets(pageKey, updated);
    },
    [presets, pageKey]
  );

  return (
    <>
      <div className="flex items-center gap-2 flex-wrap">
        {/* Quick presets */}
        {quickPresets?.map((qp) => (
          <Button
            key={qp.label}
            variant="outline"
            size="sm"
            className="text-xs h-7"
            onClick={() => onApply(qp.filters)}
          >
            {qp.label}
          </Button>
        ))}

        {/* Saved presets */}
        {presets.map((preset) => (
          <Badge
            key={preset.id}
            variant="secondary"
            className="cursor-pointer gap-1 pr-1"
          >
            <button
              type="button"
              onClick={() => onApply(preset.filters)}
              className="text-xs"
            >
              <Bookmark className="h-3 w-3 inline mr-1" />
              {preset.name}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(preset.id);
              }}
              className="ml-0.5 rounded-full p-0.5 hover:bg-destructive/20"
              aria-label={`Remover filtro ${preset.name}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}

        {/* Save current filter button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7 gap-1"
            onClick={() => setSaveDialogOpen(true)}
          >
            <Plus className="h-3 w-3" />
            Salvar Filtro
          </Button>
        )}
      </div>

      {/* Save dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Salvar Filtro</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="preset-name">Nome do filtro</Label>
              <Input
                id="preset-name"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="Ex: Vencidos este mes"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSaveDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSave} disabled={!presetName.trim()}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
