'use client';

import type { TemplatePreset } from '@/data/template-presets';
import type { IconType } from 'react-icons';
import {
  GiTShirt,
  GiArmoredPants,
  GiLargeDress,
  GiPillow,
  GiTowel,
  GiSewingMachine,
  GiRolledCloth,
  GiThread,
  GiSewingButton,
  GiRunningShoe,
  GiConverseShoe,
  GiSandal,
  GiFruitBowl,
  GiSodaCan,
  GiMedicines,
  GiLipstick,
  GiMuscleUp,
  GiProcessor,
  GiSmartphone,
  GiLaptop,
  GiPaintBucket,
  GiMeshBall,
  GiCardboardBox,
  GiShoppingCart,
  GiSpray,
  GiSoap,
} from 'react-icons/gi';

const ICON_MAP: Record<string, IconType> = {
  GiTShirt,
  GiArmoredPants,
  GiLargeDress,
  GiPillow,
  GiTowel,
  GiSewingMachine,
  GiRolledCloth,
  GiThread,
  GiSewingButton,
  GiRunningShoe,
  GiConverseShoe,
  GiSandal,
  GiFruitBowl,
  GiSodaCan,
  GiMedicines,
  GiLipstick,
  GiMuscleUp,
  GiProcessor,
  GiSmartphone,
  GiLaptop,
  GiPaintBucket,
  GiMeshBall,
  GiCardboardBox,
  GiShoppingCart,
  GiSpray,
  GiSoap,
};

interface PresetCardProps {
  preset: TemplatePreset;
  onSelect: (preset: TemplatePreset) => void;
}

export function PresetCard({ preset, onSelect }: PresetCardProps) {
  const Icon = ICON_MAP[preset.icon];

  return (
    <button
      type="button"
      onClick={() => onSelect(preset)}
      className="flex items-start gap-3 border rounded-lg p-4 cursor-pointer hover:border-primary transition text-left w-full bg-white/50 dark:bg-white/5"
    >
      <div className="shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary">
        {Icon ? <Icon className="w-5 h-5" /> : <GiShoppingCart className="w-5 h-5" />}
      </div>
      <div className="min-w-0">
        <p className="font-medium text-sm leading-tight">{preset.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
          {preset.description}
        </p>
      </div>
    </button>
  );
}
