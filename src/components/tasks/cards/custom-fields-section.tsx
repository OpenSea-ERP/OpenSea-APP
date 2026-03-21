'use client';

import { useState } from 'react';
import { Settings2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon } from 'lucide-react';
import type { CustomField, CustomFieldType } from '@/types/tasks';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CustomFieldsSectionProps {
  boardId: string;
  fields: CustomField[];
  values: Record<string, string>;
  onChange: (fieldId: string, value: string) => void;
}

const FIELD_NONE_VALUE = '__NONE__';

function CompactFieldInput({
  field,
  value,
  onChange,
}: {
  field: CustomField;
  value: string;
  onChange: (value: string) => void;
}) {
  switch (field.type as CustomFieldType) {
    case 'TEXT':
      return (
        <Input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Texto..."
          className="h-7 text-xs"
        />
      );
    case 'NUMBER':
      return (
        <Input
          type="number"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="0"
          className="h-7 text-xs"
        />
      );
    case 'URL':
      return (
        <Input
          type="url"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="https://..."
          className="h-7 text-xs text-blue-500 underline"
        />
      );
    case 'EMAIL':
      return (
        <Input
          type="email"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="email@exemplo.com"
          className="h-7 text-xs"
        />
      );
    case 'CHECKBOX':
      return (
        <div className="flex items-center h-7">
          <Checkbox
            checked={value === 'true'}
            onCheckedChange={checked => onChange(String(!!checked))}
          />
        </div>
      );
    case 'DATE': {
      const dateValue = value ? new Date(value) : undefined;
      return (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs justify-start gap-1.5 font-normal w-full"
            >
              <CalendarIcon className="h-3 w-3" />
              {dateValue
                ? format(dateValue, "dd 'de' MMM yyyy", { locale: ptBR })
                : 'Selecionar...'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateValue}
              onSelect={d => onChange(d ? d.toISOString() : '')}
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
      );
    }
    case 'SELECT':
      return (
        <Select
          value={value || FIELD_NONE_VALUE}
          onValueChange={v => onChange(v === FIELD_NONE_VALUE ? '' : v)}
        >
          <SelectTrigger className="h-7 text-xs">
            <SelectValue placeholder="Selecionar..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={FIELD_NONE_VALUE}>
              <span className="text-muted-foreground">Nenhum</span>
            </SelectItem>
            {(field.options ?? []).map(opt => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case 'MULTI_SELECT': {
      const selectedValues = value ? value.split(',').filter(Boolean) : [];
      return (
        <div className="space-y-0.5">
          {(field.options ?? []).map(opt => {
            const isChecked = selectedValues.includes(opt);
            return (
              <label
                key={opt}
                className="flex items-center gap-1.5 cursor-pointer text-xs"
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={checked => {
                    const next = checked
                      ? [...selectedValues, opt]
                      : selectedValues.filter(v => v !== opt);
                    onChange(next.join(','));
                  }}
                />
                {opt}
              </label>
            );
          })}
        </div>
      );
    }
    default:
      return (
        <Input
          value={value}
          onChange={e => onChange(e.target.value)}
          className="h-7 text-xs"
        />
      );
  }
}

export function CustomFieldsSection({
  fields,
  values,
  onChange,
}: CustomFieldsSectionProps) {
  const [configOpen, setConfigOpen] = useState(false);
  const [visibleFieldIds, setVisibleFieldIds] = useState<Set<string>>(
    () => new Set(fields.map(f => f.id))
  );

  function toggleFieldVisibility(fieldId: string) {
    setVisibleFieldIds(prev => {
      const next = new Set(prev);
      if (next.has(fieldId)) {
        next.delete(fieldId);
      } else {
        next.add(fieldId);
      }
      return next;
    });
  }

  const visibleFields = fields.filter(f => visibleFieldIds.has(f.id));

  if (fields.length === 0) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Campos personalizados
          </p>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Nenhum campo configurado neste quadro
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Campos personalizados
        </p>
        <Popover open={configOpen} onOpenChange={setConfigOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors"
            >
              <Settings2 className="h-3 w-3" />
              Campos
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-52 p-2" align="end">
            <div className="space-y-0.5 max-h-48 overflow-y-auto">
              {fields.map(field => (
                <button
                  key={field.id}
                  type="button"
                  className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted transition-colors"
                  onClick={() => toggleFieldVisibility(field.id)}
                >
                  <Checkbox
                    checked={visibleFieldIds.has(field.id)}
                    className="pointer-events-none"
                  />
                  <span className="truncate">{field.name}</span>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Fields grid */}
      {visibleFields.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-3 gap-y-2">
          {visibleFields.map(field => (
            <div key={field.id} className="space-y-0.5">
              <label className="text-[10px] font-medium text-muted-foreground flex items-center gap-0.5">
                {field.name}
                {field.isRequired && (
                  <span className="text-rose-500">*</span>
                )}
              </label>
              <CompactFieldInput
                field={field}
                value={values[field.id] ?? ''}
                onChange={v => onChange(field.id, v)}
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[10px] text-muted-foreground">
          Nenhum campo visível
        </p>
      )}
    </div>
  );
}
