'use client';

import { Badge } from '@/components/ui/badge';
import {
  FileText,
  ListChecks,
  CheckSquare,
  Settings2,
  MessageSquare,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { CardDetailsTab } from '@/components/tasks/tabs/card-details-tab';
import { CardSubtasksTab } from '@/components/tasks/tabs/card-subtasks-tab';
import { CardChecklistTab } from '@/components/tasks/tabs/card-checklist-tab';
import { CardCommentsTab } from '@/components/tasks/tabs/card-comments-tab';
import { CardCustomFieldsTab } from '@/components/tasks/tabs/card-custom-fields-tab';
import { CardActivityTab } from '@/components/tasks/tabs/card-activity-tab';
import type { Card } from '@/types/tasks';

type CardTab = 'geral' | 'subtarefas' | 'checklists' | 'campos' | 'atividade';

const TABS: {
  key: CardTab;
  label: string;
  icon: React.ElementType;
  color: string;
}[] = [
  { key: 'geral', label: 'Detalhes', icon: FileText, color: 'text-blue-500' },
  {
    key: 'subtarefas',
    label: 'Subtarefas',
    icon: ListChecks,
    color: 'text-emerald-500',
  },
  {
    key: 'checklists',
    label: 'Checklists',
    icon: CheckSquare,
    color: 'text-violet-500',
  },
  { key: 'campos', label: 'Campos', icon: Settings2, color: 'text-amber-500' },
  {
    key: 'atividade',
    label: 'Atividade',
    icon: Activity,
    color: 'text-orange-500',
  },
];

interface CardDetailTabsProps {
  card: Card;
  boardId: string;
  cardId: string;
  activeTab: CardTab;
  onTabChange: (tab: CardTab) => void;
}

export function CardDetailTabs({
  card,
  boardId,
  cardId,
  activeTab,
  onTabChange,
}: CardDetailTabsProps) {
  return (
    <>
      {/* ─── Column 1: Comments (messaging) ─── */}
      <div className="w-[280px] shrink-0 border-r border-border flex flex-col bg-muted/10 dark:bg-white/[0.01] hidden md:flex">
        {/* Column header */}
        <div className="shrink-0 px-3 py-2.5 border-b border-border/50 flex items-center gap-2">
          <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
          <span className="text-xs font-semibold">Comentários</span>
          {card._count && card._count.comments > 0 && (
            <Badge
              variant="secondary"
              className="text-[10px] h-4 px-1.5 ml-auto"
            >
              {card._count.comments}
            </Badge>
          )}
        </div>

        {/* Messages area + input */}
        <CardCommentsTab
          boardId={boardId}
          cardId={cardId}
          messagingLayout
        />
      </div>

      {/* ─── Column 2: Tab content (center) ─── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Tab bar */}
        <div className="shrink-0 flex items-center gap-0.5 px-4 border-b border-border bg-muted/20 dark:bg-white/[0.02]">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                className={cn(
                  'relative flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors',
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                onClick={() => onTabChange(tab.key)}
              >
                <Icon
                  className={cn(
                    'h-3.5 w-3.5',
                    isActive ? tab.color : ''
                  )}
                />
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {activeTab === 'geral' && (
            <CardDetailsTab card={card} boardId={boardId} />
          )}

          {activeTab === 'subtarefas' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-emerald-500" />
                <h4 className="text-sm font-semibold">Subtarefas</h4>
              </div>
              <CardSubtasksTab boardId={boardId} cardId={cardId} />
            </div>
          )}

          {activeTab === 'checklists' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-violet-500" />
                <h4 className="text-sm font-semibold">Checklists</h4>
              </div>
              <CardChecklistTab
                boardId={boardId}
                cardId={cardId}
                checklists={card.checklists ?? []}
              />
            </div>
          )}

          {activeTab === 'campos' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-amber-500" />
                <h4 className="text-sm font-semibold">
                  Campos personalizados
                </h4>
              </div>
              <CardCustomFieldsTab boardId={boardId} cardId={cardId} />
            </div>
          )}

          {activeTab === 'atividade' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-orange-500" />
                <h4 className="text-sm font-semibold">
                  Histórico de atividades
                </h4>
              </div>
              <CardActivityTab boardId={boardId} cardId={cardId} />
            </div>
          )}

          {/* Show comments inline on mobile (no left column) */}
          <div className="md:hidden space-y-3 border-t border-border pt-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-blue-400" />
              <h4 className="text-sm font-semibold">Comentários</h4>
            </div>
            <CardCommentsTab boardId={boardId} cardId={cardId} />
          </div>
        </div>
      </div>
    </>
  );
}

export type { CardTab };
