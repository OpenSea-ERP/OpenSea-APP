'use client';

import { useCallback, useState } from 'react';
import type { StorageFolder } from '@/types/storage';
import type { DragMoveItem } from './file-manager-grid';
import { DRAG_MIME } from './constants';

interface UseStorageDragDropOptions {
  selectedItems?: DragMoveItem[];
  folders: StorageFolder[];
  onDragMoveToFolder?: (targetFolderId: string | null, items: DragMoveItem[]) => void;
}

export function useStorageDragDrop({ selectedItems, folders, onDragMoveToFolder }: UseStorageDragDropOptions) {
  const [draggedItemIds, setDraggedItemIds] = useState<Set<string>>(new Set());
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  const handleItemDragStart = useCallback(
    (id: string, type: 'folder' | 'file', isSystem: boolean, e: React.DragEvent) => {
      if (isSystem) { e.preventDefault(); return; }
      let items: DragMoveItem[];
      const isInSelection = selectedItems?.some(si => si.id === id && si.type === type);
      if (isInSelection && selectedItems && selectedItems.length > 1) {
        items = selectedItems.filter(si => {
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
      if (draggedItemIds.has(folderId) || isSystem) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDragOverFolderId(folderId);
    },
    [draggedItemIds]
  );

  const handleFolderDragLeave = useCallback(
    (folderId: string, e: React.DragEvent) => {
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
        const items: DragMoveItem[] = JSON.parse(e.dataTransfer.getData(DRAG_MIME));
        if (items.length > 0 && onDragMoveToFolder) {
          onDragMoveToFolder(folderId, items);
        }
      } catch { /* Invalid data */ }
      setDraggedItemIds(new Set());
    },
    [draggedItemIds, onDragMoveToFolder]
  );

  return {
    draggedItemIds,
    dragOverFolderId,
    handleItemDragStart,
    handleItemDragEnd,
    handleFolderDragEnter,
    handleFolderDragOver,
    handleFolderDragLeave,
    handleFolderDrop,
  };
}
