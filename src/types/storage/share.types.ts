// Storage Share Link Types

export interface StorageShareLink {
  id: string;
  tenantId: string;
  fileId: string;
  token: string;
  expiresAt: string | null;
  maxDownloads: number | null;
  downloadCount: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateShareLinkRequest {
  expiresAt?: string;
  password?: string;
  maxDownloads?: number;
}

export interface SharedFileInfo {
  file: {
    name: string;
    size: number;
    mimeType: string;
    fileType: string;
  };
  link: {
    expiresAt: string | null;
    downloadCount: number;
    maxDownloads: number | null;
  };
}

export interface SharedFileDownloadRequest {
  password?: string;
}

export interface SharedFileDownloadResponse {
  url: string;
}
