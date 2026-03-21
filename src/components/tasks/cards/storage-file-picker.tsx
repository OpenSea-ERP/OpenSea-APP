'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, Loader2, HardDrive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useListFiles, useSearchStorage } from '@/hooks/storage/use-files';
import { FileTypeIcon } from '@/components/storage/file-type-icon';
import { formatFileSize } from '@/components/storage/utils';
import { useDebounce } from '@/hooks/use-debounce';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { StorageFile } from '@/types/storage';

interface StorageFilePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (file: {
    id: string;
    name: string;
    size: number;
    mimeType: string;
  }) => void;
}

export function StorageFilePicker({
  open,
  onOpenChange,
  onSelect,
}: StorageFilePickerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  const isSearching = debouncedSearch.length >= 2;

  // List all files when not searching
  const { data: listData, isLoading: isListLoading } = useListFiles(
    isSearching ? undefined : { limit: 50, status: 'ACTIVE' }
  );

  // Search when user types
  const { data: searchData, isLoading: isSearchLoading } =
    useSearchStorage(debouncedSearch);

  const files = useMemo<StorageFile[]>(() => {
    if (isSearching) {
      return searchData?.files ?? [];
    }
    return listData?.files ?? [];
  }, [isSearching, searchData, listData]);

  const isLoading = isSearching ? isSearchLoading : isListLoading;

  function handleSelect(file: StorageFile) {
    onSelect({
      id: file.id,
      name: file.originalName || file.name,
      size: file.size,
      mimeType: file.mimeType,
    });
    onOpenChange(false);
    setSearchTerm('');
  }

  function handleOpenChange(value: boolean) {
    if (!value) {
      setSearchTerm('');
    }
    onOpenChange(value);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5 text-primary" />
            Selecionar Arquivo do Storage
          </DialogTitle>
          <DialogDescription>
            Escolha um arquivo existente para anexar ao cartão.
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Buscar arquivos..."
            className="pl-9"
            autoFocus
          />
        </div>

        {/* File list */}
        <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                Carregando arquivos...
              </span>
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <HardDrive className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">
                {isSearching
                  ? 'Nenhum arquivo encontrado'
                  : 'Nenhum arquivo disponível'}
              </p>
              {isSearching && (
                <p className="text-xs mt-1">
                  Tente outro termo de busca
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-0.5 py-1">
              {files.map(file => (
                <button
                  key={file.id}
                  type="button"
                  className={cn(
                    'w-full flex items-center gap-3 rounded-lg px-3 py-2.5',
                    'text-left transition-colors',
                    'hover:bg-muted/60 focus-visible:bg-muted/60',
                    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30'
                  )}
                  onClick={() => handleSelect(file)}
                >
                  <FileTypeIcon
                    fileType={file.fileType}
                    size={24}
                    className="shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {file.originalName || file.name}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span>{formatFileSize(file.size)}</span>
                      <span className="text-border">|</span>
                      <span>
                        {format(new Date(file.createdAt), "dd 'de' MMM, yyyy", {
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
