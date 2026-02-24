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

interface FileManagerBreadcrumbProps {
  breadcrumb: FolderBreadcrumb[];
  isLoading?: boolean;
  onNavigate: (folderId: string | null) => void;
  className?: string;
}

export function FileManagerBreadcrumb({
  breadcrumb,
  isLoading,
  onNavigate,
  className,
}: FileManagerBreadcrumbProps) {
  return (
    <Breadcrumb className={cn('', className)}>
      <BreadcrumbList>
        <BreadcrumbItem>
          {breadcrumb.length > 0 ? (
            <BreadcrumbLink
              className="cursor-pointer flex items-center gap-1.5"
              onClick={() => onNavigate(null)}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Início</span>
            </BreadcrumbLink>
          ) : (
            <BreadcrumbPage className="flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5" />
              <span>Início</span>
            </BreadcrumbPage>
          )}
        </BreadcrumbItem>

        {breadcrumb.map((item, index) => {
          const isLast = index === breadcrumb.length - 1;

          return (
            <span key={item.id} className="contents">
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="flex items-center gap-1.5">
                    <Folder className="w-3.5 h-3.5" />
                    <span>{item.name}</span>
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    className="cursor-pointer flex items-center gap-1.5"
                    onClick={() => onNavigate(item.id)}
                  >
                    <Folder className="w-3.5 h-3.5" />
                    <span>{item.name}</span>
                  </BreadcrumbLink>
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
