'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { StorageFile } from '@/types/storage';
import { useAuth } from '@/contexts/auth-context';
import { storageFilesService } from '@/services/storage/files.service';
import { FileTypeIcon } from './file-type-icon';
import { OfficeViewer, isOfficePreviewable } from './office-viewer';
import { PdfViewer } from './pdf-viewer';
import { ProtectedImageCanvas } from './protected-image-canvas';
import { VideoPlayer, isVideoPreviewable } from './video-player';
import { toast } from 'sonner';

interface FilePreviewModalProps {
  file: StorageFile | null;
  files?: StorageFile[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate?: (file: StorageFile) => void;
  canDownload?: boolean;
  /** Password for protected files — passed to serve URL */
  password?: string;
}

export function FilePreviewModal({
  file,
  files = [],
  open,
  onOpenChange,
  onNavigate,
  canDownload = false,
  password,
}: FilePreviewModalProps) {
  const { user } = useAuth();
  const userName = user?.username ?? user?.email ?? 'Usuário';

  // When server-side PDF conversion fails (e.g. LibreOffice not installed),
  // fall back to the client-side OfficeViewer (docx-preview / xlsx)
  const [pdfConversionFailed, setPdfConversionFailed] = useState(false);

  // Proxy serve URL — streams through backend, no direct S3 exposure
  const serveUrl = useMemo(
    () => (file ? storageFilesService.getServeUrl(file.id, { password }) : ''),
    [file, password],
  );

  // Office files are converted to PDF server-side (LibreOffice headless)
  const serveUrlPdf = useMemo(
    () => (file ? storageFilesService.getServeUrl(file.id, { password, format: 'pdf' }) : ''),
    [file, password],
  );

  // Reset fallback state when navigating between files
  useEffect(() => {
    setPdfConversionFailed(false);
  }, [file?.id]);

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

  const handleDownload = useCallback(() => {
    if (!file) return;
    try {
      const downloadUrl = storageFilesService.getServeUrl(file.id, { download: true, password });
      window.open(downloadUrl, '_blank');
    } catch {
      toast.error('Erro ao baixar o arquivo');
    }
  }, [file, password]);

  if (!file) return null;

  const isImage = file.fileType === 'image';
  const isPdf = file.fileType === 'pdf';
  const isOffice = isOfficePreviewable(file.mimeType);
  const isVideo = isVideoPreviewable(file.mimeType);
  const isPresentation = file.fileType === 'presentation';
  const isDocument = isPdf || isOffice || isPresentation;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`max-h-[95vh] flex flex-col [&>button]:hidden ${isDocument ? 'sm:max-w-4xl' : 'sm:max-w-3xl'}`}>
        <DialogHeader className="flex flex-row items-center gap-2 space-y-0">
          <FileTypeIcon fileType={file.fileType} size={20} />
          <DialogTitle className="flex-1 truncate">{file.name}</DialogTitle>
          <div className="flex items-center gap-1 shrink-0">
            {canDownload && (
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={handleDownload}
                title="Baixar"
                aria-label="Baixar arquivo"
              >
                <Download className="w-4 h-4" />
              </Button>
            )}
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              title="Fechar"
              aria-label="Fechar preview"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
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
                  aria-label="Arquivo anterior"
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
                  aria-label="Próximo arquivo"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              )}
            </>
          )}

          {isImage && serveUrl ? (
            <div className="flex items-center justify-center w-full max-h-[50vh] overflow-hidden rounded-lg bg-gray-50 dark:bg-slate-800/50">
              <ProtectedImageCanvas
                src={serveUrl}
                alt={file.name}
                watermarkText={`${userName} · ${new Date().toLocaleDateString('pt-BR')}`}
                className="print-hidden"
                maxHeight={500}
              />
            </div>
          ) : isPdf && serveUrl ? (
            <PdfViewer url={serveUrl} />
          ) : (isOffice || isPresentation) && serveUrlPdf && !pdfConversionFailed ? (
            <PdfViewer url={serveUrlPdf} onError={() => setPdfConversionFailed(true)} />
          ) : isOffice && pdfConversionFailed && serveUrl ? (
            <OfficeViewer url={serveUrl} fileName={file.name} mimeType={file.mimeType} />
          ) : isVideo && serveUrl ? (
            <VideoPlayer url={serveUrl} name={file.name} />
          ) : (
            <div className="flex flex-col items-center gap-4 py-12">
              <FileTypeIcon fileType={file.fileType} size={64} />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Visualização não disponível para este tipo de arquivo
              </p>
            </div>
          )}
        </div>

      </DialogContent>
    </Dialog>
  );
}
