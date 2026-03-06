'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
  CommandGroup,
} from '@/components/ui/command';
import { calendarEventsService } from '@/services/calendar';
import type { CalendarEvent } from '@/types/calendar';
import { EVENT_TYPE_COLORS } from '@/types/calendar';
import { EVENT_TYPE_ICONS } from './event-type-badge';
import { EventTypeLabels } from '@/types/common/enums';
import { Search, Loader2, Calendar } from 'lucide-react';

interface EventSearchComboboxProps {
  onEventSelect: (event: CalendarEvent) => void;
}

function formatEventDate(dateStr: string, isAllDay: boolean): string {
  const date = new Date(dateStr);
  const day = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });
  if (isAllDay) return day;
  const time = date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${day} às ${time}`;
}

export function EventSearchCombobox({ onEventSelect }: EventSearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<CalendarEvent[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const doSearch = useCallback(async (query: string) => {
    setIsSearching(true);
    try {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 2, 0);

      const data = await calendarEventsService.list({
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        search: query,
        limit: 10,
      });
      setResults(data.events);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (!search || search.length < 2) {
      setResults([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      doSearch(search);
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, doSearch]);

  function handleSelect(event: CalendarEvent) {
    setOpen(false);
    setSearch('');
    setResults([]);
    onEventSelect(event);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative flex items-center gap-2 h-9 px-3 text-sm rounded-md border border-gray-200 dark:border-white/10 bg-white/95 dark:bg-white/5 text-muted-foreground hover:bg-accent/50 transition-colors flex-1 min-w-[180px] max-w-xs"
        >
          <Search className="w-4 h-4 shrink-0" />
          <span className="truncate">Buscar eventos...</span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[360px] p-0"
        align="start"
        sideOffset={4}
      >
        <Command shouldFilter={false}>
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder="Digite o nome do evento..."
          />
          <CommandList>
            {isSearching && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            )}

            {!isSearching && search.length >= 2 && results.length === 0 && (
              <CommandEmpty>Nenhum evento encontrado</CommandEmpty>
            )}

            {!isSearching && search.length < 2 && (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Calendar className="w-6 h-6 mb-2 opacity-40" />
                <span className="text-xs">
                  Digite ao menos 2 caracteres para buscar
                </span>
              </div>
            )}

            {!isSearching && results.length > 0 && (
              <CommandGroup heading="Resultados">
                {results.map((event) => {
                  const eventColor =
                    event.color ?? EVENT_TYPE_COLORS[event.type] ?? '#64748b';
                  const icon = EVENT_TYPE_ICONS[event.type];
                  const typeLabel = EventTypeLabels[event.type] ?? event.type;
                  const dateStr = event.occurrenceDate ?? event.startDate;

                  return (
                    <CommandItem
                      key={event.id + (event.occurrenceDate ?? '')}
                      value={event.id}
                      onSelect={() => handleSelect(event)}
                      className="flex items-center gap-3 py-2.5 px-2 cursor-pointer"
                    >
                      {/* Color dot + icon */}
                      <div
                        className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${eventColor}18` }}
                      >
                        <span style={{ color: eventColor }}>{icon}</span>
                      </div>

                      {/* Title + date + type */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {event.title}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span>{formatEventDate(dateStr, event.isAllDay)}</span>
                          <span className="opacity-40">·</span>
                          <span style={{ color: eventColor }}>{typeLabel}</span>
                        </div>
                      </div>

                      {/* Color indicator */}
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: eventColor }}
                      />
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
