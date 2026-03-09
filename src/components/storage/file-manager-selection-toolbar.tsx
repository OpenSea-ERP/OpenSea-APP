'use client';

import { useMemo } from 'react';
import type { SelectionAction } from '@/core/components/selection-toolbar';
import { SelectionToolbar } from '@/core/components/selection-toolbar';
import type { StorageFile, StorageFolder } from '@/types/storage';
import type { FilePermissions } from './file-context-menu';
import type { FolderPermissions } from './folder-context-menu';
import {
  Archive,
  Download,
  FolderInput,
  PackageOpen,
  Palette,
  Shield,
  Trash2,
} from 'lucide-react';

export interface FileManagerSelectionToolbarProps {
  selectedItems: { id: string; type: 'folder' | 'file' }[];
  allFolders: StorageFolder[];
  allFiles: StorageFile[];
  totalItems: number;
  folderPermissions: FolderPermissions;
  filePermissions: FilePermissions;
  onClear: () => void;
  onSelectAll: () => void;
  onMove: (ids: string[]) => void;
  onShare: (ids: string[]) => void;
  onChangeColor: (ids: string[]) => void;
  onDownload: (ids: string[]) => void;
  onDelete: (ids: string[]) => void;
  onCompress: () => void;
  onDecompress: () => void;
}

export function FileManagerSelectionToolbar({
  selectedItems,
  allFolders,
  allFiles,
  totalItems,
  folderPermissions,
  filePermissions,
  onClear,
  onSelectAll,
  onMove,
  onShare,
  onChangeColor,
  onDownload,
  onDelete,
  onCompress,
  onDecompress,
}: FileManagerSelectionToolbarProps) {
  const selectedIds = selectedItems.map(i => i.id);
  const selectedFolders = selectedItems.filter(i => i.type === 'folder');
  const selectedFiles = selectedItems.filter(i => i.type === 'file');

  const hasSystemFolders = selectedFolders.some(sf => {
    const folder = allFolders.find(f => f.id === sf.id);
    return folder?.isSystem;
  });
  const hasFilterFolders = selectedFolders.some(sf => {
    const folder = allFolders.find(f => f.id === sf.id);
    return folder?.isFilter;
  });
  const hasFiles = selectedFiles.length > 0;
  const hasFolders = selectedFolders.length > 0;
  const onlyUserFolders =
    hasFolders && !hasFiles && !hasSystemFolders && !hasFilterFolders;

  // Build actions based on selection composition and permissions
  const actions = useMemo<SelectionAction[]>(() => {
    const result: SelectionAction[] = [];

    // Move: not available if system/filter folders are selected
    const canMove =
      !hasSystemFolders &&
      !hasFilterFolders &&
      (hasFolders ? folderPermissions.canEditUserFolders : true) &&
      (hasFiles ? filePermissions.canUpdate : true);

    if (canMove) {
      result.push({
        id: 'move',
        label: 'Mover',
        icon: FolderInput,
        onClick: onMove,
        variant: 'ghost',
      });
    }

    // Share: available for all types if user has share permissions for relevant types
    const canShare =
      !hasFolders ||
      ((hasSystemFolders ? folderPermissions.canShareSystemFolders : true) &&
        (hasFilterFolders ? folderPermissions.canShareFilterFolders : true) &&
        (!hasSystemFolders && !hasFilterFolders
          ? folderPermissions.canShareUserFolders
          : true));

    if (canShare) {
      result.push({
        id: 'share',
        label: 'Compartilhar',
        icon: Shield,
        onClick: onShare,
        variant: 'ghost',
      });
    }

    // Change color: only for user folders (no files, no system/filter folders)
    if (onlyUserFolders && folderPermissions.canEditUserFolders) {
      result.push({
        id: 'color',
        label: 'Alterar cor',
        icon: Palette,
        onClick: onChangeColor,
        variant: 'ghost',
      });
    }

    // Download: always available if user has download permission
    const canDownload =
      (hasFiles ? filePermissions.canDownload : true) &&
      (!hasFolders ||
        ((hasSystemFolders
          ? folderPermissions.canDownloadSystemFolders
          : true) &&
          (hasFilterFolders
            ? folderPermissions.canDownloadFilterFolders
            : true) &&
          (!hasSystemFolders && !hasFilterFolders
            ? folderPermissions.canDownloadUserFolders
            : true)));

    if (canDownload) {
      result.push({
        id: 'download',
        label: 'Baixar',
        icon: Download,
        onClick: onDownload,
        variant: 'ghost',
      });
    }

    // Compress selected files/folders into ZIP
    result.push({
      id: 'compress',
      label: 'Compactar',
      icon: Archive,
      onClick: onCompress,
      variant: 'ghost',
    });

    // Decompress: only if exactly 1 .zip file is selected
    const isSingleZip =
      selectedItems.length === 1 &&
      selectedItems[0].type === 'file' &&
      allFiles
        .find(f => f.id === selectedItems[0].id)
        ?.name.match(/\.(zip|tar\.gz|7z)$/i);

    if (isSingleZip) {
      result.push({
        id: 'decompress',
        label: 'Descompactar',
        icon: PackageOpen,
        onClick: onDecompress,
        variant: 'ghost',
      });
    }

    // Delete: available if user has delete permission
    const canDelete =
      !hasSystemFolders &&
      !hasFilterFolders &&
      (hasFolders ? folderPermissions.canDeleteUserFolders : true) &&
      (hasFiles ? filePermissions.canDelete : true);

    if (canDelete) {
      result.push({
        id: 'delete',
        label: 'Excluir',
        icon: Trash2,
        onClick: onDelete,
        variant: 'destructive',
      });
    }

    return result;
  }, [
    hasSystemFolders,
    hasFilterFolders,
    hasFolders,
    hasFiles,
    onlyUserFolders,
    folderPermissions,
    filePermissions,
    selectedItems,
    allFiles,
    onMove,
    onShare,
    onChangeColor,
    onDownload,
    onDelete,
    onCompress,
    onDecompress,
  ]);

  return (
    <SelectionToolbar
      selectedIds={selectedIds}
      totalItems={totalItems}
      onClear={onClear}
      onSelectAll={onSelectAll}
      actions={actions}
    />
  );
}
