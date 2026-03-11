'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Attachment } from '@/types/stock';
import {
  MdAttachFile,
  MdDelete,
  MdDownload,
  MdImage,
  MdInsertDriveFile,
  MdPictureAsPdf,
} from 'react-icons/md';

interface AttachmentListProps {
  attachments: Attachment[];
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith('image/')) {
    return <MdImage className="h-5 w-5 text-blue-500" />;
  }
  if (mimeType === 'application/pdf') {
    return <MdPictureAsPdf className="h-5 w-5 text-red-500" />;
  }
  return <MdInsertDriveFile className="h-5 w-5 text-gray-500" />;
}

/**
 * Lista reutilizável de anexos com ícone por tipo, tamanho formatado,
 * label badge, link de download e botão de exclusão.
 */
export function AttachmentList({
  attachments,
  onDelete,
  isDeleting,
}: AttachmentListProps) {
  if (attachments.length === 0) {
    return (
      <div className="p-6 text-center border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
        <MdAttachFile className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Nenhum anexo adicionado</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {attachments.map(attachment => (
        <div
          key={attachment.id}
          className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 group"
        >
          <FileIcon mimeType={attachment.mimeType} />

          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-foreground">
              {attachment.fileName}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(attachment.fileSize)} &middot;{' '}
              {attachment.mimeType}
            </p>
          </div>

          {attachment.label && (
            <Badge variant="secondary" className="shrink-0">
              {attachment.label}
            </Badge>
          )}

          <a
            href={attachment.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0"
          >
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" aria-label="Baixar anexo">
              <MdDownload className="h-4 w-4" />
            </Button>
          </a>

          {onDelete && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onDelete(attachment.id)}
              disabled={isDeleting}
              aria-label="Excluir anexo"
            >
              <MdDelete className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}
