'use client';

import { useState } from 'react';
import { EyeOff, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StorageFile } from '@/types/storage';
import { FileTypeIcon } from './file-type-icon';
import { FileContextMenu } from './file-context-menu';
import type { FilePermissions } from './file-context-menu';
import { formatFileSize, truncateFileName } from './utils';

interface FileCardProps {
  file: StorageFile;
  isSelected?: boolean;
  isDragging?: boolean;
  draggable?: boolean;
  permissions?: FilePermissions;
  onClick?: (e: React.MouseEvent) => void;
  onDoubleClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onPreview?: (file: StorageFile) => void;
  onDownload?: (file: StorageFile) => void;
  onRename?: (file: StorageFile) => void;
  onMove?: (file: StorageFile) => void;
  onVersions?: (file: StorageFile) => void;
  onShare?: (file: StorageFile) => void;
  onProtect?: (file: StorageFile) => void;
  onHide?: (file: StorageFile) => void;
  onProperties?: (file: StorageFile) => void;
  onDelete?: (file: StorageFile) => void;
}

export function FileCard({
  file,
  isSelected,
  isDragging,
  draggable,
  permissions,
  onClick,
  onDoubleClick,
  onDragStart,
  onDragEnd,
  onPreview,
  onDownload,
  onRename,
  onMove,
  onVersions,
  onShare,
  onProtect,
  onHide,
  onProperties,
  onDelete,
}: FileCardProps) {
  const isImage = file.fileType === 'image';
  const [thumbError, setThumbError] = useState(false);

  return (
    <FileContextMenu
      file={file}
      permissions={permissions}
      onPreview={onPreview}
      onDownload={onDownload}
      onRename={onRename}
      onMove={onMove}
      onVersions={onVersions}
      onShare={onShare}
      onProtect={onProtect}
      onHide={onHide}
      onProperties={onProperties}
      onDelete={onDelete}
    >
      <div
        className={cn(
          'group relative flex flex-col items-center gap-2 rounded-xl p-4 cursor-pointer',
          'border border-transparent transition-all duration-200',
          'hover:bg-gray-50 dark:hover:bg-slate-800/60',
          'hover:border-gray-200 dark:hover:border-slate-700',
          isSelected &&
            'bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700',
          isSelected && 'ring-2 ring-blue-200 dark:ring-blue-800',
          isDragging && 'opacity-40'
        )}
        role="button"
        tabIndex={0}
        aria-label={`Arquivo ${file.name}`}
        draggable={draggable}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onKeyDown={e => {
          if (e.key === 'Enter' && onDoubleClick) onDoubleClick();
        }}
      >
        <div className="relative flex items-center justify-center w-12 h-12">
          {isImage && file.thumbnailKey && !thumbError ? (
            <img
              src={file.thumbnailKey}
              alt={file.name}
              loading="lazy"
              className="w-12 h-12 rounded-lg object-cover"
              onError={() => setThumbError(true)}
            />
          ) : (
            <FileTypeIcon fileType={file.fileType} size={40} />
          )}
          {file.isProtected && (
            <div className="absolute -top-1 -right-1 p-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 border border-amber-300 dark:border-amber-700">
              <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            </div>
          )}
          {file.isHidden && (
            <div className="absolute -top-1 -left-1 p-0.5 rounded-full bg-violet-100 dark:bg-violet-900/60 border border-violet-300 dark:border-violet-700">
              <EyeOff className="w-3 h-3 text-violet-600 dark:text-violet-400" />
            </div>
          )}
        </div>

        <div className="flex flex-col items-center gap-0.5 w-full min-w-0">
          <span
            className={cn(
              'text-sm font-medium text-center truncate w-full',
              'text-gray-800 dark:text-gray-200'
            )}
            title={file.name}
          >
            {truncateFileName(file.name)}
          </span>
          <span className="text-[11px] text-gray-500 dark:text-gray-400">
            {formatFileSize(file.size)}
          </span>
        </div>
      </div>
    </FileContextMenu>
  );
}
