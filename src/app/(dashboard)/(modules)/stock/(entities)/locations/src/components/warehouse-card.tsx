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
  Eye,
  MapPin,
  MoreVertical,
  Trash2,
  Warehouse,
} from 'lucide-react';
import Link from 'next/link';
import type { Warehouse as WarehouseType } from '@/types/stock';

interface WarehouseCardProps {
  warehouse: WarehouseType;
  onEdit?: (warehouse: WarehouseType) => void;
  onDelete?: (warehouse: WarehouseType) => void;
  className?: string;
}

export function WarehouseCard({
  warehouse,
  onEdit,
  onDelete,
  className,
}: WarehouseCardProps) {
  const stats = warehouse.stats;
  const occupancyPercentage = stats?.occupancyPercentage ?? 0;

  const getOccupancyColor = (percentage: number) => {
    if (percentage === 0) return 'bg-muted';
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    if (percentage < 95) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all hover:shadow-lg hover:border-primary/50',
        !warehouse.isActive && 'opacity-60',
        className
      )}
    >
      {/* Header com gradiente */}
      <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-blue-500 to-indigo-600" />

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Warehouse className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-foreground">
                  {warehouse.code}
                </span>
                <Badge
                  variant={warehouse.isActive ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {warehouse.isActive ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{warehouse.name}</p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Ações do armazém"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/stock/locations/${warehouse.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver Zonas
                </Link>
              </DropdownMenuItem>
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(warehouse)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
              )}
              {onDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDelete(warehouse)}
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
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {stats.totalZones} {stats.totalZones === 1 ? 'zona' : 'zonas'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Box className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {stats.totalBins.toLocaleString()} nichos
              </span>
            </div>
          </div>
        )}

        {/* Barra de ocupação */}
        {stats && stats.totalBins > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Ocupação</span>
              <span className="font-medium">
                {occupancyPercentage.toFixed(0)}%
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
        )}

        {/* Descrição */}
        {warehouse.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {warehouse.description}
          </p>
        )}

        {/* Botão de ação */}
        <Link href={`/stock/locations/${warehouse.id}`} className="block">
          <Button variant="outline" className="w-full">
            Ver Zonas
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

// ============================================
// Skeleton para loading
// ============================================

export function WarehouseCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-1 bg-muted animate-pulse" />
      <CardHeader className="pb-2">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-lg bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-5 w-20 rounded bg-muted animate-pulse" />
            <div className="h-4 w-32 rounded bg-muted animate-pulse" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="h-4 w-20 rounded bg-muted animate-pulse" />
          <div className="h-4 w-24 rounded bg-muted animate-pulse" />
        </div>
        <div className="h-2 w-full rounded-full bg-muted animate-pulse" />
        <div className="h-9 w-full rounded bg-muted animate-pulse" />
      </CardContent>
    </Card>
  );
}
