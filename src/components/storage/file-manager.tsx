'use client';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useDeleteFile,
  useDeleteFolder,
  useDownloadFolder,
  useEnsureEntityFolder,
  useFileManager,
  useInitializeFolders,
} from '@/hooks/storage';
import { usePermissions } from '@/hooks/use-permissions';
import { storageFilesService, storageFoldersService } from '@/services/storage';
import { storageSecurityService } from '@/services/storage/security.service';
import { cn } from '@/lib/utils';
import type { StorageFile, StorageFolder } from '@/types/storage';
import { DRAG_MIME } from './constants';
import { ArrowLeft } from 'lucide-react';
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { FilePermissions } from './file-context-menu';
import { FileManagerBreadcrumb } from './file-manager-breadcrumb';
import type { DragMoveItem } from './file-manager-grid';
import { FileManagerGrid } from './file-manager-grid';
import { FileManagerList } from './file-manager-list';
import { FileManagerToolbar } from './file-manager-toolbar';
import { FileManagerSelectionToolbar } from './file-manager-selection-toolbar';
import { FileManagerDialogs } from './file-manager-dialogs';
import type { MoveState, RenameState, DeleteState } from './file-manager-dialogs';
import { TrashView } from './trash-view';
import type { FolderPermissions } from './folder-context-menu';
import { formatFileSize } from './utils';

export interface FileManagerRef {
  openUpload: () => void;
  openNewFolder: () => void;
  openTrash: () => void;
}

interface FileManagerProps {
  rootFolderId?: string;
  entityType?: string;
  entityId?: string;
  className?: string;
  /** Hides upload/new folder buttons from the internal toolbar (use with ref to control externally) */
  hideToolbarActions?: boolean;
  /** DOM element ID where the toolbar should be portaled to (renders inside hero card). When set, internal toolbar is hidden. */
  toolbarPortalId?: string;
  /** Admin-only: show all users' files and folders */
  viewAll?: boolean;
  /** Controlled trash view state (when managed externally) */
  showTrash?: boolean;
  onShowTrashChange?: (show: boolean) => void;
}

export const FileManager = forwardRef<FileManagerRef, FileManagerProps>(
  function FileManager(
    {
      rootFolderId,
      entityType,
      entityId,
      className,
      hideToolbarActions,
      toolbarPortalId,
      viewAll,
      showTrash: showTrashProp,
      onShowTrashChange,
    },
    ref
  ) {
    const manager = useFileManager({ rootFolderId, entityType, entityId, viewAll });
    const { hasPermission } = usePermissions();

    // Compute permission objects for context menus
    const folderPermissions = useMemo<FolderPermissions>(
      () => ({
        canEditUserFolders: hasPermission('storage.user-folders.update'),
        canDeleteUserFolders: hasPermission('storage.user-folders.delete'),
        canShareUserFolders:
          hasPermission('storage.user-folders.share-user') ||
          hasPermission('storage.user-folders.share-group'),
        canShareSystemFolders:
          hasPermission('storage.system-folders.share-user') ||
          hasPermission('storage.system-folders.share-group'),
        canShareFilterFolders:
          hasPermission('storage.filter-folders.share-user') ||
          hasPermission('storage.filter-folders.share-group'),
        canDownloadUserFolders: hasPermission('storage.user-folders.download'),
        canDownloadSystemFolders: hasPermission(
          'storage.system-folders.download'
        ),
        canDownloadFilterFolders: hasPermission(
          'storage.filter-folders.download'
        ),
      }),
      [hasPermission]
    );

    const filePermissions = useMemo<FilePermissions>(
      () => ({
        canRead: hasPermission('storage.files.read'),
        canUpdate: hasPermission('storage.files.update'),
        canDelete: hasPermission('storage.files.delete'),
        canDownload: hasPermission('storage.files.download'),
        canViewVersions: hasPermission('storage.versions.read'),
      }),
      [hasPermission]
    );

    // Portal target for external toolbar
    const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
    useEffect(() => {
      if (toolbarPortalId) {
        const el = document.getElementById(toolbarPortalId);
        setPortalTarget(el);
      }
    }, [toolbarPortalId]);

    useImperativeHandle(ref, () => ({
      openUpload: () => setShowUpload(true),
      openNewFolder: () => setShowNewFolder(true),
      openTrash: () => setShowTrash(true),
    }));

    // Folder type filter
    const [folderTypeFilter, setFolderTypeFilter] = useState({
      filter: true,
      system: true,
      personal: true,
    });

    // Dialog states
    const [showUpload, setShowUpload] = useState(false);
    const [showNewFolder, setShowNewFolder] = useState(false);
    const [securityKeyDialogOpen, setSecurityKeyDialogOpen] = useState(false);
    const [previewFile, setPreviewFile] = useState<StorageFile | null>(null);
    const [showPreview, setShowPreview] = useState(false);
    const [previewPassword, setPreviewPassword] = useState<string | undefined>(undefined);
    const [versionFile, setVersionFile] = useState<StorageFile | null>(null);
    const [showVersions, setShowVersions] = useState(false);
    const [moveState, setMoveState] = useState<MoveState | null>(null);
    const [renameState, setRenameState] = useState<RenameState | null>(null);
    const [accessFolder, setAccessFolder] = useState<StorageFolder | null>(
      null
    );
    const [showAccess, setShowAccess] = useState(false);
    const [colorFolder, setColorFolder] = useState<StorageFolder | null>(null);
    const [showColorDialog, setShowColorDialog] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [deleteState, setDeleteState] = useState<DeleteState | null>(null);
    const [showTrashInternal, setShowTrashInternal] = useState(false);
    const showTrash = showTrashProp ?? showTrashInternal;
    const setShowTrash = onShowTrashChange ?? setShowTrashInternal;
    const [shareFile, setShareFile] = useState<StorageFile | null>(null);
    const [showShareDialog, setShowShareDialog] = useState(false);
    const [propertiesFile, setPropertiesFile] = useState<StorageFile | null>(null);
    const [droppedFiles, setDroppedFiles] = useState<File[]>([]);
    const [protectState, setProtectState] = useState<{
      itemId: string;
      itemType: 'file' | 'folder';
      itemName: string;
      isProtected: boolean;
    } | null>(null);
    const [unlockState, setUnlockState] = useState<{
      itemId: string;
      itemType: 'file' | 'folder';
      itemName: string;
      onUnlocked: (password: string) => void;
    } | null>(null);
    // Map of folderId → password for folders unlocked during this session
    const unlockedFoldersRef = useRef<Map<string, string>>(new Map());

    // Mutations
    const deleteFolderMutation = useDeleteFolder();
    const deleteFileMutation = useDeleteFile();
    const downloadFolderMutation = useDownloadFolder();
    const queryClient = useQueryClient();
    const initializeFolders = useInitializeFolders();
    const ensureEntityFolder = useEnsureEntityFolder();

    // Initialization - fire-and-forget on mount
    const initializedRef = useRef(false);
    useEffect(() => {
      if (initializedRef.current) return;
      initializedRef.current = true;

      initializeFolders.mutate(undefined, {
        onSuccess: () => {
          if (entityType && entityId) {
            ensureEntityFolder.mutate({
              entityType,
              entityId,
              entityName: entityType,
            });
          }
        },
      });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Keyboard shortcuts for file manager
    useEffect(() => {
      const handler = (e: KeyboardEvent) => {
        // Don't trigger when typing in inputs
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        if ((e.target as HTMLElement)?.isContentEditable) return;

        const allFolders = manager.contents?.folders ?? [];
        const allFiles = manager.contents?.files ?? [];

        // Ctrl+A — select all
        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
          e.preventDefault();
          const allItems = [
            ...allFolders.map(f => ({ id: f.id, type: 'folder' as const })),
            ...allFiles.map(f => ({ id: f.id, type: 'file' as const })),
          ];
          for (const item of allItems) {
            if (!manager.isSelected(item.id, item.type)) {
              manager.toggleItem(item);
            }
          }
          return;
        }

        // Escape — clear selection
        if (e.key === 'Escape') {
          manager.clearSelection();
          return;
        }

        // Backspace — navigate back
        if (e.key === 'Backspace' && manager.canNavigateBack) {
          e.preventDefault();
          manager.navigateBack();
          return;
        }

        // F2 — rename selected item (single selection only)
        if (e.key === 'F2' && manager.selectedItems.length === 1) {
          e.preventDefault();
          const item = manager.selectedItems[0];
          if (item.type === 'folder') {
            const folder = allFolders.find(f => f.id === item.id);
            if (folder && !folder.isSystem && !folder.isFilter) {
              handleRenameFolder(folder);
            }
          } else {
            const file = allFiles.find(f => f.id === item.id);
            if (file) {
              handleRenameFile(file);
            }
          }
          return;
        }

        // Enter — open selected item (single selection only)
        if (e.key === 'Enter' && manager.selectedItems.length === 1) {
          e.preventDefault();
          const item = manager.selectedItems[0];
          if (item.type === 'folder') {
            const folder = allFolders.find(f => f.id === item.id);
            if (folder) handleNavigateToFolder(folder.id);
          } else {
            const file = allFiles.find(f => f.id === item.id);
            if (file) handlePreviewFile(file);
          }
          return;
        }

        // Delete — delete selected items
        if (e.key === 'Delete' && manager.selectedItems.length > 0) {
          e.preventDefault();
          const selected = manager.selectedItems;

          if (selected.length === 1) {
            const item = selected[0];
            if (item.type === 'folder') {
              const folder = allFolders.find(f => f.id === item.id);
              if (folder && !folder.isSystem) {
                setDeleteState({ type: 'folder', id: folder.id, name: folder.name });
              }
            } else {
              const file = allFiles.find(f => f.id === item.id);
              if (file) {
                setDeleteState({ type: 'file', id: file.id, name: file.name });
              }
            }
          } else {
            const bulkFileIds = selected.filter(i => i.type === 'file').map(i => i.id);
            const bulkFolderIds = selected.filter(i => i.type === 'folder').map(i => i.id);
            setDeleteState({
              type: 'bulk',
              id: 'bulk',
              name: `${selected.length} itens`,
              bulkFileIds,
              bulkFolderIds,
            });
          }
        }
      };
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
      // Handlers are stable useCallbacks with [] deps — safe to omit
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [manager.selectedItems, manager.contents, manager.canNavigateBack]);

    // Track last clicked item for shift-click range selection
    const lastClickedRef = useRef<{
      id: string;
      type: 'folder' | 'file';
    } | null>(null);

    // Selection handler with ctrl/meta + shift key support
    const handleSelectItem = useCallback(
      (id: string, type: 'folder' | 'file', e: React.MouseEvent) => {
        if (e.shiftKey && lastClickedRef.current) {
          manager.selectRange(lastClickedRef.current, { id, type });
        } else if (e.ctrlKey || e.metaKey) {
          manager.toggleItem({ id, type });
        } else {
          manager.selectItem({ id, type });
        }
        lastClickedRef.current = { id, type };
      },
      [manager]
    );

    // Navigate to folder — checks protection before entering
    const handleNavigateToFolder = useCallback((folderId: string) => {
      const folder = (manager.contents?.folders ?? []).find(f => f.id === folderId);
      if (folder?.isProtected && !unlockedFoldersRef.current.has(folderId)) {
        setUnlockState({
          itemId: folderId,
          itemType: 'folder',
          itemName: folder.name,
          onUnlocked: (password) => {
            unlockedFoldersRef.current.set(folderId, password);
            manager.navigateToFolder(folderId);
          },
        });
        return;
      }
      manager.navigateToFolder(folderId);
    }, [manager]);

    // Resolve password for a file (file-level or folder-level)
    const resolveFilePassword = useCallback((file: StorageFile): string | undefined => {
      if (file.isProtected) return undefined; // Will be handled by unlock dialog
      // Check if parent folder is protected and we have its password
      if (manager.currentFolderId) {
        return unlockedFoldersRef.current.get(manager.currentFolderId);
      }
      return undefined;
    }, [manager.currentFolderId]);

    // File preview — checks protection before opening
    const handlePreviewFile = useCallback((file: StorageFile) => {
      if (file.isProtected) {
        setUnlockState({
          itemId: file.id,
          itemType: 'file',
          itemName: file.name,
          onUnlocked: (password) => {
            setPreviewPassword(password);
            setPreviewFile(file);
            setShowPreview(true);
          },
        });
        return;
      }
      // Use folder-level password if available (for files inside protected folders)
      const folderPwd = resolveFilePassword(file);
      setPreviewPassword(folderPwd);
      setPreviewFile(file);
      setShowPreview(true);
    }, [resolveFilePassword]);

    // File download — checks protection before downloading
    const handleDownloadFile = useCallback(
      (file: StorageFile) => {
        if (file.isProtected) {
          setUnlockState({
            itemId: file.id,
            itemType: 'file',
            itemName: file.name,
            onUnlocked: (password) => {
              try {
                const downloadUrl = storageFilesService.getServeUrl(file.id, { download: true, password });
                window.open(downloadUrl, '_blank');
              } catch {
                toast.error('Erro ao baixar o arquivo');
              }
            },
          });
          return;
        }
        try {
          // Use folder-level password if available
          const folderPwd = resolveFilePassword(file);
          const downloadUrl = storageFilesService.getServeUrl(file.id, { download: true, password: folderPwd });
          window.open(downloadUrl, '_blank');
        } catch {
          toast.error('Erro ao baixar o arquivo');
        }
      },
      [resolveFilePassword]
    );

    // Folder download as ZIP
    const handleDownloadFolder = useCallback(
      async (folder: StorageFolder) => {
        toast.promise(
          downloadFolderMutation.mutateAsync(folder.id).then((result) => {
            window.open(result.url, '_blank');
          }),
          {
            loading: 'Preparando download da pasta...',
            success: 'Download iniciado',
            error: 'Erro ao baixar a pasta',
          },
        );
      },
      [downloadFolderMutation]
    );

    // Rename
    const handleRenameFolder = useCallback((folder: StorageFolder) => {
      setRenameState({
        itemId: folder.id,
        itemType: 'folder',
        currentName: folder.name,
      });
    }, []);

    const handleRenameFile = useCallback((file: StorageFile) => {
      setRenameState({
        itemId: file.id,
        itemType: 'file',
        currentName: file.name,
      });
    }, []);

    // Change folder color
    const handleChangeColorFolder = useCallback((folder: StorageFolder) => {
      setColorFolder(folder);
      setShowColorDialog(true);
    }, []);

    // Move
    const handleMoveFolder = useCallback((folder: StorageFolder) => {
      setMoveState({
        itemId: folder.id,
        itemType: 'folder',
        itemName: folder.name,
      });
    }, []);

    const handleMoveFile = useCallback((file: StorageFile) => {
      setMoveState({
        itemId: file.id,
        itemType: 'file',
        itemName: file.name,
      });
    }, []);

    // Folder access
    const handleManageFolderAccess = useCallback((folder: StorageFolder) => {
      setAccessFolder(folder);
      setShowAccess(true);
    }, []);

    // Delete folder - opens PIN modal
    const handleDeleteFolder = useCallback((folder: StorageFolder) => {
      if (folder.isSystem) return;
      setDeleteState({ type: 'folder', id: folder.id, name: folder.name });
    }, []);

    // Delete file - opens PIN modal
    const handleDeleteFile = useCallback((file: StorageFile) => {
      setDeleteState({ type: 'file', id: file.id, name: file.name });
    }, []);

    // Confirmed delete after PIN verification
    const handleDeleteConfirm = useCallback(async () => {
      if (!deleteState) return;

      try {
        if (deleteState.type === 'bulk') {
          await storageFilesService.bulkDelete({
            fileIds: deleteState.bulkFileIds,
            folderIds: deleteState.bulkFolderIds,
          });
          const total = (deleteState.bulkFileIds?.length ?? 0) + (deleteState.bulkFolderIds?.length ?? 0);
          toast.success(`${total} itens excluídos com sucesso`);
          queryClient.invalidateQueries({ queryKey: ['storage-folder-contents'] });
          queryClient.invalidateQueries({ queryKey: ['storage-root-contents'] });
          queryClient.invalidateQueries({ queryKey: ['storage-stats'] });
        } else if (deleteState.type === 'folder') {
          await deleteFolderMutation.mutateAsync(deleteState.id);
          toast.success('Pasta excluída com sucesso');
        } else {
          await deleteFileMutation.mutateAsync(deleteState.id);
          toast.success('Arquivo excluído com sucesso');
        }
        manager.clearSelection();
      } catch {
        toast.error(
          deleteState.type === 'bulk'
            ? 'Erro ao excluir os itens'
            : deleteState.type === 'folder'
              ? 'Erro ao excluir a pasta'
              : 'Erro ao excluir o arquivo'
        );
      } finally {
        setDeleteState(null);
      }
    }, [deleteState, deleteFolderMutation, deleteFileMutation, manager, queryClient]);

    // File share
    const handleShareFile = useCallback((file: StorageFile) => {
      setShareFile(file);
      setShowShareDialog(true);
    }, []);

    // File properties
    const handleFileProperties = useCallback((file: StorageFile) => {
      setPropertiesFile(file);
    }, []);

    // File versions
    const handleFileVersions = useCallback((file: StorageFile) => {
      setVersionFile(file);
      setShowVersions(true);
    }, []);

    // Protection
    const handleProtectFile = useCallback((file: StorageFile) => {
      setProtectState({
        itemId: file.id,
        itemType: 'file',
        itemName: file.name,
        isProtected: file.isProtected,
      });
    }, []);

    const handleProtectFolder = useCallback((folder: StorageFolder) => {
      setProtectState({
        itemId: folder.id,
        itemType: 'folder',
        itemName: folder.name,
        isProtected: folder.isProtected,
      });
    }, []);

    // Hide/Unhide
    const handleHideFile = useCallback(async (file: StorageFile) => {
      try {
        if (file.isHidden) {
          await storageSecurityService.unhideItem({ itemId: file.id, itemType: 'file' });
          toast.success('Arquivo revelado com sucesso');
        } else {
          await storageSecurityService.hideItem({ itemId: file.id, itemType: 'file' });
          toast.success('Arquivo ocultado com sucesso');
        }
        queryClient.invalidateQueries({ queryKey: ['storage-folder-contents'] });
        queryClient.invalidateQueries({ queryKey: ['storage-root-contents'] });
      } catch {
        toast.error('Erro ao alterar visibilidade do arquivo');
      }
    }, [queryClient]);

    const handleHideFolder = useCallback(async (folder: StorageFolder) => {
      try {
        if (folder.isHidden) {
          await storageSecurityService.unhideItem({ itemId: folder.id, itemType: 'folder' });
          toast.success('Pasta revelada com sucesso');
        } else {
          await storageSecurityService.hideItem({ itemId: folder.id, itemType: 'folder' });
          toast.success('Pasta ocultada com sucesso');
        }
        queryClient.invalidateQueries({ queryKey: ['storage-folder-contents'] });
        queryClient.invalidateQueries({ queryKey: ['storage-root-contents'] });
      } catch {
        toast.error('Erro ao alterar visibilidade da pasta');
      }
    }, [queryClient]);

    // Security key dialog success handler
    const handleSecurityKeySuccess = useCallback(() => {
      manager.setShowHidden(true);
      manager.setSearchQuery('');
    }, [manager]);

    // Toggle hidden items off
    const handleToggleHidden = useCallback(() => {
      manager.setShowHidden(false);
      queryClient.invalidateQueries({ queryKey: ['storage'] });
    }, [manager, queryClient]);

    // Drag-and-drop: move items into a folder
    // Calls services directly (not mutation hooks) to avoid per-mutation
    // onSuccess query invalidation that causes race conditions in multi-move
    const handleDragMoveToFolder = useCallback(
      async (targetFolderId: string | null, items: DragMoveItem[]) => {
        const results = await Promise.allSettled(
          items.map(item => {
            if (item.type === 'folder') {
              return storageFoldersService.moveFolder(item.id, {
                parentId: targetFolderId,
              });
            }
            return storageFilesService.moveFile(item.id, {
              folderId: targetFolderId,
            });
          })
        );

        const movedCount = results.filter(r => r.status === 'fulfilled').length;
        const errorCount = results.filter(r => r.status === 'rejected').length;

        // Cancel any in-flight queries so stale data doesn't overwrite fresh data
        await queryClient.cancelQueries({ queryKey: ['storage-folder-contents'] });
        await queryClient.cancelQueries({ queryKey: ['storage-root-contents'] });
        // Invalidate to trigger fresh refetch (same pattern as mutation hooks)
        queryClient.invalidateQueries({ queryKey: ['storage-folder-contents'] });
        queryClient.invalidateQueries({ queryKey: ['storage-root-contents'] });
        queryClient.invalidateQueries({ queryKey: ['storage-breadcrumb'] });
        queryClient.invalidateQueries({ queryKey: ['storage-search'] });

        if (movedCount > 0) {
          toast.success(
            movedCount === 1
              ? 'Item movido com sucesso'
              : `${movedCount} itens movidos com sucesso`
          );
          manager.clearSelection();
        }
        if (errorCount > 0) {
          toast.error(
            errorCount === 1
              ? 'Erro ao mover 1 item'
              : `Erro ao mover ${errorCount} itens`
          );
        }
      },
      [queryClient, manager]
    );

    // Drag and drop on the main area (file upload from OS)
    const handleDragOver = useCallback((e: React.DragEvent) => {
      // Don't show upload overlay for internal drag-and-drop moves
      if (e.dataTransfer.types.includes(DRAG_MIME)) return;
      e.preventDefault();
      setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
    }, []);

    const canUpload = hasPermission('storage.files.create');

    const handleDrop = useCallback(
      (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        // Ignore internal drag-and-drop (handled by folder cards)
        if (e.dataTransfer.types.includes(DRAG_MIME)) return;
        if (e.dataTransfer.files.length > 0 && canUpload) {
          setDroppedFiles(Array.from(e.dataTransfer.files));
          setShowUpload(true);
        }
      },
      [canUpload]
    );

    // Compress selected files/folders into a ZIP
    const handleCompress = useCallback(async () => {
      const fileIds = manager.selectedItems
        .filter(i => i.type === 'file')
        .map(i => i.id);
      const folderIds = manager.selectedItems
        .filter(i => i.type === 'folder')
        .map(i => i.id);

      toast.promise(
        storageFilesService.compressFiles({
          fileIds,
          folderIds,
          targetFolderId: manager.currentFolderId,
        }).then(() => {
          manager.clearSelection();
          queryClient.invalidateQueries({ queryKey: ['storage-folder-contents'] });
          queryClient.invalidateQueries({ queryKey: ['storage-root-contents'] });
        }),
        {
          loading: 'Compactando arquivos...',
          success: 'Arquivos compactados com sucesso',
          error: 'Erro ao compactar arquivos',
        },
      );
    }, [manager, queryClient]);

    // Decompress a single ZIP file
    const handleDecompress = useCallback(async () => {
      const selected = manager.selectedItems[0];
      if (!selected || selected.type !== 'file') return;

      toast.promise(
        storageFilesService.decompressFile(selected.id, {
          targetFolderId: manager.currentFolderId,
        }).then((result) => {
          manager.clearSelection();
          queryClient.invalidateQueries({ queryKey: ['storage-folder-contents'] });
          queryClient.invalidateQueries({ queryKey: ['storage-root-contents'] });
          return result;
        }),
        {
          loading: 'Descompactando arquivo...',
          success: (result) => {
            return result.folderCount > 0
              ? `${result.files.length} arquivo(s) e ${result.folderCount} pasta(s) extraídos`
              : `${result.files.length} arquivo(s) extraído(s)`;
          },
          error: 'Erro ao descompactar arquivo',
        },
      );
    }, [manager, queryClient]);

    const allFolders = manager.contents?.folders ?? [];
    const files = manager.contents?.files ?? [];

    const folders = useMemo(
      () => allFolders.filter(f => {
        if (f.isFilter) return folderTypeFilter.filter;
        if (f.isSystem) return folderTypeFilter.system;
        return folderTypeFilter.personal;
      }),
      [allFolders, folderTypeFilter],
    );

    const toolbarElement = (
      <FileManagerToolbar
        viewMode={manager.viewMode}
        sortBy={manager.sortBy}
        sortOrder={manager.sortOrder}
        searchQuery={manager.searchQuery}
        onViewModeChange={manager.setViewMode}
        onSortByChange={manager.setSortBy}
        onSortOrderChange={manager.setSortOrder}
        onSearchChange={manager.setSearchQuery}
        showHidden={manager.showHidden}
        onToggleHidden={handleToggleHidden}
        onUpload={
          hideToolbarActions || !hasPermission('storage.files.create')
            ? undefined
            : () => setShowUpload(true)
        }
        onNewFolder={
          hideToolbarActions || !hasPermission('storage.user-folders.create')
            ? undefined
            : () => setShowNewFolder(true)
        }
        onSecurityKey={() => setSecurityKeyDialogOpen(true)}
        folderTypeFilter={folderTypeFilter}
        onFolderTypeFilterChange={setFolderTypeFilter}
      />
    );

    return (
      <div className={cn('flex flex-col h-full', className)}>
        {/* Toolbar — portaled to hero card or rendered inline */}
        {portalTarget ? (
          createPortal(toolbarElement, portalTarget)
        ) : (
          <div className="shrink-0 px-4 py-3 border-b border-gray-200 dark:border-slate-700">
            {toolbarElement}
          </div>
        )}

        {/* Trash view OR normal file manager content */}
        {showTrash ? (
          <TrashView className="flex-1" />
        ) : (
          <>
            {/* Breadcrumb + back button */}
            <div className="shrink-0 px-4 h-12 flex items-center gap-2 border-b border-gray-100 dark:border-slate-800">
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={manager.navigateBack}
                disabled={!manager.canNavigateBack}
                className={cn(!manager.canNavigateBack && 'invisible')}
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <FileManagerBreadcrumb
                breadcrumb={manager.breadcrumb}
                isLoading={manager.isLoadingBreadcrumb}
                onNavigate={manager.navigateToBreadcrumb}
                onDragMoveToFolder={handleDragMoveToFolder}
                rootFolderId={rootFolderId ?? null}
              />

              <div className="flex-1" />
            </div>

            {/* Content area */}
            <div
              aria-live="polite"
              aria-busy={manager.isLoading}
              className={cn(
                'flex-1 min-h-0 flex flex-col p-4 relative transition-colors',
                isDragOver && 'bg-blue-50/50 dark:bg-blue-950/10'
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={e => {
                // Deselect all when clicking empty area
                if (e.target === e.currentTarget) {
                  manager.clearSelection();
                }
              }}
            >
              {/* Drag overlay */}
              {isDragOver && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-blue-50/80 dark:bg-blue-950/40 border-2 border-dashed border-blue-400 rounded-lg pointer-events-none">
                  <div className="text-center">
                    <p className="text-lg font-medium text-blue-600 dark:text-blue-400">
                      Solte os arquivos aqui
                    </p>
                    <p className="text-sm text-blue-500 dark:text-blue-300">
                      para enviar para esta pasta
                    </p>
                  </div>
                </div>
              )}

              {/* Content area — aria-live for screen readers */}
              {manager.isLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex flex-col items-center gap-2 p-4"
                    >
                      <Skeleton className="w-12 h-12 rounded-lg" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
              ) : manager.error ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <p className="text-sm text-red-500 dark:text-red-400 mb-4">
                    Erro ao carregar o conteúdo da pasta
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      queryClient.invalidateQueries({ queryKey: ['storage-folder-contents'] });
                      queryClient.invalidateQueries({ queryKey: ['storage-root-contents'] });
                    }}
                  >
                    Tentar novamente
                  </Button>
                </div>
              ) : manager.viewMode === 'grid' ? (
                <FileManagerGrid
                  folders={folders}
                  files={files}
                  isSelected={manager.isSelected}
                  selectedItems={manager.selectedItems}
                  onSelectItem={handleSelectItem}
                  onSelectMultiple={manager.selectMultiple}
                  onNavigateToFolder={handleNavigateToFolder}
                  onPreviewFile={handlePreviewFile}
                  onUpload={() => setShowUpload(true)}
                  onDragMoveToFolder={handleDragMoveToFolder}
                  onRenameFolder={handleRenameFolder}
                  onChangeColorFolder={handleChangeColorFolder}
                  onMoveFolder={handleMoveFolder}
                  onManageFolderAccess={handleManageFolderAccess}
                  onDeleteFolder={handleDeleteFolder}
                  onDownloadFolder={handleDownloadFolder}
                  onProtectFolder={hasPermission('storage.security.manage') ? handleProtectFolder : undefined}
                  onHideFolder={hasPermission('storage.security.manage') ? handleHideFolder : undefined}
                  onDownloadFile={handleDownloadFile}
                  onRenameFile={handleRenameFile}
                  onMoveFile={handleMoveFile}
                  onFileVersions={handleFileVersions}
                  onShareFile={handleShareFile}
                  onProtectFile={hasPermission('storage.security.manage') ? handleProtectFile : undefined}
                  onHideFile={hasPermission('storage.security.manage') ? handleHideFile : undefined}
                  onProperties={handleFileProperties}
                  onDeleteFile={handleDeleteFile}
                  folderPermissions={folderPermissions}
                  filePermissions={filePermissions}
                />
              ) : (
                <FileManagerList
                  folders={folders}
                  files={files}
                  isSelected={manager.isSelected}
                  selectedItems={manager.selectedItems}
                  onSelectItem={handleSelectItem}
                  onNavigateToFolder={handleNavigateToFolder}
                  onPreviewFile={handlePreviewFile}
                  onUpload={() => setShowUpload(true)}
                  onDragMoveToFolder={handleDragMoveToFolder}
                  sortBy={manager.sortBy}
                  sortOrder={manager.sortOrder}
                  onSortChange={manager.setSortBy}
                  onRenameFolder={handleRenameFolder}
                  onChangeColorFolder={handleChangeColorFolder}
                  onMoveFolder={handleMoveFolder}
                  onManageFolderAccess={handleManageFolderAccess}
                  onDeleteFolder={handleDeleteFolder}
                  onDownloadFolder={handleDownloadFolder}
                  onProtectFolder={hasPermission('storage.security.manage') ? handleProtectFolder : undefined}
                  onHideFolder={hasPermission('storage.security.manage') ? handleHideFolder : undefined}
                  onDownloadFile={handleDownloadFile}
                  onRenameFile={handleRenameFile}
                  onMoveFile={handleMoveFile}
                  onFileVersions={handleFileVersions}
                  onShareFile={handleShareFile}
                  onProtectFile={hasPermission('storage.security.manage') ? handleProtectFile : undefined}
                  onHideFile={hasPermission('storage.security.manage') ? handleHideFile : undefined}
                  onProperties={handleFileProperties}
                  onDeleteFile={handleDeleteFile}
                  folderPermissions={folderPermissions}
                  filePermissions={filePermissions}
                />
              )}
            </div>

            {/* Footer — item count + size */}
            {!manager.isLoading && !manager.error && (
              <div className="shrink-0 px-4 py-2 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {folders.length + files.length}{' '}
                  {folders.length + files.length === 1 ? 'item' : 'itens'}
                  {(manager.searchQuery.trim() || !folderTypeFilter.filter || !folderTypeFilter.system || !folderTypeFilter.personal) && (
                    <span className="ml-1 text-yellow-600 dark:text-yellow-400">(filtrado)</span>
                  )}
                </span>
                <span>
                  {formatFileSize(
                    files.reduce((sum, f) => sum + f.size, 0)
                  )}
                </span>
              </div>
            )}
          </>
        )}

        {/* Selection Toolbar */}
        {manager.selectedItems.length > 0 && (
          <FileManagerSelectionToolbar
            selectedItems={manager.selectedItems}
            allFolders={allFolders}
            allFiles={files}
            totalItems={folders.length + files.length}
            folderPermissions={folderPermissions}
            filePermissions={filePermissions}
            onClear={manager.clearSelection}
            onSelectAll={manager.selectAll}
            onMove={ids => {
              const selectedForMove = manager.selectedItems.filter(i => ids.includes(i.id));
              if (selectedForMove.length === 0) return;

              if (selectedForMove.length === 1) {
                const item = selectedForMove[0];
                const folder = allFolders.find(f => f.id === item.id);
                const file = files.find(f => f.id === item.id);
                setMoveState({
                  itemId: item.id,
                  itemType: item.type,
                  itemName: folder?.name ?? file?.name ?? '',
                });
              } else {
                const bulkFileIds = selectedForMove.filter(i => i.type === 'file').map(i => i.id);
                const bulkFolderIds = selectedForMove.filter(i => i.type === 'folder').map(i => i.id);
                setMoveState({
                  itemId: 'bulk',
                  itemType: 'bulk',
                  itemName: `${selectedForMove.length} itens`,
                  bulkFileIds,
                  bulkFolderIds,
                });
              }
            }}
            onShare={ids => {
              const item = manager.selectedItems.find(i => ids.includes(i.id));
              if (item?.type === 'folder') {
                const folder = allFolders.find(f => f.id === item.id);
                if (folder) handleManageFolderAccess(folder);
              }
            }}
            onChangeColor={ids => {
              const item = manager.selectedItems.find(i => ids.includes(i.id));
              if (item?.type === 'folder') {
                const folder = allFolders.find(f => f.id === item.id);
                if (folder) handleChangeColorFolder(folder);
              }
            }}
            onDownload={async ids => {
              const selectedForDownload = manager.selectedItems.filter(
                i => ids.includes(i.id)
              );
              const downloadFiles = selectedForDownload.filter(i => i.type === 'file');

              if (downloadFiles.length <= 1) {
                // Single file download
                const file = files.find(f => f.id === downloadFiles[0]?.id);
                if (file) await handleDownloadFile(file);
              } else {
                // Multiple files: compress into ZIP, then download
                try {
                  toast.info('Preparando download...');
                  const result = await storageFilesService.compressFiles({
                    fileIds: downloadFiles.map(i => i.id),
                    folderIds: selectedForDownload.filter(i => i.type === 'folder').map(i => i.id),
                    targetFolderId: manager.currentFolderId,
                  });
                  const downloadUrl = storageFilesService.getServeUrl(result.file.id, { download: true });
                  window.open(downloadUrl, '_blank');
                  queryClient.invalidateQueries({ queryKey: ['storage-folder-contents'] });
                  queryClient.invalidateQueries({ queryKey: ['storage-root-contents'] });
                } catch {
                  toast.error('Erro ao preparar download');
                }
              }
            }}
            onDelete={ids => {
              const selectedForDelete = manager.selectedItems.filter(i => ids.includes(i.id));
              if (selectedForDelete.length === 0) return;

              if (selectedForDelete.length === 1) {
                const item = selectedForDelete[0];
                if (item.type === 'folder') {
                  const folder = allFolders.find(f => f.id === item.id);
                  if (folder) handleDeleteFolder(folder);
                } else {
                  const file = files.find(f => f.id === item.id);
                  if (file) handleDeleteFile(file);
                }
              } else {
                const bulkFileIds = selectedForDelete.filter(i => i.type === 'file').map(i => i.id);
                const bulkFolderIds = selectedForDelete.filter(i => i.type === 'folder').map(i => i.id);
                setDeleteState({
                  type: 'bulk',
                  id: 'bulk',
                  name: `${selectedForDelete.length} itens`,
                  bulkFileIds,
                  bulkFolderIds,
                });
              }
            }}
            onCompress={handleCompress}
            onDecompress={handleDecompress}
          />
        )}

        {/* Dialogs */}
        <FileManagerDialogs
          showUpload={showUpload}
          onShowUploadChange={setShowUpload}
          currentFolderId={manager.currentFolderId}
          entityType={entityType}
          entityId={entityId}
          droppedFiles={droppedFiles}
          onClearDroppedFiles={() => setDroppedFiles([])}
          showNewFolder={showNewFolder}
          onShowNewFolderChange={setShowNewFolder}
          previewFile={previewFile}
          previewFiles={files}
          showPreview={showPreview}
          onShowPreviewChange={setShowPreview}
          onPreviewNavigate={file => {
            setPreviewPassword(undefined);
            setPreviewFile(file);
          }}
          onClearPreviewPassword={() => setPreviewPassword(undefined)}
          canDownload={filePermissions.canDownload}
          previewPassword={previewPassword}
          versionFile={versionFile}
          showVersions={showVersions}
          onShowVersionsChange={setShowVersions}
          moveState={moveState}
          onMoveStateChange={setMoveState}
          renameState={renameState}
          onRenameStateChange={setRenameState}
          accessFolder={accessFolder}
          showAccess={showAccess}
          onShowAccessChange={setShowAccess}
          onClearAccessFolder={() => setAccessFolder(null)}
          colorFolder={colorFolder}
          showColorDialog={showColorDialog}
          onShowColorDialogChange={setShowColorDialog}
          onClearColorFolder={() => setColorFolder(null)}
          shareFile={shareFile}
          showShareDialog={showShareDialog}
          onShowShareDialogChange={setShowShareDialog}
          onClearShareFile={() => setShareFile(null)}
          propertiesFile={propertiesFile}
          onClearPropertiesFile={() => setPropertiesFile(null)}
          folderName={
            manager.breadcrumb.length > 0
              ? manager.breadcrumb[manager.breadcrumb.length - 1].name
              : 'Início'
          }
          protectState={protectState}
          onClearProtectState={() => setProtectState(null)}
          unlockState={unlockState}
          onClearUnlockState={() => setUnlockState(null)}
          securityKeyDialogOpen={securityKeyDialogOpen}
          onSecurityKeyDialogOpenChange={setSecurityKeyDialogOpen}
          onSecurityKeySuccess={handleSecurityKeySuccess}
          deleteState={deleteState}
          onClearDeleteState={() => setDeleteState(null)}
          onDeleteConfirm={handleDeleteConfirm}
        />
      </div>
    );
  }
);

