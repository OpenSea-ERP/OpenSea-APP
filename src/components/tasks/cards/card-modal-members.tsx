'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { MemberAvatar } from '@/components/tasks/shared/member-avatar';
import { cn } from '@/lib/utils';
import type { BoardMember } from '@/types/tasks';

interface CardModalMembersProps {
  boardId: string;
  cardId?: string;
  boardMembers: BoardMember[];
  members: string[]; // userId[]
  onAdd: (userId: string) => void;
  onRemove: (userId: string) => void;
}

export function CardModalMembers({
  boardMembers,
  members,
  onAdd,
  onRemove,
}: CardModalMembersProps) {
  const [open, setOpen] = useState(false);

  const selectedMembers = boardMembers.filter(m => members.includes(m.userId));

  function handleToggle(userId: string) {
    if (members.includes(userId)) {
      onRemove(userId);
    } else {
      onAdd(userId);
    }
  }

  return (
    <div className="flex items-center gap-0.5">
      {/* Stacked avatars */}
      {selectedMembers.map((member, i) => (
        <div
          key={member.userId}
          className="shrink-0"
          style={{ marginLeft: i > 0 ? '-6px' : 0, zIndex: selectedMembers.length - i }}
        >
          <MemberAvatar
            name={member.userName}
            avatarUrl={member.userAvatarUrl}
            size="sm"
            className="h-[22px] w-[22px] text-[8px] ring-2 ring-background"
          />
        </div>
      ))}

      {/* Add button */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              'h-[22px] w-[22px] rounded-full border border-dashed border-muted-foreground/40',
              'flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors',
              selectedMembers.length > 0 && '-ml-1.5'
            )}
          >
            <Plus className="h-3 w-3" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-60 p-2" align="start">
          <p className="text-xs font-medium text-muted-foreground px-2 pb-2">
            Membros do cartão
          </p>
          <div className="space-y-0.5 max-h-48 overflow-y-auto">
            {boardMembers.map(member => {
              const isSelected = members.includes(member.userId);
              return (
                <button
                  key={member.userId}
                  type="button"
                  className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors"
                  onClick={() => handleToggle(member.userId)}
                >
                  <Checkbox
                    checked={isSelected}
                    className="pointer-events-none"
                  />
                  <MemberAvatar
                    name={member.userName}
                    avatarUrl={member.userAvatarUrl}
                    size="sm"
                  />
                  <span className="truncate text-sm">
                    {member.userName ?? member.userEmail}
                  </span>
                </button>
              );
            })}
            {boardMembers.length === 0 && (
              <p className="text-xs text-muted-foreground px-2 py-2">
                Nenhum membro no quadro
              </p>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground px-2 pt-2 border-t border-border mt-2">
            Ou use @menção nos comentários
          </p>
        </PopoverContent>
      </Popover>
    </div>
  );
}
