import { storageFoldersService } from '@/services/storage';
import type {
  CreateFolderRequest,
  EnsureEntityFolderRequest,
  FolderContentsQuery,
  MoveFolderRequest,
  RenameFolderRequest,
  UpdateFolderRequest,
} from '@/types/storage';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const QUERY_KEYS = {
  FOLDERS: ['storage-folders'],
  FOLDER: (id: string) => ['storage-folders', id],
  FOLDER_CONTENTS: (id: string | null, query?: FolderContentsQuery) =>
    ['storage-folder-contents', id, query] as const,
  ROOT_CONTENTS: (query?: FolderContentsQuery) =>
    ['storage-root-contents', query] as const,
  BREADCRUMB: (id: string | null) => ['storage-breadcrumb', id],
  SEARCH: (query: string) => ['storage-folder-search', query],
} as const;

export { QUERY_KEYS as storageFolderKeys };

// GET /v1/storage/folders/:id/contents ou /root/contents - Lista conteúdo
export function useFolderContents(
  folderId: string | null,
  query?: FolderContentsQuery
) {
  return useQuery({
    queryKey: folderId
      ? QUERY_KEYS.FOLDER_CONTENTS(folderId, query)
      : QUERY_KEYS.ROOT_CONTENTS(query),
    queryFn: () =>
      folderId
        ? storageFoldersService.getFolderContents(folderId, query)
        : storageFoldersService.getRootContents(query),
  });
}

// GET /v1/storage/folders/:id - Busca detalhes de uma pasta
export function useFolder(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.FOLDER(id),
    queryFn: () => storageFoldersService.getFolder(id),
    enabled: !!id,
  });
}

// GET /v1/storage/folders/:id/breadcrumb - Busca breadcrumb
export function useBreadcrumb(folderId: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.BREADCRUMB(folderId),
    queryFn: () => storageFoldersService.getBreadcrumb(folderId!),
    enabled: !!folderId,
  });
}

// POST /v1/storage/folders - Cria uma nova pasta
export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateFolderRequest) =>
      storageFoldersService.createFolder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage-folder-contents'] });
      queryClient.invalidateQueries({ queryKey: ['storage-root-contents'] });
    },
  });
}

// PATCH /v1/storage/folders/:id - Atualiza cor/ícone de uma pasta
export function useUpdateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFolderRequest }) =>
      storageFoldersService.updateFolder(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['storage-folder-contents'] });
      queryClient.invalidateQueries({ queryKey: ['storage-root-contents'] });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.FOLDER(variables.id),
      });
    },
  });
}

// PATCH /v1/storage/folders/:id/rename - Renomeia uma pasta
export function useRenameFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RenameFolderRequest }) =>
      storageFoldersService.renameFolder(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['storage-folder-contents'] });
      queryClient.invalidateQueries({ queryKey: ['storage-root-contents'] });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.FOLDER(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: ['storage-breadcrumb'] });
    },
  });
}

// PATCH /v1/storage/folders/:id/move - Move uma pasta
export function useMoveFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MoveFolderRequest }) =>
      storageFoldersService.moveFolder(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['storage-folder-contents'] });
      queryClient.invalidateQueries({ queryKey: ['storage-root-contents'] });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.FOLDER(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: ['storage-breadcrumb'] });
    },
  });
}

// DELETE /v1/storage/folders/:id - Remove uma pasta
export function useDeleteFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => storageFoldersService.deleteFolder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage-folder-contents'] });
      queryClient.invalidateQueries({ queryKey: ['storage-root-contents'] });
    },
  });
}

// GET /v1/storage/folders/search - Pesquisa pastas
export function useSearchFolders(query: string, enabled = true) {
  return useQuery({
    queryKey: QUERY_KEYS.SEARCH(query),
    queryFn: () => storageFoldersService.searchFolders(query),
    enabled: enabled && query.length > 0,
  });
}

// POST /v1/storage/folders/initialize - Inicializa pastas raiz do tenant
export function useInitializeFolders() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => storageFoldersService.initializeFolders(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage-folder-contents'] });
      queryClient.invalidateQueries({ queryKey: ['storage-root-contents'] });
    },
  });
}

// POST /v1/storage/folders/ensure-entity - Garante pastas de uma entidade
export function useEnsureEntityFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: EnsureEntityFolderRequest) =>
      storageFoldersService.ensureEntityFolder(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage-folder-contents'] });
      queryClient.invalidateQueries({ queryKey: ['storage-root-contents'] });
    },
  });
}
