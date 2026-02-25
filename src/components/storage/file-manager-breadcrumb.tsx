'use client';

import { Folder, Home } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import type { FolderBreadcrumb } from '@/types/storage';
import { cn } from '@/lib/utils';
import { useCallback, useState } from 'react';
import type { DragMoveItem } from './file-manager-grid';

const DRAG_MIME = 'application/x-storage-item';

interface FileManagerBreadcrumbProps {
  breadcrumb: FolderBreadcrumb[];
  isLoading?: boolean;
  onNavigate: (folderId: string | null) => void;
  onDragMoveToFolder?: (
    targetFolderId: string | null,
    items: DragMoveItem[]
  ) => void;
  /** The root folder ID (for dropping on "Inicio"). When absent, null is sent as targetFolderId (move to root). */
  rootFolderId?: string | null;
  className?: string;
}

export function FileManagerBreadcrumb({
  breadcrumb,
  isLoading,
  onNavigate,
  onDragMoveToFolder,
  rootFolderId,
  className,
}: FileManagerBreadcrumbProps) {
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const handleDragEnter = useCallback(
    (folderId: string | null, e: React.DragEvent) => {
      if (!e.dataTransfer.types.includes(DRAG_MIME)) return;
      e.preventDefault();
      e.stopPropagation();
      setDragOverId(folderId ?? '__root__');
    },
    []
  );

  const handleDragOver = useCallback(
    (folderId: string | null, e: React.DragEvent) => {
      if (!e.dataTransfer.types.includes(DRAG_MIME)) return;
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';
      setDragOverId(folderId ?? '__root__');
    },
    []
  );

  const handleDragLeave = useCallback(
    (folderId: string | null, e: React.DragEvent) => {
      const relatedTarget = e.relatedTarget as HTMLElement | null;
      const currentTarget = e.currentTarget as HTMLElement;
      if (relatedTarget && currentTarget.contains(relatedTarget)) return;

      const key = folderId ?? '__root__';
      if (dragOverId === key) {
        setDragOverId(null);
      }
    },
    [dragOverId]
  );

  const handleDrop = useCallback(
    (folderId: string | null, e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOverId(null);

      if (!e.dataTransfer.types.includes(DRAG_MIME)) return;

      // folderId is null when dropping on "Inicio" breadcrumb
      // rootFolderId overrides null when set (entity-scoped file managers)
      // When both are null/undefined, send null to API (move to root)
      const targetId = folderId ?? rootFolderId ?? null;
      if (!onDragMoveToFolder) return;

      try {
        const items: DragMoveItem[] = JSON.parse(
          e.dataTransfer.getData(DRAG_MIME)
        );
        if (items.length > 0) {
          onDragMoveToFolder(targetId, items);
        }
      } catch {
        // Invalid data
      }
    },
    [rootFolderId, onDragMoveToFolder]
  );

  const isRootDragOver = dragOverId === '__root__';

  return (
    <Breadcrumb className={cn('', className)}>
      <BreadcrumbList>
        <BreadcrumbItem>
          {breadcrumb.length > 0 ? (
            <div
              onDragEnter={e => handleDragEnter(null, e)}
              onDragOver={e => handleDragOver(null, e)}
              onDragLeave={e => handleDragLeave(null, e)}
              onDrop={e => handleDrop(null, e)}
            >
              <BreadcrumbLink
                className={cn(
                  'cursor-pointer flex items-center gap-1.5 rounded px-1.5 py-0.5 transition-all',
                  isRootDragOver &&
                    'ring-2 ring-blue-400 bg-blue-50 dark:bg-blue-950/40'
                )}
                draggable={false}
                onClick={() => onNavigate(null)}
              >
                <Home className="w-3.5 h-3.5" />
                <span>Inicio</span>
              </BreadcrumbLink>
            </div>
          ) : (
            <BreadcrumbPage className="flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5" />
              <span>Inicio</span>
            </BreadcrumbPage>
          )}
        </BreadcrumbItem>

        {breadcrumb.map((item, index) => {
          const isLast = index === breadcrumb.length - 1;
          const isDragTarget = dragOverId === item.id;

          return (
            <span key={item.id} className="contents">
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <div
                    onDragEnter={e => handleDragEnter(item.id, e)}
                    onDragOver={e => handleDragOver(item.id, e)}
                    onDragLeave={e => handleDragLeave(item.id, e)}
                    onDrop={e => handleDrop(item.id, e)}
                  >
                    <BreadcrumbPage
                      className={cn(
                        'flex items-center gap-1.5 rounded px-1.5 py-0.5 transition-all',
                        isDragTarget &&
                          'ring-2 ring-blue-400 bg-blue-50 dark:bg-blue-950/40'
                      )}
                    >
                      <Folder className="w-3.5 h-3.5" />
                      <span>{item.name}</span>
                    </BreadcrumbPage>
                  </div>
                ) : (
                  <div
                    onDragEnter={e => handleDragEnter(item.id, e)}
                    onDragOver={e => handleDragOver(item.id, e)}
                    onDragLeave={e => handleDragLeave(item.id, e)}
                    onDrop={e => handleDrop(item.id, e)}
                  >
                    <BreadcrumbLink
                      className={cn(
                        'cursor-pointer flex items-center gap-1.5 rounded px-1.5 py-0.5 transition-all',
                        isDragTarget &&
                          'ring-2 ring-blue-400 bg-blue-50 dark:bg-blue-950/40'
                      )}
                      draggable={false}
                      onClick={() => onNavigate(item.id)}
                    >
                      <Folder className="w-3.5 h-3.5" />
                      <span>{item.name}</span>
                    </BreadcrumbLink>
                  </div>
                )}
              </BreadcrumbItem>
            </span>
          );
        })}

        {isLoading && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <span className="text-sm text-gray-400 animate-pulse">...</span>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
