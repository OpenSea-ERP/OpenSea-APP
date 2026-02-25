// Storage File Types

export type StorageFileStatus = 'ACTIVE' | 'ARCHIVED' | 'DELETED';

export type FileTypeCategory =
  | 'document'
  | 'image'
  | 'spreadsheet'
  | 'presentation'
  | 'pdf'
  | 'archive'
  | 'video'
  | 'audio'
  | 'code'
  | 'other';

export const FILE_STATUS_LABELS: Record<StorageFileStatus, string> = {
  ACTIVE: 'Ativo',
  ARCHIVED: 'Arquivado',
  DELETED: 'Excluído',
};

export interface StorageFile {
  id: string;
  tenantId: string;
  folderId: string | null;
  name: string;
  originalName: string;
  fileKey: string;
  path: string;
  size: number;
  mimeType: string;
  fileType: FileTypeCategory;
  thumbnailKey: string | null;
  status: StorageFileStatus;
  currentVersion: number;
  entityType: string | null;
  entityId: string | null;
  expiresAt: string | null;
  uploadedBy: string;
  versions?: StorageFileVersion[];
  createdAt: string;
  updatedAt?: string;
}

export interface StorageFileVersion {
  id: string;
  fileId: string;
  version: number;
  fileKey: string;
  size: number;
  mimeType: string;
  changeNote: string | null;
  uploadedBy: string;
  createdAt: string;
}

export interface RenameFileRequest {
  name: string;
}

export interface MoveFileRequest {
  folderId: string | null;
}

export interface ListFilesQuery {
  folderId?: string;
  fileType?: string;
  entityType?: string;
  entityId?: string;
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface ListFilesResponse {
  files: StorageFile[];
  meta: { total: number; page: number; limit: number; pages: number };
}

export interface FileResponse {
  file: StorageFile;
}

export interface FileDetailResponse {
  file: StorageFile;
  versions: StorageFileVersion[];
}

export interface FileVersionResponse {
  file: StorageFile;
  version: StorageFileVersion;
}

export interface VersionsResponse {
  versions: StorageFileVersion[];
}

export interface DownloadResponse {
  url: string;
}

export interface PreviewFileResponse {
  url: string;
  thumbnailUrl: string | null;
  name: string;
  mimeType: string;
  size: number;
  fileType: string;
  previewable: boolean;
}

export interface SearchStorageQuery {
  query: string;
  fileType?: string;
  page?: number;
  limit?: number;
}

export interface SearchStorageResponse {
  files: StorageFile[];
  folders: import('./folder.types').StorageFolder[];
  totalFiles: number;
  totalFolders: number;
}

export interface DeletedItemsResponse {
  files: StorageFile[];
  folders: import('./folder.types').StorageFolder[];
  totalFiles: number;
  totalFolders: number;
}

export interface EmptyTrashResponse {
  deletedFiles: number;
  deletedFolders: number;
}

export interface StorageStats {
  totalFiles: number;
  totalSize: number;
  filesByType: Record<string, number>;
  maxStorageMb: number;
  usedStoragePercent: number;
}
