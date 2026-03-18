'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import {
  Box,
  Edit,
  Layers,
  Lock,
  Map,
  MapPin,
  MoreVertical,
  Settings,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import type { Zone } from '@/types/stock';

interface ZoneCardProps {
  zone: Zone;
  warehouseId: string;
  onEdit?: (zone: Zone) => void;
  onDelete?: (zone: Zone) => void;
  onConfigure?: (zone: Zone) => void;
  className?: string;
}

export function ZoneCard({
  zone,
  warehouseId,
  onEdit,
  onDelete,
  onConfigure,
  className,
}: ZoneCardProps) {
  const stats = zone.stats;
  const structure = zone.structure;
  const occupancyPercentage = stats?.occupancyPercentage ?? 0;
  const hasStructure = structure && structure.aisles > 0;

  const getOccupancyColor = (percentage: number) => {
    if (percentage === 0) return 'bg-gray-200 dark:bg-gray-700';
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    if (percentage < 95) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const totalBins = hasStructure
    ? structure.aisles * structure.shelvesPerAisle * structure.binsPerShelf
    : 0;

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all hover:shadow-lg hover:border-primary/50',
        !zone.isActive && 'opacity-60',
        className
      )}
    >
      {/* Header com gradiente */}
      <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-emerald-500 to-teal-600" />

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <MapPin className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-foreground">
                  {zone.code}
                </span>
                <Badge
                  variant={zone.isActive ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {zone.isActive ? 'Ativa' : 'Inativa'}
                </Badge>
                {!hasStructure && (
                  <Badge variant="outline" className="text-xs text-amber-600">
                    Não configurada
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{zone.name}</p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Ações da zona"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {hasStructure && (
                <DropdownMenuItem asChild>
                  <Link
                    href={`/stock/locations/${warehouseId}/zones/${zone.id}`}
                  >
                    <Map className="mr-2 h-4 w-4" />
                    Ver Mapa 2D
                  </Link>
                </DropdownMenuItem>
              )}
              {onConfigure && (
                <DropdownMenuItem onClick={() => onConfigure(zone)}>
                  <Settings className="mr-2 h-4 w-4" />
                  {hasStructure ? 'Reconfigurar' : 'Configurar Estrutura'}
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(zone)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDelete(zone)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Estrutura */}
        {hasStructure ? (
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-muted/50 p-2">
              <div className="text-lg font-bold text-foreground">
                {structure.aisles}
              </div>
              <div className="text-xs text-muted-foreground">Corredores</div>
            </div>
            <div className="rounded-lg bg-muted/50 p-2">
              <div className="text-lg font-bold text-foreground">
                {structure.shelvesPerAisle}
              </div>
              <div className="text-xs text-muted-foreground">Prateleiras</div>
            </div>
            <div className="rounded-lg bg-muted/50 p-2">
              <div className="text-lg font-bold text-foreground">
                {structure.binsPerShelf}
              </div>
              <div className="text-xs text-muted-foreground">Nichos</div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <Layers className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              Estrutura não configurada
            </p>
            <p className="text-xs text-muted-foreground">
              Configure corredores, prateleiras e nichos
            </p>
          </div>
        )}

        {/* Stats */}
        {hasStructure && (
          <>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Box className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {totalBins.toLocaleString()} nichos total
                </span>
              </div>
              {stats?.blockedBins && stats.blockedBins > 0 && (
                <div className="flex items-center gap-1 text-amber-600">
                  <Lock className="h-3 w-3" />
                  <span className="text-xs">
                    {stats.blockedBins} bloqueados
                  </span>
                </div>
              )}
            </div>

            {/* Barra de ocupação */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Ocupação</span>
                <span className="font-medium">
                  {stats?.occupiedBins ?? 0}/{totalBins} (
                  {occupancyPercentage.toFixed(0)}%)
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    getOccupancyColor(occupancyPercentage)
                  )}
                  style={{ width: `${Math.min(occupancyPercentage, 100)}%` }}
                />
              </div>
            </div>
          </>
        )}

        {/* Descrição */}
        {zone.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {zone.description}
          </p>
        )}

        {/* Botões de ação */}
        <div className="flex gap-2">
          {hasStructure ? (
            <Link
              href={`/stock/locations/${warehouseId}/zones/${zone.id}`}
              className="flex-1"
            >
              <Button variant="outline" className="w-full">
                <Map className="mr-2 h-4 w-4" />
                Ver Mapa
              </Button>
            </Link>
          ) : (
            <Button
              variant="default"
              className="flex-1"
              onClick={() => onConfigure?.(zone)}
            >
              <Settings className="mr-2 h-4 w-4" />
              Configurar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================
// Skeleton para loading
// ============================================

export function ZoneCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1 bg-gray-200 dark:bg-gray-700 animate-pulse" />
      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="space-y-2">
            <div className="h-5 w-16 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="h-16 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"
            />
          ))}
        </div>
        <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="h-9 w-full rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </CardContent>
    </Card>
  );
}
