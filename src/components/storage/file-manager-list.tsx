'use client';

import { ArrowUp, ArrowDown } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import type { StorageFolder, StorageFile } from '@/types/storage';
import type { SortBy, SortOrder } from '@/hooks/storage';
import type { FolderPermissions } from './folder-context-menu';
import type { FilePermissions } from './file-context-menu';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import { FileTypeIcon, getFileTypeLabel } from './file-type-icon';
import { FolderIcon } from './folder-icon';
import { formatFileSize } from './utils';
import { EmptyFolderState } from './empty-folder-state';
import { FolderContextMenu } from './folder-context-menu';
import { FileContextMenu } from './file-context-menu';
import { useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { DragMoveItem } from './file-manager-grid';
import { useStorageDragDrop } from './use-storage-drag-drop';

const ROW_HEIGHT = 48;
const OVERSCAN = 10;

interface FileManagerListProps {
  folders: StorageFolder[];
  files: StorageFile[];
  isSelected: (id: string, type: 'folder' | 'file') => boolean;
  selectedItems?: DragMoveItem[];
  onSelectItem: (
    id: string,
    type: 'folder' | 'file',
    e: React.MouseEvent
  ) => void;
  onNavigateToFolder: (folderId: string) => void;
  onPreviewFile: (file: StorageFile) => void;
  onUpload?: () => void;
  onDragMoveToFolder?: (
    targetFolderId: string | null,
    items: DragMoveItem[]
  ) => void;
  sortBy: SortBy;
  sortOrder: SortOrder;
  onSortChange: (sortBy: SortBy) => void;
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

type ListItem =
  | { type: 'folder'; data: StorageFolder }
  | { type: 'file'; data: StorageFile };

function SortIndicator({
  column,
  sortBy,
  sortOrder,
}: {
  column: SortBy;
  sortBy: SortBy;
  sortOrder: SortOrder;
}) {
  if (column !== sortBy) return null;
  return sortOrder === 'asc' ? (
    <ArrowUp className="w-3 h-3 inline ml-1" />
  ) : (
    <ArrowDown className="w-3 h-3 inline ml-1" />
  );
}

export function FileManagerList({
  folders,
  files,
  isSelected,
  selectedItems,
  onSelectItem,
  onNavigateToFolder,
  onPreviewFile,
  onUpload,
  onDragMoveToFolder,
  sortBy,
  sortOrder,
  onSortChange,
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
}: FileManagerListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Drag-and-drop
  const {
    draggedItemIds, dragOverFolderId,
    handleItemDragStart, handleItemDragEnd,
    handleFolderDragEnter, handleFolderDragOver,
    handleFolderDragLeave, handleFolderDrop,
  } = useStorageDragDrop({ selectedItems, folders, onDragMoveToFolder });

  // Merge folders and files into a single flat list
  const allItems = useMemo<ListItem[]>(() => {
    const items: ListItem[] = [];
    for (const folder of folders) {
      items.push({ type: 'folder', data: folder });
    }
    for (const file of files) {
      items.push({ type: 'file', data: file });
    }
    return items;
  }, [folders, files]);

  const virtualizer = useVirtualizer({
    count: allItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
  });

  const isEmpty = folders.length === 0 && files.length === 0;

  if (isEmpty) {
    return <EmptyFolderState onUpload={onUpload} />;
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Sticky table header */}
      <div className="shrink-0 border-b border-border">
        <div className="flex items-center h-10 text-sm font-medium text-foreground">
          <div className="w-10 px-2" />
          <div
            role="columnheader"
            tabIndex={0}
            aria-sort={sortBy === 'name' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
            className="flex-1 min-w-0 px-2 cursor-pointer select-none"
            onClick={() => onSortChange('name')}
            onKeyDown={e => e.key === 'Enter' && onSortChange('name')}
          >
            Nome
            <SortIndicator
              column="name"
              sortBy={sortBy}
              sortOrder={sortOrder}
            />
          </div>
          <div role="columnheader" className="w-32 px-2">Tipo</div>
          <div
            role="columnheader"
            tabIndex={0}
            aria-sort={sortBy === 'size' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
            className="w-28 px-2 cursor-pointer select-none"
            onClick={() => onSortChange('size')}
            onKeyDown={e => e.key === 'Enter' && onSortChange('size')}
          >
            Tamanho
            <SortIndicator
              column="size"
              sortBy={sortBy}
              sortOrder={sortOrder}
            />
          </div>
          <div
            role="columnheader"
            tabIndex={0}
            aria-sort={sortBy === 'updatedAt' ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
            className="w-40 px-2 cursor-pointer select-none"
            onClick={() => onSortChange('updatedAt')}
            onKeyDown={e => e.key === 'Enter' && onSortChange('updatedAt')}
          >
            Modificado
            <SortIndicator
              column="updatedAt"
              sortBy={sortBy}
              sortOrder={sortOrder}
            />
          </div>
        </div>
      </div>

      {/* Virtualized scrollable body */}
      <div ref={parentRef} className="flex-1 overflow-y-auto">
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map(virtualRow => {
            const item = allItems[virtualRow.index];

            if (item.type === 'folder') {
              const folder = item.data;
              return (
                <div
                  key={`folder-${folder.id}`}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <FolderContextMenu
                    folder={folder}
                    permissions={folderPermissions}
                    onOpen={f => onNavigateToFolder(f.id)}
                    onRename={onRenameFolder}
                    onChangeColor={onChangeColorFolder}
                    onMove={onMoveFolder}
                    onManageAccess={onManageFolderAccess}
                    onProtect={onProtectFolder}
                    onHide={onHideFolder}
                    onDelete={onDeleteFolder}
                    onDownload={onDownloadFolder}
                  >
                    <div
                      className={cn(
                        'flex items-center h-full border-b border-border cursor-pointer transition-all duration-150',
                        'hover:bg-muted/50',
                        isSelected(folder.id, 'folder') &&
                          'bg-blue-50 dark:bg-blue-950/30',
                        draggedItemIds.has(folder.id) && 'opacity-40',
                        dragOverFolderId === folder.id &&
                          'ring-2 ring-blue-400 bg-blue-50 dark:bg-blue-950/40'
                      )}
                      draggable={!folder.isSystem}
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
                        handleFolderDragEnter(folder.id, folder.isSystem, e)
                      }
                      onDragOver={e =>
                        handleFolderDragOver(folder.id, folder.isSystem, e)
                      }
                      onDragLeave={e => handleFolderDragLeave(folder.id, e)}
                      onDrop={e =>
                        handleFolderDrop(folder.id, folder.isSystem, e)
                      }
                      onClick={e => onSelectItem(folder.id, 'folder', e)}
                      onDoubleClick={() => onNavigateToFolder(folder.id)}
                    >
                      <div className="w-10 px-2 flex items-center justify-center">
                        <Checkbox
                          checked={isSelected(folder.id, 'folder')}
                          onClick={e => {
                            e.stopPropagation();
                            onSelectItem(folder.id, 'folder', e);
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0 px-2">
                        <div className="flex items-center gap-2">
                          <FolderIcon folder={folder} size="sm" />
                          <span className="font-medium truncate">
                            {folder.name}
                          </span>
                        </div>
                      </div>
                      <div className="w-32 px-2 text-gray-500 dark:text-gray-400">
                        Pasta
                      </div>
                      <div className="w-28 px-2 text-gray-500 dark:text-gray-400">
                        {folder.fileCount !== undefined
                          ? `${folder.fileCount} ${folder.fileCount === 1 ? 'item' : 'itens'}`
                          : '--'}
                      </div>
                      <div className="w-40 px-2 text-gray-500 dark:text-gray-400">
                        {formatDate(folder.updatedAt ?? folder.createdAt)}
                      </div>
                    </div>
                  </FolderContextMenu>
                </div>
              );
            }

            // File row
            const file = item.data;
            return (
              <div
                key={`file-${file.id}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <FileContextMenu
                  file={file}
                  permissions={filePermissions}
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
                >
                  <div
                    className={cn(
                      'flex items-center h-full border-b border-border cursor-pointer transition-all duration-150',
                      'hover:bg-muted/50',
                      isSelected(file.id, 'file') &&
                        'bg-blue-50 dark:bg-blue-950/30',
                      draggedItemIds.has(file.id) && 'opacity-40'
                    )}
                    draggable
                    onDragStart={e =>
                      handleItemDragStart(file.id, 'file', false, e)
                    }
                    onDragEnd={handleItemDragEnd}
                    onClick={e => onSelectItem(file.id, 'file', e)}
                    onDoubleClick={() => onPreviewFile(file)}
                  >
                    <div className="w-10 px-2 flex items-center justify-center">
                      <Checkbox
                        checked={isSelected(file.id, 'file')}
                        onClick={e => {
                          e.stopPropagation();
                          onSelectItem(file.id, 'file', e);
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0 px-2">
                      <div className="flex items-center gap-2">
                        <FileTypeIcon
                          fileType={file.fileType}
                          size={18}
                          className="shrink-0"
                        />
                        <span className="font-medium truncate">
                          {file.name}
                        </span>
                      </div>
                    </div>
                    <div className="w-32 px-2 text-gray-500 dark:text-gray-400">
                      {getFileTypeLabel(file.fileType)}
                    </div>
                    <div className="w-28 px-2 text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.size)}
                    </div>
                    <div className="w-40 px-2 text-gray-500 dark:text-gray-400">
                      {formatDate(file.updatedAt ?? file.createdAt)}
                    </div>
                  </div>
                </FileContextMenu>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
