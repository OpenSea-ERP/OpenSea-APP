'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Gauge } from 'lucide-react';
import { toast } from 'sonner';

interface ColumnWipLimitPopoverProps {
  columnId: string;
  wipLimit: number | null | undefined;
  onSaveWip: (columnId: string, wipLimit: number | null) => void;
}

export function ColumnWipLimitPopover({
  columnId,
  wipLimit,
  onSaveWip,
}: ColumnWipLimitPopoverProps) {
  const [showWipPopover, setShowWipPopover] = useState(false);
  const [wipValue, setWipValue] = useState(wipLimit?.toString() ?? '');

  function handleSaveWip() {
    const parsed = wipValue.trim() === '' ? null : parseInt(wipValue, 10);
    if (parsed !== null && (isNaN(parsed) || parsed < 0)) {
      toast.error('Limite inválido.');
      return;
    }

    onSaveWip(columnId, parsed);
    setShowWipPopover(false);
  }

  function handleClearWip() {
    onSaveWip(columnId, null);
    setWipValue('');
    setShowWipPopover(false);
  }

  return (
    <Popover open={showWipPopover} onOpenChange={setShowWipPopover}>
      <PopoverTrigger asChild>
        <DropdownMenuItem
          onSelect={e => {
            e.preventDefault();
            setShowWipPopover(true);
          }}
        >
          <Gauge className="h-4 w-4 mr-2" />
          Limite de cartões
          {wipLimit && (
            <span className="ml-auto text-xs text-muted-foreground">
              {wipLimit}
            </span>
          )}
        </DropdownMenuItem>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" side="right" align="start">
        <div className="space-y-2">
          <label
            htmlFor="col-wip-limit"
            className="text-xs font-medium text-muted-foreground"
          >
            Máximo de cartões nesta coluna
          </label>
          <Input
            id="col-wip-limit"
            type="number"
            min={0}
            placeholder="Sem limite"
            value={wipValue}
            onChange={e => setWipValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSaveWip();
              if (e.key === 'Escape') setShowWipPopover(false);
            }}
            className="h-8"
            autoFocus
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 h-7"
              onClick={handleSaveWip}
            >
              Salvar
            </Button>
            {wipLimit && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7"
                onClick={handleClearWip}
              >
                Limpar
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
