'use client';

import { cn } from '@/lib/utils';
import type { StorageFile, StorageFolder } from '@/types/storage';
import { useCallback, useRef, useState } from 'react';
import { EmptyFolderState } from './empty-folder-state';
import { FileCard } from './file-card';
import type { FilePermissions } from './file-context-menu';
import { FolderCard } from './folder-card';
import type { FolderPermissions } from './folder-context-menu';

interface FileManagerGridProps {
  folders: StorageFolder[];
  files: StorageFile[];
  isSelected: (id: string, type: 'folder' | 'file') => boolean;
  onSelectItem: (
    id: string,
    type: 'folder' | 'file',
    e: React.MouseEvent
  ) => void;
  onSelectMultiple?: (items: { id: string; type: 'folder' | 'file' }[]) => void;
  onNavigateToFolder: (folderId: string) => void;
  onPreviewFile: (file: StorageFile) => void;
  onUpload?: () => void;
  // Folder actions
  onRenameFolder?: (folder: StorageFolder) => void;
  onChangeColorFolder?: (folder: StorageFolder) => void;
  onMoveFolder?: (folder: StorageFolder) => void;
  onManageFolderAccess?: (folder: StorageFolder) => void;
  onDeleteFolder?: (folder: StorageFolder) => void;
  onDownloadFolder?: (folder: StorageFolder) => void;
  // File actions
  onDownloadFile?: (file: StorageFile) => void;
  onRenameFile?: (file: StorageFile) => void;
  onMoveFile?: (file: StorageFile) => void;
  onFileVersions?: (file: StorageFile) => void;
  onDeleteFile?: (file: StorageFile) => void;
  // Permissions
  folderPermissions?: FolderPermissions;
  filePermissions?: FilePermissions;
  className?: string;
}

interface DragRect {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

function rectsIntersect(
  a: { left: number; top: number; right: number; bottom: number },
  b: { left: number; top: number; right: number; bottom: number }
) {
  return (
    a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
  );
}

export function FileManagerGrid({
  folders,
  files,
  isSelected,
  onSelectItem,
  onSelectMultiple,
  onNavigateToFolder,
  onPreviewFile,
  onUpload,
  onRenameFolder,
  onChangeColorFolder,
  onMoveFolder,
  onManageFolderAccess,
  onDeleteFolder,
  onDownloadFolder,
  onDownloadFile,
  onRenameFile,
  onMoveFile,
  onFileVersions,
  onDeleteFile,
  folderPermissions,
  filePermissions,
  className,
}: FileManagerGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [dragRect, setDragRect] = useState<DragRect | null>(null);
  const isDraggingRef = useRef(false);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only start drag on left button, on empty area (not on cards)
      if (e.button !== 0 || !onSelectMultiple) return;
      const target = e.target as HTMLElement;
      // Don't start drag if clicking on a card
      if (target.closest('[data-item-id]')) return;

      const rect = gridRef.current?.getBoundingClientRect();
      if (!rect) return;

      isDraggingRef.current = false;
      const startX = e.clientX;
      const startY = e.clientY;

      const handleMouseMove = (me: MouseEvent) => {
        const dx = me.clientX - startX;
        const dy = me.clientY - startY;
        // Only start drag after 5px of movement to avoid false positives
        if (!isDraggingRef.current && Math.abs(dx) + Math.abs(dy) < 5) return;
        isDraggingRef.current = true;

        setDragRect({
          startX,
          startY,
          currentX: me.clientX,
          currentY: me.clientY,
        });

        // Find intersecting items
        if (!gridRef.current) return;
        const selRect = {
          left: Math.min(startX, me.clientX),
          top: Math.min(startY, me.clientY),
          right: Math.max(startX, me.clientX),
          bottom: Math.max(startY, me.clientY),
        };

        const items: { id: string; type: 'folder' | 'file' }[] = [];
        const cards = gridRef.current.querySelectorAll('[data-item-id]');
        cards.forEach(card => {
          const cardRect = card.getBoundingClientRect();
          if (rectsIntersect(selRect, cardRect)) {
            const id = card.getAttribute('data-item-id')!;
            const type = card.getAttribute('data-item-type') as
              | 'folder'
              | 'file';
            items.push({ id, type });
          }
        });
        onSelectMultiple(items);
      };

      const handleMouseUp = () => {
        setDragRect(null);
        isDraggingRef.current = false;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [onSelectMultiple]
  );

  const isEmpty = folders.length === 0 && files.length === 0;

  if (isEmpty) {
    return <EmptyFolderState onUpload={onUpload} />;
  }

  // Calculate rubber-band rect styles
  const selectionStyle = dragRect
    ? {
        left: Math.min(dragRect.startX, dragRect.currentX),
        top: Math.min(dragRect.startY, dragRect.currentY),
        width: Math.abs(dragRect.currentX - dragRect.startX),
        height: Math.abs(dragRect.currentY - dragRect.startY),
      }
    : null;

  return (
    <>
      <div
        ref={gridRef}
        className={cn(
          'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 select-none',
          className
        )}
        onMouseDown={handleMouseDown}
      >
        {folders.map(folder => (
          <div key={folder.id} data-item-id={folder.id} data-item-type="folder">
            <FolderCard
              folder={folder}
              isSelected={isSelected(folder.id, 'folder')}
              permissions={folderPermissions}
              onClick={e => onSelectItem(folder.id, 'folder', e)}
              onDoubleClick={() => onNavigateToFolder(folder.id)}
              onOpen={f => onNavigateToFolder(f.id)}
              onRename={onRenameFolder}
              onChangeColor={onChangeColorFolder}
              onMove={onMoveFolder}
              onManageAccess={onManageFolderAccess}
              onDelete={onDeleteFolder}
              onDownload={onDownloadFolder}
            />
          </div>
        ))}

        {files.map(file => (
          <div key={file.id} data-item-id={file.id} data-item-type="file">
            <FileCard
              file={file}
              isSelected={isSelected(file.id, 'file')}
              permissions={filePermissions}
              onClick={e => onSelectItem(file.id, 'file', e)}
              onDoubleClick={() => onPreviewFile(file)}
              onPreview={onPreviewFile}
              onDownload={onDownloadFile}
              onRename={onRenameFile}
              onMove={onMoveFile}
              onVersions={onFileVersions}
              onDelete={onDeleteFile}
            />
          </div>
        ))}
      </div>

      {/* Rubber-band selection overlay */}
      {selectionStyle && (
        <div
          className="fixed z-50 border border-blue-400 bg-blue-400/10 rounded-sm pointer-events-none"
          style={selectionStyle}
        />
      )}
    </>
  );
}
