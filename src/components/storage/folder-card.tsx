'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { StorageFolder } from '@/types/storage';
import { FolderContextMenu } from './folder-context-menu';
import type { FolderPermissions } from './folder-context-menu';
import { FolderIcon } from './folder-icon';

interface FolderCardProps {
  folder: StorageFolder;
  isSelected?: boolean;
  isDragging?: boolean;
  isDragTarget?: boolean;
  draggable?: boolean;
  permissions?: FolderPermissions;
  onClick?: (e: React.MouseEvent) => void;
  onDoubleClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDragEnter?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onOpen?: (folder: StorageFolder) => void;
  onRename?: (folder: StorageFolder) => void;
  onChangeColor?: (folder: StorageFolder) => void;
  onMove?: (folder: StorageFolder) => void;
  onManageAccess?: (folder: StorageFolder) => void;
  onDelete?: (folder: StorageFolder) => void;
  onDownload?: (folder: StorageFolder) => void;
}

export function FolderCard({
  folder,
  isSelected,
  isDragging,
  isDragTarget,
  draggable,
  permissions,
  onClick,
  onDoubleClick,
  onDragStart,
  onDragEnd,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
  onOpen,
  onRename,
  onChangeColor,
  onMove,
  onManageAccess,
  onDelete,
  onDownload,
}: FolderCardProps) {
  return (
    <FolderContextMenu
      folder={folder}
      permissions={permissions}
      onOpen={onOpen}
      onRename={onRename}
      onChangeColor={onChangeColor}
      onMove={onMove}
      onManageAccess={onManageAccess}
      onDelete={onDelete}
      onDownload={onDownload}
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
          isDragTarget &&
            'ring-2 ring-blue-400 bg-blue-50 dark:bg-blue-950/40 scale-[1.02]',
          isDragging && 'opacity-40'
        )}
        draggable={draggable}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
      >
        <FolderIcon folder={folder} size="lg" />

        <div className="flex flex-col items-center gap-1 w-full min-w-0">
          <span
            className={cn(
              'text-sm font-medium text-center truncate w-full',
              'text-gray-800 dark:text-gray-200'
            )}
            title={folder.name}
          >
            {folder.name}
          </span>

          {folder.fileCount !== undefined && folder.fileCount > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {folder.fileCount} {folder.fileCount === 1 ? 'item' : 'itens'}
            </Badge>
          )}
        </div>
      </div>
    </FolderContextMenu>
  );
}
