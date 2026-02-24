'use client';

import { Folder, Package, DollarSign, Users, UserCircle } from 'lucide-react';
import { PiFunnelDuotone } from 'react-icons/pi';
import { cn } from '@/lib/utils';
import type { StorageFolder } from '@/types/storage';

/** Maps module slug to a Lucide icon component */
const MODULE_ICONS: Record<string, React.ElementType> = {
  stock: Package,
  finance: DollarSign,
  hr: Users,
  core: UserCircle,
};

/** Default folder color (amber-500) */
const DEFAULT_COLOR = '#f59e0b';

/** Darkens a hex color by a given factor (0–1, where 0.7 = 30% darker) */
function darkenColor(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `#${Math.round(r * factor)
    .toString(16)
    .padStart(2, '0')}${Math.round(g * factor)
    .toString(16)
    .padStart(2, '0')}${Math.round(b * factor)
    .toString(16)
    .padStart(2, '0')}`;
}

interface FolderIconProps {
  folder: StorageFolder;
  /** Icon size preset */
  size?: 'sm' | 'lg';
  className?: string;
}

/**
 * Renders a folder icon with an optional overlay:
 * - Filter folders → funnel icon
 * - Module folders → module icon (Package, DollarSign, Users, etc.)
 * - Personal folders → no overlay
 */
export function FolderIcon({
  folder,
  size = 'lg',
  className,
}: FolderIconProps) {
  const isLarge = size === 'lg';
  const folderSize = isLarge ? 'w-12 h-12' : 'w-5 h-5';

  const OverlayIcon = folder.isFilter
    ? PiFunnelDuotone
    : folder.module
      ? MODULE_ICONS[folder.module]
      : null;

  const baseColor = folder.color || DEFAULT_COLOR;
  const overlayColor = darkenColor(baseColor, 0.55);

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center shrink-0',
        className
      )}
    >
      <Folder
        className={cn(
          folderSize,
          'transition-colors',
          folder.color ? '' : 'text-amber-500 dark:text-amber-400'
        )}
        style={folder.color ? { color: folder.color } : undefined}
        fill="currentColor"
        strokeWidth={1}
      />
      {OverlayIcon && (
        <OverlayIcon
          className={cn(
            'absolute drop-shadow-sm',
            isLarge ? 'w-5 h-5 mt-0.5' : 'w-2.5 h-2.5 mt-px'
          )}
          style={{ color: overlayColor }}
        />
      )}
    </div>
  );
}
