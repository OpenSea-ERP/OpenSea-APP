import { storageFilesService } from '@/services/storage';
import type {
  RenameFileRequest,
  MoveFileRequest,
  ListFilesQuery,
} from '@/types/storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const QUERY_KEYS = {
  FILES: ['storage-files'],
  FILE: (id: string) => ['storage-files', id],
  FILE_LIST: (query?: ListFilesQuery) => ['storage-files-list', query] as const,
  FILE_PREVIEW: (id: string) => ['storage-file-preview', id],
  VERSIONS: (fileId: string) => ['storage-file-versions', fileId],
  STATS: ['storage-stats'],
  SEARCH: (query: string) => ['storage-search', query] as const,
} as const;

export { QUERY_KEYS as storageFileKeys };

// POST /v1/storage/folders/:folderId/files - Upload de arquivo
export function useUploadFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      folderId,
      file,
      options,
    }: {
      folderId: string | null;
      file: File;
      options?: { entityType?: string; entityId?: string };
    }) => storageFilesService.uploadFile(folderId, file, options),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage-folder-contents'] });
      queryClient.invalidateQueries({ queryKey: ['storage-root-contents'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FILES });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.STATS });
    },
  });
}

// GET /v1/storage/files/:id - Busca detalhes de um arquivo
export function useFileDetails(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.FILE(id),
    queryFn: () => storageFilesService.getFile(id),
    enabled: !!id,
    staleTime: 30_000,
  });
}

// GET /v1/storage/files/:id/preview - Obtém presigned URL para preview
export function usePreviewFile(id: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.FILE_PREVIEW(id ?? ''),
    queryFn: () => storageFilesService.previewFile(id!),
    enabled: !!id,
    staleTime: 45 * 60 * 1000, // 45min (presigned URLs expiram em 1h)
  });
}

// GET /v1/storage/files/:id/download - Obtém URL de download
export function useDownloadFile() {
  return useMutation({
    mutationFn: ({ id, version }: { id: string; version?: number }) =>
      storageFilesService.downloadFile(id, version),
  });
}

// PATCH /v1/storage/files/:id/rename - Renomeia um arquivo
export function useRenameFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RenameFileRequest }) =>
      storageFilesService.renameFile(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['storage-folder-contents'] });
      queryClient.invalidateQueries({ queryKey: ['storage-root-contents'] });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.FILE(variables.id),
      });
    },
  });
}

// PATCH /v1/storage/files/:id/move - Move um arquivo
export function useMoveFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MoveFileRequest }) =>
      storageFilesService.moveFile(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['storage-folder-contents'] });
      queryClient.invalidateQueries({ queryKey: ['storage-root-contents'] });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.FILE(variables.id),
      });
    },
  });
}

// DELETE /v1/storage/files/:id - Remove um arquivo
export function useDeleteFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => storageFilesService.deleteFile(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage-folder-contents'] });
      queryClient.invalidateQueries({ queryKey: ['storage-root-contents'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.FILES });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.STATS });
    },
  });
}

// GET /v1/storage/files - Lista arquivos com filtros
export function useListFiles(query?: ListFilesQuery) {
  return useQuery({
    queryKey: QUERY_KEYS.FILE_LIST(query),
    queryFn: () => storageFilesService.listFiles(query),
    staleTime: 30_000,
  });
}

// POST /v1/storage/files/:id/versions - Upload de nova versão
export function useUploadVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      file,
      changeNote,
    }: {
      id: string;
      file: File;
      changeNote?: string;
    }) => storageFilesService.uploadVersion(id, file, changeNote),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.FILE(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.VERSIONS(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.STATS });
    },
  });
}

// GET /v1/storage/files/:id/versions - Lista versões de um arquivo
export function useListVersions(fileId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.VERSIONS(fileId),
    queryFn: () => storageFilesService.listVersions(fileId),
    enabled: !!fileId,
  });
}

// POST /v1/storage/files/:id/versions/:vId/restore - Restaura uma versão
export function useRestoreVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, versionId }: { id: string; versionId: string }) =>
      storageFilesService.restoreVersion(id, versionId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.FILE(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.VERSIONS(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: ['storage-folder-contents'] });
      queryClient.invalidateQueries({ queryKey: ['storage-root-contents'] });
    },
  });
}

// GET /v1/storage/search - Busca global de arquivos e pastas
export function useSearchStorage(query: string) {
  return useQuery({
    queryKey: QUERY_KEYS.SEARCH(query),
    queryFn: () => storageFilesService.searchStorage({ query }),
    enabled: query.length >= 2,
    staleTime: 1000 * 30, // 30 segundos
  });
}

// GET /v1/storage/stats - Estatísticas de armazenamento
export function useStorageStats() {
  return useQuery({
    queryKey: QUERY_KEYS.STATS,
    queryFn: () => storageFilesService.getStats(),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}
