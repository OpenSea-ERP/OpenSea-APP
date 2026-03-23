'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MobileTopBar } from '@/components/mobile/mobile-top-bar';
import { useVolumes, useCreateVolume } from '@/hooks/mobile/use-mobile-volumes';
import {
  Plus,
  Package,
  Loader2,
  AlertCircle,
  ChevronRight,
  PackageOpen,
} from 'lucide-react';
import type { Volume, VolumeStatus } from '@/types/stock';

const STATUS_CONFIG: Record<VolumeStatus, { label: string; classes: string }> =
  {
    OPEN: {
      label: 'Aberto',
      classes: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
    },
    CLOSED: {
      label: 'Fechado',
      classes: 'bg-indigo-500/10 text-indigo-400 ring-indigo-500/20',
    },
    DELIVERED: {
      label: 'Entregue',
      classes: 'bg-sky-500/10 text-sky-400 ring-sky-500/20',
    },
    RETURNED: {
      label: 'Devolvido',
      classes: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
    },
  };

function VolumeCard({
  volume,
  onClick,
}: {
  volume: Volume;
  onClick: () => void;
}) {
  const config = STATUS_CONFIG[volume.status];

  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 border-b border-slate-800 px-4 py-3 text-left active:bg-slate-800/50"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-800">
        <Package className="h-5 w-5 text-slate-400" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-slate-200">
            {volume.code}
          </span>
          <span
            className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${config.classes}`}
          >
            {config.label}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-500">
          <span>{volume.itemCount ?? 0} itens</span>
          {volume.destinationRef && (
            <span className="truncate">Pedido: {volume.destinationRef}</span>
          )}
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-600" />
    </button>
  );
}

export default function VolumesListPage() {
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useVolumes();

  const createVolume = useCreateVolume();

  // Infinite scroll observer
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (!node) return;
      const observer = new IntersectionObserver(
        entries => {
          if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        },
        { threshold: 0.1 }
      );
      observer.observe(node);
      return () => observer.disconnect();
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  const handleCreate = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const result = await createVolume.mutateAsync({});
      router.push(`/m/stock/volumes/${result.volume.id}`);
    } finally {
      setCreating(false);
    }
  };

  const allVolumes = data?.pages.flatMap(p => p.volumes) ?? [];

  // Sort: open first, then closed/delivered/returned
  const sortedVolumes = [...allVolumes].sort((a, b) => {
    const order: Record<VolumeStatus, number> = {
      OPEN: 0,
      CLOSED: 1,
      DELIVERED: 2,
      RETURNED: 3,
    };
    return order[a.status] - order[b.status];
  });

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col bg-slate-950">
      <MobileTopBar
        title="Volumes"
        showBack
        rightContent={
          <button
            onClick={handleCreate}
            disabled={creating}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white active:bg-indigo-600 disabled:opacity-50"
          >
            {creating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Plus className="h-3.5 w-3.5" />
            )}
            Novo
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
          </div>
        )}

        {isError && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 px-6 text-center">
            <AlertCircle className="h-8 w-8 text-rose-400" />
            <p className="text-sm text-slate-400">Erro ao carregar volumes</p>
          </div>
        )}

        {!isLoading && !isError && sortedVolumes.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-800">
              <PackageOpen className="h-7 w-7 text-slate-500" />
            </div>
            <p className="text-sm font-medium text-slate-400">
              Nenhum volume encontrado
            </p>
            <p className="text-xs text-slate-600">
              Toque em &quot;+ Novo&quot; para criar um volume
            </p>
          </div>
        )}

        {sortedVolumes.map(volume => (
          <VolumeCard
            key={volume.id}
            volume={volume}
            onClick={() => router.push(`/m/stock/volumes/${volume.id}`)}
          />
        ))}

        {/* Infinite scroll sentinel */}
        {hasNextPage && (
          <div ref={sentinelRef} className="flex justify-center py-4">
            {isFetchingNextPage && (
              <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
