'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EventTypeBadge } from './event-type-badge';
import { InviteShareDialog } from './invite-share-dialog';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import {
  useDeleteCalendarEvent,
  useRespondToEvent,
  useRemoveParticipant,
  useManageReminders,
} from '@/hooks/calendar';
import {
  EventVisibilityLabels,
  ParticipantRoleLabels,
  ParticipantStatusLabels,
} from '@/types/common/enums';
import type { CalendarEvent, Calendar as CalendarType, ParticipantStatus, SystemSourceType } from '@/types/calendar';
import { EVENT_TYPE_COLORS, REMINDER_PRESETS, SYSTEM_SOURCE_ROUTES, SYSTEM_SOURCE_LABELS } from '@/types/calendar';
import {
  MapPin,
  Users,
  Repeat,
  Eye,
  Pencil,
  Trash2,
  UserPlus,
  X,
  Bell,
  Check,
  XCircle,
  HelpCircle,
  ExternalLink,
  FileText,
  Link2,
  Globe,
  CalendarDays,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface EventDetailSheetProps {
  event: CalendarEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (event: CalendarEvent) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  canInvite?: boolean;
  canRespond?: boolean;
  canShare?: boolean;
  canManageParticipants?: boolean;
  canManageReminders?: boolean;
  currentUserId?: string;
  calendars?: CalendarType[];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

// Participant status colors for avatar rings
const STATUS_RING_COLORS: Record<string, string> = {
  ACCEPTED: 'ring-emerald-500',
  DECLINED: 'ring-red-400',
  TENTATIVE: 'ring-amber-400',
  PENDING: 'ring-gray-300 dark:ring-gray-600',
};

export function EventDetailSheet({
  event,
  open,
  onOpenChange,
  onEdit,
  canEdit = false,
  canDelete = false,
  canInvite = false,
  canRespond = false,
  canShare = false,
  canManageParticipants = false,
  canManageReminders = false,
  currentUserId,
  calendars = [],
}: EventDetailSheetProps) {
  const [showPinModal, setShowPinModal] = useState(false);
  const [showRemovePinModal, setShowRemovePinModal] = useState(false);
  const [participantToRemove, setParticipantToRemove] = useState<string | null>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showAllParticipants, setShowAllParticipants] = useState(false);
  const deleteEvent = useDeleteCalendarEvent();
  const respondToEvent = useRespondToEvent();
  const removeParticipant = useRemoveParticipant();
  const manageReminders = useManageReminders();
  const router = useRouter();

  if (!event) return null;

  const isSystem = !!event.systemSourceType;
  const eventCalendar = event.calendarId
    ? calendars.find((c) => c.id === event.calendarId)
    : null;
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  const eventColor = event.color ?? EVENT_TYPE_COLORS[event.type] ?? '#64748b';

  const participants = event.participants ?? [];
  const reminders = event.reminders ?? [];

  const myParticipation = currentUserId
    ? participants.find((p) => p.userId === currentUserId)
    : null;
  const isOwner = myParticipation?.role === 'OWNER' || event.createdBy === currentUserId;

  const myReminders = currentUserId
    ? reminders.filter((r) => r.userId === currentUserId)
    : [];

  const isSameDay =
    startDate.toDateString() === endDate.toDateString();

  const formatDate = (date: Date) => {
    if (event.isAllDay) {
      return date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
    return date.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTimeOnly = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  async function handleDelete() {
    try {
      await deleteEvent.mutateAsync(event!.id);
      toast.success('Evento excluído com sucesso');
      onOpenChange(false);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro ao excluir evento';
      toast.error(msg);
    }
  }

  async function handleRsvp(status: 'ACCEPTED' | 'DECLINED' | 'TENTATIVE') {
    try {
      await respondToEvent.mutateAsync({
        eventId: event!.id,
        userId: currentUserId,
        data: { status },
      });
      const labels = { ACCEPTED: 'aceito', DECLINED: 'recusado', TENTATIVE: 'respondido com talvez' };
      toast.success(`Convite ${labels[status]}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro ao responder convite';
      toast.error(msg);
    }
  }

  async function handleRemoveParticipant() {
    if (!participantToRemove) return;
    try {
      await removeParticipant.mutateAsync({
        eventId: event!.id,
        userId: participantToRemove,
      });
      toast.success('Participante removido');
      setParticipantToRemove(null);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro ao remover participante';
      toast.error(msg);
    }
  }

  async function handleReminderChange(value: string) {
    const minutesBefore = parseInt(value, 10);
    if (isNaN(minutesBefore)) return;

    try {
      await manageReminders.mutateAsync({
        eventId: event!.id,
        data: {
          reminders: minutesBefore === 0 ? [] : [{ minutesBefore }],
        },
      });
      toast.success(
        minutesBefore === 0
          ? 'Lembrete removido'
          : `Lembrete configurado para ${value} minutos antes`,
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro ao configurar lembrete';
      toast.error(msg);
    }
  }

  function handleViewSource() {
    if (!event?.systemSourceType || !event.systemSourceId) return;
    const routeFn = SYSTEM_SOURCE_ROUTES[event.systemSourceType as SystemSourceType];
    if (routeFn) {
      router.push(routeFn(event.systemSourceId));
    }
  }

  const currentReminderValue =
    myReminders.length > 0 ? String(myReminders[0].minutesBefore) : '0';

  const PARTICIPANT_PAGE_SIZE = 5;
  const visibleParticipants = showAllParticipants
    ? participants
    : participants.slice(0, PARTICIPANT_PAGE_SIZE);
  const hiddenCount = participants.length - PARTICIPANT_PAGE_SIZE;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-[480px] overflow-y-auto p-0 bg-white dark:bg-card">
          {/* Colored header banner */}
          <div
            className="relative px-6 pt-8 pb-5"
            style={{ background: `linear-gradient(160deg, ${eventColor}30, ${eventColor}08 70%)` }}
          >
            <div
              className="absolute top-0 left-0 w-full h-2"
              style={{ backgroundColor: eventColor }}
            />

            <SheetHeader className="space-y-1.5">
              {/* Badges row */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <EventTypeBadge type={event.type} />
                <Badge variant="secondary" className="text-[0.65rem] gap-1 h-6">
                  <Eye className="w-3 h-3" />
                  {EventVisibilityLabels[event.visibility] ?? event.visibility}
                </Badge>
                {event.isRecurring && (
                  <Badge variant="secondary" className="text-[0.65rem] gap-1 h-6">
                    <Repeat className="w-3 h-3" />
                    Recorrente
                  </Badge>
                )}
                {isSystem && (
                  <Badge variant="outline" className="text-[0.65rem] h-6 text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-500/40">
                    Sistema
                  </Badge>
                )}
              </div>

              {/* Title + Edit button */}
              <div className="flex items-start gap-2">
                <SheetTitle className="text-xl font-bold leading-tight truncate flex-1 min-w-0">
                  {event.title}
                </SheetTitle>
                {canEdit && onEdit && !isSystem && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 rounded-full hover:bg-white/20"
                    onClick={() => {
                      onEdit(event);
                      onOpenChange(false);
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {/* Calendar subtitle */}
              {eventCalendar && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground -mt-0.5">
                  {eventCalendar.color && (
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: eventCalendar.color }}
                    />
                  )}
                  <span className="truncate">{eventCalendar.name}</span>
                </div>
              )}
            </SheetHeader>
          </div>

          <div className="px-6 py-5 space-y-4">
            {/* Date & Time */}
            <div className="flex items-start gap-3">
              <div
                className="p-2 rounded-lg shrink-0"
                style={{ backgroundColor: `${eventColor}15` }}
              >
                <CalendarDays className="w-4 h-4" style={{ color: eventColor }} />
              </div>
              <div className="text-sm space-y-0.5">
                {event.isAllDay ? (
                  <>
                    <div className="font-medium">{formatDate(startDate)}</div>
                    {!isSameDay && (
                      <div className="text-muted-foreground">até {formatDate(endDate)}</div>
                    )}
                    <div className="text-xs text-muted-foreground">Dia inteiro</div>
                  </>
                ) : isSameDay ? (
                  <>
                    <div className="font-medium">
                      {startDate.toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="text-muted-foreground">
                      {formatTimeOnly(startDate)} — {formatTimeOnly(endDate)}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="font-medium">{formatDate(startDate)}</div>
                    <div className="text-muted-foreground">até {formatDate(endDate)}</div>
                  </>
                )}
              </div>
            </div>

            {/* Location */}
            {event.location && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-muted/50 dark:bg-white/5 shrink-0">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="text-sm pt-1.5">{event.location}</div>
              </div>
            )}

            {/* Timezone */}
            {event.timezone && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-muted/50 dark:bg-white/5 shrink-0">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="text-sm text-muted-foreground pt-1.5">
                  {event.timezone}
                  {(() => {
                    try {
                      const fmt = new Intl.DateTimeFormat('en-US', {
                        timeZone: event.timezone!,
                        timeZoneName: 'shortOffset',
                      });
                      const offsetPart = fmt.formatToParts(new Date()).find((p) => p.type === 'timeZoneName');
                      if (offsetPart) {
                        const raw = offsetPart.value.replace('GMT', '');
                        const offset = !raw ? 'UTC' : raw.includes(':') ? raw : `${raw}:00`;
                        return <span className="ml-1.5 text-xs opacity-60">({offset})</span>;
                      }
                    } catch { /* ignore */ }
                    return null;
                  })()}
                </div>
              </div>
            )}

            {/* Description */}
            {event.description && (
              <>
                <div className="border-t border-border/50" />
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Descrição
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/90 pl-5.5">
                    {event.description}
                  </p>
                </div>
              </>
            )}

            {/* RSVP */}
            {canRespond && myParticipation && !isOwner && (
              <>
                <div className="border-t border-border/50" />
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Responder ao convite
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={myParticipation.status === 'ACCEPTED' ? 'default' : 'outline'}
                      className="h-9 text-xs flex-1"
                      onClick={() => handleRsvp('ACCEPTED')}
                      disabled={respondToEvent.isPending}
                    >
                      <Check className="w-3.5 h-3.5 mr-1.5" />
                      Aceitar
                    </Button>
                    <Button
                      size="sm"
                      variant={myParticipation.status === 'DECLINED' ? 'destructive' : 'outline'}
                      className="h-9 text-xs flex-1"
                      onClick={() => handleRsvp('DECLINED')}
                      disabled={respondToEvent.isPending}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1.5" />
                      Recusar
                    </Button>
                    <Button
                      size="sm"
                      variant={myParticipation.status === 'TENTATIVE' ? 'secondary' : 'outline'}
                      className="h-9 text-xs flex-1"
                      onClick={() => handleRsvp('TENTATIVE')}
                      disabled={respondToEvent.isPending}
                    >
                      <HelpCircle className="w-3.5 h-3.5 mr-1.5" />
                      Talvez
                    </Button>
                  </div>
                  {myParticipation.status !== 'PENDING' && (
                    <div className="text-xs text-muted-foreground mt-2">
                      Status atual:{' '}
                      <span className="font-medium">
                        {ParticipantStatusLabels[myParticipation.status as ParticipantStatus] ?? myParticipation.status}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Reminders */}
            {canManageReminders && myParticipation && (
              <>
                <div className="border-t border-border/50" />
                <div>
                  <div className="flex items-center gap-2 mb-2.5">
                    <Bell className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Lembrete
                    </span>
                  </div>
                  <Select
                    value={currentReminderValue}
                    onValueChange={handleReminderChange}
                  >
                    <SelectTrigger
                      className="w-full h-9 text-sm transition-colors"
                      style={currentReminderValue !== '0' ? { borderColor: eventColor } : undefined}
                    >
                      <SelectValue placeholder="Selecionar lembrete" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Sem lembrete</SelectItem>
                      {REMINDER_PRESETS.map((preset) => (
                        <SelectItem key={preset.value} value={String(preset.value)}>
                          {preset.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* Participants */}
            {participants.length > 0 && (
              <>
                <div className="border-t border-border/50" />
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Participantes ({participants.length})
                      </span>
                    </div>
                    {canInvite && isOwner && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setShowInviteDialog(true)}
                      >
                        <UserPlus className="w-3.5 h-3.5 mr-1" />
                        Convidar
                      </Button>
                    )}
                  </div>

                  {/* Avatar group (summary view) */}
                  {!showAllParticipants && participants.length > 0 && (
                    <div className="flex items-center mb-2">
                      <div className="flex -space-x-2">
                        {participants.slice(0, 8).map((p) => {
                          const displayName = p.userName ?? p.userEmail ?? p.userId;
                          const statusRing = STATUS_RING_COLORS[p.status] ?? STATUS_RING_COLORS.PENDING;
                          return (
                            <div
                              key={p.id}
                              title={`${displayName} — ${ParticipantRoleLabels[p.role] ?? p.role} · ${ParticipantStatusLabels[p.status] ?? p.status}`}
                              className={`w-8 h-8 rounded-full ring-2 ${statusRing} flex items-center justify-center text-[0.55rem] font-semibold text-white cursor-default`}
                              style={{ backgroundColor: `${eventColor}cc` }}
                            >
                              {getInitials(displayName)}
                            </div>
                          );
                        })}
                        {participants.length > 8 && (
                          <div className="w-8 h-8 rounded-full ring-2 ring-border bg-muted flex items-center justify-center text-[0.55rem] font-semibold text-muted-foreground">
                            +{participants.length - 8}
                          </div>
                        )}
                      </div>
                      {(canManageParticipants || participants.length > 3) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs ml-3 text-muted-foreground"
                          onClick={() => setShowAllParticipants(true)}
                        >
                          Ver todos
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Expanded participant list */}
                  {showAllParticipants && (
                    <div className="space-y-1.5">
                      {participants.map((p) => {
                        const displayName = p.userName ?? p.userEmail ?? p.userId;
                        const statusRing = STATUS_RING_COLORS[p.status] ?? STATUS_RING_COLORS.PENDING;
                        return (
                          <div
                            key={p.id}
                            className="flex items-center gap-2.5 py-1 px-2 rounded-md hover:bg-muted/50 dark:hover:bg-white/5 transition-colors"
                          >
                            <div
                              className={`w-7 h-7 rounded-full ring-2 ${statusRing} flex items-center justify-center text-[0.55rem] font-semibold text-white shrink-0`}
                              style={{ backgroundColor: `${eventColor}cc` }}
                            >
                              {getInitials(displayName)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm truncate font-medium">{displayName}</div>
                              <div className="text-[0.65rem] text-muted-foreground">
                                {ParticipantRoleLabels[p.role] ?? p.role} · {ParticipantStatusLabels[p.status] ?? p.status}
                              </div>
                            </div>
                            {canManageParticipants && isOwner && p.role !== 'OWNER' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                                onClick={() => {
                                  setParticipantToRemove(p.userId);
                                  setShowRemovePinModal(true);
                                }}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        );
                      })}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full h-7 text-xs text-muted-foreground"
                        onClick={() => setShowAllParticipants(false)}
                      >
                        Recolher
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* System source link */}
            {isSystem && event.systemSourceId && (
              <>
                <div className="border-t border-border/50" />
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 shrink-0">
                    <Link2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">Origem do sistema</div>
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 h-auto text-sm"
                      onClick={handleViewSource}
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1" />
                      {SYSTEM_SOURCE_LABELS[event.systemSourceType as SystemSourceType] ??
                        event.systemSourceType}
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Creator footer */}
            {event.creatorName && (
              <div className="text-xs text-muted-foreground pt-3 border-t border-border/50">
                Criado por <span className="font-medium text-foreground/70">{event.creatorName}</span>
              </div>
            )}

          </div>

          {/* Delete button at bottom, full-width */}
          {!isSystem && canDelete && (
            <div className="px-6 pb-6 mt-auto">
              <Button
                variant="ghost"
                className="w-full h-10 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 dark:text-rose-400 dark:hover:text-rose-300 dark:hover:bg-rose-500/10"
                onClick={() => setShowPinModal(true)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir evento
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete event PIN modal */}
      <VerifyActionPinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={handleDelete}
        title="Excluir Evento"
        description={`Tem certeza que deseja excluir o evento "${event.title}"? Digite seu PIN de Ação para confirmar.`}
      />

      {/* Remove participant PIN modal */}
      <VerifyActionPinModal
        isOpen={showRemovePinModal}
        onClose={() => {
          setShowRemovePinModal(false);
          setParticipantToRemove(null);
        }}
        onSuccess={handleRemoveParticipant}
        title="Remover Participante"
        description="Tem certeza que deseja remover este participante do evento? Digite seu PIN de Ação para confirmar."
      />

      {/* Unified invite & share dialog */}
      {showInviteDialog && (
        <InviteShareDialog
          event={event}
          open={showInviteDialog}
          onOpenChange={setShowInviteDialog}
        />
      )}
    </>
  );
}
