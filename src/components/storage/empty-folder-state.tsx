'use client';

import { FolderOpen, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyFolderStateProps {
  onUpload?: () => void;
  className?: string;
}

export function EmptyFolderState({
  onUpload,
  className,
}: EmptyFolderStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-20 px-4',
        className
      )}
    >
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-slate-800 mb-6">
        <FolderOpen className="w-10 h-10 text-gray-400 dark:text-slate-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
        Esta pasta está vazia
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center max-w-sm">
        Arraste arquivos aqui ou clique em Carregar para adicionar conteúdo
      </p>
      {onUpload && (
        <Button onClick={onUpload} size="sm">
          <Upload className="w-4 h-4" />
          Carregar arquivo
        </Button>
      )}
    </div>
  );
}
