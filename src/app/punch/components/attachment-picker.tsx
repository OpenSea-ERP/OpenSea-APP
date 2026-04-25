'use client';

/**
 * AttachmentPicker — câmera/galeria/PDF picker mobile-first.
 *
 * Phase 8 / Plan 08-03 / Task 2 — D-08 + D-09.
 *
 * Três triggers (3 hidden inputs) — câmera (capture="environment"), galeria
 * (image/*, multiple), PDF (application/pdf). Validações client-side:
 *   - max `maxFiles` (default 3) arquivos.
 *   - max `maxSizeMB` (default 5) por arquivo.
 *   - quota IDB (`useStorageQuota.isAtLimit`) bloqueia novo anexo.
 *
 * Backend re-valida no upload. Quando atinge `isNearLimit`, exibe warning
 * inline (D-09).
 */

import { useStorageQuota } from '@/hooks/pwa/use-storage-quota';
import { cn } from '@/lib/utils';
import { Camera, FileText, ImagePlus, X } from 'lucide-react';
import { useRef } from 'react';
import { toast } from 'sonner';

interface AttachmentPickerProps {
  files: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  disabled?: boolean;
}

const ACCEPT_IMAGE = 'image/jpeg,image/jpg,image/png';
const ACCEPT_PDF = 'application/pdf';

export function AttachmentPicker({
  files,
  onChange,
  maxFiles = 3,
  maxSizeMB = 5,
  disabled = false,
}: AttachmentPickerProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const { isAtLimit, isNearLimit } = useStorageQuota();

  const handleAdd = (newFiles: FileList | null) => {
    if (!newFiles || newFiles.length === 0) return;

    if (isAtLimit) {
      toast.error(
        'Espaço esgotado — sincronize ou remova batidas pendentes antes de anexar mais arquivos.'
      );
      return;
    }

    const remaining = maxFiles - files.length;
    if (remaining <= 0) {
      toast.error(
        `Máximo de ${maxFiles} arquivos. Remova um anexo para adicionar outro.`
      );
      return;
    }

    const valid: File[] = [];
    Array.from(newFiles)
      .slice(0, remaining)
      .forEach(file => {
        if (file.size > maxSizeMB * 1024 * 1024) {
          toast.error(`${file.name} excede ${maxSizeMB}MB.`);
          return;
        }
        valid.push(file);
      });

    if (valid.length > 0) {
      onChange([...files, ...valid]);
    }
  };

  const handleRemove = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  const buttonClass =
    'flex flex-col items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-medium text-slate-700 hover:border-violet-300 hover:bg-violet-50 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:border-violet-500/40 dark:hover:bg-violet-500/10 disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <div data-testid="attachment-picker" className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={disabled || isAtLimit}
          data-testid="attachment-picker-camera"
          className={buttonClass}
        >
          <Camera className="size-5" />
          Câmera
        </button>
        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          disabled={disabled || isAtLimit}
          data-testid="attachment-picker-gallery"
          className={buttonClass}
        >
          <ImagePlus className="size-5" />
          Galeria
        </button>
        <button
          type="button"
          onClick={() => pdfInputRef.current?.click()}
          disabled={disabled || isAtLimit}
          data-testid="attachment-picker-pdf"
          className={buttonClass}
        >
          <FileText className="size-5" />
          PDF
        </button>
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept={ACCEPT_IMAGE}
        capture="environment"
        hidden
        onChange={e => {
          handleAdd(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept={ACCEPT_IMAGE}
        multiple
        hidden
        onChange={e => {
          handleAdd(e.target.files);
          e.target.value = '';
        }}
      />
      <input
        ref={pdfInputRef}
        type="file"
        accept={ACCEPT_PDF}
        hidden
        onChange={e => {
          handleAdd(e.target.files);
          e.target.value = '';
        }}
      />

      {files.length > 0 && (
        <ul className="space-y-1.5">
          {files.map((file, i) => (
            <li
              key={`${file.name}-${i}`}
              className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/60"
            >
              <span className="flex-1 truncate text-xs font-medium text-slate-700 dark:text-slate-200">
                {file.name}
              </span>
              <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
                {(file.size / 1024).toFixed(0)} KB
              </span>
              <button
                type="button"
                onClick={() => handleRemove(i)}
                aria-label={`Remover ${file.name}`}
                className="text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <p
        className={cn(
          'text-xs',
          isNearLimit
            ? 'text-amber-600 dark:text-amber-300'
            : 'text-slate-500 dark:text-slate-400'
        )}
      >
        {files.length}/{maxFiles} arquivos · até {maxSizeMB}MB cada
        {isNearLimit && ' · Storage quase cheio'}
      </p>
    </div>
  );
}
