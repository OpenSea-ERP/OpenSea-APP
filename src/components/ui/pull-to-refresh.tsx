'use client';

/**
 * PullToRefresh — wrapper de touchstart/touchmove/touchend nativo (~80 LOC).
 *
 * Phase 8 / Plan 08-03 / Task 3 — D-12 fallback (sem Background Sync /
 * Socket.IO disponível).
 *
 * Threshold 70px. Só dispara quando `window.scrollY === 0` no touchstart
 * (impede captura quando o usuário rola lista normal). Em desktop o
 * componente passa `children` direto sem overhead — todos os listeners
 * são touch (desktop não dispara).
 *
 * Sem dep externa (RESEARCH.md tradeoff: ~5kb pull-to-refresh lib vs ~80
 * LOC inline).
 */

import { ArrowDown, Loader2 } from 'lucide-react';
import { useRef, useState, type ReactNode, type TouchEvent } from 'react';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<unknown> | void;
  isRefreshing?: boolean;
}

const THRESHOLD = 70;
const MAX_PULL = 105; // 1.5 × THRESHOLD — caps the visual rubber-band.

export function PullToRefresh({
  children,
  onRefresh,
  isRefreshing = false,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const isActive = useRef(false);

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    if (typeof window === 'undefined') return;
    if (window.scrollY > 0) {
      isActive.current = false;
      return;
    }
    isActive.current = true;
    startY.current = e.touches[0]?.clientY ?? 0;
  };

  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (!isActive.current) return;
    if (typeof window !== 'undefined' && window.scrollY > 0) {
      isActive.current = false;
      return;
    }
    const currentY = e.touches[0]?.clientY ?? 0;
    const distance = currentY - startY.current;
    if (distance > 0) {
      setPullDistance(Math.min(distance, MAX_PULL));
    }
  };

  const handleTouchEnd = async () => {
    if (!isActive.current) return;
    isActive.current = false;
    if (pullDistance >= THRESHOLD && !isRefreshing) {
      try {
        await onRefresh();
      } catch {
        /* swallow — caller handles via error state */
      }
    }
    setPullDistance(0);
    startY.current = 0;
  };

  const rotation = Math.min(180, (pullDistance / THRESHOLD) * 180);

  return (
    <div
      data-testid="pull-to-refresh"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        style={{
          height: pullDistance,
          transition: pullDistance === 0 ? 'height 200ms ease-out' : 'none',
        }}
        className="flex items-end justify-center overflow-hidden"
      >
        {(isRefreshing || pullDistance > 0) && (
          <div className="pb-2">
            {isRefreshing ? (
              <Loader2 className="size-5 animate-spin text-violet-600 dark:text-violet-300" />
            ) : (
              <ArrowDown
                className="size-5 text-slate-500 transition-transform dark:text-slate-400"
                style={{ transform: `rotate(${rotation}deg)` }}
              />
            )}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
