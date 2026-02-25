'use client';

import { useCallback, useMemo, useState } from 'react';
import { useFolderContents, useBreadcrumb } from './use-folders';
import { useSearchStorage } from './use-files';
import type { StorageFile, StorageFolder } from '@/types/storage';

export type ViewMode = 'grid' | 'list';
export type SortBy = 'name' | 'createdAt' | 'updatedAt' | 'size';
export type SortOrder = 'asc' | 'desc';

export interface SelectedItem {
  id: string;
  type: 'folder' | 'file';
}

export interface FileManagerOptions {
  rootFolderId?: string;
  entityType?: string;
  entityId?: string;
}

export function useFileManager(options?: FileManagerOptions) {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(
    options?.rootFolderId ?? null
  );
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [folderHistory, setFolderHistory] = useState<(string | null)[]>([]);

  // Parâmetros de consulta para o conteúdo da pasta (sorting is done client-side)
  const contentsQuery = useMemo(
    () => ({
      search: searchQuery || undefined,
    }),
    [searchQuery]
  );

  // Busca conteúdo da pasta atual
  const {
    data: rawContents,
    isLoading: isLoadingContents,
    error: contentsError,
  } = useFolderContents(currentFolderId, contentsQuery);

  // Global search (when at root with search query 2+ chars)
  const isGlobalSearch = currentFolderId === null && searchQuery.length >= 2;
  const { data: searchResults, isLoading: isLoadingSearch } =
    useSearchStorage(isGlobalSearch ? searchQuery : '');

  // Ordena os dados no client-side
  const contents = useMemo(() => {
    // Use global search results when in search mode
    const source = isGlobalSearch && searchResults
      ? {
          folders: searchResults.folders,
          files: searchResults.files,
          total: searchResults.totalFiles + searchResults.totalFolders,
        }
      : rawContents;

    if (!source) return source;

    const sortedFolders = [...source.folders].sort((a, b) => {
      const dir = sortOrder === 'asc' ? 1 : -1;
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name, 'pt-BR') * dir;
        case 'createdAt':
          return (
            (new Date(a.createdAt).getTime() -
              new Date(b.createdAt).getTime()) *
            dir
          );
        case 'updatedAt':
          return (
            (new Date(a.updatedAt ?? a.createdAt).getTime() -
              new Date(b.updatedAt ?? b.createdAt).getTime()) *
            dir
          );
        case 'size':
          return ((a.fileCount ?? 0) - (b.fileCount ?? 0)) * dir;
        default:
          return 0;
      }
    });

    const sortedFiles = [...source.files].sort((a, b) => {
      const dir = sortOrder === 'asc' ? 1 : -1;
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name, 'pt-BR') * dir;
        case 'createdAt':
          return (
            (new Date(a.createdAt).getTime() -
              new Date(b.createdAt).getTime()) *
            dir
          );
        case 'updatedAt':
          return (
            (new Date(a.updatedAt ?? a.createdAt).getTime() -
              new Date(b.updatedAt ?? b.createdAt).getTime()) *
            dir
          );
        case 'size':
          return (a.size - b.size) * dir;
        default:
          return 0;
      }
    });

    return {
      folders: sortedFolders,
      files: sortedFiles,
      total: source.total,
    };
  }, [rawContents, searchResults, isGlobalSearch, sortBy, sortOrder]);

  // Busca breadcrumb da pasta atual
  const { data: breadcrumbData, isLoading: isLoadingBreadcrumb } =
    useBreadcrumb(currentFolderId);

  // Navegação
  const navigateToFolder = useCallback(
    (folderId: string) => {
      setFolderHistory(prev => [...prev, currentFolderId]);
      setCurrentFolderId(folderId);
      setSelectedItems([]);
      setSearchQuery('');
    },
    [currentFolderId]
  );

  const navigateBack = useCallback(() => {
    setFolderHistory(prev => {
      const newHistory = [...prev];
      const previousFolderId = newHistory.pop() ?? null;
      setCurrentFolderId(previousFolderId);
      setSelectedItems([]);
      setSearchQuery('');
      return newHistory;
    });
  }, []);

  const navigateToRoot = useCallback(() => {
    setCurrentFolderId(options?.rootFolderId ?? null);
    setFolderHistory([]);
    setSelectedItems([]);
    setSearchQuery('');
  }, [options?.rootFolderId]);

  const navigateToBreadcrumb = useCallback(
    (folderId: string | null) => {
      if (folderId === currentFolderId) return;
      // Ao navegar para um item do breadcrumb, limpa o histórico
      setCurrentFolderId(folderId);
      setFolderHistory([]);
      setSelectedItems([]);
      setSearchQuery('');
    },
    [currentFolderId]
  );

  // Seleção
  const selectItem = useCallback((item: SelectedItem) => {
    setSelectedItems([item]);
  }, []);

  const toggleItem = useCallback((item: SelectedItem) => {
    setSelectedItems(prev => {
      const exists = prev.find(i => i.id === item.id && i.type === item.type);
      if (exists) {
        return prev.filter(i => !(i.id === item.id && i.type === item.type));
      }
      return [...prev, item];
    });
  }, []);

  /** Select a range of items between two indices (for shift-click) */
  const selectRange = useCallback(
    (fromItem: SelectedItem, toItem: SelectedItem) => {
      if (!contents) return;

      const allItems: SelectedItem[] = [
        ...contents.folders.map((f: StorageFolder) => ({
          id: f.id,
          type: 'folder' as const,
        })),
        ...contents.files.map((f: StorageFile) => ({
          id: f.id,
          type: 'file' as const,
        })),
      ];

      const fromIdx = allItems.findIndex(
        i => i.id === fromItem.id && i.type === fromItem.type
      );
      const toIdx = allItems.findIndex(
        i => i.id === toItem.id && i.type === toItem.type
      );

      if (fromIdx === -1 || toIdx === -1) return;

      const start = Math.min(fromIdx, toIdx);
      const end = Math.max(fromIdx, toIdx);
      setSelectedItems(allItems.slice(start, end + 1));
    },
    [contents]
  );

  /** Select multiple items by their IDs (for drag selection) */
  const selectMultiple = useCallback((items: SelectedItem[]) => {
    setSelectedItems(items);
  }, []);

  const selectAll = useCallback(() => {
    if (!contents) return;

    const allItems: SelectedItem[] = [
      ...contents.folders.map((f: StorageFolder) => ({
        id: f.id,
        type: 'folder' as const,
      })),
      ...contents.files.map((f: StorageFile) => ({
        id: f.id,
        type: 'file' as const,
      })),
    ];
    setSelectedItems(allItems);
  }, [contents]);

  const clearSelection = useCallback(() => {
    setSelectedItems([]);
  }, []);

  const isSelected = useCallback(
    (id: string, type: 'folder' | 'file') => {
      return selectedItems.some(i => i.id === id && i.type === type);
    },
    [selectedItems]
  );

  return {
    // Estado
    currentFolderId,
    selectedItems,
    viewMode,
    sortBy,
    sortOrder,
    searchQuery,
    canNavigateBack: folderHistory.length > 0,

    // Dados
    contents,
    breadcrumb: breadcrumbData?.breadcrumb ?? [],
    isLoading: isGlobalSearch ? isLoadingSearch : isLoadingContents,
    isLoadingBreadcrumb,
    isGlobalSearch,
    error: contentsError,

    // Navegação
    navigateToFolder,
    navigateBack,
    navigateToRoot,
    navigateToBreadcrumb,

    // Seleção
    selectItem,
    toggleItem,
    selectRange,
    selectMultiple,
    selectAll,
    clearSelection,
    isSelected,

    // Configuração
    setViewMode,
    setSortBy,
    setSortOrder,
    setSearchQuery,
  };
}
