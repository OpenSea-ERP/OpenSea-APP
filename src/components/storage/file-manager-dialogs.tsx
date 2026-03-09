'use client';

import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import type { StorageFile, StorageFolder } from '@/types/storage';
import { FilePreviewModal } from './file-preview-modal';
import { FileVersionPanel } from './file-version-panel';
import { FolderAccessDialog } from './folder-access-dialog';
import { FolderColorDialog } from './folder-color-dialog';
import { MoveItemDialog } from './move-item-dialog';
import { NewFolderDialog } from './new-folder-dialog';
import { RenameDialog } from './rename-dialog';
import { FilePropertiesDialog } from './file-properties-dialog';
import { ProtectionDialog } from './protection-dialog';
import { UnlockDialog } from './unlock-dialog';
import { SecurityKeyDialog } from './security-key-dialog';
import { ShareLinkDialog } from './share-link-dialog';
import { UploadDialog } from './upload-dialog';

// Dialog state types (exported for use by file-manager.tsx)
export interface MoveState {
  itemId: string;
  itemType: 'folder' | 'file' | 'bulk';
  itemName: string;
  bulkFileIds?: string[];
  bulkFolderIds?: string[];
}

export interface RenameState {
  itemId: string;
  itemType: 'folder' | 'file';
  currentName: string;
}

export interface DeleteState {
  type: 'folder' | 'file' | 'bulk';
  id: string;
  name: string;
  bulkFileIds?: string[];
  bulkFolderIds?: string[];
}

export interface FileManagerDialogsProps {
  // Upload
  showUpload: boolean;
  onShowUploadChange: (open: boolean) => void;
  currentFolderId?: string | null;
  entityType?: string;
  entityId?: string;
  droppedFiles: File[];
  onClearDroppedFiles: () => void;
  // New Folder
  showNewFolder: boolean;
  onShowNewFolderChange: (open: boolean) => void;
  // Preview
  previewFile: StorageFile | null;
  previewFiles: StorageFile[];
  showPreview: boolean;
  onShowPreviewChange: (open: boolean) => void;
  onPreviewNavigate: (file: StorageFile) => void;
  onClearPreviewPassword: () => void;
  canDownload: boolean;
  previewPassword?: string;
  // Versions
  versionFile: StorageFile | null;
  showVersions: boolean;
  onShowVersionsChange: (open: boolean) => void;
  // Move
  moveState: MoveState | null;
  onMoveStateChange: (state: MoveState | null) => void;
  // Rename
  renameState: RenameState | null;
  onRenameStateChange: (state: RenameState | null) => void;
  // Access
  accessFolder: StorageFolder | null;
  showAccess: boolean;
  onShowAccessChange: (open: boolean) => void;
  onClearAccessFolder: () => void;
  // Color
  colorFolder: StorageFolder | null;
  showColorDialog: boolean;
  onShowColorDialogChange: (open: boolean) => void;
  onClearColorFolder: () => void;
  // Share
  shareFile: StorageFile | null;
  showShareDialog: boolean;
  onShowShareDialogChange: (open: boolean) => void;
  onClearShareFile: () => void;
  // Properties
  propertiesFile: StorageFile | null;
  onClearPropertiesFile: () => void;
  folderName: string;
  // Protection
  protectState: { itemId: string; itemType: 'file' | 'folder'; itemName: string; isProtected: boolean } | null;
  onClearProtectState: () => void;
  // Unlock
  unlockState: { itemId: string; itemType: 'file' | 'folder'; itemName: string; onUnlocked: (password: string) => void } | null;
  onClearUnlockState: () => void;
  // Security Key
  securityKeyDialogOpen: boolean;
  onSecurityKeyDialogOpenChange: (open: boolean) => void;
  onSecurityKeySuccess: () => void;
  // Delete
  deleteState: DeleteState | null;
  onClearDeleteState: () => void;
  onDeleteConfirm: () => void;
}

export function FileManagerDialogs({
  showUpload,
  onShowUploadChange,
  currentFolderId,
  entityType,
  entityId,
  droppedFiles,
  onClearDroppedFiles,
  showNewFolder,
  onShowNewFolderChange,
  previewFile,
  previewFiles,
  showPreview,
  onShowPreviewChange,
  onPreviewNavigate,
  onClearPreviewPassword,
  canDownload,
  previewPassword,
  versionFile,
  showVersions,
  onShowVersionsChange,
  moveState,
  onMoveStateChange,
  renameState,
  onRenameStateChange,
  accessFolder,
  showAccess,
  onShowAccessChange,
  onClearAccessFolder,
  colorFolder,
  showColorDialog,
  onShowColorDialogChange,
  onClearColorFolder,
  shareFile,
  showShareDialog,
  onShowShareDialogChange,
  onClearShareFile,
  propertiesFile,
  onClearPropertiesFile,
  folderName,
  protectState,
  onClearProtectState,
  unlockState,
  onClearUnlockState,
  securityKeyDialogOpen,
  onSecurityKeyDialogOpenChange,
  onSecurityKeySuccess,
  deleteState,
  onClearDeleteState,
  onDeleteConfirm,
}: FileManagerDialogsProps) {
  return (
    <>
      <UploadDialog
        open={showUpload}
        onOpenChange={open => {
          onShowUploadChange(open);
          if (!open) onClearDroppedFiles();
        }}
        folderId={currentFolderId ?? null}
        entityType={entityType}
        entityId={entityId}
        initialFiles={droppedFiles}
      />

      <NewFolderDialog
        open={showNewFolder}
        onOpenChange={onShowNewFolderChange}
        parentId={currentFolderId ?? null}
        module={undefined}
        entityType={entityType}
        entityId={entityId}
      />

      <FilePreviewModal
        file={previewFile}
        files={previewFiles}
        open={showPreview}
        onOpenChange={(open) => {
          onShowPreviewChange(open);
          if (!open) onClearPreviewPassword();
        }}
        onNavigate={onPreviewNavigate}
        canDownload={canDownload}
        password={previewPassword}
      />

      <FileVersionPanel
        file={versionFile}
        open={showVersions}
        onOpenChange={onShowVersionsChange}
      />

      {moveState && (
        <MoveItemDialog
          open={!!moveState}
          onOpenChange={open => {
            if (!open) onMoveStateChange(null);
          }}
          itemId={moveState.itemId}
          itemType={moveState.itemType}
          itemName={moveState.itemName}
          currentFolderId={currentFolderId ?? null}
          bulkFileIds={moveState.bulkFileIds}
          bulkFolderIds={moveState.bulkFolderIds}
        />
      )}

      {renameState && (
        <RenameDialog
          open={!!renameState}
          onOpenChange={open => {
            if (!open) onRenameStateChange(null);
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
          onShowAccessChange(open);
          if (!open) onClearAccessFolder();
        }}
      />

      <FolderColorDialog
        folder={colorFolder}
        open={showColorDialog}
        onOpenChange={open => {
          onShowColorDialogChange(open);
          if (!open) onClearColorFolder();
        }}
      />

      <ShareLinkDialog
        file={shareFile}
        open={showShareDialog}
        onOpenChange={open => {
          onShowShareDialogChange(open);
          if (!open) onClearShareFile();
        }}
      />

      <FilePropertiesDialog
        file={propertiesFile}
        open={!!propertiesFile}
        onOpenChange={open => {
          if (!open) onClearPropertiesFile();
        }}
        folderName={folderName}
      />

      {/* Protection dialog */}
      {protectState && (
        <ProtectionDialog
          open={!!protectState}
          onOpenChange={(open) => {
            if (!open) onClearProtectState();
          }}
          itemId={protectState.itemId}
          itemType={protectState.itemType}
          itemName={protectState.itemName}
          isProtected={protectState.isProtected}
        />
      )}

      {/* Unlock dialog for protected items */}
      {unlockState && (
        <UnlockDialog
          open={!!unlockState}
          onOpenChange={(open) => {
            if (!open) onClearUnlockState();
          }}
          itemId={unlockState.itemId}
          itemType={unlockState.itemType}
          itemName={unlockState.itemName}
          onUnlocked={unlockState.onUnlocked}
        />
      )}

      {/* Security key dialog */}
      <SecurityKeyDialog
        open={securityKeyDialogOpen}
        onOpenChange={onSecurityKeyDialogOpenChange}
        onSuccess={onSecurityKeySuccess}
      />

      {/* PIN verification for destructive actions */}
      <VerifyActionPinModal
        isOpen={!!deleteState}
        onClose={onClearDeleteState}
        onSuccess={onDeleteConfirm}
        title={
          deleteState?.type === 'bulk'
            ? 'Excluir Itens'
            : deleteState?.type === 'folder'
              ? 'Excluir Pasta'
              : 'Excluir Arquivo'
        }
        description={
          deleteState
            ? `Digite seu PIN de Ação para confirmar a exclusão de "${deleteState.name}".`
            : ''
        }
      />
    </>
  );
}
