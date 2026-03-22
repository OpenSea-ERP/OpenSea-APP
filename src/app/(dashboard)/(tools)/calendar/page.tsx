'use client';

import { useState, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageActionBar } from '@/components/layout/page-action-bar';
import { ProtectedRoute } from '@/components/auth/protected-route';
import {
  CalendarView,
  CalendarSelector,
  EventCreateDialog,
  EventDetailSheet,
  EventEditDialog,
  EventFilters,
} from '@/components/calendar';
import type { CalendarViewRef } from '@/components/calendar';
import {
  useCalendarEvents,
  useCalendarEvent,
  useMyCalendars,
} from '@/hooks/calendar';
import { usePermissions } from '@/hooks/use-permissions';
import { useAuth } from '@/contexts/auth-context';
import { TOOLS_PERMISSIONS } from '@/config/rbac/permission-codes';
import { apiConfig, authConfig } from '@/config/api';
import { calendarEventsService } from '@/services/calendar';
import type { CalendarEvent, EventType } from '@/types/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Calendar, Download, Plus } from 'lucide-react';

const VALID_VIEWS = [
  'dayGridMonth',
  'timeGridWeek',
  'timeGridDay',
  'listWeek',
] as const;
type CalendarViewType = (typeof VALID_VIEWS)[number];

const VALID_EVENT_TYPES: EventType[] = [
  'MEETING',
  'TASK',
  'REMINDER',
  'DEADLINE',
  'HOLIDAY',
  'BIRTHDAY',
  'VACATION',
  'ABSENCE',
  'FINANCE_DUE',
  'PURCHASE_ORDER',
  'CUSTOM',
];

export default function CalendarPage() {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const canCreate = hasPermission(TOOLS_PERMISSIONS.CALENDAR.REGISTER);
  const canEdit = hasPermission(TOOLS_PERMISSIONS.CALENDAR.MODIFY);
  const canDelete = hasPermission(TOOLS_PERMISSIONS.CALENDAR.REMOVE);
  const canInvite = hasPermission(TOOLS_PERMISSIONS.CALENDAR.SHARE);
  const canRespond = hasPermission(TOOLS_PERMISSIONS.CALENDAR.ACCESS);
  const canManageParticipants = hasPermission(TOOLS_PERMISSIONS.CALENDAR.ADMIN);
  const canManageReminders = hasPermission(TOOLS_PERMISSIONS.CALENDAR.REGISTER);
  const canShare =
    hasPermission(TOOLS_PERMISSIONS.CALENDAR.SHARE) ||
    hasPermission(TOOLS_PERMISSIONS.CALENDAR.SHARE);
  const canExport = hasPermission(TOOLS_PERMISSIONS.CALENDAR.EXPORT);

  // Read URL query params
  const urlView = searchParams.get('view') as CalendarViewType | null;
  const urlType = searchParams.get('type') as EventType | null;
  const urlDate = searchParams.get('date');

  const initialView = useMemo<CalendarViewType>(() => {
    if (urlView && VALID_VIEWS.includes(urlView)) return urlView;
    return 'dayGridMonth';
  }, [urlView]);

  const initialDate = useMemo<Date | undefined>(() => {
    if (!urlDate) return undefined;
    const parsed = new Date(urlDate);
    return isNaN(parsed.getTime()) ? undefined : parsed;
  }, [urlDate]);

  // Helper to update URL params without full navigation
  const updateUrlParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  // Date range state (controlled by FullCalendar's datesSet)
  const [dateRange, setDateRange] = useState(() => {
    const base = initialDate ?? new Date();
    const start = new Date(base.getFullYear(), base.getMonth(), 1);
    const end = new Date(base.getFullYear(), base.getMonth() + 1, 7);
    return { startDate: start.toISOString(), endDate: end.toISOString() };
  });

  // View state synced with URL
  const [currentView, setCurrentView] = useState<CalendarViewType>(initialView);

  // Filters synced with URL
  const [selectedType, setSelectedType] = useState<EventType | undefined>(
    () => {
      if (urlType && VALID_EVENT_TYPES.includes(urlType)) return urlType;
      return undefined;
    }
  );
  const [includeSystemEvents, setIncludeSystemEvents] = useState(true);
  const calendarViewRef = useRef<CalendarViewRef>(null);

  // Multi-calendar support
  const { data: calendarsData } = useMyCalendars();
  const calendars = calendarsData?.calendars ?? [];
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([]);

  // Initialize selected calendars once loaded
  const isCalendarsInitialized = useMemo(() => {
    if (calendars.length > 0 && selectedCalendarIds.length === 0) {
      return false;
    }
    return true;
  }, [calendars.length, selectedCalendarIds.length]);

  // Auto-select all calendars when first loaded
  if (!isCalendarsInitialized && calendars.length > 0) {
    setSelectedCalendarIds(calendars.map(c => c.id));
  }

  // Default calendar for creating events (first personal, or first creatable)
  const defaultCalendarId = useMemo(() => {
    const personal = calendars.find(
      c => c.type === 'PERSONAL' && c.access.canCreate
    );
    if (personal) return personal.id;
    const first = calendars.find(c => c.access.canCreate);
    return first?.id ?? '';
  }, [calendars]);

  const handleTypeChange = useCallback(
    (type: EventType | undefined) => {
      setSelectedType(type);
      updateUrlParams({ type: type ?? null });
    },
    [updateUrlParams]
  );

  const handleViewChange = useCallback(
    (view: string) => {
      const validView = VALID_VIEWS.includes(view as CalendarViewType)
        ? (view as CalendarViewType)
        : 'dayGridMonth';
      setCurrentView(validView);
      updateUrlParams({
        view: validView === 'dayGridMonth' ? null : validView,
      });
    },
    [updateUrlParams]
  );

  // Dialogs/Sheets
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [defaultCreateDate, setDefaultCreateDate] = useState<
    Date | undefined
  >();

  // Live event data (auto-updates when participants change)
  const { data: liveEventData } = useCalendarEvent(selectedEvent?.id ?? '');
  const liveEvent = liveEventData?.event ?? selectedEvent;

  // Fetch events
  const { data, isLoading } = useCalendarEvents({
    ...dateRange,
    type: selectedType,
    includeSystemEvents,
    calendarIds:
      selectedCalendarIds.length > 0
        ? selectedCalendarIds.join(',')
        : undefined,
  });

  const events = data?.events ?? [];

  const handleDatesSet = useCallback(
    (start: Date, end: Date, viewType: string) => {
      setDateRange({
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      });
      handleViewChange(viewType);
    },
    [handleViewChange]
  );

  const handleDateClick = useCallback(
    (date: Date) => {
      if (canCreate) {
        setDefaultCreateDate(date);
        setCreateDialogOpen(true);
      }
    },
    [canCreate]
  );

  const handleEventClick = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setDetailSheetOpen(true);
  }, []);

  const handleEdit = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setEditDialogOpen(true);
  }, []);

  const handleSearchSelect = useCallback((event: CalendarEvent) => {
    const eventDate = new Date(event.occurrenceDate ?? event.startDate);
    calendarViewRef.current?.gotoDate(eventDate);
    setSelectedEvent(event);
    setDetailSheetOpen(true);
  }, []);

  const handleExport = useCallback(async () => {
    try {
      const exportPath = calendarEventsService.getExportUrl({
        ...dateRange,
        type: selectedType,
        includeSystemEvents,
      });
      const token = localStorage.getItem(authConfig.tokenKey);
      const url = new URL(exportPath, apiConfig.baseURL);

      const response = await fetch(url.toString(), {
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      });

      if (!response.ok) throw new Error('Falha ao exportar');

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = 'opensea-agenda.ics';
      a.click();
      URL.revokeObjectURL(downloadUrl);
      toast.success('Agenda exportada com sucesso');
    } catch {
      toast.error('Erro ao exportar agenda');
    }
  }, [dateRange, selectedType, includeSystemEvents]);

  const actionButtons = [
    ...(canExport
      ? [
          {
            id: 'export',
            title: 'Exportar iCal',
            icon: Download,
            variant: 'outline' as const,
            onClick: handleExport,
          },
        ]
      : []),
    ...(canCreate
      ? [
          {
            id: 'new-event',
            title: 'Novo Evento',
            icon: Plus,
            variant: 'default' as const,
            onClick: () => setCreateDialogOpen(true),
          },
        ]
      : []),
  ];

  return (
    <ProtectedRoute requiredPermission={TOOLS_PERMISSIONS.CALENDAR.ACCESS}>
      <div className="flex flex-col gap-3 h-[calc(100vh-10rem)]">
        {/* Action Bar */}
        <PageActionBar
          breadcrumbItems={[{ label: 'Agenda', href: '/calendar' }]}
          buttons={actionButtons}
        />

        {/* Hero Banner — compact, with filters embedded */}
        <Card className="relative overflow-hidden px-5 py-4 bg-white shadow-sm dark:shadow-none dark:bg-white/5 border-gray-200 dark:border-white/10 shrink-0">
          {/* Decorative blobs */}
          <div className="absolute top-0 right-0 w-44 h-44 bg-blue-500/15 dark:bg-blue-500/10 rounded-full opacity-80 -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full opacity-80 translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10">
            {/* Title row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-linear-to-br from-blue-500 to-indigo-600">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">
                    Agenda
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-white/60">
                    Organize e acompanhe seus compromissos e eventos
                  </p>
                </div>
              </div>

              {/* Calendar selector (multi-calendar) */}
              {calendars.length > 1 && (
                <CalendarSelector
                  calendars={calendars}
                  selectedIds={selectedCalendarIds}
                  onSelectionChange={setSelectedCalendarIds}
                />
              )}
            </div>

            {/* Filters row */}
            <div className="bg-muted/30 dark:bg-white/5 rounded-lg px-3 py-2">
              <EventFilters
                selectedType={selectedType}
                onTypeChange={handleTypeChange}
                includeSystemEvents={includeSystemEvents}
                onSystemEventsChange={setIncludeSystemEvents}
                onEventSelect={handleSearchSelect}
              />
            </div>
          </div>
        </Card>

        {/* Calendar Card — fills remaining space */}
        <Card className="bg-white shadow-sm dark:shadow-none dark:bg-white/5 border-gray-200 dark:border-white/10 p-3 md:p-4 flex-1 min-h-0 flex flex-col">
          {isLoading && !data ? (
            <div className="space-y-4 flex-1">
              <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-8 w-64" />
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 7 }).map((_, i) => (
                  <Skeleton key={`header-${i}`} className="h-8" />
                ))}
                {Array.from({ length: 35 }).map((_, i) => (
                  <Skeleton key={`cell-${i}`} className="h-20" />
                ))}
              </div>
            </div>
          ) : (
            <CalendarView
              ref={calendarViewRef}
              events={events}
              onDateClick={handleDateClick}
              onEventClick={handleEventClick}
              onDatesSet={handleDatesSet}
              currentView={currentView}
              initialDate={initialDate}
              className="flex-1 min-h-0"
            />
          )}
        </Card>

        {/* Dialogs */}
        <EventCreateDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          defaultDate={defaultCreateDate}
          calendars={calendars}
          defaultCalendarId={defaultCalendarId}
        />

        <EventEditDialog
          event={selectedEvent}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
        />

        <EventDetailSheet
          event={liveEvent}
          open={detailSheetOpen}
          onOpenChange={setDetailSheetOpen}
          onEdit={handleEdit}
          canEdit={canEdit}
          canDelete={canDelete}
          canInvite={canInvite}
          canRespond={canRespond}
          canShare={canShare}
          canManageParticipants={canManageParticipants}
          canManageReminders={canManageReminders}
          currentUserId={user?.id}
          calendars={calendars}
        />
      </div>
    </ProtectedRoute>
  );
}
