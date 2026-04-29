'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useUpdatePosTerminal } from '@/hooks/sales';
import {
  usePosTerminalZones,
  useAssignTerminalZone,
  useRemoveTerminalZone,
} from '@/hooks/sales/use-pos-terminal-zones';
import { useAllZones } from '@/app/(dashboard)/(modules)/stock/(entities)/locations/src/api/zones.queries';
import type { PosTerminal, PosTerminalMode, PosZoneTier } from '@/types/sales';
import { cn } from '@/lib/utils';
import {
  Banknote,
  Loader2,
  MapPin,
  Monitor,
  Plus,
  ScanLine,
  Settings,
  ShoppingBag,
  Star,
  Trash2,
  Warehouse,
  X,
} from 'lucide-react';

interface Props {
  open: boolean;
  terminal: PosTerminal | null;
  onOpenChange: (open: boolean) => void;
}

const MODE_OPTIONS: PosTerminalMode[] = [
  'SALES_ONLY',
  'SALES_WITH_CHECKOUT',
  'CASHIER',
  'TOTEM',
];

const MODE_LABELS: Record<
  PosTerminalMode,
  { label: string; icon: React.ElementType }
> = {
  SALES_ONLY: { label: 'Só Vendas', icon: ShoppingBag },
  SALES_WITH_CHECKOUT: { label: 'Venda + Cobrança', icon: Monitor },
  CASHIER: { label: 'Caixa', icon: Banknote },
  TOTEM: { label: 'Autoatendimento', icon: ScanLine },
};

export function EditTerminalDialog({ open, terminal, onOpenChange }: Props) {
  const [tab, setTab] = useState<'general' | 'zones'>('general');

  // Reset tab when reopening for a different terminal
  useEffect(() => {
    if (open) setTab('general');
  }, [open, terminal?.id]);

  if (!terminal) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar terminal</DialogTitle>
          <DialogDescription>
            {terminal.terminalName} · {terminal.terminalCode}
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={tab}
          onValueChange={v => setTab(v as 'general' | 'zones')}
          className="mt-2"
        >
          <TabsList className="grid grid-cols-2 w-full h-12">
            <TabsTrigger value="general">
              <Settings className="h-4 w-4 mr-2" />
              Geral
            </TabsTrigger>
            <TabsTrigger value="zones">
              <MapPin className="h-4 w-4 mr-2" />
              Zonas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-4">
            <GeneralTab
              terminal={terminal}
              onClose={() => onOpenChange(false)}
            />
          </TabsContent>

          <TabsContent value="zones" className="mt-4">
            <ZonesTab terminal={terminal} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// Aba Geral
// ============================================================================

function GeneralTab({
  terminal,
  onClose,
}: {
  terminal: PosTerminal;
  onClose: () => void;
}) {
  const [name, setName] = useState(terminal.terminalName);
  const [mode, setMode] = useState<PosTerminalMode>(terminal.mode);
  const [acceptsPending, setAcceptsPending] = useState(
    terminal.acceptsPendingOrders
  );

  const updateTerminal = useUpdatePosTerminal();

  async function handleSave() {
    await updateTerminal.mutateAsync({
      id: terminal.id,
      data: {
        terminalName: name.trim(),
        mode,
        acceptsPendingOrders: acceptsPending,
      },
    });
    onClose();
  }

  const dirty =
    name.trim() !== terminal.terminalName ||
    mode !== terminal.mode ||
    acceptsPending !== terminal.acceptsPendingOrders;

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="edit-terminal-name">Nome do terminal</Label>
        <Input
          id="edit-terminal-name"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Ex.: Caixa 01"
        />
      </div>

      <div className="space-y-2">
        <Label>Modo de operação</Label>
        <div className="grid grid-cols-2 gap-2">
          {MODE_OPTIONS.map(m => {
            const Icon = MODE_LABELS[m].icon;
            const selected = mode === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
                  selected
                    ? 'bg-violet-50 border-violet-300 text-violet-700 dark:bg-violet-500/10 dark:border-violet-500/40 dark:text-violet-200'
                    : 'border-border hover:bg-slate-50 dark:hover:bg-slate-800/40'
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{MODE_LABELS[m].label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Pedidos pendentes</Label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={acceptsPending}
            onChange={e => setAcceptsPending(e.target.checked)}
            className="h-4 w-4"
          />
          <span>Aceitar pedidos pendentes neste terminal</span>
        </label>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        <Button variant="outline" size="sm" onClick={onClose}>
          Cancelar
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!dirty || !name.trim() || updateTerminal.isPending}
        >
          {updateTerminal.isPending ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// Aba Zonas
// ============================================================================

function ZonesTab({ terminal }: { terminal: PosTerminal }) {
  const linked = usePosTerminalZones(terminal.id);
  const allZones = useAllZones();
  const assignZone = useAssignTerminalZone(terminal.id);
  const removeZone = useRemoveTerminalZone(terminal.id);

  const linkedZones = linked.data?.zones ?? [];
  const linkedIds = new Set(linkedZones.map(l => l.zoneId));
  const availableZones = (allZones.data ?? []).filter(
    z => !linkedIds.has(z.id)
  );

  const [adding, setAdding] = useState(false);
  const [pickedZoneId, setPickedZoneId] = useState<string | null>(null);
  const [pickedTier, setPickedTier] = useState<PosZoneTier>('PRIMARY');

  async function handleAdd() {
    if (!pickedZoneId) return;
    await assignZone.mutateAsync({ zoneId: pickedZoneId, tier: pickedTier });
    setAdding(false);
    setPickedZoneId(null);
    setPickedTier('PRIMARY');
  }

  async function handleRetier(zoneId: string, currentTier: PosZoneTier) {
    const next: PosZoneTier =
      currentTier === 'PRIMARY' ? 'SECONDARY' : 'PRIMARY';
    await assignZone.mutateAsync({ zoneId, tier: next });
  }

  if (linked.isLoading || allZones.isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/30 p-3 text-xs text-violet-700 dark:text-violet-200">
        <p>
          <strong>Zonas vinculadas determinam o catálogo</strong> que o terminal
          recebe. Sem zona ativa, o Emporion não baixa produtos. Itens em zonas
          PRIMARY são preferenciais; SECONDARY entram como reserva.
        </p>
      </div>

      {/* Zonas vinculadas */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">
            Zonas vinculadas ({linkedZones.length})
          </h4>
          {!adding && availableZones.length > 0 && (
            <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Adicionar
            </Button>
          )}
        </div>

        {linkedZones.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nenhuma zona vinculada. Adicione ao menos uma para que o terminal
            receba catálogo.
          </div>
        ) : (
          <div className="space-y-2">
            {linkedZones.map(link => (
              <div
                key={link.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5"
              >
                <Warehouse className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">
                      {link.zone.name}
                    </span>
                    <code className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300">
                      {link.zone.code}
                    </code>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {link.zone.warehouseName}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRetier(link.zoneId, link.tier)}
                  disabled={assignZone.isPending}
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border transition-colors',
                    link.tier === 'PRIMARY'
                      ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-500/15 dark:text-slate-300 dark:border-slate-500/30'
                  )}
                >
                  <Star
                    className={cn(
                      'h-3 w-3',
                      link.tier === 'PRIMARY' && 'fill-current'
                    )}
                  />
                  {link.tier === 'PRIMARY' ? 'Principal' : 'Secundária'}
                </button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                  onClick={() => removeZone.mutate(link.zoneId)}
                  disabled={removeZone.isPending}
                  title="Desvincular zona"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Painel "Adicionar zona" inline */}
      {adding && (
        <div className="rounded-lg border border-violet-200 dark:border-violet-500/30 bg-violet-50/50 dark:bg-violet-500/5 p-3 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">Adicionar zona</h4>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => {
                setAdding(false);
                setPickedZoneId(null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {availableZones.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Não há zonas disponíveis. Crie zonas em Estoque → Localizações.
            </p>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label className="text-xs">Zona</Label>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {availableZones.map(z => {
                    const selected = pickedZoneId === z.id;
                    return (
                      <button
                        key={z.id}
                        type="button"
                        onClick={() => setPickedZoneId(z.id)}
                        className={cn(
                          'w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs border transition-colors',
                          selected
                            ? 'bg-violet-100 border-violet-300 dark:bg-violet-500/20 dark:border-violet-500/50'
                            : 'border-transparent hover:bg-violet-100/50 dark:hover:bg-violet-500/10'
                        )}
                      >
                        <Warehouse className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="font-medium truncate">{z.name}</span>
                        <code className="font-mono text-[10px] text-muted-foreground">
                          {z.code}
                        </code>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Prioridade</Label>
                <div className="flex gap-2">
                  {(['PRIMARY', 'SECONDARY'] as PosZoneTier[]).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setPickedTier(t)}
                      className={cn(
                        'flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors',
                        pickedTier === t
                          ? t === 'PRIMARY'
                            ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/20 dark:text-amber-200 dark:border-amber-500/40'
                            : 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-500/20 dark:text-slate-200 dark:border-slate-500/40'
                          : 'border-border hover:bg-white/50'
                      )}
                    >
                      <Star
                        className={cn(
                          'h-3 w-3',
                          pickedTier === t && t === 'PRIMARY' && 'fill-current'
                        )}
                      />
                      {t === 'PRIMARY' ? 'Principal' : 'Secundária'}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                size="sm"
                className="w-full"
                onClick={handleAdd}
                disabled={!pickedZoneId || assignZone.isPending}
              >
                {assignZone.isPending ? 'Vinculando...' : 'Vincular zona'}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
