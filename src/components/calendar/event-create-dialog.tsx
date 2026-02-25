'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RecurrencePicker } from './recurrence-picker';
import { useCreateCalendarEvent } from '@/hooks/calendar';
import { EventTypeLabels } from '@/types/common/enums';
import type { EventType, EventVisibility } from '@/types/calendar';
import {
  CalendarPlus,
  Clock,
  Settings2,
  Repeat,
  MapPin,
  AlignLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

interface EventCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: Date;
}

const EVENT_TYPES = Object.entries(EventTypeLabels) as [EventType, string][];

const COLOR_PRESETS = [
  { value: '#3b82f6', label: 'Azul' },
  { value: '#10b981', label: 'Verde' },
  { value: '#f59e0b', label: 'Amarelo' },
  { value: '#ef4444', label: 'Vermelho' },
  { value: '#8b5cf6', label: 'Roxo' },
  { value: '#ec4899', label: 'Rosa' },
  { value: '#06b6d4', label: 'Ciano' },
  { value: '#f97316', label: 'Laranja' },
];

export function EventCreateDialog({
  open,
  onOpenChange,
  defaultDate,
}: EventCreateDialogProps) {
  const createEvent = useCreateCalendarEvent();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [type, setType] = useState<EventType>('CUSTOM');
  const [visibility, setVisibility] = useState<EventVisibility>('PUBLIC');
  const [color, setColor] = useState('');
  const [rrule, setRrule] = useState<string | null>(null);

  const [showDescription, setShowDescription] = useState(false);
  const [showLocation, setShowLocation] = useState(false);
  const [showRecurrence, setShowRecurrence] = useState(false);

  // Reset form and sync dates when dialog opens
  useEffect(() => {
    if (open) {
      const now = new Date();
      const start = defaultDate ? new Date(defaultDate) : now;
      if (defaultDate) {
        start.setHours(now.getHours(), now.getMinutes(), 0, 0);
      }
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      setTitle('');
      setDescription('');
      setLocation('');
      setStartDate(formatDateTimeLocal(start));
      setEndDate(formatDateTimeLocal(end));
      setIsAllDay(false);
      setType('CUSTOM');
      setVisibility('PUBLIC');
      setColor('');
      setRrule(null);
      setShowDescription(false);
      setShowLocation(false);
      setShowRecurrence(false);
    }
  }, [open, defaultDate]);

  async function handleSubmit() {
    if (!title.trim()) {
      toast.error('O título é obrigatório');
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      toast.error('A data de fim deve ser posterior à data de início');
      return;
    }

    try {
      await createEvent.mutateAsync({
        title: title.trim(),
        description: description || null,
        location: location || null,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        isAllDay,
        type,
        visibility,
        color: color || null,
        rrule,
      });

      toast.success('Evento criado com sucesso');
      onOpenChange(false);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro ao criar evento';
      toast.error(msg);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-lg">
              <div className="p-2 rounded-lg bg-primary/10">
                <CalendarPlus className="w-4 h-4 text-primary" />
              </div>
              Novo Evento
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Title - always visible */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Título *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome do evento"
              maxLength={256}
            />
          </div>

          {/* Description - collapsible */}
          <Collapsible open={showDescription} onOpenChange={setShowDescription}>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer group w-full">
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showDescription ? 'rotate-90' : ''}`} />
              <AlignLeft className="w-3.5 h-3.5" />
              <span>Adicionar descrição</span>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição do evento"
                rows={2}
                className="resize-none"
              />
            </CollapsibleContent>
          </Collapsible>

          {/* Location - collapsible */}
          <Collapsible open={showLocation} onOpenChange={setShowLocation}>
            <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer group w-full">
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showLocation ? 'rotate-90' : ''}`} />
              <MapPin className="w-3.5 h-3.5" />
              <span>Adicionar local</span>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Local do evento"
                maxLength={512}
              />
            </CollapsibleContent>
          </Collapsible>

          <div className="border-t border-border/50" />

          {/* Date & Time - always visible */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                Data e hora
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground cursor-pointer">Dia inteiro</Label>
                <Switch checked={isAllDay} onCheckedChange={setIsAllDay} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Início *</Label>
                <Input
                  type={isAllDay ? 'date' : 'datetime-local'}
                  value={isAllDay ? startDate.slice(0, 10) : startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Fim *</Label>
                <Input
                  type={isAllDay ? 'date' : 'datetime-local'}
                  value={isAllDay ? endDate.slice(0, 10) : endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-border/50" />

          {/* Settings - always visible */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Settings2 className="w-3.5 h-3.5" />
              Configurações
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm">Tipo</Label>
                <Select value={type} onValueChange={(val) => setType(val as EventType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Visibilidade</Label>
                <Select
                  value={visibility}
                  onValueChange={(val) => setVisibility(val as EventVisibility)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLIC">Público</SelectItem>
                    <SelectItem value="PRIVATE">Privado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm">Cor</Label>
              <div className="flex items-center gap-1.5">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => setColor(color === preset.value ? '' : preset.value)}
                    className="w-7 h-7 rounded-full border-2 transition-all hover:scale-110"
                    style={{
                      backgroundColor: preset.value,
                      borderColor: color === preset.value ? 'var(--color-foreground)' : 'transparent',
                    }}
                    title={preset.label}
                    aria-label={`Selecionar cor ${preset.label}`}
                  />
                ))}
                <span className="text-xs text-muted-foreground ml-2">
                  {color ? '' : 'Automática'}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-border/50" />

          {/* Recurrence */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Repeat className="w-3.5 h-3.5" />
                Recorrência
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground cursor-pointer">Repetir evento</Label>
                <Switch
                  checked={showRecurrence}
                  onCheckedChange={(checked) => {
                    setShowRecurrence(checked);
                    if (!checked) setRrule(null);
                  }}
                />
              </div>
            </div>

            {showRecurrence && (
              <RecurrencePicker value={rrule} onChange={setRrule} />
            )}
          </div>
        </div>

        <div className="px-6 pb-6 pt-2 border-t border-border/50">
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={createEvent.isPending}>
              <CalendarPlus className="w-4 h-4 mr-1.5" />
              {createEvent.isPending ? 'Criando...' : 'Criar Evento'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function formatDateTimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
