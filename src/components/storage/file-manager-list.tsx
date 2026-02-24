'use client';

import { ArrowUp, ArrowDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

interface FileManagerListProps {
  folders: StorageFolder[];
  files: StorageFile[];
  isSelected: (id: string, type: 'folder' | 'file') => boolean;
  onSelectItem: (
    id: string,
    type: 'folder' | 'file',
    e: React.MouseEvent
  ) => void;
  onNavigateToFolder: (folderId: string) => void;
  onPreviewFile: (file: StorageFile) => void;
  onUpload?: () => void;
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
  onSelectItem,
  onNavigateToFolder,
  onPreviewFile,
  onUpload,
  sortBy,
  sortOrder,
  onSortChange,
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
}: FileManagerListProps) {
  const isEmpty = folders.length === 0 && files.length === 0;

  if (isEmpty) {
    return <EmptyFolderState onUpload={onUpload} />;
  }

  return (
    <div className={cn('', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10" />
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => onSortChange('name')}
            >
              Nome
              <SortIndicator
                column="name"
                sortBy={sortBy}
                sortOrder={sortOrder}
              />
            </TableHead>
            <TableHead className="w-32">Tipo</TableHead>
            <TableHead
              className="cursor-pointer select-none w-28"
              onClick={() => onSortChange('size')}
            >
              Tamanho
              <SortIndicator
                column="size"
                sortBy={sortBy}
                sortOrder={sortOrder}
              />
            </TableHead>
            <TableHead
              className="cursor-pointer select-none w-40"
              onClick={() => onSortChange('updatedAt')}
            >
              Modificado
              <SortIndicator
                column="updatedAt"
                sortBy={sortBy}
                sortOrder={sortOrder}
              />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {folders.map(folder => (
            <FolderContextMenu
              key={folder.id}
              folder={folder}
              permissions={folderPermissions}
              onOpen={f => onNavigateToFolder(f.id)}
              onRename={onRenameFolder}
              onChangeColor={onChangeColorFolder}
              onMove={onMoveFolder}
              onManageAccess={onManageFolderAccess}
              onDelete={onDeleteFolder}
              onDownload={onDownloadFolder}
            >
              <TableRow
                className={cn(
                  'cursor-pointer',
                  isSelected(folder.id, 'folder') &&
                    'bg-blue-50 dark:bg-blue-950/30'
                )}
                onClick={e => onSelectItem(folder.id, 'folder', e)}
                onDoubleClick={() => onNavigateToFolder(folder.id)}
              >
                <TableCell>
                  <Checkbox
                    checked={isSelected(folder.id, 'folder')}
                    onClick={e => {
                      e.stopPropagation();
                      onSelectItem(folder.id, 'folder', e);
                    }}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FolderIcon folder={folder} size="sm" />
                    <span className="font-medium truncate">{folder.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-gray-500 dark:text-gray-400">
                  Pasta
                </TableCell>
                <TableCell className="text-gray-500 dark:text-gray-400">
                  {folder.fileCount !== undefined
                    ? `${folder.fileCount} ${folder.fileCount === 1 ? 'item' : 'itens'}`
                    : '--'}
                </TableCell>
                <TableCell className="text-gray-500 dark:text-gray-400">
                  {formatDate(folder.createdAt)}
                </TableCell>
              </TableRow>
            </FolderContextMenu>
          ))}

          {files.map(file => (
            <FileContextMenu
              key={file.id}
              file={file}
              permissions={filePermissions}
              onPreview={onPreviewFile}
              onDownload={onDownloadFile}
              onRename={onRenameFile}
              onMove={onMoveFile}
              onVersions={onFileVersions}
              onDelete={onDeleteFile}
            >
              <TableRow
                className={cn(
                  'cursor-pointer',
                  isSelected(file.id, 'file') &&
                    'bg-blue-50 dark:bg-blue-950/30'
                )}
                onClick={e => onSelectItem(file.id, 'file', e)}
                onDoubleClick={() => onPreviewFile(file)}
              >
                <TableCell>
                  <Checkbox
                    checked={isSelected(file.id, 'file')}
                    onClick={e => {
                      e.stopPropagation();
                      onSelectItem(file.id, 'file', e);
                    }}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FileTypeIcon
                      fileType={file.fileType}
                      size={18}
                      className="shrink-0"
                    />
                    <span className="font-medium truncate">{file.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-gray-500 dark:text-gray-400">
                  {getFileTypeLabel(file.fileType)}
                </TableCell>
                <TableCell className="text-gray-500 dark:text-gray-400">
                  {formatFileSize(file.size)}
                </TableCell>
                <TableCell className="text-gray-500 dark:text-gray-400">
                  {formatDate(file.createdAt)}
                </TableCell>
              </TableRow>
            </FileContextMenu>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
