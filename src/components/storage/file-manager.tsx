'use client';

import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { SelectionAction } from '@/core/components/selection-toolbar';
import { SelectionToolbar } from '@/core/components/selection-toolbar';
import {
  useDeleteFile,
  useDeleteFolder,
  useDownloadFile,
  useDownloadFolder,
  useEnsureEntityFolder,
  useFileManager,
  useInitializeFolders,
} from '@/hooks/storage';
import { usePermissions } from '@/hooks/use-permissions';
import { storageFilesService, storageFoldersService } from '@/services/storage';
import { cn } from '@/lib/utils';
import type { StorageFile, StorageFolder } from '@/types/storage';
import {
  ArrowLeft,
  Download,
  FolderInput,
  Palette,
  Shield,
} from 'lucide-react';
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
import { FilePreviewModal } from './file-preview-modal';
import { TrashView } from './trash-view';
import { FileVersionPanel } from './file-version-panel';
import { FolderAccessDialog } from './folder-access-dialog';
import { FolderColorDialog } from './folder-color-dialog';
import type { FolderPermissions } from './folder-context-menu';
import { MoveItemDialog } from './move-item-dialog';
import { NewFolderDialog } from './new-folder-dialog';
import { RenameDialog } from './rename-dialog';
import { ShareLinkDialog } from './share-link-dialog';
import { UploadDialog } from './upload-dialog';

export interface FileManagerRef {
  openUpload: () => void;
  openNewFolder: () => void;
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
}

// Dialog state types
interface MoveState {
  itemId: string;
  itemType: 'folder' | 'file';
  itemName: string;
}

interface RenameState {
  itemId: string;
  itemType: 'folder' | 'file';
  currentName: string;
}

interface DeleteState {
  type: 'folder' | 'file';
  id: string;
  name: string;
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
    },
    ref
  ) {
    const manager = useFileManager({ rootFolderId, entityType, entityId });
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
    const [previewFile, setPreviewFile] = useState<StorageFile | null>(null);
    const [showPreview, setShowPreview] = useState(false);
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
    const [showTrash, setShowTrash] = useState(false);
    const [shareFile, setShareFile] = useState<StorageFile | null>(null);
    const [showShareDialog, setShowShareDialog] = useState(false);

    // Mutations
    const deleteFolderMutation = useDeleteFolder();
    const deleteFileMutation = useDeleteFile();
    const downloadMutation = useDownloadFile();
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

    // File preview
    const handlePreviewFile = useCallback((file: StorageFile) => {
      setPreviewFile(file);
      setShowPreview(true);
    }, []);

    // File download
    const handleDownloadFile = useCallback(
      async (file: StorageFile) => {
        try {
          const result = await downloadMutation.mutateAsync({ id: file.id });
          window.open(result.url, '_blank');
        } catch {
          toast.error('Erro ao baixar o arquivo');
        }
      },
      [downloadMutation]
    );

    // Folder download as ZIP
    const handleDownloadFolder = useCallback(
      async (folder: StorageFolder) => {
        try {
          toast.info('Preparando download da pasta...');
          const result = await downloadFolderMutation.mutateAsync(folder.id);
          window.open(result.url, '_blank');
          toast.success('Download iniciado');
        } catch {
          toast.error('Erro ao baixar a pasta');
        }
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
        if (deleteState.type === 'folder') {
          await deleteFolderMutation.mutateAsync(deleteState.id);
          toast.success('Pasta excluída com sucesso');
        } else {
          await deleteFileMutation.mutateAsync(deleteState.id);
          toast.success('Arquivo excluído com sucesso');
        }
        manager.clearSelection();
      } catch {
        toast.error(
          deleteState.type === 'folder'
            ? 'Erro ao excluir a pasta'
            : 'Erro ao excluir o arquivo'
        );
      } finally {
        setDeleteState(null);
      }
    }, [deleteState, deleteFolderMutation, deleteFileMutation, manager]);

    // File share
    const handleShareFile = useCallback((file: StorageFile) => {
      setShareFile(file);
      setShowShareDialog(true);
    }, []);

    // File versions
    const handleFileVersions = useCallback((file: StorageFile) => {
      setVersionFile(file);
      setShowVersions(true);
    }, []);

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

        // Invalidate queries once after all moves complete
        queryClient.invalidateQueries({
          queryKey: ['storage-folder-contents'],
        });
        queryClient.invalidateQueries({ queryKey: ['storage-root-contents'] });
        queryClient.invalidateQueries({ queryKey: ['storage-breadcrumb'] });

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
    const DRAG_MIME = 'application/x-storage-item';

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
        if (
          e.dataTransfer.files.length > 0 &&
          manager.currentFolderId &&
          canUpload
        ) {
          setShowUpload(true);
        }
      },
      [manager.currentFolderId, canUpload]
    );

    const allFolders = manager.contents?.folders ?? [];
    const files = manager.contents?.files ?? [];

    const folders = allFolders.filter(f => {
      if (f.isFilter) return folderTypeFilter.filter;
      if (f.isSystem) return folderTypeFilter.system;
      return folderTypeFilter.personal;
    });

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
        folderTypeFilter={folderTypeFilter}
        onFolderTypeFilterChange={setFolderTypeFilter}
        showTrash={showTrash}
        onToggleTrash={
          hasPermission('storage.files.list')
            ? () => setShowTrash(prev => !prev)
            : undefined
        }
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
            </div>

            {/* Content area */}
            <div
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

              {/* Loading state */}
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
                    onClick={() => window.location.reload()}
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
                  onNavigateToFolder={manager.navigateToFolder}
                  onPreviewFile={handlePreviewFile}
                  onUpload={() => setShowUpload(true)}
                  onDragMoveToFolder={handleDragMoveToFolder}
                  onRenameFolder={handleRenameFolder}
                  onChangeColorFolder={handleChangeColorFolder}
                  onMoveFolder={handleMoveFolder}
                  onManageFolderAccess={handleManageFolderAccess}
                  onDeleteFolder={handleDeleteFolder}
                  onDownloadFolder={handleDownloadFolder}
                  onDownloadFile={handleDownloadFile}
                  onRenameFile={handleRenameFile}
                  onMoveFile={handleMoveFile}
                  onFileVersions={handleFileVersions}
                  onShareFile={handleShareFile}
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
                  onNavigateToFolder={manager.navigateToFolder}
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
                  onDownloadFile={handleDownloadFile}
                  onRenameFile={handleRenameFile}
                  onMoveFile={handleMoveFile}
                  onFileVersions={handleFileVersions}
                  onShareFile={handleShareFile}
                  onDeleteFile={handleDeleteFile}
                  folderPermissions={folderPermissions}
                  filePermissions={filePermissions}
                />
              )}
            </div>
          </>
        )}

        {/* Selection Toolbar */}
        {manager.selectedItems.length > 0 && (
          <FileManagerSelectionToolbar
            selectedItems={manager.selectedItems}
            allFolders={allFolders}
            totalItems={folders.length + files.length}
            folderPermissions={folderPermissions}
            filePermissions={filePermissions}
            onClear={manager.clearSelection}
            onSelectAll={manager.selectAll}
            onMove={ids => {
              // Move first item (bulk move does sequential calls)
              const item = manager.selectedItems.find(i => ids.includes(i.id));
              if (item) {
                const folder = allFolders.find(f => f.id === item.id);
                const file = files.find(f => f.id === item.id);
                setMoveState({
                  itemId: item.id,
                  itemType: item.type,
                  itemName: folder?.name ?? file?.name ?? '',
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
              // Download all selected files
              for (const item of manager.selectedItems) {
                if (item.type === 'file' && ids.includes(item.id)) {
                  const file = files.find(f => f.id === item.id);
                  if (file) await handleDownloadFile(file);
                }
              }
            }}
          />
        )}

        {/* Dialogs */}
        <UploadDialog
          open={showUpload}
          onOpenChange={setShowUpload}
          folderId={manager.currentFolderId}
          entityType={entityType}
          entityId={entityId}
        />

        <NewFolderDialog
          open={showNewFolder}
          onOpenChange={setShowNewFolder}
          parentId={manager.currentFolderId}
          module={undefined}
          entityType={entityType}
          entityId={entityId}
        />

        <FilePreviewModal
          file={previewFile}
          files={files}
          open={showPreview}
          onOpenChange={setShowPreview}
          onNavigate={file => setPreviewFile(file)}
        />

        <FileVersionPanel
          file={versionFile}
          open={showVersions}
          onOpenChange={setShowVersions}
        />

        {moveState && (
          <MoveItemDialog
            open={!!moveState}
            onOpenChange={open => {
              if (!open) setMoveState(null);
            }}
            itemId={moveState.itemId}
            itemType={moveState.itemType}
            itemName={moveState.itemName}
            currentFolderId={manager.currentFolderId}
          />
        )}

        {renameState && (
          <RenameDialog
            open={!!renameState}
            onOpenChange={open => {
              if (!open) setRenameState(null);
            }}
            itemId={renameState.itemId}
            itemType={renameState.itemType}
            currentName={renameState.currentName}
          />
        )}

        <FolderAccessDialog
          folder={accessFolder}
          open={showAccess}
          onOpenChange={open => {
            setShowAccess(open);
            if (!open) setAccessFolder(null);
          }}
        />

        <FolderColorDialog
          folder={colorFolder}
          open={showColorDialog}
          onOpenChange={open => {
            setShowColorDialog(open);
            if (!open) setColorFolder(null);
          }}
        />

        <ShareLinkDialog
          file={shareFile}
          open={showShareDialog}
          onOpenChange={open => {
            setShowShareDialog(open);
            if (!open) setShareFile(null);
          }}
        />

        {/* PIN verification for destructive actions */}
        <VerifyActionPinModal
          isOpen={!!deleteState}
          onClose={() => setDeleteState(null)}
          onSuccess={handleDeleteConfirm}
          title={
            deleteState?.type === 'folder' ? 'Excluir Pasta' : 'Excluir Arquivo'
          }
          description={
            deleteState
              ? `Digite seu PIN de Ação para confirmar a exclusão de "${deleteState.name}".`
              : ''
          }
        />
      </div>
    );
  }
);

// =============================================================================
// Selection Toolbar Sub-Component
// =============================================================================

interface FileManagerSelectionToolbarProps {
  selectedItems: { id: string; type: 'folder' | 'file' }[];
  allFolders: StorageFolder[];
  totalItems: number;
  folderPermissions: FolderPermissions;
  filePermissions: FilePermissions;
  onClear: () => void;
  onSelectAll: () => void;
  onMove: (ids: string[]) => void;
  onShare: (ids: string[]) => void;
  onChangeColor: (ids: string[]) => void;
  onDownload: (ids: string[]) => void;
}

function FileManagerSelectionToolbar({
  selectedItems,
  allFolders,
  totalItems,
  folderPermissions,
  filePermissions,
  onClear,
  onSelectAll,
  onMove,
  onShare,
  onChangeColor,
  onDownload,
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

    return result;
  }, [
    hasSystemFolders,
    hasFilterFolders,
    hasFolders,
    hasFiles,
    onlyUserFolders,
    folderPermissions,
    filePermissions,
    onMove,
    onShare,
    onChangeColor,
    onDownload,
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
