'use client';

import { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { PageActionBar } from '@/components/layout/page-action-bar';
import { ProtectedRoute } from '@/components/auth/protected-route';
import {
  CalendarView,
  EventCreateDialog,
  EventDetailSheet,
  EventEditDialog,
  EventFilters,
  EventTypeBadge,
} from '@/components/calendar';
import { useCalendarEvents } from '@/hooks/calendar';
import { usePermissions } from '@/hooks/use-permissions';
import { useAuth } from '@/contexts/auth-context';
import { CALENDAR_PERMISSIONS } from '@/config/rbac/permission-codes';
import type { CalendarEvent, EventType } from '@/types/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Plus } from 'lucide-react';

const LEGEND_TYPES: EventType[] = [
  'MEETING', 'TASK', 'REMINDER', 'DEADLINE', 'HOLIDAY',
  'BIRTHDAY', 'VACATION', 'ABSENCE', 'FINANCE_DUE', 'PURCHASE_ORDER', 'CUSTOM',
];

export default function CalendarPage() {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(CALENDAR_PERMISSIONS.EVENTS.CREATE);
  const canEdit = hasPermission(CALENDAR_PERMISSIONS.EVENTS.UPDATE);
  const canDelete = hasPermission(CALENDAR_PERMISSIONS.EVENTS.DELETE);
  const canInvite = hasPermission(CALENDAR_PERMISSIONS.PARTICIPANTS.INVITE);
  const canRespond = hasPermission(CALENDAR_PERMISSIONS.PARTICIPANTS.RESPOND);
  const canManageParticipants = hasPermission(CALENDAR_PERMISSIONS.PARTICIPANTS.MANAGE);
  const canManageReminders = hasPermission(CALENDAR_PERMISSIONS.REMINDERS.CREATE);

  // Date range state (controlled by FullCalendar's datesSet)
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 7);
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  });

  // Filters
  const [selectedType, setSelectedType] = useState<EventType | undefined>();
  const [includeSystemEvents, setIncludeSystemEvents] = useState(true);
  const [search, setSearch] = useState('');

  // Dialogs/Sheets
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [defaultCreateDate, setDefaultCreateDate] = useState<Date | undefined>();

  // Fetch events
  const { data, isLoading } = useCalendarEvents({
    ...dateRange,
    type: selectedType,
    includeSystemEvents,
    search: search || undefined,
  });

  const events = data?.events ?? [];

  const handleDatesSet = useCallback((start: Date, end: Date) => {
    setDateRange({
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    });
  }, []);

  const handleDateClick = useCallback(
    (date: Date) => {
      if (canCreate) {
        setDefaultCreateDate(date);
        setCreateDialogOpen(true);
      }
    },
    [canCreate],
  );

  const handleEventClick = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setDetailSheetOpen(true);
  }, []);

  const handleEdit = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setEditDialogOpen(true);
  }, []);

  return (
    <ProtectedRoute requiredPermission={CALENDAR_PERMISSIONS.EVENTS.LIST}>
    <div className="space-y-6">
      {/* Action Bar */}
      <PageActionBar
        breadcrumbItems={[{ label: 'Agenda', href: '/calendar' }]}
        buttons={
          canCreate
            ? [
                {
                  id: 'new-event',
                  title: 'Novo Evento',
                  icon: Plus,
                  onClick: () => setCreateDialogOpen(true),
                },
              ]
            : []
        }
      />

      {/* Hero Card */}
      <Card className="relative overflow-hidden p-6 md:p-8 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
        <div className="absolute top-0 right-0 w-56 h-56 bg-blue-500/10 rounded-full opacity-80 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-500/10 rounded-full opacity-80 translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 rounded-xl bg-linear-to-br from-blue-500 to-indigo-600">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                Agenda
              </h1>
              <p className="text-sm text-gray-600 dark:text-white/60">
                Gerencie eventos, reuniões e compromissos
              </p>
            </div>
          </div>

          <div className="mt-4">
            <EventFilters
              selectedType={selectedType}
              onTypeChange={setSelectedType}
              includeSystemEvents={includeSystemEvents}
              onSystemEventsChange={setIncludeSystemEvents}
              search={search}
              onSearchChange={setSearch}
            />
          </div>
        </div>
      </Card>

      {/* Calendar Card */}
      <Card className="bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10 p-4 md:p-6">
        {isLoading ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-8 w-64" />
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={`header-${i}`} className="h-8" />
              ))}
              {Array.from({ length: 35 }).map((_, i) => (
                <Skeleton key={`cell-${i}`} className="h-24" />
              ))}
            </div>
          </div>
        ) : (
          <CalendarView
            events={events}
            onDateClick={handleDateClick}
            onEventClick={handleEventClick}
            onDatesSet={handleDatesSet}
          />
        )}
      </Card>

      {/* Type Legend */}
      <div className="flex items-center gap-2 flex-wrap px-1">
        <span className="text-xs font-medium text-muted-foreground mr-1">Tipos:</span>
        {LEGEND_TYPES.map((type) => (
          <EventTypeBadge key={type} type={type} className="text-[0.65rem] px-1.5 py-0.5" />
        ))}
      </div>

      {/* Dialogs */}
      <EventCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        defaultDate={defaultCreateDate}
      />

      <EventEditDialog
        event={selectedEvent}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      <EventDetailSheet
        event={selectedEvent}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
        onEdit={handleEdit}
        canEdit={canEdit}
        canDelete={canDelete}
        canInvite={canInvite}
        canRespond={canRespond}
        canManageParticipants={canManageParticipants}
        canManageReminders={canManageReminders}
        currentUserId={user?.id}
      />
    </div>
    </ProtectedRoute>
  );
}
