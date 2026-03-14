'use client';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  PRESET_CATEGORY_LABELS,
  PRESETS_BY_CATEGORY,
  VISIBLE_CATEGORIES,
  type PresetCategory,
  type TemplatePreset,
} from '@/data/template-presets';
import { ChevronRight, Settings2 } from 'lucide-react';
import { useState } from 'react';
import { PresetCard } from './preset-card';

interface PresetGridProps {
  onSelectPreset: (preset: TemplatePreset) => void;
  onManualCreate: () => void;
}

export function PresetGrid({
  onSelectPreset,
  onManualCreate,
}: PresetGridProps) {
  const [activeCategory, setActiveCategory] = useState<PresetCategory>(
    VISIBLE_CATEGORIES[0]
  );

  const presets = PRESETS_BY_CATEGORY[activeCategory] || [];

  return (
    <div className="flex gap-4">
      {/* Sidebar */}
      <div className="w-44 shrink-0 border-r border-border/50 pr-2">
        <ScrollArea className="h-[50vh]">
          <div className="space-y-0.5 py-1">
            {VISIBLE_CATEGORIES.map(cat => {
              const isActive = cat === activeCategory;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors text-sm ${
                    isActive
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'hover:bg-muted/60 text-foreground/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{PRESET_CATEGORY_LABELS[cat]}</span>
                    <ChevronRight
                      className={`w-3.5 h-3.5 transition-transform ${isActive ? 'rotate-90' : ''}`}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0 gap-3">
        <ScrollArea className="flex-1 max-h-[45vh]">
          <div className="grid grid-cols-2 gap-3 pr-3">
            {presets.map(preset => (
              <PresetCard
                key={preset.id}
                preset={preset}
                onSelect={onSelectPreset}
              />
            ))}
          </div>
        </ScrollArea>

        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={onManualCreate}
        >
          <Settings2 className="w-4 h-4" />
          Configurar um Novo Template
        </Button>
      </div>
    </div>
  );
}
