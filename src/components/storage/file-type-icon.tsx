'use client';

import {
  Archive,
  Code,
  File,
  FileSpreadsheet,
  FileText,
  Image,
  Music,
  Presentation,
  Video,
} from 'lucide-react';
import type { FileTypeCategory } from '@/types/storage';
import { cn } from '@/lib/utils';

interface FileTypeIconProps {
  fileType: FileTypeCategory;
  className?: string;
  size?: number;
}

const FILE_TYPE_CONFIG: Record<
  FileTypeCategory,
  { icon: React.ElementType; color: string; label: string }
> = {
  document: { icon: FileText, color: 'text-blue-500', label: 'Documento' },
  image: { icon: Image, color: 'text-emerald-500', label: 'Imagem' },
  spreadsheet: {
    icon: FileSpreadsheet,
    color: 'text-green-600',
    label: 'Planilha',
  },
  presentation: {
    icon: Presentation,
    color: 'text-orange-500',
    label: 'Apresentação',
  },
  pdf: { icon: FileText, color: 'text-red-500', label: 'PDF' },
  archive: {
    icon: Archive,
    color: 'text-amber-600',
    label: 'Arquivo compactado',
  },
  video: { icon: Video, color: 'text-purple-500', label: 'Vídeo' },
  audio: { icon: Music, color: 'text-pink-500', label: 'Áudio' },
  code: { icon: Code, color: 'text-cyan-500', label: 'Código' },
  other: { icon: File, color: 'text-gray-500', label: 'Arquivo' },
};

export function FileTypeIcon({
  fileType,
  className,
  size = 20,
}: FileTypeIconProps) {
  const config = FILE_TYPE_CONFIG[fileType] ?? FILE_TYPE_CONFIG.other;
  const Icon = config.icon;

  return (
    <Icon
      className={cn(config.color, className)}
      size={size}
      aria-label={config.label}
    />
  );
}

export function getFileTypeLabel(fileType: FileTypeCategory): string {
  return FILE_TYPE_CONFIG[fileType]?.label ?? 'Arquivo';
}

export function getFileTypeColor(fileType: FileTypeCategory): string {
  return FILE_TYPE_CONFIG[fileType]?.color ?? 'text-gray-500';
}
