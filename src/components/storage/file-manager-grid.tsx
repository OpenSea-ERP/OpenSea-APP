'use client';

import { cn } from '@/lib/utils';
import type { StorageFile, StorageFolder } from '@/types/storage';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { EmptyFolderState } from './empty-folder-state';
import { FileCard } from './file-card';
import type { FilePermissions } from './file-context-menu';
import { FolderCard } from './folder-card';
import type { FolderPermissions } from './folder-context-menu';
import { useStorageDragDrop } from './use-storage-drag-drop';

/** Estimated card height including padding and gap (px) */
const CARD_HEIGHT = 148;
/** Gap between rows (px) — matches gap-3 = 12px */
const ROW_GAP = 12;

/**
 * Breakpoint → columns mapping that mirrors the original CSS grid:
 * grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6
 *
 * We compute columns based on container width rather than viewport breakpoints
 * so the virtualizer stays in sync even when the container is not full-width.
 */
function getColumnsForWidth(width: number): number {
  // Use slightly lower thresholds to account for scrollbar width (~17px)
  // preventing column jumps when scrollbar appears/disappears.
  if (width >= 1080) return 6;
  if (width >= 880) return 5;
  if (width >= 680) return 4;
  if (width >= 480) return 3;
  return 2;
}

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
  onProtectFolder?: (folder: StorageFolder) => void;
  onHideFolder?: (folder: StorageFolder) => void;
  // File actions
  onDownloadFile?: (file: StorageFile) => void;
  onRenameFile?: (file: StorageFile) => void;
  onMoveFile?: (file: StorageFile) => void;
  onFileVersions?: (file: StorageFile) => void;
  onShareFile?: (file: StorageFile) => void;
  onProtectFile?: (file: StorageFile) => void;
  onHideFile?: (file: StorageFile) => void;
  onProperties?: (file: StorageFile) => void;
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

type GridItem =
  | { type: 'folder'; data: StorageFolder }
  | { type: 'file'; data: StorageFile };

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
  onProtectFolder,
  onHideFolder,
  onDownloadFile,
  onRenameFile,
  onMoveFile,
  onFileVersions,
  onShareFile,
  onProtectFile,
  onHideFile,
  onProperties,
  onDeleteFile,
  folderPermissions,
  filePermissions,
  className,
}: FileManagerGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const gridContentRef = useRef<HTMLDivElement>(null);
  const [dragRect, setDragRect] = useState<DragRect | null>(null);
  const isDraggingRef = useRef(false);

  // Drag-and-drop
  const {
    draggedItemIds, dragOverFolderId,
    handleItemDragStart, handleItemDragEnd,
    handleFolderDragEnter, handleFolderDragOver,
    handleFolderDragLeave, handleFolderDrop,
  } = useStorageDragDrop({ selectedItems, folders, onDragMoveToFolder });

  // Dynamic column count based on container width.
  // Uses a ref to avoid unnecessary re-renders when the column count hasn't changed
  // (e.g., scrollbar toggling, dialog open/close causing minor width fluctuations).
  const columnsRef = useRef(6);
  const [columns, setColumns] = useState(6);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const observer = new ResizeObserver(entries => {
      // Debounce: only update columns after width stabilizes for 100ms
      // This prevents flickering during folder navigation transitions
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        for (const entry of entries) {
          const newCols = getColumnsForWidth(entry.contentRect.width);
          if (newCols !== columnsRef.current) {
            columnsRef.current = newCols;
            setColumns(newCols);
          }
        }
      }, 100);
    });

    // Set initial value synchronously (no debounce for first render)
    const initialCols = getColumnsForWidth(el.clientWidth);
    columnsRef.current = initialCols;
    setColumns(initialCols);

    observer.observe(el);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, []);

  // Flatten folders + files into a single array
  const allItems = useMemo<GridItem[]>(() => {
    const items: GridItem[] = [];
    for (const folder of folders) {
      items.push({ type: 'folder', data: folder });
    }
    for (const file of files) {
      items.push({ type: 'file', data: file });
    }
    return items;
  }, [folders, files]);

  const rowCount = Math.ceil(allItems.length / columns);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => CARD_HEIGHT + ROW_GAP,
    overscan: 3,
  });

  // --- Rubber-band selection ---

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only start drag on left button, on empty area (not on cards)
      if (e.button !== 0 || !onSelectMultiple) return;
      const target = e.target as HTMLElement;
      // Don't start drag if clicking on a card
      if (target.closest('[data-item-id]')) return;

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
        if (!gridContentRef.current) return;
        const selRect = {
          left: Math.min(startX, me.clientX),
          top: Math.min(startY, me.clientY),
          right: Math.max(startX, me.clientX),
          bottom: Math.max(startY, me.clientY),
        };

        const items: { id: string; type: 'folder' | 'file' }[] = [];
        const cards = gridContentRef.current.querySelectorAll('[data-item-id]');
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
        ref={scrollRef}
        className={cn('h-full overflow-y-auto select-none p-1', className)}
        onMouseDown={handleMouseDown}
      >
        <div
          ref={gridContentRef}
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map(virtualRow => {
            const rowIndex = virtualRow.index;
            const startIdx = rowIndex * columns;
            const rowItems = allItems.slice(startIdx, startIdx + columns);

            return (
              <div
                key={virtualRow.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div
                  className="grid gap-3"
                  style={{
                    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                  }}
                >
                  {rowItems.map(item => {
                    if (item.type === 'folder') {
                      const folder = item.data;
                      return (
                        <div
                          key={folder.id}
                          data-item-id={folder.id}
                          data-item-type="folder"
                        >
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
                              handleItemDragStart(
                                folder.id,
                                'folder',
                                folder.isSystem,
                                e
                              )
                            }
                            onDragEnd={handleItemDragEnd}
                            onDragEnter={e =>
                              handleFolderDragEnter(
                                folder.id,
                                folder.isSystem,
                                e
                              )
                            }
                            onDragOver={e =>
                              handleFolderDragOver(
                                folder.id,
                                folder.isSystem,
                                e
                              )
                            }
                            onDragLeave={e =>
                              handleFolderDragLeave(folder.id, e)
                            }
                            onDrop={e =>
                              handleFolderDrop(folder.id, folder.isSystem, e)
                            }
                            onOpen={f => onNavigateToFolder(f.id)}
                            onRename={onRenameFolder}
                            onChangeColor={onChangeColorFolder}
                            onMove={onMoveFolder}
                            onManageAccess={onManageFolderAccess}
                            onProtect={onProtectFolder}
                            onHide={onHideFolder}
                            onDelete={onDeleteFolder}
                            onDownload={onDownloadFolder}
                          />
                        </div>
                      );
                    }

                    const file = item.data;
                    return (
                      <div
                        key={file.id}
                        data-item-id={file.id}
                        data-item-type="file"
                      >
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
                          onProtect={onProtectFile}
                          onHide={onHideFile}
                          onProperties={onProperties}
                          onDelete={onDeleteFile}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
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
