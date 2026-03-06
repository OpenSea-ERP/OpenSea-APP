export interface BoardGradient {
  id: string;
  from: string;
  to: string;
  className: string;
  style: { background: string };
}

export const BOARD_GRADIENTS: BoardGradient[] = [
  {
    id: 'blue-indigo',
    from: '#3b82f6',
    to: '#6366f1',
    className: 'bg-gradient-to-br from-blue-500 to-indigo-500',
    style: { background: 'linear-gradient(135deg, #3b82f6, #6366f1)' },
  },
  {
    id: 'green-teal',
    from: '#22c55e',
    to: '#14b8a6',
    className: 'bg-gradient-to-br from-green-500 to-teal-500',
    style: { background: 'linear-gradient(135deg, #22c55e, #14b8a6)' },
  },
  {
    id: 'purple-pink',
    from: '#a855f7',
    to: '#ec4899',
    className: 'bg-gradient-to-br from-purple-500 to-pink-500',
    style: { background: 'linear-gradient(135deg, #a855f7, #ec4899)' },
  },
  {
    id: 'orange-red',
    from: '#f97316',
    to: '#ef4444',
    className: 'bg-gradient-to-br from-orange-500 to-red-500',
    style: { background: 'linear-gradient(135deg, #f97316, #ef4444)' },
  },
  {
    id: 'cyan-blue',
    from: '#06b6d4',
    to: '#3b82f6',
    className: 'bg-gradient-to-br from-cyan-500 to-blue-500',
    style: { background: 'linear-gradient(135deg, #06b6d4, #3b82f6)' },
  },
  {
    id: 'rose-fuchsia',
    from: '#f43f5e',
    to: '#d946ef',
    className: 'bg-gradient-to-br from-rose-500 to-fuchsia-500',
    style: { background: 'linear-gradient(135deg, #f43f5e, #d946ef)' },
  },
  {
    id: 'emerald-cyan',
    from: '#10b981',
    to: '#06b6d4',
    className: 'bg-gradient-to-br from-emerald-500 to-cyan-500',
    style: { background: 'linear-gradient(135deg, #10b981, #06b6d4)' },
  },
  {
    id: 'amber-orange',
    from: '#f59e0b',
    to: '#f97316',
    className: 'bg-gradient-to-br from-amber-500 to-orange-500',
    style: { background: 'linear-gradient(135deg, #f59e0b, #f97316)' },
  },
  {
    id: 'violet-purple',
    from: '#8b5cf6',
    to: '#a855f7',
    className: 'bg-gradient-to-br from-violet-500 to-purple-500',
    style: { background: 'linear-gradient(135deg, #8b5cf6, #a855f7)' },
  },
  {
    id: 'sky-indigo',
    from: '#0ea5e9',
    to: '#6366f1',
    className: 'bg-gradient-to-br from-sky-500 to-indigo-500',
    style: { background: 'linear-gradient(135deg, #0ea5e9, #6366f1)' },
  },
  {
    id: 'lime-green',
    from: '#84cc16',
    to: '#22c55e',
    className: 'bg-gradient-to-br from-lime-500 to-green-500',
    style: { background: 'linear-gradient(135deg, #84cc16, #22c55e)' },
  },
  {
    id: 'slate-zinc',
    from: '#64748b',
    to: '#71717a',
    className: 'bg-gradient-to-br from-slate-500 to-zinc-500',
    style: { background: 'linear-gradient(135deg, #64748b, #71717a)' },
  },
];

const STORAGE_PREFIX = 'board-gradient-';

function hashBoardId(boardId: string): number {
  let hash = 0;
  for (let i = 0; i < boardId.length; i++) {
    hash = (hash * 31 + boardId.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

export function getGradientForBoard(boardId: string): BoardGradient {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}${boardId}`);
    if (stored) {
      const found = BOARD_GRADIENTS.find((g) => g.id === stored);
      if (found) return found;
    }
  }
  return BOARD_GRADIENTS[hashBoardId(boardId) % BOARD_GRADIENTS.length];
}

export function setGradientForBoard(boardId: string, gradientId: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`${STORAGE_PREFIX}${boardId}`, gradientId);
  }
}
