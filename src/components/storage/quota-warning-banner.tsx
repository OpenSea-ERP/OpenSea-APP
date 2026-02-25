'use client';

import { AlertTriangle, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useStorageStats } from '@/hooks/storage';
import { formatFileSize } from './utils';

export function QuotaWarningBanner() {
  const { data: stats } = useStorageStats();

  if (!stats || stats.maxStorageMb <= 0) return null;

  const percent = stats.usedStoragePercent;

  if (percent < 80) return null;

  const maxFormatted = formatFileSize(stats.maxStorageMb * 1024 * 1024);
  const usedFormatted = formatFileSize(stats.totalSize);

  if (percent >= 95) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Armazenamento quase esgotado!</strong> Você está usando{' '}
          {usedFormatted} de {maxFormatted} ({percent.toFixed(1)}%). Libere
          espaço ou solicite aumento do limite para continuar enviando arquivos.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-400">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        Você está usando {usedFormatted} de {maxFormatted} ({percent.toFixed(1)}
        %). Considere liberar espaço ou solicitar aumento do limite.
      </AlertDescription>
    </Alert>
  );
}
