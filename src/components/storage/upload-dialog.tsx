'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Upload, X, FileIcon, CheckCircle2, AlertCircle, AlertTriangle, RotateCcw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStorageStats } from '@/hooks/storage';
import { storageFilesService } from '@/services/storage';
import { cn } from '@/lib/utils';
import { formatFileSize } from './utils';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId: string | null;
  entityType?: string;
  entityId?: string;
  initialFiles?: File[];
}

interface FileUploadState {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

export function UploadDialog({
  open,
  onOpenChange,
  folderId,
  entityType,
  entityId,
  initialFiles,
}: UploadDialogProps) {
  const [files, setFiles] = useState<FileUploadState[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const cancelledRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { data: stats } = useStorageStats();

  const hasQuota = stats && stats.maxStorageMb > 0;
  const totalPendingSize = files
    .filter((f) => f.status === 'pending')
    .reduce((sum, f) => sum + f.file.size, 0);
  const projectedUsage = stats
    ? stats.totalSize + totalPendingSize
    : 0;
  const quotaExceeded =
    hasQuota && projectedUsage > stats.maxStorageMb * 1024 * 1024;
  const quotaNearLimit =
    hasQuota && !quotaExceeded && stats.usedStoragePercent >= 80;

  const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB (multipart upload supports large files)

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const rejected: string[] = [];
    const accepted: FileUploadState[] = [];

    for (const file of fileArray) {
      if (file.size > MAX_FILE_SIZE) {
        rejected.push(
          `"${file.name}" excede o limite de ${formatFileSize(MAX_FILE_SIZE)}`
        );
      } else if (file.size === 0) {
        rejected.push(`"${file.name}" está vazio`);
      } else {
        accepted.push({ file, status: 'pending', progress: 0 });
      }
    }

    if (rejected.length > 0) {
      toast.error(rejected.join('. '));
    }

    if (accepted.length > 0) {
      setFiles(prev => [...prev, ...accepted]);
    }
  }, []);

  // Pre-populate files from drag-and-drop on the main area
  useEffect(() => {
    if (open && initialFiles && initialFiles.length > 0) {
      addFiles(initialFiles);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        addFiles(e.target.files);
        // Limpar o input para permitir selecionar o mesmo arquivo novamente
        e.target.value = '';
      }
    },
    [addFiles]
  );

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    cancelledRef.current = false;

    let successCount = 0;
    let errorCount = 0;

    const MAX_CONCURRENT = 3;
    const pendingIndices = files
      .map((f, i) => (f.status === 'pending' ? i : -1))
      .filter((i) => i !== -1);

    const uploadFile = async (i: number) => {
      setFiles(prev =>
        prev.map((f, idx) =>
          idx === i ? { ...f, status: 'uploading' as const, progress: 0 } : f
        )
      );

      try {
        await storageFilesService.smartUpload(
          folderId,
          files[i].file,
          (percent) => {
            setFiles(prev =>
              prev.map((f, idx) =>
                idx === i ? { ...f, progress: percent } : f
              )
            );
          },
          entityType ? { entityType, entityId } : undefined,
        );

        setFiles(prev =>
          prev.map((f, idx) =>
            idx === i ? { ...f, status: 'success' as const, progress: 100 } : f
          )
        );
        successCount++;
      } catch {
        setFiles(prev =>
          prev.map((f, idx) =>
            idx === i
              ? {
                  ...f,
                  status: 'error' as const,
                  progress: 0,
                  error: 'Falha no upload',
                }
              : f
          )
        );
        errorCount++;
      }
    };

    // Upload with concurrency limit
    const queue = [...pendingIndices];
    const workers = Array.from(
      { length: Math.min(MAX_CONCURRENT, queue.length) },
      async () => {
        while (queue.length > 0 && !cancelledRef.current) {
          const idx = queue.shift()!;
          await uploadFile(idx);
        }
      },
    );
    await Promise.all(workers);

    // Invalidate queries after all uploads
    if (successCount > 0) {
      queryClient.invalidateQueries({ queryKey: ['storage-folder-contents'] });
      queryClient.invalidateQueries({ queryKey: ['storage-root-contents'] });
      queryClient.invalidateQueries({ queryKey: ['storage-files'] });
      queryClient.invalidateQueries({ queryKey: ['storage-stats'] });
    }

    setIsUploading(false);

    if (successCount > 0 && errorCount === 0) {
      toast.success(
        `${successCount} ${successCount === 1 ? 'arquivo enviado' : 'arquivos enviados'} com sucesso`
      );
      handleClose();
    } else if (successCount > 0 && errorCount > 0) {
      toast.warning(`${successCount} enviado(s), ${errorCount} com erro`);
    } else if (errorCount > 0) {
      toast.error('Falha ao enviar os arquivos');
    }
  };

  const handleCancel = useCallback(() => {
    cancelledRef.current = true;
  }, []);

  const handleClose = () => {
    if (isUploading) {
      handleCancel();
      return;
    }
    setFiles([]);
    setIsDragging(false);
    onOpenChange(false);
  };

  const pendingCount = files.filter(f => f.status === 'pending').length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Carregar arquivos
          </DialogTitle>
          <DialogDescription>
            Arraste arquivos ou clique para selecionar
          </DialogDescription>
        </DialogHeader>

        {/* Quota warnings */}
        {quotaExceeded && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              O upload excederia o limite de armazenamento ({formatFileSize(stats!.maxStorageMb * 1024 * 1024)}).
              Remova arquivos ou solicite aumento do limite.
            </AlertDescription>
          </Alert>
        )}
        {quotaNearLimit && (
          <Alert className="border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Armazenamento próximo do limite ({stats!.usedStoragePercent.toFixed(1)}% utilizado).
            </AlertDescription>
          </Alert>
        )}

        {/* Drop zone */}
        <div
          className={cn(
            'relative border-2 border-dashed rounded-xl p-8 transition-colors text-center',
            isDragging
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/20'
              : 'border-gray-300 dark:border-slate-600 hover:border-gray-400 dark:hover:border-slate-500'
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            accept={[
              // Imagens
              '.jpg,.jpeg,.png,.gif,.webp,.svg,.bmp,.ico',
              // Documentos
              '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.odp,.txt,.csv,.rtf',
              // Vídeos
              '.mp4,.webm,.mov,.avi,.mkv',
              // Áudio
              '.mp3,.wav,.ogg,.flac,.aac',
              // Arquivos compactados
              '.zip,.rar,.7z,.tar,.gz',
              // Código
              '.json,.xml,.html,.css,.js,.ts,.py,.md',
            ].join(',')}
            onChange={handleFileSelect}
          />
          <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400 dark:text-slate-500" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {isDragging
              ? 'Solte os arquivos aqui'
              : 'Arraste e solte arquivos aqui, ou clique para selecionar'}
          </p>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <ScrollArea className="max-h-48">
            <div className="space-y-2">
              {files.map((fileState, index) => (
                <div
                  key={`${fileState.file.name}-${index}`}
                  className="flex items-center gap-3 p-2 rounded-lg border border-gray-200 dark:border-slate-700"
                >
                  {fileState.status === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                  ) : fileState.status === 'error' ? (
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  ) : (
                    <FileIcon className="w-5 h-5 text-gray-400 shrink-0" />
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {fileState.file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(fileState.file.size)}
                      {fileState.error && (
                        <span className="text-red-500 ml-2">
                          {fileState.error}
                        </span>
                      )}
                    </p>
                    {fileState.status === 'uploading' && (
                      <Progress
                        value={fileState.progress}
                        className="mt-1 h-1"
                      />
                    )}
                  </div>

                  {fileState.status === 'pending' && !isUploading && (
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="shrink-0"
                      onClick={e => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                  {fileState.status === 'error' && !isUploading && (
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="shrink-0 text-amber-600"
                      title="Tentar novamente"
                      onClick={e => {
                        e.stopPropagation();
                        setFiles(prev =>
                          prev.map((f, idx) =>
                            idx === index ? { ...f, status: 'pending' as const, error: undefined, progress: 0 } : f
                          )
                        );
                      }}
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={isUploading ? handleCancel : handleClose}
          >
            {isUploading ? 'Parar' : 'Cancelar'}
          </Button>
          <Button
            size="sm"
            onClick={handleUpload}
            disabled={isUploading || pendingCount === 0 || !!quotaExceeded}
          >
            {isUploading
              ? 'Enviando...'
              : `Enviar ${pendingCount} ${pendingCount === 1 ? 'arquivo' : 'arquivos'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
