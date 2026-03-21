'use client';

import { useRef, useState } from 'react';
import { Plus, X, FileText, Image, FileSpreadsheet, File } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { StorageFilePicker } from './storage-file-picker';
import type { CardAttachment } from '@/types/tasks';

interface AttachmentSectionProps {
  attachments: CardAttachment[];
  onUpload: (file: File) => void;
  onRemove: (attachmentId: string) => void;
  onLinkStorageFile?: (file: { id: string; name: string; size: number; mimeType: string }) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType.includes('spreadsheet') || mimeType.includes('csv'))
    return FileSpreadsheet;
  if (mimeType.includes('pdf') || mimeType.includes('document'))
    return FileText;
  return File;
}

export function AttachmentSection({
  attachments,
  onUpload,
  onRemove,
  onLinkStorageFile,
}: AttachmentSectionProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      onUpload(files[i]);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
    setAddOpen(false);
  }

  function handleUploadClick() {
    fileInputRef.current?.click();
    setAddOpen(false);
  }

  function handleStorageClick() {
    setPickerOpen(true);
    setAddOpen(false);
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Anexos
        </p>
        <Popover open={addOpen} onOpenChange={setAddOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors"
            >
              <Plus className="h-3 w-3" />
              Adicionar
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-44 p-1" align="end">
            <button
              type="button"
              className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted transition-colors"
              onClick={handleUploadClick}
            >
              Upload de arquivo
            </button>
            <button
              type="button"
              className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted transition-colors"
              onClick={handleStorageClick}
            >
              Buscar no Storage
            </button>
          </PopoverContent>
        </Popover>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Files grid */}
      {attachments.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {attachments.map(attachment => {
            const mimeType = attachment.file?.mimeType ?? 'application/octet-stream';
            const IconComp = getFileIcon(mimeType);
            const fileName = attachment.fileName ?? attachment.file?.originalName ?? 'Arquivo';
            const fileSize = attachment.file?.size;

            return (
              <div
                key={attachment.id}
                className={cn(
                  'flex items-center gap-2 rounded-md border border-border/40 bg-muted/30 px-2 py-1.5',
                  'group relative'
                )}
              >
                <IconComp className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs truncate" title={fileName}>
                    {fileName}
                  </p>
                  {fileSize != null && (
                    <p className="text-[10px] text-muted-foreground">
                      {formatFileSize(fileSize)}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"
                  onClick={() => onRemove(attachment.id)}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-[10px] text-muted-foreground">Nenhum anexo</p>
      )}

      {/* Storage file picker modal */}
      {onLinkStorageFile && (
        <StorageFilePicker
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          onSelect={onLinkStorageFile}
        />
      )}
    </div>
  );
}
