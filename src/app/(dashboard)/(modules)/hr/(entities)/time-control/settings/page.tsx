'use client';

import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import type { HeaderButton } from '@/components/layout/types/header.types';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { logger } from '@/lib/logger';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import {
  AlarmClock,
  Camera,
  Clock,
  Download,
  FileDown,
  FileText,
  Loader2,
  LogIn,
  MapPin,
  MapPinned,
  Monitor,
  Pencil,
  Plus,
  QrCode,
  Save,
  Settings,
  Shield,
  Smartphone,
  Timer,
  Trash2,
  WifiOff,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import type {
  GeofenceZone,
  PunchConfiguration,
} from '../src/api/punch-config.api';
import { punchConfigApi } from '../src/api/punch-config.api';
import { GeofenceZoneModal } from './zone-modal';

// =============================================================================
// SECTION HEADER
// =============================================================================

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="space-y-3 px-4 pt-4">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-foreground" />
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="border-b border-border" />
    </div>
  );
}

// =============================================================================
// CONFIG ROW
// =============================================================================

function ConfigRow({
  icon: Icon,
  label,
  description,
  children,
}: {
  icon: LucideIcon;
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-4 px-4 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted/60 shrink-0">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="shrink-0 ml-4">{children}</div>
    </div>
  );
}

// =============================================================================
// ZONE CARD
// =============================================================================

function ZoneCard({
  zone,
  onEdit,
  onDelete,
}: {
  zone: GeofenceZone;
  onEdit: (zone: GeofenceZone) => void;
  onDelete: (zone: GeofenceZone) => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-white dark:bg-slate-800/60">
      <div
        className={`w-2.5 h-2.5 rounded-full ${zone.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{zone.name}</p>
        <p className="text-xs text-muted-foreground">
          {zone.address ||
            `${zone.latitude.toFixed(6)}, ${zone.longitude.toFixed(6)}`}{' '}
          — raio: {zone.radiusMeters}m
        </p>
      </div>
      <Button variant="ghost" size="icon-sm" onClick={() => onEdit(zone)}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => onDelete(zone)}
        className="text-rose-500 hover:text-rose-600"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function PunchConfigSettingsPage() {
  const queryClient = useQueryClient();

  // ---------------------------------------------------------------------------
  // LOCAL STATE
  // ---------------------------------------------------------------------------

  const [selfieRequired, setSelfieRequired] = useState(false);
  const [gpsRequired, setGpsRequired] = useState(false);
  const [geofenceEnabled, setGeofenceEnabled] = useState(false);
  const [qrCodeEnabled, setQrCodeEnabled] = useState(false);
  const [directLoginEnabled, setDirectLoginEnabled] = useState(true);
  const [kioskModeEnabled, setKioskModeEnabled] = useState(false);
  const [pwaEnabled, setPwaEnabled] = useState(false);
  const [offlineAllowed, setOfflineAllowed] = useState(false);
  const [maxOfflineHours, setMaxOfflineHours] = useState(24);
  const [toleranceMinutes, setToleranceMinutes] = useState(10);
  const [autoClockOutHours, setAutoClockOutHours] = useState<string>('');
  const [pdfReceiptEnabled, setPdfReceiptEnabled] = useState(true);
  const [defaultRadiusMeters, setDefaultRadiusMeters] = useState(200);

  // Zone management
  const [zoneModalOpen, setZoneModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<GeofenceZone | null>(null);
  const [deleteZone, setDeleteZone] = useState<GeofenceZone | null>(null);

  const [isSaving, setIsSaving] = useState(false);

  // ---------------------------------------------------------------------------
  // QUERIES
  // ---------------------------------------------------------------------------

  const { data: config, isLoading: configLoading } =
    useQuery<PunchConfiguration>({
      queryKey: ['punch-config'],
      queryFn: () => punchConfigApi.getConfig(),
    });

  const { data: zonesData, isLoading: zonesLoading } = useQuery({
    queryKey: ['geofence-zones'],
    queryFn: () => punchConfigApi.listZones(),
  });

  const zones = zonesData?.zones ?? [];

  // Sync local state from server
  useEffect(() => {
    if (config) {
      setSelfieRequired(config.selfieRequired ?? false);
      setGpsRequired(config.gpsRequired ?? false);
      setGeofenceEnabled(config.geofenceEnabled ?? false);
      setQrCodeEnabled(config.qrCodeEnabled ?? false);
      setDirectLoginEnabled(config.directLoginEnabled ?? true);
      setKioskModeEnabled(config.kioskModeEnabled ?? false);
      setPwaEnabled(config.pwaEnabled ?? false);
      setOfflineAllowed(config.offlineAllowed ?? false);
      setMaxOfflineHours(config.maxOfflineHours ?? 24);
      setToleranceMinutes(config.toleranceMinutes ?? 10);
      setAutoClockOutHours(
        config.autoClockOutHours != null ? String(config.autoClockOutHours) : ''
      );
      setPdfReceiptEnabled(config.pdfReceiptEnabled ?? true);
      setDefaultRadiusMeters(config.defaultRadiusMeters ?? 200);
    }
  }, [config]);

  // ---------------------------------------------------------------------------
  // MUTATIONS — ZONES
  // ---------------------------------------------------------------------------

  const createZoneMutation = useMutation({
    mutationFn: punchConfigApi.createZone,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geofence-zones'] });
      toast.success('Zona criada com sucesso');
      setZoneModalOpen(false);
    },
    onError: (err: Error) => {
      logger.error('Erro ao criar zona', err);
      toast.error('Erro ao criar zona de geofence');
    },
  });

  const updateZoneMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Parameters<typeof punchConfigApi.updateZone>[1];
    }) => punchConfigApi.updateZone(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geofence-zones'] });
      toast.success('Zona atualizada com sucesso');
      setZoneModalOpen(false);
      setEditingZone(null);
    },
    onError: (err: Error) => {
      logger.error('Erro ao atualizar zona', err);
      toast.error('Erro ao atualizar zona de geofence');
    },
  });

  const deleteZoneMutation = useMutation({
    mutationFn: (id: string) => punchConfigApi.deleteZone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['geofence-zones'] });
      toast.success('Zona excluída com sucesso');
      setDeleteZone(null);
    },
    onError: (err: Error) => {
      logger.error('Erro ao excluir zona', err);
      toast.error('Erro ao excluir zona de geofence');
    },
  });

  // ---------------------------------------------------------------------------
  // HANDLERS
  // ---------------------------------------------------------------------------

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await punchConfigApi.updateConfig({
        selfieRequired,
        gpsRequired,
        geofenceEnabled,
        qrCodeEnabled,
        directLoginEnabled,
        kioskModeEnabled,
        pwaEnabled,
        offlineAllowed,
        maxOfflineHours,
        toleranceMinutes,
        autoClockOutHours: autoClockOutHours ? Number(autoClockOutHours) : null,
        pdfReceiptEnabled,
        defaultRadiusMeters,
      });
      await queryClient.invalidateQueries({ queryKey: ['punch-config'] });
      toast.success('Configurações salvas com sucesso');
    } catch (error) {
      logger.error(
        'Erro ao salvar configurações de ponto',
        error instanceof Error ? error : undefined
      );
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  }, [
    selfieRequired,
    gpsRequired,
    geofenceEnabled,
    qrCodeEnabled,
    directLoginEnabled,
    kioskModeEnabled,
    pwaEnabled,
    offlineAllowed,
    maxOfflineHours,
    toleranceMinutes,
    autoClockOutHours,
    pdfReceiptEnabled,
    defaultRadiusMeters,
    queryClient,
  ]);

  const handleEditZone = useCallback((zone: GeofenceZone) => {
    setEditingZone(zone);
    setZoneModalOpen(true);
  }, []);

  const handleDeleteZoneConfirm = useCallback(async () => {
    if (!deleteZone) return;
    await deleteZoneMutation.mutateAsync(deleteZone.id);
  }, [deleteZone, deleteZoneMutation]);

  const handleZoneModalClose = useCallback(() => {
    setZoneModalOpen(false);
    setEditingZone(null);
  }, []);

  // ---------------------------------------------------------------------------
  // ACTION BUTTONS
  // ---------------------------------------------------------------------------

  const actionButtons: HeaderButton[] = [
    {
      id: 'save',
      title: isSaving ? 'Salvando...' : 'Salvar',
      icon: isSaving ? Loader2 : Save,
      onClick: handleSave,
      variant: 'default',
      disabled: isSaving,
    },
  ];

  // ---------------------------------------------------------------------------
  // LOADING STATE
  // ---------------------------------------------------------------------------

  if (configLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Controle de Ponto', href: '/hr/time-control' },
              { label: 'Configurações' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridLoading count={4} layout="list" size="md" />
        </PageBody>
      </PageLayout>
    );
  }

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'RH', href: '/hr' },
            { label: 'Controle de Ponto', href: '/hr/time-control' },
            { label: 'Configurações' },
          ]}
          buttons={actionButtons}
        />

        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 shadow-lg">
              <Settings className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">Controle de Ponto</p>
              <h1 className="text-xl font-bold truncate">Configurações</h1>
            </div>
          </div>
        </Card>
      </PageHeader>

      <PageBody>
        <div className="space-y-6">
          {/* Section 1: Métodos de Autenticação */}
          <Card className="bg-white/5 overflow-hidden py-0">
            <SectionHeader
              icon={Shield}
              title="Métodos de Autenticação"
              subtitle="Configure como os funcionários se identificam ao bater ponto"
            />
            <div>
              <ConfigRow
                icon={Camera}
                label="Selfie Obrigatória"
                description="Exige captura de foto ao registrar ponto"
              >
                <Switch
                  checked={selfieRequired}
                  onCheckedChange={setSelfieRequired}
                />
              </ConfigRow>
              <ConfigRow
                icon={MapPin}
                label="GPS Obrigatório"
                description="Exige localização GPS ao registrar ponto"
              >
                <Switch
                  checked={gpsRequired}
                  onCheckedChange={setGpsRequired}
                />
              </ConfigRow>
              <ConfigRow
                icon={MapPinned}
                label="Geofence"
                description="Valida se o funcionário está dentro de uma zona permitida"
              >
                <Switch
                  checked={geofenceEnabled}
                  onCheckedChange={setGeofenceEnabled}
                />
              </ConfigRow>
              <ConfigRow
                icon={QrCode}
                label="QR Code"
                description="Permite registro via leitura de QR Code no local"
              >
                <Switch
                  checked={qrCodeEnabled}
                  onCheckedChange={setQrCodeEnabled}
                />
              </ConfigRow>
            </div>
          </Card>

          {/* Section 2: Métodos de Acesso */}
          <Card className="bg-white/5 overflow-hidden py-0">
            <SectionHeader
              icon={Smartphone}
              title="Métodos de Acesso"
              subtitle="Configure como os funcionários acessam o sistema de ponto"
            />
            <div>
              <ConfigRow
                icon={LogIn}
                label="Login Direto"
                description="Funcionário acessa /punch após login no sistema"
              >
                <Switch
                  checked={directLoginEnabled}
                  onCheckedChange={setDirectLoginEnabled}
                />
              </ConfigRow>
              <ConfigRow
                icon={Monitor}
                label="Modo Quiosque"
                description="Tablet fixo no local para múltiplos funcionários"
              >
                <Switch
                  checked={kioskModeEnabled}
                  onCheckedChange={setKioskModeEnabled}
                />
              </ConfigRow>
              <ConfigRow
                icon={Download}
                label="PWA (App Instalável)"
                description="Funcionário instala como aplicativo no celular"
              >
                <Switch checked={pwaEnabled} onCheckedChange={setPwaEnabled} />
              </ConfigRow>
            </div>
          </Card>

          {/* Section 3: Regras Gerais */}
          <Card className="bg-white/5 overflow-hidden py-0">
            <SectionHeader
              icon={Settings}
              title="Regras Gerais"
              subtitle="Configure tolerâncias e limites"
            />
            <div>
              <ConfigRow
                icon={Clock}
                label="Tolerância (minutos)"
                description="Tolerância de atraso/antecipação conforme Art. 58 CLT"
              >
                <Input
                  type="number"
                  min={0}
                  max={30}
                  value={toleranceMinutes}
                  onChange={e => setToleranceMinutes(Number(e.target.value))}
                  className="w-24 h-9 text-sm text-center"
                />
              </ConfigRow>
              <ConfigRow
                icon={WifiOff}
                label="Registro Offline"
                description="Permite registro sem conexão (sincroniza depois)"
              >
                <Switch
                  checked={offlineAllowed}
                  onCheckedChange={setOfflineAllowed}
                />
              </ConfigRow>
              {offlineAllowed && (
                <ConfigRow
                  icon={Timer}
                  label="Máximo Horas Offline"
                  description="Limite de horas para aceitar registros offline"
                >
                  <Input
                    type="number"
                    min={1}
                    max={168}
                    value={maxOfflineHours}
                    onChange={e => setMaxOfflineHours(Number(e.target.value))}
                    className="w-24 h-9 text-sm text-center"
                  />
                </ConfigRow>
              )}
              <ConfigRow
                icon={AlarmClock}
                label="Auto Clock-Out (horas)"
                description="Encerra ponto automaticamente após N horas. Deixe vazio para desativar."
              >
                <Input
                  type="number"
                  min={1}
                  max={24}
                  value={autoClockOutHours}
                  onChange={e => setAutoClockOutHours(e.target.value)}
                  placeholder="Desativado"
                  className="w-24 h-9 text-sm text-center"
                />
              </ConfigRow>
            </div>
          </Card>

          {/* Section 4: Comprovante */}
          <Card className="bg-white/5 overflow-hidden py-0">
            <SectionHeader
              icon={FileText}
              title="Comprovante"
              subtitle="Configurações do comprovante de ponto (Portaria 671)"
            />
            <div>
              <ConfigRow
                icon={FileDown}
                label="Comprovante PDF"
                description="Gera comprovante em PDF conforme Portaria 671/2021"
              >
                <Switch
                  checked={pdfReceiptEnabled}
                  onCheckedChange={setPdfReceiptEnabled}
                />
              </ConfigRow>
            </div>
          </Card>

          {/* Section 5: Zonas de Geofence (conditional) */}
          {geofenceEnabled && (
            <Card className="bg-white/5 overflow-hidden py-0 pb-4">
              <SectionHeader
                icon={MapPinned}
                title="Zonas de Geofence"
                subtitle="Defina as áreas permitidas para registro de ponto"
              />
              <div>
                <ConfigRow
                  icon={MapPin}
                  label="Raio Padrão (metros)"
                  description="Raio padrão para novas zonas"
                >
                  <Input
                    type="number"
                    min={50}
                    max={5000}
                    value={defaultRadiusMeters}
                    onChange={e =>
                      setDefaultRadiusMeters(Number(e.target.value))
                    }
                    className="w-24 h-9 text-sm text-center"
                  />
                </ConfigRow>
              </div>

              {/* Zone list */}
              {zonesLoading ? (
                <div className="px-4">
                  <GridLoading count={2} layout="list" size="sm" />
                </div>
              ) : zones.length > 0 ? (
                <div className="space-y-2 px-4 mt-2">
                  {zones.map(zone => (
                    <ZoneCard
                      key={zone.id}
                      zone={zone}
                      onEdit={handleEditZone}
                      onDelete={z => setDeleteZone(z)}
                    />
                  ))}
                </div>
              ) : (
                <div className="px-4 mt-2">
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhuma zona cadastrada
                  </p>
                </div>
              )}

              {/* Add zone button */}
              <div className="px-4 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingZone(null);
                    setZoneModalOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Zona
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Zone Modal */}
        <GeofenceZoneModal
          isOpen={zoneModalOpen}
          onClose={handleZoneModalClose}
          zone={editingZone}
          defaultRadius={defaultRadiusMeters}
          onSubmit={async data => {
            if (editingZone) {
              await updateZoneMutation.mutateAsync({
                id: editingZone.id,
                data,
              });
            } else {
              await createZoneMutation.mutateAsync(data);
            }
          }}
          isLoading={
            createZoneMutation.isPending || updateZoneMutation.isPending
          }
        />

        {/* Delete Zone PIN Modal */}
        <VerifyActionPinModal
          isOpen={!!deleteZone}
          onClose={() => setDeleteZone(null)}
          onSuccess={handleDeleteZoneConfirm}
          title="Excluir Zona de Geofence"
          description={`Digite seu PIN de ação para excluir a zona "${deleteZone?.name}". Esta ação não pode ser desfeita.`}
        />
      </PageBody>
    </PageLayout>
  );
}
