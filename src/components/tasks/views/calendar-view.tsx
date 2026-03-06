'use client';

import { useMemo, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ptBrLocale from '@fullcalendar/core/locales/pt-br';
import type { EventClickArg, EventDropArg } from '@fullcalendar/core';
import type { Board, Card, CardPriority } from '@/types/tasks';
import { useUpdateCard } from '@/hooks/tasks/use-cards';
import { toast } from 'sonner';

interface CalendarViewProps {
  board: Board;
  cards: Card[];
  boardId: string;
  onCardClick?: (card: Card) => void;
}

const PRIORITY_HEX: Record<CardPriority, string> = {
  URGENT: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#3b82f6',
  NONE: '#9ca3af',
};

export function CalendarView({ board, cards, boardId, onCardClick }: CalendarViewProps) {
  const updateCard = useUpdateCard(boardId);

  const events = useMemo(
    () =>
      cards
        .filter((c) => c.dueDate)
        .map((c) => {
          const color = c.labels && c.labels.length > 0
            ? c.labels[0].color
            : PRIORITY_HEX[c.priority];
          return {
            id: c.id,
            title: c.title,
            start: c.dueDate!,
            backgroundColor: color,
            borderColor: 'transparent',
            extendedProps: { card: c },
          };
        }),
    [cards],
  );

  const handleEventClick = useCallback(
    (info: EventClickArg) => {
      const card = info.event.extendedProps.card as Card | undefined;
      if (card) onCardClick?.(card);
    },
    [onCardClick],
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
        },
      );
    },
    [updateCard],
  );

  return (
    <div className="rounded-xl border border-border bg-card p-3 md:p-4">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale={ptBrLocale}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek',
        }}
        events={events}
        editable
        eventClick={handleEventClick}
        eventDrop={handleEventDrop}
        height="auto"
        dayMaxEvents={4}
        eventDisplay="block"
        eventTimeFormat={{
          hour: '2-digit',
          minute: '2-digit',
          meridiem: false,
        }}
      />
    </div>
  );
}
