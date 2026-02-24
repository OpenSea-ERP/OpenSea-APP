'use client';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  Eye,
  Download,
  Pencil,
  FolderInput,
  History,
  Trash2,
} from 'lucide-react';
import type { StorageFile } from '@/types/storage';

export interface FilePermissions {
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canDownload: boolean;
  canViewVersions: boolean;
}

interface FileContextMenuProps {
  file: StorageFile;
  children: React.ReactNode;
  permissions?: FilePermissions;
  onPreview?: (file: StorageFile) => void;
  onDownload?: (file: StorageFile) => void;
  onRename?: (file: StorageFile) => void;
  onMove?: (file: StorageFile) => void;
  onVersions?: (file: StorageFile) => void;
  onDelete?: (file: StorageFile) => void;
}

export function FileContextMenu({
  file,
  children,
  permissions,
  onPreview,
  onDownload,
  onRename,
  onMove,
  onVersions,
  onDelete,
}: FileContextMenuProps) {
  const canRead = permissions?.canRead ?? true;
  const canUpdate = permissions?.canUpdate ?? true;
  const canDl = permissions?.canDownload ?? true;
  const canDel = permissions?.canDelete ?? true;
  const canVersions = permissions?.canViewVersions ?? true;

  const showRead = canRead && onPreview;
  const showDownload = canDl && onDownload;
  const showRename = canUpdate && onRename;
  const showMove = canUpdate && onMove;
  const showVersions = canVersions && onVersions;
  const showDelete = canDel && onDelete;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        {showRead && (
          <ContextMenuItem onClick={() => onPreview(file)}>
            <Eye className="w-4 h-4" />
            Abrir
          </ContextMenuItem>
        )}

        {showDownload && (
          <ContextMenuItem onClick={() => onDownload(file)}>
            <Download className="w-4 h-4" />
            Baixar
          </ContextMenuItem>
        )}

        {(showRead || showDownload) && (showRename || showMove) && (
          <ContextMenuSeparator />
        )}

        {showRename && (
          <ContextMenuItem onClick={() => onRename(file)}>
            <Pencil className="w-4 h-4" />
            Renomear
          </ContextMenuItem>
        )}

        {showMove && (
          <ContextMenuItem onClick={() => onMove(file)}>
            <FolderInput className="w-4 h-4" />
            Mover
          </ContextMenuItem>
        )}

        {showVersions && (
          <ContextMenuItem onClick={() => onVersions(file)}>
            <History className="w-4 h-4" />
            Versões
          </ContextMenuItem>
        )}

        {showDelete && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              variant="destructive"
              onClick={() => onDelete(file)}
            >
              <Trash2 className="w-4 h-4" />
              Excluir
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
