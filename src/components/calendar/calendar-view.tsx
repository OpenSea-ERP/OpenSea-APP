'use client';

import { useRef, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/types/calendar';
import { EVENT_TYPE_COLORS } from '@/types/calendar';
import { EVENT_TYPE_ICONS } from './event-type-badge';
import type { DateClickArg } from '@fullcalendar/interaction';
import type { EventClickArg, DatesSetArg, EventInput, EventContentArg } from '@fullcalendar/core';

export interface CalendarViewRef {
  gotoDate: (date: Date) => void;
}

interface CalendarViewProps {
  events: CalendarEvent[];
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onDatesSet?: (start: Date, end: Date, viewType: string) => void;
  currentView?: string;
  initialDate?: Date;
  className?: string;
}

function isFinancePaid(event: CalendarEvent): boolean {
  return event.type === 'FINANCE_DUE' &&
    (event.title.includes('[Pago]') || event.title.includes('[Recebido]'));
}

function getFinanceDueColor(event: CalendarEvent): string {
  if (isFinancePaid(event)) return '#94a3b8'; // muted slate for paid
  // Check title pattern: "A Pagar:" or "A Receber:" from calendar sync
  if (event.title.includes('A Receber') || event.title.includes('[Recebido]')) {
    return '#10b981'; // green for receivable
  }
  return '#f59e0b'; // amber for payable
}

function mapToFullCalendarEvents(events: CalendarEvent[]): EventInput[] {
  return events.map((event) => {
    const isFinance = event.type === 'FINANCE_DUE';
    const color = isFinance
      ? getFinanceDueColor(event)
      : (event.color ?? EVENT_TYPE_COLORS[event.type] ?? '#64748b');

    return {
      id: event.id + (event.occurrenceDate ?? ''),
      title: event.title,
      start: event.occurrenceDate ?? event.startDate,
      end: event.endDate,
      allDay: event.isAllDay,
      backgroundColor: color,
      borderColor: color,
      extendedProps: { calendarEvent: event },
    };
  });
}

export const CalendarView = forwardRef<CalendarViewRef, CalendarViewProps>(
  function CalendarView(
    {
      events,
      onDateClick,
      onEventClick,
      onDatesSet,
      currentView = 'dayGridMonth',
      initialDate,
      className,
    },
    ref,
  ) {
  const calendarRef = useRef<FullCalendar>(null);

  useImperativeHandle(ref, () => ({
    gotoDate(date: Date) {
      calendarRef.current?.getApi().gotoDate(date);
    },
  }));

  useEffect(() => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi && calendarApi.view.type !== currentView) {
      calendarApi.changeView(currentView);
    }
  }, [currentView]);

  const handleDateClick = (arg: DateClickArg) => {
    onDateClick?.(arg.date);
  };

  const handleEventClick = (arg: EventClickArg) => {
    const calendarEvent = arg.event.extendedProps.calendarEvent as CalendarEvent;
    onEventClick?.(calendarEvent);
  };

  const handleDatesSet = (arg: DatesSetArg) => {
    onDatesSet?.(arg.start, arg.end, arg.view.type);
  };

  const renderEventContent = (arg: EventContentArg) => {
    const calendarEvent = arg.event.extendedProps.calendarEvent as CalendarEvent | undefined;
    const isListView = arg.view.type === 'listWeek';
    const isMonthView = arg.view.type === 'dayGridMonth';
    const isTimeGrid = arg.view.type === 'timeGridWeek' || arg.view.type === 'timeGridDay';

    // Finance event special icon: arrow-down for payable, arrow-up for receivable
    let icon = calendarEvent ? EVENT_TYPE_ICONS[calendarEvent.type] : null;
    const isPaid = calendarEvent ? isFinancePaid(calendarEvent) : false;

    if (calendarEvent?.type === 'FINANCE_DUE') {
      const isReceivable =
        calendarEvent.title.includes('A Receber') ||
        calendarEvent.title.includes('[Recebido]');
      icon = isReceivable
        ? <span className="w-3 h-3 text-[0.65rem] font-bold">{'\u2191'}</span>
        : <span className="w-3 h-3 text-[0.65rem] font-bold">{'\u2193'}</span>;
    }

    // Format time for month view
    const timeText = isMonthView && !arg.event.allDay && arg.event.start
      ? arg.event.start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      : null;

    return (
      <div className={cn(
        'flex items-center gap-1 overflow-hidden w-full',
        isListView ? 'py-1 px-1' : 'px-1.5',
        isTimeGrid && 'py-0.5',
      )}>
        {icon && <span className="shrink-0 opacity-80">{icon}</span>}
        <span className={cn(
          'truncate font-medium leading-tight flex-1 min-w-0',
          isListView ? 'text-xs' : 'text-[0.75rem]',
          isPaid && 'line-through opacity-60',
        )}>
          {arg.event.title}
        </span>
        {timeText && (
          <span className="shrink-0 text-[0.6rem] font-medium opacity-70 ml-auto tabular-nums">
            {timeText}
          </span>
        )}
      </div>
    );
  };

  const calendarEvents = useMemo(() => mapToFullCalendarEvents(events), [events]);

  return (
    <div className={cn('os-calendar h-full', className)}>
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
        initialView={currentView}
        initialDate={initialDate}
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
        events={calendarEvents}
        eventContent={renderEventContent}
        eventDisplay="block"
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        datesSet={handleDatesSet}
        editable={false}
        selectable={true}
        dayMaxEvents={3}
        moreLinkText={(n) => `+${n} mais`}
        noEventsText="Nenhum evento neste período"
        height="100%"
      />
    </div>
  );
});
