'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  UNIT_OF_MEASURE_LABELS,
  type UnitOfMeasure,
} from '@/types/stock';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface QuickCreateFormProps {
  onBack: () => void;
  onSubmit: (data: { name: string; unitOfMeasure: UnitOfMeasure }) => void;
}

const UOM_ENTRIES = Object.entries(UNIT_OF_MEASURE_LABELS) as [UnitOfMeasure, string][];

export function QuickCreateForm({ onBack, onSubmit }: QuickCreateFormProps) {
  const [name, setName] = useState('');
  const [unitOfMeasure, setUnitOfMeasure] = useState<UnitOfMeasure>('UNITS');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name: name.trim(), unitOfMeasure });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h3 className="text-lg font-semibold">Novo Template Manual</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="template-name">
            Nome do Template <span className="text-red-500">*</span>
          </Label>
          <Input
            id="template-name"
            ref={inputRef}
            placeholder="Ex: Eletrônicos, Roupas, Alimentos..."
            value={name}
            onChange={e => setName(e.target.value)}
            required
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="template-uom">Unidade de Medida</Label>
          <Select
            value={unitOfMeasure}
            onValueChange={v => setUnitOfMeasure(v as UnitOfMeasure)}
          >
            <SelectTrigger id="template-uom" className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UOM_ENTRIES.map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Você poderá configurar atributos e detalhes posteriormente.
          </p>
        </div>

        <Button type="submit" className="w-full" disabled={!name.trim()}>
          Criar Template
        </Button>
      </form>
    </div>
  );
}
