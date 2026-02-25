'use client';

import { useCallback } from 'react';
import { ChevronLeft, ChevronRight, Download, Loader2, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import type { StorageFile } from '@/types/storage';
import { useDownloadFile, usePreviewFile } from '@/hooks/storage';
import { FileTypeIcon } from './file-type-icon';
import { formatFileSize } from './utils';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface FilePreviewModalProps {
  file: StorageFile | null;
  files?: StorageFile[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate?: (file: StorageFile) => void;
}

export function FilePreviewModal({
  file,
  files = [],
  open,
  onOpenChange,
  onNavigate,
}: FilePreviewModalProps) {
  const downloadMutation = useDownloadFile();
  const { data: preview, isLoading: isPreviewLoading } = usePreviewFile(
    open && file ? file.id : null,
  );

  const currentIndex = file ? files.findIndex(f => f.id === file.id) : -1;
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < files.length - 1;

  const handlePrevious = useCallback(() => {
    if (hasPrevious && onNavigate) {
      onNavigate(files[currentIndex - 1]);
    }
  }, [hasPrevious, files, currentIndex, onNavigate]);

  const handleNext = useCallback(() => {
    if (hasNext && onNavigate) {
      onNavigate(files[currentIndex + 1]);
    }
  }, [hasNext, files, currentIndex, onNavigate]);

  const handleDownload = useCallback(async () => {
    if (!file) return;
    try {
      const result = await downloadMutation.mutateAsync({ id: file.id });
      window.open(result.url, '_blank');
    } catch {
      toast.error('Erro ao baixar o arquivo');
    }
  }, [file, downloadMutation]);

  if (!file) return null;

  const isImage = file.fileType === 'image';
  const isPdf = file.fileType === 'pdf';
  const isPreviewable = isImage || isPdf;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-8">
            <FileTypeIcon fileType={file.fileType} size={20} />
            <span className="truncate">{file.name}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Preview area */}
        <div className="flex-1 min-h-0 flex items-center justify-center relative">
          {/* Navigation arrows */}
          {files.length > 1 && (
            <>
              {hasPrevious && (
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10"
                  onClick={handlePrevious}
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              )}
              {hasNext && (
                <Button
                  size="icon-sm"
                  variant="ghost"
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10"
                  onClick={handleNext}
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              )}
            </>
          )}

          {isPreviewable && isPreviewLoading ? (
            <div className="flex items-center justify-center w-full h-[50vh] rounded-lg bg-gray-50 dark:bg-slate-800/50">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Carregando visualização...</p>
              </div>
            </div>
          ) : isImage && preview?.url ? (
            <div className="flex items-center justify-center w-full max-h-[50vh] overflow-hidden rounded-lg bg-gray-50 dark:bg-slate-800/50">
              <img
                src={preview.thumbnailUrl ?? preview.url}
                alt={file.name}
                className="max-w-full max-h-[50vh] object-contain"
              />
            </div>
          ) : isPdf && preview?.url ? (
            <div className="w-full h-[50vh] rounded-lg overflow-hidden bg-gray-50 dark:bg-slate-800/50">
              <iframe
                src={preview.url}
                title={file.name}
                className="w-full h-full border-0"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-12">
              <FileTypeIcon fileType={file.fileType} size={64} />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Visualização não disponível para este tipo de arquivo
              </p>
            </div>
          )}
        </div>

        <Separator />

        {/* Metadata */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">
              Nome
            </p>
            <p className="font-medium truncate" title={file.originalName}>
              {file.originalName}
            </p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">
              Tamanho
            </p>
            <p className="font-medium">{formatFileSize(file.size)}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">
              Tipo
            </p>
            <p className="font-medium">{file.mimeType}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">
              Criado em
            </p>
            <p className="font-medium">{formatDate(file.createdAt)}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            <X className="w-4 h-4" />
            Fechar
          </Button>
          <Button
            size="sm"
            onClick={handleDownload}
            disabled={downloadMutation.isPending}
          >
            <Download className="w-4 h-4" />
            Baixar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
