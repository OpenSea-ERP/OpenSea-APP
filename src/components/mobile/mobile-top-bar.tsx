'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface MobileTopBarProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightContent?: React.ReactNode;
}

export function MobileTopBar({
  title,
  subtitle,
  showBack = false,
  rightContent,
}: MobileTopBarProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 flex h-12 items-center gap-3 border-b border-slate-700/50 bg-slate-900/95 px-4 backdrop-blur-sm">
      {showBack && (
        <button
          onClick={() => router.back()}
          className="text-slate-400 active:text-slate-200"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <h1 className="truncate text-sm font-semibold text-slate-100">
          {title}
        </h1>
        {subtitle && (
          <p className="truncate text-[11px] text-slate-500">{subtitle}</p>
        )}
      </div>
      {rightContent}
    </header>
  );
}
