'use client';

import { useState } from 'react';
import { Plus, X, Search } from 'lucide-react';
import { toast } from 'sonner';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { CardIntegration, IntegrationType } from '@/types/tasks';
import { INTEGRATION_CONFIG } from '@/types/tasks';

interface IntegrationLinkerProps {
  integrations: CardIntegration[];
  onAdd: (type: IntegrationType, entityId: string, entityLabel: string) => void;
  onRemove: (integrationId: string) => void;
}

const INTEGRATION_TYPES = Object.keys(INTEGRATION_CONFIG) as IntegrationType[];

export function IntegrationLinker({
  integrations,
  onRemove,
}: IntegrationLinkerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredTypes = INTEGRATION_TYPES.filter(type => {
    const config = INTEGRATION_CONFIG[type];
    return config.label.toLowerCase().includes(search.toLowerCase());
  });

  function handleTypeClick(_type: IntegrationType) {
    toast.info('Em breve — busca de integrações será implementada');
    setOpen(false);
    setSearch('');
  }

  return (
    <div className="space-y-1.5">
      {/* Existing integrations */}
      {integrations.map(integration => {
        const config = INTEGRATION_CONFIG[integration.type];
        return (
          <div
            key={integration.id}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs group"
            style={{
              backgroundColor: `hsl(${config.color} / 0.08)`,
              border: `1px solid hsl(${config.color} / 0.2)`,
            }}
          >
            <span className="shrink-0">{config.icon}</span>
            <span className="truncate flex-1" title={integration.entityLabel}>
              {integration.entityLabel}
            </span>
            <button
              type="button"
              className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity"
              onClick={() => onRemove(integration.id)}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}

      {/* Add button */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              'w-full flex items-center justify-center gap-1 rounded-md py-1 text-xs',
              'border border-dashed border-muted-foreground/30 text-muted-foreground',
              'hover:border-primary hover:text-primary transition-colors'
            )}
          >
            <Plus className="h-3 w-3" />
            Vincular
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-52 p-2" align="start">
          <div className="relative mb-2">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar tipo..."
              className="h-7 text-xs pl-7"
            />
          </div>
          <div className="space-y-0.5 max-h-48 overflow-y-auto">
            {filteredTypes.map(type => {
              const config = INTEGRATION_CONFIG[type];
              return (
                <button
                  key={type}
                  type="button"
                  className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted transition-colors"
                  onClick={() => handleTypeClick(type)}
                >
                  <span>{config.icon}</span>
                  <span>{config.label}</span>
                </button>
              );
            })}
            {filteredTypes.length === 0 && (
              <p className="text-[10px] text-muted-foreground px-2 py-2">
                Nenhum tipo encontrado
              </p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
