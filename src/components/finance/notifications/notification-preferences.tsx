'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNotificationPreferences } from '@/hooks/finance';

interface NotificationPreferencesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationPreferences({
  open,
  onOpenChange,
}: NotificationPreferencesProps) {
  const { prefs, updatePreferences } = useNotificationPreferences();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Preferencias de Notificacao</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overdue toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notif-overdue">Notificar contas vencidas</Label>
              <p className="text-xs text-muted-foreground">
                Exibir alerta quando houver contas vencidas
              </p>
            </div>
            <Switch
              id="notif-overdue"
              checked={prefs.notifOverdue}
              onCheckedChange={(checked) =>
                updatePreferences({ notifOverdue: checked })
              }
            />
          </div>

          {/* Due soon toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notif-due-soon">Notificar vencimento proximo</Label>
              <p className="text-xs text-muted-foreground">
                Alertar sobre contas proximas do vencimento
              </p>
            </div>
            <Switch
              id="notif-due-soon"
              checked={prefs.notifDueSoon}
              onCheckedChange={(checked) =>
                updatePreferences({ notifDueSoon: checked })
              }
            />
          </div>

          {/* Days before */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notif-days">Dias de antecedencia</Label>
              <p className="text-xs text-muted-foreground">
                Quantos dias antes do vencimento notificar
              </p>
            </div>
            <Select
              value={String(prefs.notifDueDaysBefore)}
              onValueChange={(v) =>
                updatePreferences({ notifDueDaysBefore: Number(v) })
              }
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 3, 5, 7].map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Daily summary toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notif-daily">Resumo diario</Label>
              <p className="text-xs text-muted-foreground">
                Exibir banner com resumo financeiro do dia
              </p>
            </div>
            <Switch
              id="notif-daily"
              checked={prefs.notifDailySummary}
              onCheckedChange={(checked) =>
                updatePreferences({ notifDailySummary: checked })
              }
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
