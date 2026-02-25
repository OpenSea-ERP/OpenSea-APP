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
import { ParticipantInviteDialog } from './participant-invite-dialog';
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
import type { CalendarEvent, ParticipantStatus, SystemSourceType } from '@/types/calendar';
import { EVENT_TYPE_COLORS, REMINDER_PRESETS, SYSTEM_SOURCE_ROUTES, SYSTEM_SOURCE_LABELS } from '@/types/calendar';
import {
  MapPin,
  Clock,
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
  canManageParticipants?: boolean;
  canManageReminders?: boolean;
  currentUserId?: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function EventDetailSheet({
  event,
  open,
  onOpenChange,
  onEdit,
  canEdit = false,
  canDelete = false,
  canInvite = false,
  canRespond = false,
  canManageParticipants = false,
  canManageReminders = false,
  currentUserId,
}: EventDetailSheetProps) {
  const [showPinModal, setShowPinModal] = useState(false);
  const [showRemovePinModal, setShowRemovePinModal] = useState(false);
  const [participantToRemove, setParticipantToRemove] = useState<string | null>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const deleteEvent = useDeleteCalendarEvent();
  const respondToEvent = useRespondToEvent();
  const removeParticipant = useRemoveParticipant();
  const manageReminders = useManageReminders();
  const router = useRouter();

  if (!event) return null;

  const isSystem = !!event.systemSourceType;
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  const eventColor = event.color ?? EVENT_TYPE_COLORS[event.type] ?? '#64748b';

  const myParticipation = currentUserId
    ? event.participants.find((p) => p.userId === currentUserId)
    : null;
  const isOwner = myParticipation?.role === 'OWNER';

  const myReminders = currentUserId
    ? event.reminders.filter((r) => r.userId === currentUserId)
    : [];

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

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="sm:max-w-[480px] overflow-y-auto p-0">
          {/* Color stripe */}
          <div
            className="h-1.5 w-full rounded-t-lg"
            style={{ backgroundColor: eventColor }}
          />

          <div className="px-6 pt-5 pb-6">
            <SheetHeader className="space-y-3">
              {/* Badges row */}
              <div className="flex items-center gap-2 flex-wrap">
                <EventTypeBadge type={event.type} />
                <Badge variant="secondary" className="text-xs">
                  <Eye className="w-3 h-3 mr-1" />
                  {EventVisibilityLabels[event.visibility] ?? event.visibility}
                </Badge>
                {event.isRecurring && (
                  <Badge variant="secondary" className="text-xs">
                    <Repeat className="w-3 h-3 mr-1" />
                    Recorrente
                  </Badge>
                )}
                {isSystem && (
                  <Badge variant="outline" className="text-xs text-amber-600 border-amber-300 dark:text-amber-400 dark:border-amber-500/40">
                    Sistema
                  </Badge>
                )}
              </div>

              {/* Title */}
              <SheetTitle className="text-xl font-bold leading-tight">
                {event.title}
              </SheetTitle>
            </SheetHeader>

            <div className="space-y-3 mt-5">
              {/* Date & Time + Location */}
              <div className="rounded-lg bg-muted/50 dark:bg-white/5 p-3 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <Clock className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                  <div className="text-sm">
                    <div className="font-medium">{formatDate(startDate)}</div>
                    <div className="text-muted-foreground">até {formatDate(endDate)}</div>
                  </div>
                </div>

                {event.location && (
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                    <span className="text-sm">{event.location}</span>
                  </div>
                )}
              </div>

              {/* Description */}
              {event.description && (
                <div className="rounded-lg bg-muted/50 dark:bg-white/5 p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Descrição
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{event.description}</p>
                </div>
              )}

              {/* RSVP */}
              {canRespond && myParticipation && !isOwner && (
                <div className="rounded-lg bg-muted/50 dark:bg-white/5 p-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
                    Responder ao convite
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={myParticipation.status === 'ACCEPTED' ? 'default' : 'outline'}
                      className="h-8 text-xs"
                      onClick={() => handleRsvp('ACCEPTED')}
                      disabled={respondToEvent.isPending}
                    >
                      <Check className="w-3.5 h-3.5 mr-1" />
                      Aceitar
                    </Button>
                    <Button
                      size="sm"
                      variant={myParticipation.status === 'DECLINED' ? 'destructive' : 'outline'}
                      className="h-8 text-xs"
                      onClick={() => handleRsvp('DECLINED')}
                      disabled={respondToEvent.isPending}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" />
                      Recusar
                    </Button>
                    <Button
                      size="sm"
                      variant={myParticipation.status === 'TENTATIVE' ? 'secondary' : 'outline'}
                      className="h-8 text-xs"
                      onClick={() => handleRsvp('TENTATIVE')}
                      disabled={respondToEvent.isPending}
                    >
                      <HelpCircle className="w-3.5 h-3.5 mr-1" />
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
              )}

              {/* Reminders */}
              {canManageReminders && myParticipation && (
                <div className="rounded-lg bg-muted/50 dark:bg-white/5 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Bell className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Lembrete
                    </span>
                  </div>
                  <Select
                    value={currentReminderValue}
                    onValueChange={handleReminderChange}
                  >
                    <SelectTrigger className="w-full h-8 text-sm">
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
              )}

              {/* Participants */}
              {event.participants && event.participants.length > 0 && (
                <div className="rounded-lg bg-muted/50 dark:bg-white/5 p-3">
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Participantes ({event.participants.length})
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
                  <div className="space-y-2">
                    {event.participants.map((p) => {
                      const displayName = p.userName ?? p.userEmail ?? p.userId;
                      return (
                        <div
                          key={p.id}
                          className="flex items-center gap-2.5"
                        >
                          <div
                            className="w-7 h-7 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-[0.6rem] font-semibold text-primary shrink-0"
                          >
                            {getInitials(displayName)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm truncate">{displayName}</div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Badge variant="outline" className="text-[0.6rem] px-1.5 py-0">
                              {ParticipantRoleLabels[p.role] ?? p.role}
                            </Badge>
                            <Badge variant="secondary" className="text-[0.6rem] px-1.5 py-0">
                              {ParticipantStatusLabels[p.status] ?? p.status}
                            </Badge>
                            {canManageParticipants && isOwner && p.role !== 'OWNER' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                onClick={() => {
                                  setParticipantToRemove(p.userId);
                                  setShowRemovePinModal(true);
                                }}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* System source link */}
              {isSystem && event.systemSourceId && (
                <div className="rounded-lg bg-muted/50 dark:bg-white/5 p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Link2 className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Origem
                    </span>
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto text-sm"
                    onClick={handleViewSource}
                  >
                    <ExternalLink className="w-3.5 h-3.5 mr-1" />
                    Ver origem:{' '}
                    {SYSTEM_SOURCE_LABELS[event.systemSourceType as SystemSourceType] ??
                      event.systemSourceType}
                  </Button>
                </div>
              )}

              {/* Creator footer */}
              {event.creatorName && (
                <div className="text-xs text-muted-foreground pt-1">
                  Criado por {event.creatorName}
                </div>
              )}

              {/* Actions */}
              {!isSystem && (canEdit || canDelete) && (
                <div className="flex gap-2 pt-3 border-t border-border">
                  {canEdit && onEdit && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8"
                      onClick={() => {
                        onEdit(event);
                        onOpenChange(false);
                      }}
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1.5" />
                      Editar
                    </Button>
                  )}
                  {canDelete && (
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-8"
                      onClick={() => setShowPinModal(true)}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                      Excluir
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
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

      {/* Invite participants dialog */}
      {showInviteDialog && (
        <ParticipantInviteDialog
          event={event}
          open={showInviteDialog}
          onOpenChange={setShowInviteDialog}
        />
      )}
    </>
  );
}
