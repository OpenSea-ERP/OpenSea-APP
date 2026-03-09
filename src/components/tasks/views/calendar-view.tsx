'use client';

import { useMemo, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import type {
  EventClickArg,
  EventDropArg,
  EventContentArg,
} from '@fullcalendar/core';
import { cn } from '@/lib/utils';
import type { Board, Card, CardPriority } from '@/types/tasks';
import { PRIORITY_CONFIG } from '@/types/tasks';
import { useUpdateCard } from '@/hooks/tasks/use-cards';
import { getGradientForBoard } from '../shared/board-gradients';
import { toast } from 'sonner';

interface CalendarViewProps {
  board: Board;
  cards: Card[];
  boardId: string;
  readOnly?: boolean;
  onCardClick?: (card: Card) => void;
}

const PRIORITY_HEX: Record<CardPriority, string> = {
  URGENT: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#3b82f6',
  NONE: '#9ca3af',
};

export function CalendarView({
  board,
  cards,
  boardId,
  readOnly,
  onCardClick,
}: CalendarViewProps) {
  const updateCard = useUpdateCard(boardId);
  const gradient = getGradientForBoard(boardId);

  const columns = useMemo(
    () => [...(board.columns ?? [])].sort((a, b) => a.position - b.position),
    [board.columns]
  );

  const columnMap = useMemo(() => {
    const map = new Map<string, { title: string; color: string | null }>();
    for (const col of columns)
      map.set(col.id, { title: col.title, color: col.color });
    return map;
  }, [columns]);

  const events = useMemo(
    () =>
      cards
        .filter(c => c.dueDate)
        .map(c => {
          const color =
            c.labels && c.labels.length > 0
              ? c.labels[0].color
              : PRIORITY_HEX[c.priority];
          return {
            id: c.id,
            title: c.title,
            start: c.dueDate!,
            backgroundColor: color,
            borderColor: color,
            extendedProps: { card: c },
          };
        }),
    [cards]
  );

  const handleEventClick = useCallback(
    (info: EventClickArg) => {
      const card = info.event.extendedProps.card as Card | undefined;
      if (card) onCardClick?.(card);
    },
    [onCardClick]
  );

  const handleEventDrop = useCallback(
    (info: EventDropArg) => {
      const cardId = info.event.id;
      const newDate = info.event.start;

      if (!cardId || !newDate) {
        info.revert();
        return;
      }

      updateCard.mutate(
        { cardId, data: { dueDate: newDate.toISOString() } },
        {
          onSuccess: () => toast.success('Prazo atualizado'),
          onError: () => {
            toast.error('Erro ao atualizar prazo');
            info.revert();
          },
        }
      );
    },
    [updateCard]
  );

  const renderEventContent = useCallback(
    (arg: EventContentArg) => {
      const card = arg.event.extendedProps.card as Card | undefined;
      const isListView = arg.view.type === 'listWeek';
      const isMonthView = arg.view.type === 'dayGridMonth';
      const isTimeGrid =
        arg.view.type === 'timeGridWeek' || arg.view.type === 'timeGridDay';

      const colInfo = card ? columnMap.get(card.columnId) : null;
      const priorityConfig = card ? PRIORITY_CONFIG[card.priority] : null;

      const timeText =
        isMonthView && arg.event.start
          ? arg.event.start.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })
          : null;

      return (
        <div
          className={cn(
            'flex items-center gap-1.5 overflow-hidden w-full',
            isListView ? 'py-1 px-1' : 'px-1.5',
            isTimeGrid && 'py-0.5'
          )}
        >
          {priorityConfig && (
            <span
              className={cn(
                'h-2 w-2 rounded-full shrink-0',
                priorityConfig.dotColor
              )}
            />
          )}
          <span
            className={cn(
              'truncate font-medium leading-tight flex-1 min-w-0',
              isListView ? 'text-xs' : 'text-[0.75rem]'
            )}
          >
            {arg.event.title}
          </span>
          {isListView && colInfo && (
            <span className="shrink-0 text-[0.6rem] text-muted-foreground px-1.5 py-0.5 rounded bg-muted/50">
              {colInfo.title}
            </span>
          )}
          {timeText && (
            <span className="shrink-0 text-[0.6rem] font-medium opacity-70 ml-auto tabular-nums">
              {timeText}
            </span>
          )}
        </div>
      );
    },
    [columnMap]
  );

  return (
    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-card overflow-hidden">
      {/* Colored top accent bar */}
      <div className="h-1 w-full" style={gradient.style} />

      <div className="os-calendar p-3 md:p-4">
        <FullCalendar
          plugins={[
            dayGridPlugin,
            timeGridPlugin,
            listPlugin,
            interactionPlugin,
          ]}
          initialView="dayGridMonth"
          locale="pt-br"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
          }}
          buttonText={{
            today: 'Hoje',
            month: 'Mês',
            week: 'Semana',
            day: 'Dia',
            list: 'Agenda',
          }}
          allDayText="Dia inteiro"
          moreLinkText={n => `+${n} mais`}
          noEventsText="Nenhum cartão com prazo neste período"
          events={events}
          eventContent={renderEventContent}
          editable={!readOnly}
          eventClick={handleEventClick}
          eventDrop={readOnly ? undefined : handleEventDrop}
          height="auto"
          dayMaxEvents={3}
          eventDisplay="block"
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false,
          }}
        />
      </div>
    </div>
  );
}
