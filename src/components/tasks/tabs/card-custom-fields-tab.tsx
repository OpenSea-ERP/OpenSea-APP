'use client';

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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
import { CalendarIcon, Settings2 } from 'lucide-react';
import { useCustomFields, useSetCustomFieldValues } from '@/hooks/tasks/use-custom-fields';
import { useCard } from '@/hooks/tasks/use-cards';
import type { CustomField, CustomFieldType } from '@/types/tasks';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CardCustomFieldsTabProps {
  boardId: string;
  cardId: string;
}

const FIELD_NONE_VALUE = '__NONE__';

function FieldInput({
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
          onChange={(e) => onChange(e.target.value)}
          placeholder="Texto..."
          className="h-8 text-sm"
        />
      );
    case 'NUMBER':
      return (
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0"
          className="h-8 text-sm"
        />
      );
    case 'URL':
      return (
        <Input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          className="h-8 text-sm"
        />
      );
    case 'EMAIL':
      return (
        <Input
          type="email"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="email@exemplo.com"
          className="h-8 text-sm"
        />
      );
    case 'CHECKBOX':
      return (
        <div className="flex items-center h-8">
          <Checkbox
            checked={value === 'true'}
            onCheckedChange={(checked) => onChange(String(!!checked))}
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
              className="h-8 text-sm justify-start gap-2 font-normal"
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              {dateValue
                ? format(dateValue, "dd 'de' MMM yyyy", { locale: ptBR })
                : 'Selecionar data...'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateValue}
              onSelect={(d) => onChange(d ? d.toISOString() : '')}
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
          onValueChange={(v) => onChange(v === FIELD_NONE_VALUE ? '' : v)}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="Selecionar..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={FIELD_NONE_VALUE}>
              <span className="text-muted-foreground">Nenhum</span>
            </SelectItem>
            {(field.options ?? []).map((opt) => (
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
        <div className="space-y-1">
          {(field.options ?? []).map((opt) => {
            const isChecked = selectedValues.includes(opt);
            return (
              <label
                key={opt}
                className="flex items-center gap-2 cursor-pointer text-sm"
              >
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={(checked) => {
                    const next = checked
                      ? [...selectedValues, opt]
                      : selectedValues.filter((v) => v !== opt);
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
          onChange={(e) => onChange(e.target.value)}
          className="h-8 text-sm"
        />
      );
  }
}

export function CardCustomFieldsTab({ boardId, cardId }: CardCustomFieldsTabProps) {
  const { data: fieldsData, isLoading: isLoadingFields } = useCustomFields(boardId);
  const { data: cardData } = useCard(boardId, cardId);
  const setValues = useSetCustomFieldValues(boardId);

  const customFields = fieldsData?.customFields ?? [];
  const card = cardData?.card;
  const existingValues = card?.customFieldValues ?? [];

  // Local state for field values
  const [localValues, setLocalValues] = useState<Record<string, string>>({});
  const [isDirty, setIsDirty] = useState(false);

  // Initialize local values from card data
  useEffect(() => {
    const vals: Record<string, string> = {};
    for (const fv of existingValues) {
      vals[fv.fieldId] = fv.value ?? '';
    }
    setLocalValues(vals);
    setIsDirty(false);
  }, [existingValues]);

  const handleFieldChange = useCallback((fieldId: string, value: string) => {
    setLocalValues((prev) => ({ ...prev, [fieldId]: value }));
    setIsDirty(true);
  }, []);

  const handleSave = useCallback(() => {
    const changedValues = customFields
      .map((field) => {
        const newValue = localValues[field.id] ?? '';
        const existingValue = existingValues.find((v) => v.fieldId === field.id)?.value ?? '';
        if (newValue === existingValue) return null;
        return { fieldId: field.id, value: newValue || null };
      })
      .filter(Boolean) as { fieldId: string; value: string | null }[];

    if (changedValues.length === 0) {
      toast.info('Nenhuma alteração para salvar');
      return;
    }

    setValues.mutate(
      { cardId, values: changedValues },
      {
        onSuccess: () => {
          setIsDirty(false);
          toast.success('Campos atualizados');
        },
        onError: () => toast.error('Erro ao salvar campos'),
      },
    );
  }, [customFields, localValues, existingValues, cardId, setValues]);

  if (isLoadingFields) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (customFields.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground w-full">
        <Settings2 className="h-8 w-8 mb-2 opacity-50" />
        <p className="text-sm">Nenhum campo customizado configurado neste quadro</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 flex-col w-full">
      <div className="space-y-4">
        {customFields.map((field) => (
          <div key={field.id} className="space-y-1">
            <label className="text-sm font-medium flex items-center gap-1">
              {field.name}
              {field.isRequired && <span className="text-destructive">*</span>}
            </label>
            <FieldInput
              field={field}
              value={localValues[field.id] ?? ''}
              onChange={(v) => handleFieldChange(field.id, v)}
            />
          </div>
        ))}
      </div>

      {isDirty && (
        <div className="flex justify-end pt-2 border-t border-border">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={setValues.isPending}
          >
            Salvar
          </Button>
        </div>
      )}
    </div>
  );
}
