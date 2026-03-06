'use client';

import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/tasks/shared/empty-states';
import { MemberAvatar } from '@/components/tasks/shared/member-avatar';
import { getGradientForBoard } from '@/components/tasks/shared/board-gradients';
import type { Board } from '@/types/tasks';
import { KanbanSquare, Users, LayoutGrid } from 'lucide-react';

interface BoardListProps {
  boards: Board[];
  isLoading: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function BoardList({
  boards,
  isLoading,
  emptyTitle = 'Nenhum quadro encontrado',
  emptyDescription = 'Crie um novo quadro para organizar suas tarefas.',
}: BoardListProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  if (boards.length === 0) {
    return (
      <EmptyState
        icon={KanbanSquare}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {boards.map((board) => {
        const gradient = getGradientForBoard(board.id);
        return (
          <button
            key={board.id}
            type="button"
            className="group relative overflow-hidden rounded-xl h-32 text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            style={gradient.style}
            onClick={() => router.push(`/tasks/${board.id}`)}
          >
            {/* Overlay for readability */}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />

            {/* Content */}
            <div className="relative h-full flex flex-col justify-between p-4">
              {/* Title area */}
              <div>
                <h3 className="font-bold text-white text-lg leading-tight line-clamp-1 drop-shadow-sm">
                  {board.title}
                </h3>
                {board.description && (
                  <p className="text-white/75 text-sm mt-0.5 line-clamp-1">
                    {board.description}
                  </p>
                )}
              </div>

              {/* Bottom stats */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {board._count && (
                    <>
                      <span className="inline-flex items-center gap-1 text-xs text-white/80 font-medium">
                        <LayoutGrid className="h-3.5 w-3.5" />
                        {board._count.cards}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-white/80 font-medium">
                        <Users className="h-3.5 w-3.5" />
                        {board._count.members}
                      </span>
                    </>
                  )}
                </div>

                {/* Member avatars */}
                {board.members && board.members.length > 0 && (
                  <div className="flex items-center -space-x-1.5">
                    {board.members.slice(0, 3).map((member) => (
                      <div
                        key={member.id}
                        className="h-6 w-6 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-white/30"
                        title={member.userName ?? undefined}
                      >
                        {(member.userName ?? '?').charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {board.members.length > 3 && (
                      <div className="h-6 w-6 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-white/30">
                        +{board.members.length - 3}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
