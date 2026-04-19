'use client';

import {
  Bell,
  Mail,
  Monitor,
  Moon,
  Send,
  Smartphone,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { useMultiplePermissions } from '@/hooks/use-permissions';

import { ModulePreferencesGrid } from '@/features/notifications/components/preferences/module-preferences-grid';
import {
  useNotificationModulesManifest,
  useNotificationPreferencesBundle,
  useNotificationSettings,
  usePushDevices,
  useRevokePushDevice,
  useSendTestNotification,
  useUpdateNotificationPreferences,
  useUpdateNotificationSettings,
} from '@/features/notifications/hooks/use-notification-preferences';
import { usePushSubscription } from '@/features/notifications/hooks/use-push-subscription';
import type { NotificationPreferenceRow } from '@/features/notifications/types';
import { cn } from '@/lib/utils';

const CHANNEL_META = {
  IN_APP: { label: 'No app', icon: Bell },
  EMAIL: { label: 'E-mail', icon: Mail },
  PUSH: { label: 'Push', icon: Monitor },
  SMS: { label: 'SMS', icon: Smartphone },
} as const;

type MasterKey = 'masterInApp' | 'masterEmail' | 'masterPush' | 'masterSms';

const MASTER_FIELDS: Array<[MasterKey, keyof typeof CHANNEL_META]> = [
  ['masterInApp', 'IN_APP'],
  ['masterEmail', 'EMAIL'],
  ['masterPush', 'PUSH'],
  ['masterSms', 'SMS'],
];

export function NotificationsTab() {
  const perms = useMultiplePermissions({
    canRead: 'tools.notifications.preferences.access',
    canModify: 'tools.notifications.preferences.modify',
    canManageDevices: 'tools.notifications.devices.admin',
  });

  const settings = useNotificationSettings();
  const preferences = useNotificationPreferencesBundle();
  const manifest = useNotificationModulesManifest();
  const devices = usePushDevices();

  const updateSettings = useUpdateNotificationSettings();
  const updatePrefs = useUpdateNotificationPreferences();
  const sendTest = useSendTestNotification();
  const revoke = useRevokePushDevice();
  const push = usePushSubscription();

  const handleModuleToggle = (moduleCode: string, enabled: boolean) => {
    updatePrefs.mutate({ modules: [{ code: moduleCode, isEnabled: enabled }] });
  };

  const handlePreferencesChange = (rows: NotificationPreferenceRow[]) => {
    updatePrefs.mutate({ preferences: rows });
  };

  const isLoading =
    settings.isLoading || manifest.isLoading || preferences.isLoading;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (!perms.canRead) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        Você não tem permissão para visualizar preferências de notificação.
      </Card>
    );
  }

  if (!settings.data) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        Não foi possível carregar as preferências.
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Gerais */}
      <Card className="p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Moon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Gerais
            </h2>
            <p className="text-xs text-gray-500 dark:text-white/50">
              Preferências aplicadas a todos os tipos de notificação.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Row
            title="Não perturbe"
            description="Bloqueia alertas não urgentes dentro do horário configurado."
            control={
              <Switch
                checked={settings.data.doNotDisturb}
                disabled={!perms.canModify}
                onCheckedChange={v =>
                  updateSettings.mutate({ doNotDisturb: v })
                }
              />
            }
          />
          {settings.data.doNotDisturb && (
            <div className="flex gap-3 pl-2">
              <TimeInput
                label="Das"
                defaultValue={settings.data.dndStart ?? '22:00'}
                onCommit={v => updateSettings.mutate({ dndStart: v })}
              />
              <TimeInput
                label="Até"
                defaultValue={settings.data.dndEnd ?? '07:00'}
                onCommit={v => updateSettings.mutate({ dndEnd: v })}
              />
            </div>
          )}
          <Row
            title="Som"
            description="Toca um breve som ao receber notificações."
            control={
              <Switch
                checked={settings.data.soundEnabled}
                disabled={!perms.canModify}
                onCheckedChange={v =>
                  updateSettings.mutate({ soundEnabled: v })
                }
              />
            }
            icon={
              settings.data.soundEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )
            }
          />
        </div>
      </Card>

      {/* Canais */}
      <Card className="p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Canais
            </h2>
            <p className="text-xs text-gray-500 dark:text-white/50">
              Desativar aqui silencia o canal para todas as categorias.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {MASTER_FIELDS.map(([key, channel]) => {
            const meta = CHANNEL_META[channel];
            const Icon = meta.icon;
            return (
              <label
                key={channel}
                className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 dark:border-white/10 px-4 py-3 cursor-pointer"
              >
                <span className="flex items-center gap-2 text-sm text-gray-900 dark:text-white">
                  <Icon className="w-4 h-4 text-gray-500 dark:text-white/50" />
                  {meta.label}
                </span>
                <Switch
                  checked={Boolean(settings.data?.[key])}
                  disabled={!perms.canModify}
                  onCheckedChange={v =>
                    updateSettings.mutate({ [key]: v } as Record<
                      string,
                      boolean
                    >)
                  }
                />
              </label>
            );
          })}
        </div>

        {perms.canManageDevices &&
          push.permission !== 'granted' &&
          push.permission !== 'unsupported' && (
            <div className="mt-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 flex items-center justify-between gap-3">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Para receber notificações push neste dispositivo, é preciso
                autorizar o navegador.
              </p>
              <Button
                size="sm"
                variant="outline"
                disabled={push.subscribing}
                onClick={() => push.subscribe(navigator.userAgent)}
              >
                {push.subscribing ? 'Ativando...' : 'Ativar push'}
              </Button>
            </div>
          )}
      </Card>

      {/* Por módulo — grid granular por categoria × canal × frequência */}
      <Card className="p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Monitor className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Por módulo
            </h2>
            <p className="text-xs text-gray-500 dark:text-white/50">
              Expanda um módulo para configurar cada categoria por canal e
              frequência.
            </p>
          </div>
        </div>

        {manifest.data && preferences.data ? (
          <ModulePreferencesGrid
            modules={manifest.data.modules}
            preferences={preferences.data}
            onModuleToggle={handleModuleToggle}
            onPreferencesChange={handlePreferencesChange}
          />
        ) : (
          <p className="text-sm text-gray-500 dark:text-white/50 py-4">
            Carregando preferências...
          </p>
        )}
      </Card>

      {/* Dispositivos push */}
      {perms.canManageDevices && (devices.data?.devices?.length ?? 0) > 0 && (
        <Card className="p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-slate-500/10 text-slate-600 dark:text-slate-400">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Dispositivos com push
              </h2>
              <p className="text-xs text-gray-500 dark:text-white/50">
                Navegadores autorizados a receber notificações push.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {devices.data?.devices.map(d => (
              <div
                key={d.id}
                className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-200 dark:border-white/10"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {d.deviceName ?? d.userAgent?.slice(0, 60) ?? 'Dispositivo'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-white/50">
                    {d.lastSeenAt
                      ? `Ativo em ${new Date(d.lastSeenAt).toLocaleString('pt-BR')}`
                      : 'Nunca visto'}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => revoke.mutate(d.id)}
                  aria-label="Remover dispositivo"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Enviar teste */}
      <Card className="p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Testar notificações
            </h2>
            <p className="text-xs text-gray-500 dark:text-white/50">
              Envia uma notificação de cada tipo para você validar a entrega.
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => sendTest.mutate(undefined)}
          disabled={sendTest.isPending}
        >
          {sendTest.isPending ? 'Enviando...' : 'Enviar notificações de teste'}
        </Button>
      </Card>
    </div>
  );
}

function Row({
  title,
  description,
  control,
  icon,
}: {
  title: string;
  description: string;
  control: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0 flex-1 flex items-center gap-2">
        {icon && (
          <span className="text-gray-500 dark:text-white/50">{icon}</span>
        )}
        <div>
          <p className="font-medium text-sm text-gray-900 dark:text-white">
            {title}
          </p>
          <p className="text-xs text-gray-500 dark:text-white/50">
            {description}
          </p>
        </div>
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

function TimeInput({
  label,
  defaultValue,
  onCommit,
}: {
  label: string;
  defaultValue: string;
  onCommit: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-gray-500 dark:text-white/50">{label}</span>
      <input
        type="time"
        defaultValue={defaultValue}
        onBlur={e => onCommit(e.target.value)}
        className={cn(
          'border rounded-md px-3 py-1.5 text-sm',
          'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10',
          'text-gray-900 dark:text-white'
        )}
      />
    </label>
  );
}
