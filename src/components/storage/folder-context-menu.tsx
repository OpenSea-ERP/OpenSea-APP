'use client';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import type { StorageFolder } from '@/types/storage';
import {
  Download,
  FolderInput,
  FolderOpen,
  Palette,
  Pencil,
  Shield,
  Trash2,
} from 'lucide-react';

export interface FolderPermissions {
  canEditUserFolders: boolean;
  canDeleteUserFolders: boolean;
  canShareUserFolders: boolean;
  canShareSystemFolders: boolean;
  canShareFilterFolders: boolean;
  canDownloadUserFolders: boolean;
  canDownloadSystemFolders: boolean;
  canDownloadFilterFolders: boolean;
}

interface FolderContextMenuProps {
  folder: StorageFolder;
  children: React.ReactNode;
  permissions?: FolderPermissions;
  onOpen?: (folder: StorageFolder) => void;
  onRename?: (folder: StorageFolder) => void;
  onChangeColor?: (folder: StorageFolder) => void;
  onMove?: (folder: StorageFolder) => void;
  onManageAccess?: (folder: StorageFolder) => void;
  onDelete?: (folder: StorageFolder) => void;
  onDownload?: (folder: StorageFolder) => void;
}

function resolveFolderPermissions(
  folder: StorageFolder,
  permissions?: FolderPermissions
) {
  if (!permissions) {
    // No permissions provided — hide privileged actions (safe default)
    return {
      canEdit: false,
      canDelete: false,
      canShare: false,
      canDownload: false,
    };
  }

  if (folder.isSystem) {
    return {
      canEdit: false,
      canDelete: false,
      canShare: permissions.canShareSystemFolders,
      canDownload: permissions.canDownloadSystemFolders,
    };
  }

  if (folder.isFilter) {
    return {
      canEdit: false,
      canDelete: false,
      canShare: permissions.canShareFilterFolders,
      canDownload: permissions.canDownloadFilterFolders,
    };
  }

  // User folder
  return {
    canEdit: permissions.canEditUserFolders,
    canDelete: permissions.canDeleteUserFolders,
    canShare: permissions.canShareUserFolders,
    canDownload: permissions.canDownloadUserFolders,
  };
}

export function FolderContextMenu({
  folder,
  children,
  permissions,
  onOpen,
  onRename,
  onChangeColor,
  onMove,
  onManageAccess,
  onDelete,
  onDownload,
}: FolderContextMenuProps) {
  const resolved = resolveFolderPermissions(folder, permissions);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        {onOpen && (
          <ContextMenuItem onClick={() => onOpen(folder)}>
            <FolderOpen className="w-4 h-4" />
            Abrir
          </ContextMenuItem>
        )}

        {resolved.canEdit && onRename && (
          <ContextMenuItem onClick={() => onRename(folder)}>
            <Pencil className="w-4 h-4" />
            Renomear
          </ContextMenuItem>
        )}

        {resolved.canEdit && onChangeColor && (
          <ContextMenuItem onClick={() => onChangeColor(folder)}>
            <Palette className="w-4 h-4" />
            Alterar cor
          </ContextMenuItem>
        )}

        {resolved.canEdit && onMove && (
          <ContextMenuItem onClick={() => onMove(folder)}>
            <FolderInput className="w-4 h-4" />
            Mover
          </ContextMenuItem>
        )}

        {resolved.canDownload && onDownload && (
          <ContextMenuItem onClick={() => onDownload(folder)}>
            <Download className="w-4 h-4" />
            Baixar
          </ContextMenuItem>
        )}

        {resolved.canShare && onManageAccess && (
          <ContextMenuItem onClick={() => onManageAccess(folder)}>
            <Shield className="w-4 h-4" />
            Gerenciar acesso
          </ContextMenuItem>
        )}

        {resolved.canDelete && onDelete && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem
              variant="destructive"
              onClick={() => onDelete(folder)}
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
