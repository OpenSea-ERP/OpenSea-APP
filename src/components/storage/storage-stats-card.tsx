'use client';

import { HardDrive, FileIcon, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useStorageStats } from '@/hooks/storage';
import { cn } from '@/lib/utils';
import { formatFileSize } from './utils';
import { FileTypeIcon } from './file-type-icon';
import type { FileTypeCategory } from '@/types/storage';

interface StorageStatsCardProps {
  className?: string;
}

export function StorageStatsCard({ className }: StorageStatsCardProps) {
  const { data: stats, isLoading } = useStorageStats();

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-2 w-full" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <HardDrive className="w-4 h-4" />
          Armazenamento
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <FileIcon className="w-4 h-4" />
              {stats.totalFiles}{' '}
              {stats.totalFiles === 1 ? 'arquivo' : 'arquivos'}
            </span>
            <span className="font-medium">
              {formatFileSize(stats.totalSize)}
            </span>
          </div>

          <div>
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>Utilizado</span>
              <span>{stats.usedStoragePercent.toFixed(1)}%</span>
            </div>
            <Progress value={stats.usedStoragePercent} />
          </div>

          {Object.keys(stats.filesByType).length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                <BarChart3 className="w-3 h-3" />
                Por tipo
              </p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(stats.filesByType).map(([type, count]) => (
                  <div
                    key={type}
                    className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400"
                  >
                    <FileTypeIcon
                      fileType={type as FileTypeCategory}
                      size={14}
                    />
                    <span className="truncate capitalize">{type}</span>
                    <span className="ml-auto font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
