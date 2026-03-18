'use client';

import { useState, useCallback } from 'react';
import {
  ChevronDown,
  MapPin,
  MoreVertical,
  Settings,
  Edit,
  Trash2,
  Search,
  ArrowUpDown,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Zone } from '@/types/stock';
import { useBinOccupancy } from '../api';
import { AisleBinGrid } from './aisle-bin-grid';

interface ZoneExpandableCardProps {
  zone: Zone;
  warehouseId: string;
  isExpanded: boolean;
  highlightBinId?: string;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onConfigureStructure: () => void;
  onBinClick?: (binId: string) => void;
  hasEditPermission?: boolean;
  hasDeletePermission?: boolean;
  hasConfigurePermission?: boolean;
}

type FilterType = 'all' | 'empty' | 'occupied' | 'full' | 'blocked';

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'empty', label: 'Vazios' },
  { value: 'occupied', label: 'Ocupados' },
  { value: 'full', label: 'Cheios' },
  { value: 'blocked', label: 'Bloqueados' },
];

export function ZoneExpandableCard({
  zone,
  warehouseId,
  isExpanded,
  highlightBinId,
  onToggle,
  onEdit,
  onDelete,
  onConfigureStructure,
  onBinClick: onBinClickProp,
  hasEditPermission,
  hasDeletePermission,
  hasConfigurePermission,
}: ZoneExpandableCardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  const structure = zone.structure;
  const stats = zone.stats;
  const hasStructure = structure && structure.aisles > 0;
  const occupancyPercentage = stats?.occupancyPercentage ?? 0;

  // Only fetch bin data when expanded
  const { data: occupancyData, isLoading: isLoadingBins } = useBinOccupancy(
    isExpanded ? zone.id : ''
  );

  const handleBinClick = useCallback((binId: string) => {
    onBinClickProp?.(binId);
  }, [onBinClickProp]);

  const getStatusBadge = () => {
    if (!zone.isActive) {
      return <Badge variant="secondary" className="text-xs">Inativa</Badge>;
    }
    if (!hasStructure) {
      return (
        <Badge
          variant="outline"
          className="text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20"
        >
          Pendente
        </Badge>
      );
    }
    return (
      <Badge
        variant="outline"
        className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20"
      >
        Configurada
      </Badge>
    );
  };

  const getProgressColor = (percentage: number) => {
    if (percentage === 0) return 'bg-gray-300 dark:bg-gray-600';
    if (percentage < 50) return 'bg-emerald-500';
    if (percentage < 80) return 'bg-amber-500';
    if (percentage < 95) return 'bg-orange-500';
    return 'bg-rose-500';
  };

  const totalBins = hasStructure
    ? structure.aisles * structure.shelvesPerAisle * structure.binsPerShelf
    : 0;

  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-800/60 border border-border rounded-lg overflow-hidden transition-all duration-300 ease-in-out',
        isExpanded && 'ring-1 ring-blue-500/30',
      )}
    >
      {/* Collapsed header - clickable */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        {/* Icon */}
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
          <MapPin className="h-5 w-5 text-white" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-sm text-foreground">{zone.code}</span>
            <span className="text-sm text-muted-foreground truncate">{zone.name}</span>
            {getStatusBadge()}
          </div>
          {hasStructure && (
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-xs text-muted-foreground">
                {structure.aisles}c &middot; {structure.shelvesPerAisle}p &middot; {totalBins}b
              </span>
              {/* Mini occupancy bar */}
              <div className="h-1 w-16 rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className={cn('h-full rounded-full', getProgressColor(occupancyPercentage))}
                  style={{ width: `${Math.min(occupancyPercentage, 100)}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {occupancyPercentage.toFixed(0)}%
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Ações da zona">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {hasConfigurePermission && (
                <DropdownMenuItem onClick={onConfigureStructure}>
                  <Settings className="mr-2 h-4 w-4" />
                  Configurar Estrutura
                </DropdownMenuItem>
              )}
              {hasEditPermission && (
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
              )}
              {hasDeletePermission && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-rose-600 focus:text-rose-600"
                    onClick={onDelete}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <ChevronDown
            className={cn(
              'h-5 w-5 text-muted-foreground transition-transform duration-300',
              isExpanded && 'rotate-180',
            )}
          />
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
          {/* Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search input */}
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar endereço..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-sm"
              />
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1">
              {FILTER_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant={filter === option.value ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 text-xs px-2.5"
                  onClick={() => setFilter(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Bin grid */}
          {isLoadingBins ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : occupancyData?.bins && occupancyData.bins.length > 0 ? (
            <AisleBinGrid
              bins={occupancyData.bins}
              zoneId={zone.id}
              highlightBinId={highlightBinId}
              onBinClick={handleBinClick}
              searchQuery={searchQuery}
              filter={filter}
            />
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">
              {hasStructure
                ? 'Nenhum bin encontrado nesta zona.'
                : 'Configure a estrutura da zona para visualizar os bins.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
