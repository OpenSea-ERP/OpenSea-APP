'use client';

import { useCallback, useRef, useState } from 'react';
import { Upload, X, FileIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUploadFile } from '@/hooks/storage';
import { cn } from '@/lib/utils';
import { formatFileSize } from './utils';
import { toast } from 'sonner';

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folderId: string | null;
  entityType?: string;
  entityId?: string;
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
}: UploadDialogProps) {
  const [files, setFiles] = useState<FileUploadState[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadFile();

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const uploadStates: FileUploadState[] = fileArray.map(file => ({
      file,
      status: 'pending',
      progress: 0,
    }));
    setFiles(prev => [...prev, ...uploadStates]);
  }, []);

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

    // Usa a pasta raiz (precisa ter um ID) ou cria na raiz
    const targetFolderId = folderId;
    if (!targetFolderId) {
      toast.error('Nenhuma pasta selecionada para upload');
      return;
    }

    setIsUploading(true);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < files.length; i++) {
      const fileState = files[i];
      if (fileState.status !== 'pending') continue;

      // Atualizar status para uploading
      setFiles(prev =>
        prev.map((f, idx) =>
          idx === i ? { ...f, status: 'uploading' as const, progress: 30 } : f
        )
      );

      try {
        await uploadMutation.mutateAsync({
          folderId: targetFolderId,
          file: fileState.file,
          options: entityType ? { entityType, entityId } : undefined,
        });

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

  const handleClose = () => {
    if (isUploading) return;
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
            onClick={handleClose}
            disabled={isUploading}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleUpload}
            disabled={isUploading || pendingCount === 0}
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
