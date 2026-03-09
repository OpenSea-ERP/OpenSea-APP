'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { SortBy, SortOrder, ViewMode } from '@/hooks/storage';
import { cn } from '@/lib/utils';
import {
  ArrowUpDown,
  Eye,
  EyeOff,
  FolderPlus,
  Grid3X3,
  KeyRound,
  List,
  Search,
  SlidersHorizontal,
  Upload,
} from 'lucide-react';
import { useCallback } from 'react';

export interface FolderTypeFilter {
  filter: boolean;
  system: boolean;
  personal: boolean;
}

interface FileManagerToolbarProps {
  viewMode: ViewMode;
  sortBy: SortBy;
  sortOrder: SortOrder;
  searchQuery: string;
  onViewModeChange: (mode: ViewMode) => void;
  onSortByChange: (sortBy: SortBy) => void;
  onSortOrderChange: (order: SortOrder) => void;
  onSearchChange: (query: string) => void;
  showHidden?: boolean;
  onToggleHidden?: () => void;
  onSecurityKey?: () => void;
  onUpload?: () => void;
  onNewFolder?: () => void;
  folderTypeFilter?: FolderTypeFilter;
  onFolderTypeFilterChange?: (filter: FolderTypeFilter) => void;
  className?: string;
}

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'name', label: 'Nome' },
  { value: 'createdAt', label: 'Data de criação' },
  { value: 'updatedAt', label: 'Última modificação' },
  { value: 'size', label: 'Tamanho' },
];

const FOLDER_TYPE_OPTIONS: { key: keyof FolderTypeFilter; label: string }[] = [
  { key: 'filter', label: 'Filtragem' },
  { key: 'system', label: 'Sistema' },
  { key: 'personal', label: 'Pessoal' },
];

export function FileManagerToolbar({
  viewMode,
  sortBy,
  sortOrder,
  searchQuery,
  onViewModeChange,
  onSortByChange,
  onSortOrderChange,
  onSearchChange,
  showHidden,
  onToggleHidden,
  onSecurityKey,
  onUpload,
  onNewFolder,
  folderTypeFilter,
  onFolderTypeFilterChange,
  className,
}: FileManagerToolbarProps) {
  // Search is debounced in use-file-manager hook (useDebounce 300ms)
  // No local debounce needed here

  const handleSortToggle = useCallback(
    (selected: SortBy) => {
      if (selected === sortBy) {
        onSortOrderChange(sortOrder === 'asc' ? 'desc' : 'asc');
      } else {
        onSortByChange(selected);
        onSortOrderChange('asc');
      }
    },
    [sortBy, sortOrder, onSortByChange, onSortOrderChange]
  );

  const activeFilterCount = folderTypeFilter
    ? FOLDER_TYPE_OPTIONS.filter(o => !folderTypeFilter[o.key]).length
    : 0;

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {/* Actions */}
      {onUpload && (
        <Button size="sm" onClick={onUpload}>
          <Upload className="w-4 h-4" />
          Carregar
        </Button>
      )}

      {onNewFolder && (
        <Button size="sm" variant="outline" onClick={onNewFolder}>
          <FolderPlus className="w-4 h-4" />
          Nova pasta
        </Button>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Search */}
      <div className="relative w-full sm:w-56">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Pesquisar..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className="h-9 pl-9 text-sm"
        />
      </div>

      {/* Security key button */}
      {onSecurityKey && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon-sm" variant="ghost" onClick={onSecurityKey}>
              <KeyRound className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Chave de segurança</TooltipContent>
        </Tooltip>
      )}

      {/* Hidden items toggle */}
      {showHidden && onToggleHidden && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={onToggleHidden}
              className="text-amber-600 dark:text-amber-400"
            >
              <EyeOff className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Ocultar itens revelados</TooltipContent>
        </Tooltip>
      )}

      {/* Folder type filter */}
      {folderTypeFilter && onFolderTypeFilterChange && (
        <Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button size="icon-sm" variant="ghost" className="relative">
                  <SlidersHorizontal className="w-4 h-4" />
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] font-medium flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent>Filtrar tipos de pasta</TooltipContent>
          </Tooltip>
          <PopoverContent align="end" className="w-52 p-3">
            <p className="text-xs font-medium text-muted-foreground mb-3">
              Tipos de pasta
            </p>
            <div className="space-y-2.5">
              {FOLDER_TYPE_OPTIONS.map(option => (
                <label
                  key={option.key}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Checkbox
                    checked={folderTypeFilter[option.key]}
                    onCheckedChange={checked =>
                      onFolderTypeFilterChange({
                        ...folderTypeFilter,
                        [option.key]: !!checked,
                      })
                    }
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Sort */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon-sm" variant="ghost">
            <ArrowUpDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {SORT_OPTIONS.map(option => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleSortToggle(option.value)}
            >
              <span className="flex-1">{option.label}</span>
              {sortBy === option.value && (
                <span className="text-xs text-gray-500 ml-2">
                  {option.value === 'name'
                    ? sortOrder === 'asc'
                      ? 'A-Z'
                      : 'Z-A'
                    : sortOrder === 'asc'
                      ? '↑'
                      : '↓'}
                </span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* View toggle */}
      <div className="flex items-center border rounded-xl overflow-hidden border-gray-200 dark:border-slate-700">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className={cn(
                'p-2 transition-colors',
                viewMode === 'grid'
                  ? 'bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-gray-100'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              )}
              onClick={() => onViewModeChange('grid')}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Grade</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              className={cn(
                'p-2 transition-colors',
                viewMode === 'list'
                  ? 'bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-gray-100'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              )}
              onClick={() => onViewModeChange('list')}
            >
              <List className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>Lista</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
