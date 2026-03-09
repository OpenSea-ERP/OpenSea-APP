// Storage Folder Types

export interface StorageFolder {
  id: string;
  tenantId: string;
  parentId: string | null;
  name: string;
  slug: string;
  path: string;
  icon: string | null;
  color: string | null;
  isSystem: boolean;
  isFilter: boolean;
  filterFileType: string | null;
  module: string | null;
  entityType: string | null;
  entityId: string | null;
  depth: number;
  isProtected: boolean;
  isHidden: boolean;
  createdBy: string | null;
  fileCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateFolderRequest {
  name: string;
  parentId?: string;
  icon?: string;
  color?: string;
  module?: string;
  entityType?: string;
  entityId?: string;
}

export interface UpdateFolderRequest {
  color?: string | null;
  icon?: string | null;
}

export interface RenameFolderRequest {
  name: string;
}

export interface MoveFolderRequest {
  parentId: string | null;
}

export interface FolderBreadcrumb {
  id: string;
  name: string;
  path: string;
}

export interface FolderContents {
  folders: StorageFolder[];
  files: import('./file.types').StorageFile[];
  totalFolders?: number;
  totalFiles?: number;
  total: number;
}

export interface FolderContentsQuery {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  sortOrder?: 'asc' | 'desc';
  /** Admin-only: show all users' files and folders */
  viewAll?: boolean;
  /** Show hidden items (requires verified security key) */
  showHidden?: boolean;
}

export interface FolderResponse {
  folder: StorageFolder;
}

export interface FoldersResponse {
  folders: StorageFolder[];
}

export interface BreadcrumbResponse {
  breadcrumb: FolderBreadcrumb[];
}

export interface InitializeFoldersResponse {
  folders: StorageFolder[];
  message: string;
}

export interface EnsureEntityFolderRequest {
  entityType: string;
  entityId: string;
  entityName: string;
}

export interface EnsureEntityFolderResponse {
  folders: StorageFolder[];
  message?: string;
}
