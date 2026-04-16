'use client';

import { cn } from '@/lib/utils';
import { Building2, Home, MapPin, MapPinOff } from 'lucide-react';

export type GeoState =
  | { kind: 'unknown' }
  | { kind: 'denied' }
  | { kind: 'office'; zoneName: string }
  | { kind: 'remote' };

interface GeoBadgeProps {
  state: GeoState;
}

/**
 * Compact pill that summarises the user's geo context for the punch CTA.
 * Reflects the result from `geofence-status` and `location-display` in a
 * single, glanceable element so the big CTA stays the focal point.
 */
export function GeoBadge({ state }: GeoBadgeProps) {
  const config = resolveConfig(state);

  return (
    <div
      data-testid="punch-geo-badge"
      data-geo-kind={state.kind}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium',
        config.className
      )}
    >
      <config.Icon className="size-3.5" />
      <span>{config.label}</span>
    </div>
  );
}

function resolveConfig(state: GeoState) {
  switch (state.kind) {
    case 'office':
      return {
        Icon: Building2,
        label: state.zoneName ? `No ${state.zoneName}` : 'No escritório',
        className:
          'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300',
      };
    case 'remote':
      return {
        Icon: Home,
        label: 'Trabalho remoto',
        className:
          'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300',
      };
    case 'denied':
      return {
        Icon: MapPinOff,
        label: 'Sem localização',
        className:
          'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400',
      };
    case 'unknown':
    default:
      return {
        Icon: MapPin,
        label: 'Localizando...',
        className:
          'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400',
      };
  }
}
