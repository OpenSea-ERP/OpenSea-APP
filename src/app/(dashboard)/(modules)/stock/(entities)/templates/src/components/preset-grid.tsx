'use client';

import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  PRESET_CATEGORY_LABELS,
  PRESETS_BY_CATEGORY,
  type PresetCategory,
  type TemplatePreset,
} from '@/data/template-presets';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Settings2 } from 'lucide-react';
import { PresetCard } from './preset-card';

interface PresetGridProps {
  onSelectPreset: (preset: TemplatePreset) => void;
  onManualCreate: () => void;
}

const CATEGORIES = Object.keys(PRESET_CATEGORY_LABELS) as PresetCategory[];

export function PresetGrid({ onSelectPreset, onManualCreate }: PresetGridProps) {
  return (
    <div className="flex flex-col gap-4">
      <Tabs defaultValue={CATEGORIES[0]} className="w-full">
        <ScrollArea className="w-full">
          <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
            {CATEGORIES.map(cat => (
              <TabsTrigger
                key={cat}
                value={cat}
                className="text-xs px-3 py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {PRESET_CATEGORY_LABELS[cat]}
              </TabsTrigger>
            ))}
          </TabsList>
        </ScrollArea>

        {CATEGORIES.map(cat => (
          <TabsContent key={cat} value={cat} className="mt-4">
            <ScrollArea className="max-h-[45vh]">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pr-3">
                {(PRESETS_BY_CATEGORY[cat] || []).map(preset => (
                  <PresetCard
                    key={preset.id}
                    preset={preset}
                    onSelect={onSelectPreset}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>

      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={onManualCreate}
      >
        <Settings2 className="w-4 h-4" />
        Configurar um Novo Template
      </Button>
    </div>
  );
}
