'use client';

import { useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/types/calendar';
import { EVENT_TYPE_COLORS } from '@/types/calendar';
import type { DateClickArg } from '@fullcalendar/interaction';
import type { EventClickArg, DatesSetArg, EventInput } from '@fullcalendar/core';

interface CalendarViewProps {
  events: CalendarEvent[];
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onDatesSet?: (start: Date, end: Date) => void;
  currentView?: string;
  className?: string;
}

function mapToFullCalendarEvents(events: CalendarEvent[]): EventInput[] {
  return events.map((event) => ({
    id: event.id + (event.occurrenceDate ?? ''),
    title: event.title,
    start: event.occurrenceDate ?? event.startDate,
    end: event.endDate,
    allDay: event.isAllDay,
    backgroundColor: event.color ?? EVENT_TYPE_COLORS[event.type] ?? '#64748b',
    borderColor: event.color ?? EVENT_TYPE_COLORS[event.type] ?? '#64748b',
    extendedProps: { calendarEvent: event },
  }));
}

export function CalendarView({
  events,
  onDateClick,
  onEventClick,
  onDatesSet,
  currentView = 'dayGridMonth',
  className,
}: CalendarViewProps) {
  const calendarRef = useRef<FullCalendar>(null);

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
    onDatesSet?.(arg.start, arg.end);
  };

  return (
    <div className={cn('os-calendar', className)}>
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
        initialView={currentView}
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
        events={mapToFullCalendarEvents(events)}
        eventDisplay="block"
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        datesSet={handleDatesSet}
        editable={false}
        selectable={true}
        dayMaxEvents={3}
        moreLinkText={(n) => `+${n} mais`}
        noEventsText="Nenhum evento neste período"
        height="auto"
        aspectRatio={1.8}
      />
    </div>
  );
}
