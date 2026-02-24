'use client';

import { useCallback } from 'react';
import { Download, History, RotateCcw } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import type { StorageFile } from '@/types/storage';
import {
  useListVersions,
  useDownloadFile,
  useRestoreVersion,
} from '@/hooks/storage';
import { usePermissions } from '@/hooks/use-permissions';
import { formatFileSize } from './utils';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface FileVersionPanelProps {
  file: StorageFile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FileVersionPanel({
  file,
  open,
  onOpenChange,
}: FileVersionPanelProps) {
  const { data: versionsData, isLoading } = useListVersions(file?.id ?? '');
  const downloadMutation = useDownloadFile();
  const restoreMutation = useRestoreVersion();
  const { hasPermission } = usePermissions();

  const canDownload = hasPermission('storage.files.download');
  const canRestore = hasPermission('storage.versions.restore');

  const handleDownloadVersion = useCallback(
    async (version: number) => {
      if (!file) return;
      try {
        const result = await downloadMutation.mutateAsync({
          id: file.id,
          version,
        });
        window.open(result.url, '_blank');
      } catch {
        toast.error('Erro ao baixar esta versão');
      }
    },
    [file, downloadMutation]
  );

  const handleRestore = useCallback(
    async (versionId: string) => {
      if (!file) return;
      try {
        await restoreMutation.mutateAsync({
          id: file.id,
          versionId,
        });
        toast.success('Versão restaurada com sucesso');
      } catch {
        toast.error('Erro ao restaurar a versão');
      }
    },
    [file, restoreMutation]
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Histórico de versões
          </SheetTitle>
          <SheetDescription>{file ? file.name : ''}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {isLoading ? (
            <div className="space-y-4 mt-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3 mt-4">
              {versionsData?.versions.map(version => {
                const isCurrent = version.version === file?.currentVersion;

                return (
                  <div
                    key={version.id}
                    className="rounded-lg border border-gray-200 dark:border-slate-700 p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          Versão {version.version}
                        </span>
                        {isCurrent && (
                          <Badge variant="default" className="text-[10px]">
                            Atual
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatFileSize(version.size)}
                      </span>
                    </div>

                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      <p>{formatDate(version.createdAt)}</p>
                      {version.changeNote && (
                        <p className="mt-1 italic">{version.changeNote}</p>
                      )}
                    </div>

                    <Separator />

                    <div className="flex items-center gap-2">
                      {canDownload && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs h-7"
                          onClick={() => handleDownloadVersion(version.version)}
                          disabled={downloadMutation.isPending}
                        >
                          <Download className="w-3 h-3" />
                          Baixar
                        </Button>
                      )}
                      {!isCurrent && canRestore && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs h-7"
                          onClick={() => handleRestore(version.id)}
                          disabled={restoreMutation.isPending}
                        >
                          <RotateCcw className="w-3 h-3" />
                          Restaurar
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}

              {versionsData?.versions.length === 0 && (
                <div className="text-center py-8 text-sm text-gray-500 dark:text-gray-400">
                  Nenhuma versão encontrada
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
