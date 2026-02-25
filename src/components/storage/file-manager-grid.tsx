'use client';

import { cn } from '@/lib/utils';
import type { StorageFile, StorageFolder } from '@/types/storage';
import { useCallback, useRef, useState } from 'react';
import { EmptyFolderState } from './empty-folder-state';
import { FileCard } from './file-card';
import type { FilePermissions } from './file-context-menu';
import { FolderCard } from './folder-card';
import type { FolderPermissions } from './folder-context-menu';

const DRAG_MIME = 'application/x-storage-item';

export interface DragMoveItem {
  id: string;
  type: 'folder' | 'file';
}

interface FileManagerGridProps {
  folders: StorageFolder[];
  files: StorageFile[];
  isSelected: (id: string, type: 'folder' | 'file') => boolean;
  selectedItems?: DragMoveItem[];
  onSelectItem: (
    id: string,
    type: 'folder' | 'file',
    e: React.MouseEvent
  ) => void;
  onSelectMultiple?: (items: DragMoveItem[]) => void;
  onNavigateToFolder: (folderId: string) => void;
  onPreviewFile: (file: StorageFile) => void;
  onUpload?: () => void;
  onDragMoveToFolder?: (
    targetFolderId: string | null,
    items: DragMoveItem[]
  ) => void;
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
  onShareFile?: (file: StorageFile) => void;
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
  selectedItems,
  onSelectItem,
  onSelectMultiple,
  onNavigateToFolder,
  onPreviewFile,
  onUpload,
  onDragMoveToFolder,
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
  onShareFile,
  onDeleteFile,
  folderPermissions,
  filePermissions,
  className,
}: FileManagerGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [dragRect, setDragRect] = useState<DragRect | null>(null);
  const isDraggingRef = useRef(false);

  // Drag-and-drop state
  const [draggedItemIds, setDraggedItemIds] = useState<Set<string>>(new Set());
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  // --- Native drag-and-drop handlers ---

  const handleItemDragStart = useCallback(
    (
      id: string,
      type: 'folder' | 'file',
      isSystem: boolean,
      e: React.DragEvent
    ) => {
      if (isSystem) {
        e.preventDefault();
        return;
      }

      // Determine items to drag: if item is in selection, drag all selected; otherwise just this item
      let items: DragMoveItem[];
      const isInSelection = selectedItems?.some(
        si => si.id === id && si.type === type
      );
      if (isInSelection && selectedItems && selectedItems.length > 1) {
        items = selectedItems.filter(si => {
          // Exclude system folders from the drag set
          if (si.type === 'folder') {
            const f = folders.find(fo => fo.id === si.id);
            if (f?.isSystem) return false;
          }
          return true;
        });
      } else {
        items = [{ id, type }];
      }

      e.dataTransfer.setData(DRAG_MIME, JSON.stringify(items));
      e.dataTransfer.effectAllowed = 'move';

      setDraggedItemIds(new Set(items.map(i => i.id)));
    },
    [selectedItems, folders]
  );

  const handleItemDragEnd = useCallback(() => {
    setDraggedItemIds(new Set());
    setDragOverFolderId(null);
  }, []);

  const handleFolderDragEnter = useCallback(
    (folderId: string, isSystem: boolean, e: React.DragEvent) => {
      if (!e.dataTransfer.types.includes(DRAG_MIME)) return;
      if (draggedItemIds.has(folderId) || isSystem) return;

      e.preventDefault();
      setDragOverFolderId(folderId);
    },
    [draggedItemIds]
  );

  const handleFolderDragOver = useCallback(
    (folderId: string, isSystem: boolean, e: React.DragEvent) => {
      if (!e.dataTransfer.types.includes(DRAG_MIME)) return;
      // Don't allow drop on self or on system folders
      if (draggedItemIds.has(folderId) || isSystem) return;

      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDragOverFolderId(folderId);
    },
    [draggedItemIds]
  );

  const handleFolderDragLeave = useCallback(
    (folderId: string, e: React.DragEvent) => {
      // Only clear if actually leaving this folder card (not entering a child)
      const relatedTarget = e.relatedTarget as HTMLElement | null;
      const currentTarget = e.currentTarget as HTMLElement;
      if (relatedTarget && currentTarget.contains(relatedTarget)) return;

      if (dragOverFolderId === folderId) {
        setDragOverFolderId(null);
      }
    },
    [dragOverFolderId]
  );

  const handleFolderDrop = useCallback(
    (folderId: string, isSystem: boolean, e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOverFolderId(null);

      if (!e.dataTransfer.types.includes(DRAG_MIME)) return;
      if (draggedItemIds.has(folderId) || isSystem) return;

      try {
        const items: DragMoveItem[] = JSON.parse(
          e.dataTransfer.getData(DRAG_MIME)
        );
        if (items.length > 0 && onDragMoveToFolder) {
          onDragMoveToFolder(folderId, items);
        }
      } catch {
        // Invalid data — ignore
      }

      setDraggedItemIds(new Set());
    },
    [draggedItemIds, onDragMoveToFolder]
  );

  // --- Rubber-band selection ---

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
              isDragging={draggedItemIds.has(folder.id)}
              isDragTarget={dragOverFolderId === folder.id}
              draggable={!folder.isSystem}
              permissions={folderPermissions}
              onClick={e => onSelectItem(folder.id, 'folder', e)}
              onDoubleClick={() => onNavigateToFolder(folder.id)}
              onDragStart={e =>
                handleItemDragStart(folder.id, 'folder', folder.isSystem, e)
              }
              onDragEnd={handleItemDragEnd}
              onDragEnter={e =>
                handleFolderDragEnter(folder.id, folder.isSystem, e)
              }
              onDragOver={e =>
                handleFolderDragOver(folder.id, folder.isSystem, e)
              }
              onDragLeave={e => handleFolderDragLeave(folder.id, e)}
              onDrop={e =>
                handleFolderDrop(folder.id, folder.isSystem, e)
              }
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
              isDragging={draggedItemIds.has(file.id)}
              draggable
              permissions={filePermissions}
              onClick={e => onSelectItem(file.id, 'file', e)}
              onDoubleClick={() => onPreviewFile(file)}
              onDragStart={e =>
                handleItemDragStart(file.id, 'file', false, e)
              }
              onDragEnd={handleItemDragEnd}
              onPreview={onPreviewFile}
              onDownload={onDownloadFile}
              onRename={onRenameFile}
              onMove={onMoveFile}
              onVersions={onFileVersions}
              onShare={onShareFile}
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
