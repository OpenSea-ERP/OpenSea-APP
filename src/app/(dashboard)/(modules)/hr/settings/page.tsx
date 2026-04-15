'use client';

import { punchConfigApi } from '@/app/(dashboard)/(modules)/hr/(entities)/time-control/src/api/punch-config.api';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { logger } from '@/lib/logger';
import { hrConfigService } from '@/services/hr/hr-config.service';
import { esocialService } from '@/services/hr/esocial.service';
import type {
  HrTenantConfig,
  PunchConfiguration,
  GeofenceZone,
  CreateGeofenceZoneData,
} from '@/types/hr';
import type {
  EsocialConfig,
  EsocialCertificate,
  EsocialEnvironment,
} from '@/types/esocial';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import {
  Baby,
  Building,
  Building2,
  Camera,
  Clock,
  DollarSign,
  Edit,
  FileText,
  Heart,
  Info,
  Landmark,
  Loader2,
  MapPin,
  MapPinned,
  Navigation,
  Percent,
  Plus,
  QrCode,
  Save,
  Scale,
  Settings,
  Shield,
  ShieldCheck,
  Smartphone,
  Timer,
  Trash2,
  Upload,
  User,
  Users,
  UtensilsCrossed,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { GeofenceZoneModal } from './zone-modal';

// =============================================================================
// SHARED COMPONENTS
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
    <div className="flex flex-col md:flex-row md:items-center justify-between py-4 px-4 border-b border-border/50 last:border-0 gap-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted/60 shrink-0">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="shrink-0 ml-12 md:ml-4">{children}</div>
    </div>
  );
}

function ZoneCard({
  zone,
  onEdit,
  onDelete,
}: {
  zone: GeofenceZone;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 px-4 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className={`h-2 w-2 rounded-full shrink-0 ${
            zone.isActive ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'
          }`}
        />
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{zone.name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {zone.address
              ? zone.address
              : `${zone.latitude.toFixed(6)}, ${zone.longitude.toFixed(6)}`}
            {' — '}
            {zone.radiusMeters}m
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0 ml-4">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={onEdit}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// =============================================================================
// TAB 1: GERAL
// =============================================================================

function GeralTab() {
  const queryClient = useQueryClient();

  const [empresaCidadaEnabled, setEmpresaCidadaEnabled] = useState(false);
  const [maternityLeaveDays, setMaternityLeaveDays] = useState(120);
  const [paternityLeaveDays, setPaternityLeaveDays] = useState(5);
  const [unionContributionEnabled, setUnionContributionEnabled] =
    useState(false);
  const [unionContributionRate, setUnionContributionRate] = useState(100);
  const [patEnabled, setPatEnabled] = useState(false);
  const [patMonthlyValue, setPatMonthlyValue] = useState<number>(0);
  const [timeBankIndividualMonths, setTimeBankIndividualMonths] = useState(6);
  const [timeBankCollectiveMonths, setTimeBankCollectiveMonths] = useState(12);
  const [ratPercent, setRatPercent] = useState(1);
  const [fapFactor, setFapFactor] = useState(1);
  const [terceirosPercent, setTerceirosPercent] = useState(5.8);
  const [isSaving, setIsSaving] = useState(false);

  const { data: configData, isLoading } = useQuery<HrTenantConfig>({
    queryKey: ['hr-config'],
    queryFn: async () => {
      const response = await hrConfigService.getConfig();
      return response.hrConfig;
    },
  });

  useEffect(() => {
    if (configData) {
      setEmpresaCidadaEnabled(configData.empresaCidadaEnabled);
      setMaternityLeaveDays(configData.maternityLeaveDays);
      setPaternityLeaveDays(configData.paternityLeaveDays);
      setUnionContributionEnabled(configData.unionContributionEnabled);
      setUnionContributionRate(configData.unionContributionRate ?? 0);
      setPatEnabled(configData.patEnabled);
      setPatMonthlyValue(configData.patMonthlyValuePerEmployee ?? 0);
      setTimeBankIndividualMonths(configData.timeBankIndividualMonths);
      setTimeBankCollectiveMonths(configData.timeBankCollectiveMonths);
      setRatPercent(configData.ratPercent);
      setFapFactor(configData.fapFactor);
      setTerceirosPercent(configData.terceirosPercent);
    }
  }, [configData]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      await hrConfigService.updateConfig({
        empresaCidadaEnabled,
        maternityLeaveDays,
        paternityLeaveDays,
        unionContributionEnabled,
        unionContributionRate,
        patEnabled,
        patMonthlyValuePerEmployee: patMonthlyValue,
        timeBankIndividualMonths,
        timeBankCollectiveMonths,
        ratPercent,
        fapFactor,
        terceirosPercent,
      });
      await queryClient.invalidateQueries({ queryKey: ['hr-config'] });
      toast.success('Configurações salvas com sucesso');
    } catch (error) {
      logger.error(
        'Erro ao salvar configurações de RH',
        error instanceof Error ? error : undefined
      );
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  }, [
    empresaCidadaEnabled,
    maternityLeaveDays,
    paternityLeaveDays,
    unionContributionEnabled,
    unionContributionRate,
    patEnabled,
    patMonthlyValue,
    timeBankIndividualMonths,
    timeBankCollectiveMonths,
    ratPercent,
    fapFactor,
    terceirosPercent,
    queryClient,
  ]);

  if (isLoading) {
    return <GridLoading count={5} layout="list" size="md" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          size="sm"
          className="h-9 px-2.5"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="hidden lg:inline">Salvando...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span className="hidden lg:inline">Salvar</span>
            </>
          )}
        </Button>
      </div>

      {/* Section 1: Empresa Cidadã */}
      <Card className="bg-white/5 overflow-hidden py-0">
        <SectionHeader
          icon={Heart}
          title="Empresa Cidadã"
          subtitle="Extensão de licenças (Lei 11.770/08)"
        />
        <div>
          <ConfigRow
            icon={Baby}
            label="Programa Empresa Cidadã"
            description="Habilita extensão de licença maternidade e paternidade"
          >
            <Switch
              checked={empresaCidadaEnabled}
              onCheckedChange={setEmpresaCidadaEnabled}
              aria-label="Habilitar Programa Empresa Cidadã"
            />
          </ConfigRow>
          {empresaCidadaEnabled && (
            <>
              <ConfigRow
                icon={Heart}
                label="Licença Maternidade (dias)"
                description="120 dias padrão, 180 dias com Empresa Cidadã"
              >
                <Input
                  type="number"
                  min={120}
                  max={180}
                  value={maternityLeaveDays}
                  onChange={e => setMaternityLeaveDays(Number(e.target.value))}
                  className="w-24 h-9 text-sm text-center"
                />
              </ConfigRow>
              <ConfigRow
                icon={Baby}
                label="Licença Paternidade (dias)"
                description="5 dias padrão, 20 dias com Empresa Cidadã"
              >
                <Input
                  type="number"
                  min={5}
                  max={20}
                  value={paternityLeaveDays}
                  onChange={e => setPaternityLeaveDays(Number(e.target.value))}
                  className="w-24 h-9 text-sm text-center"
                />
              </ConfigRow>
            </>
          )}
        </div>
      </Card>

      {/* Section 2: Contribuição Sindical */}
      <Card className="bg-white/5 overflow-hidden py-0">
        <SectionHeader
          icon={Building}
          title="Contribuição Sindical"
          subtitle="Configuração do desconto sindical (opcional desde Reforma 2017)"
        />
        <div>
          <ConfigRow
            icon={Landmark}
            label="Contribuição Sindical"
            description="Habilita desconto de contribuição sindical na folha"
          >
            <Switch
              checked={unionContributionEnabled}
              onCheckedChange={setUnionContributionEnabled}
              aria-label="Habilitar Contribuição Sindical"
            />
          </ConfigRow>
          {unionContributionEnabled && (
            <ConfigRow
              icon={Percent}
              label="Taxa (%)"
              description="Percentual sobre 1 dia de salário (padrão: 1 dia/ano)"
            >
              <Input
                type="number"
                min={0}
                max={100}
                value={unionContributionRate}
                onChange={e => setUnionContributionRate(Number(e.target.value))}
                className="w-24 h-9 text-sm text-center"
              />
            </ConfigRow>
          )}
        </div>
      </Card>

      {/* Section 3: PAT */}
      <Card className="bg-white/5 overflow-hidden py-0">
        <SectionHeader
          icon={UtensilsCrossed}
          title="PAT — Programa de Alimentação"
          subtitle="Benefício fiscal para alimentação do trabalhador"
        />
        <div>
          <ConfigRow
            icon={UtensilsCrossed}
            label="PAT Habilitado"
            description="Empresa participa do Programa de Alimentação do Trabalhador"
          >
            <Switch
              checked={patEnabled}
              onCheckedChange={setPatEnabled}
              aria-label="Habilitar PAT"
            />
          </ConfigRow>
          {patEnabled && (
            <ConfigRow
              icon={DollarSign}
              label="Valor Mensal por Funcionário (R$)"
              description="Valor do benefício alimentação por funcionário"
            >
              <Input
                type="number"
                min={0}
                step={0.01}
                value={patMonthlyValue}
                onChange={e => setPatMonthlyValue(Number(e.target.value))}
                className="w-28 h-9 text-sm text-center"
              />
            </ConfigRow>
          )}
        </div>
      </Card>

      {/* Section 4: Banco de Horas */}
      <Card className="bg-white/5 overflow-hidden py-0">
        <SectionHeader
          icon={Clock}
          title="Banco de Horas"
          subtitle="Prazos de compensação (Art. 59 CLT)"
        />
        <div>
          <ConfigRow
            icon={User}
            label="Acordo Individual (meses)"
            description="Prazo para compensação em acordo individual (padrão: 6 meses)"
          >
            <Input
              type="number"
              min={1}
              max={12}
              value={timeBankIndividualMonths}
              onChange={e =>
                setTimeBankIndividualMonths(Number(e.target.value))
              }
              className="w-24 h-9 text-sm text-center"
            />
          </ConfigRow>
          <ConfigRow
            icon={Users}
            label="Acordo Coletivo (meses)"
            description="Prazo para compensação em acordo coletivo (padrão: 12 meses)"
          >
            <Input
              type="number"
              min={1}
              max={24}
              value={timeBankCollectiveMonths}
              onChange={e =>
                setTimeBankCollectiveMonths(Number(e.target.value))
              }
              className="w-24 h-9 text-sm text-center"
            />
          </ConfigRow>
        </div>
      </Card>

      {/* Section 5: Contribuição Patronal */}
      <Card className="bg-white/5 overflow-hidden py-0">
        <SectionHeader
          icon={Building2}
          title="Contribuição Patronal"
          subtitle="INSS patronal, RAT e terceiros"
        />
        <div>
          <ConfigRow
            icon={Percent}
            label="RAT (%)"
            description="Risco Ambiental do Trabalho: 1% (leve), 2% (médio), 3% (grave)"
          >
            <Input
              type="number"
              min={1}
              max={3}
              step={0.01}
              value={ratPercent}
              onChange={e => setRatPercent(Number(e.target.value))}
              className="w-24 h-9 text-sm text-center"
            />
          </ConfigRow>
          <ConfigRow
            icon={Scale}
            label="FAP (fator)"
            description="Fator Acidentário de Prevenção (0,500 a 2,000)"
          >
            <Input
              type="number"
              min={0.5}
              max={2}
              step={0.001}
              value={fapFactor}
              onChange={e => setFapFactor(Number(e.target.value))}
              className="w-24 h-9 text-sm text-center"
            />
          </ConfigRow>
          <ConfigRow
            icon={Building}
            label="Terceiros (%)"
            description="Sistema S (SESI, SENAI, INCRA, Sal.Educação, SEBRAE)"
          >
            <Input
              type="number"
              min={0}
              max={20}
              step={0.1}
              value={terceirosPercent}
              onChange={e => setTerceirosPercent(Number(e.target.value))}
              className="w-24 h-9 text-sm text-center"
            />
          </ConfigRow>
        </div>
      </Card>
    </div>
  );
}

// =============================================================================
// TAB 2: CONTROLE DE PONTO
// =============================================================================

function PontoTab() {
  const queryClient = useQueryClient();

  // Punch config state
  const [selfieRequired, setSelfieRequired] = useState(false);
  const [gpsRequired, setGpsRequired] = useState(false);
  const [geofenceEnabled, setGeofenceEnabled] = useState(false);
  const [qrCodeEnabled, setQrCodeEnabled] = useState(false);
  const [directLoginEnabled, setDirectLoginEnabled] = useState(false);
  const [kioskModeEnabled, setKioskModeEnabled] = useState(false);
  const [pwaEnabled, setPwaEnabled] = useState(false);
  const [offlineAllowed, setOfflineAllowed] = useState(false);
  const [maxOfflineHours, setMaxOfflineHours] = useState(24);
  const [toleranceMinutes, setToleranceMinutes] = useState(10);
  const [autoClockOutHours, setAutoClockOutHours] = useState<number | null>(
    null
  );
  const [pdfReceiptEnabled, setPdfReceiptEnabled] = useState(false);
  const [defaultRadiusMeters, setDefaultRadiusMeters] = useState(200);
  const [isSaving, setIsSaving] = useState(false);

  // Zone modal state
  const [zoneModalOpen, setZoneModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<GeofenceZone | null>(null);
  const [isZoneSubmitting, setIsZoneSubmitting] = useState(false);

  // Delete zone state
  const [deleteZoneId, setDeleteZoneId] = useState<string | null>(null);
  const [deleteZoneName, setDeleteZoneName] = useState('');

  // Queries
  const { data: punchConfig, isLoading: isLoadingConfig } =
    useQuery<PunchConfiguration>({
      queryKey: ['punch-config'],
      queryFn: async () => {
        return punchConfigApi.getConfig();
      },
    });

  const { data: zonesData, isLoading: isLoadingZones } = useQuery<{
    zones: GeofenceZone[];
  }>({
    queryKey: ['geofence-zones'],
    queryFn: async () => {
      return punchConfigApi.listZones();
    },
  });

  const zones = zonesData?.zones;

  // Sync state from server
  useEffect(() => {
    if (punchConfig) {
      setSelfieRequired(punchConfig.selfieRequired);
      setGpsRequired(punchConfig.gpsRequired);
      setGeofenceEnabled(punchConfig.geofenceEnabled);
      setQrCodeEnabled(punchConfig.qrCodeEnabled);
      setDirectLoginEnabled(punchConfig.directLoginEnabled);
      setKioskModeEnabled(punchConfig.kioskModeEnabled);
      setPwaEnabled(punchConfig.pwaEnabled);
      setOfflineAllowed(punchConfig.offlineAllowed);
      setMaxOfflineHours(punchConfig.maxOfflineHours);
      setToleranceMinutes(punchConfig.toleranceMinutes);
      setAutoClockOutHours(punchConfig.autoClockOutHours);
      setPdfReceiptEnabled(punchConfig.pdfReceiptEnabled);
      setDefaultRadiusMeters(punchConfig.defaultRadiusMeters);
    }
  }, [punchConfig]);

  // Save handler
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
        autoClockOutHours,
        pdfReceiptEnabled,
        defaultRadiusMeters,
      });
      await queryClient.invalidateQueries({ queryKey: ['punch-config'] });
      toast.success('Configurações de ponto salvas com sucesso');
    } catch (error) {
      logger.error(
        'Erro ao salvar configurações de ponto',
        error instanceof Error ? error : undefined
      );
      toast.error('Erro ao salvar configurações de ponto');
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

  // Zone submit handler
  const handleZoneSubmit = useCallback(
    async (data: CreateGeofenceZoneData) => {
      setIsZoneSubmitting(true);
      try {
        if (editingZone) {
          await punchConfigApi.updateZone(editingZone.id, data);
          toast.success('Zona atualizada com sucesso');
        } else {
          await punchConfigApi.createZone(data);
          toast.success('Zona criada com sucesso');
        }
        await queryClient.invalidateQueries({ queryKey: ['geofence-zones'] });
        setZoneModalOpen(false);
        setEditingZone(null);
      } catch (error) {
        throw error;
      } finally {
        setIsZoneSubmitting(false);
      }
    },
    [editingZone, queryClient]
  );

  // Zone delete handler
  const handleDeleteZoneConfirm = useCallback(async () => {
    if (!deleteZoneId) return;
    try {
      await punchConfigApi.deleteZone(deleteZoneId);
      await queryClient.invalidateQueries({ queryKey: ['geofence-zones'] });
      toast.success('Zona excluída com sucesso');
    } catch (error) {
      logger.error(
        'Erro ao excluir zona',
        error instanceof Error ? error : undefined
      );
      toast.error('Erro ao excluir zona');
    } finally {
      setDeleteZoneId(null);
      setDeleteZoneName('');
    }
  }, [deleteZoneId, queryClient]);

  if (isLoadingConfig) {
    return <GridLoading count={5} layout="list" size="md" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          size="sm"
          className="h-9 px-2.5"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="hidden lg:inline">Salvando...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span className="hidden lg:inline">Salvar</span>
            </>
          )}
        </Button>
      </div>

      {/* Section 1: Métodos de Autenticação */}
      <Card className="bg-white/5 overflow-hidden py-0">
        <SectionHeader
          icon={Shield}
          title="Métodos de Autenticação"
          subtitle="Verificações exigidas no registro de ponto"
        />
        <div>
          <ConfigRow
            icon={Camera}
            label="Selfie Obrigatória"
            description="Exige captura de selfie ao registrar ponto"
          >
            <Switch
              checked={selfieRequired}
              onCheckedChange={setSelfieRequired}
              aria-label="Selfie obrigatória"
            />
          </ConfigRow>
          <ConfigRow
            icon={Navigation}
            label="GPS Obrigatório"
            description="Exige localização GPS ao registrar ponto"
          >
            <Switch
              checked={gpsRequired}
              onCheckedChange={setGpsRequired}
              aria-label="GPS obrigatório"
            />
          </ConfigRow>
          <ConfigRow
            icon={MapPin}
            label="Geofence Habilitado"
            description="Restringe registro de ponto a zonas geográficas específicas"
          >
            <Switch
              checked={geofenceEnabled}
              onCheckedChange={setGeofenceEnabled}
              aria-label="Geofence habilitado"
            />
          </ConfigRow>
          <ConfigRow
            icon={QrCode}
            label="QR Code Habilitado"
            description="Permite registro de ponto via leitura de QR Code"
          >
            <Switch
              checked={qrCodeEnabled}
              onCheckedChange={setQrCodeEnabled}
              aria-label="QR Code habilitado"
            />
          </ConfigRow>
        </div>
      </Card>

      {/* Section 2: Métodos de Acesso */}
      <Card className="bg-white/5 overflow-hidden py-0">
        <SectionHeader
          icon={Smartphone}
          title="Métodos de Acesso"
          subtitle="Formas de acesso ao sistema de ponto"
        />
        <div>
          <ConfigRow
            icon={User}
            label="Login Direto"
            description="Permite acesso direto com credenciais do funcionário"
          >
            <Switch
              checked={directLoginEnabled}
              onCheckedChange={setDirectLoginEnabled}
              aria-label="Login direto habilitado"
            />
          </ConfigRow>
          <ConfigRow
            icon={Smartphone}
            label="Modo Kiosk"
            description="Terminal compartilhado para múltiplos funcionários"
          >
            <Switch
              checked={kioskModeEnabled}
              onCheckedChange={setKioskModeEnabled}
              aria-label="Modo Kiosk habilitado"
            />
          </ConfigRow>
          <ConfigRow
            icon={Wifi}
            label="PWA Habilitado"
            description="Aplicativo progressivo instalável no dispositivo"
          >
            <Switch
              checked={pwaEnabled}
              onCheckedChange={setPwaEnabled}
              aria-label="PWA habilitado"
            />
          </ConfigRow>
        </div>
      </Card>

      {/* Section 3: Regras Gerais */}
      <Card className="bg-white/5 overflow-hidden py-0">
        <SectionHeader
          icon={Settings}
          title="Regras Gerais"
          subtitle="Tolerâncias, modo offline e encerramento automático"
        />
        <div>
          <ConfigRow
            icon={Timer}
            label="Tolerância (minutos)"
            description="Minutos de tolerância antes/depois do horário"
          >
            <Input
              type="number"
              min={0}
              max={60}
              value={toleranceMinutes}
              onChange={e => setToleranceMinutes(Number(e.target.value))}
              className="w-24 h-9 text-sm text-center"
            />
          </ConfigRow>
          <ConfigRow
            icon={WifiOff}
            label="Modo Offline"
            description="Permite registro de ponto sem conexão à internet"
          >
            <Switch
              checked={offlineAllowed}
              onCheckedChange={setOfflineAllowed}
              aria-label="Modo offline habilitado"
            />
          </ConfigRow>
          {offlineAllowed && (
            <ConfigRow
              icon={Clock}
              label="Máximo Offline (horas)"
              description="Tempo máximo que um registro offline é aceito"
            >
              <Input
                type="number"
                min={1}
                max={72}
                value={maxOfflineHours}
                onChange={e => setMaxOfflineHours(Number(e.target.value))}
                className="w-24 h-9 text-sm text-center"
              />
            </ConfigRow>
          )}
          <ConfigRow
            icon={Clock}
            label="Encerramento Automático (horas)"
            description="Encerra turno automaticamente após X horas (vazio = desabilitado)"
          >
            <Input
              type="number"
              min={1}
              max={24}
              value={autoClockOutHours ?? ''}
              onChange={e => {
                const val = e.target.value;
                setAutoClockOutHours(val === '' ? null : Number(val));
              }}
              placeholder="—"
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
          subtitle="Configuração de comprovante de ponto"
        />
        <div>
          <ConfigRow
            icon={FileText}
            label="Comprovante em PDF"
            description="Gera comprovante em PDF após cada registro de ponto"
          >
            <Switch
              checked={pdfReceiptEnabled}
              onCheckedChange={setPdfReceiptEnabled}
              aria-label="Comprovante PDF habilitado"
            />
          </ConfigRow>
        </div>
      </Card>

      {/* Section 5: Zonas de Geofence */}
      {geofenceEnabled && (
        <Card className="bg-white/5 overflow-hidden py-0">
          <SectionHeader
            icon={MapPinned}
            title="Zonas de Geofence"
            subtitle="Áreas autorizadas para registro de ponto"
          />
          <div>
            <ConfigRow
              icon={MapPinned}
              label="Raio Padrão (metros)"
              description="Raio padrão para novas zonas de geofence"
            >
              <Input
                type="number"
                min={10}
                max={10000}
                value={defaultRadiusMeters}
                onChange={e => setDefaultRadiusMeters(Number(e.target.value))}
                className="w-28 h-9 text-sm text-center"
              />
            </ConfigRow>

            {/* Zones list */}
            {isLoadingZones ? (
              <div className="p-4">
                <GridLoading count={2} layout="list" size="sm" />
              </div>
            ) : zones && zones.length > 0 ? (
              <div>
                {zones.map(zone => (
                  <ZoneCard
                    key={zone.id}
                    zone={zone}
                    onEdit={() => {
                      setEditingZone(zone);
                      setZoneModalOpen(true);
                    }}
                    onDelete={() => {
                      setDeleteZoneId(zone.id);
                      setDeleteZoneName(zone.name);
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Nenhuma zona cadastrada
              </div>
            )}

            {/* Add zone button */}
            <div className="p-4">
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-2.5"
                onClick={() => {
                  setEditingZone(null);
                  setZoneModalOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                <span>Adicionar Zona</span>
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Zone modal */}
      <GeofenceZoneModal
        isOpen={zoneModalOpen}
        onClose={() => {
          setZoneModalOpen(false);
          setEditingZone(null);
        }}
        zone={editingZone}
        defaultRadius={defaultRadiusMeters}
        onSubmit={handleZoneSubmit}
        isLoading={isZoneSubmitting}
      />

      {/* Delete zone PIN modal */}
      <VerifyActionPinModal
        isOpen={!!deleteZoneId}
        onClose={() => {
          setDeleteZoneId(null);
          setDeleteZoneName('');
        }}
        onSuccess={handleDeleteZoneConfirm}
        title="Confirmar Exclusão"
        description={`Digite seu PIN de ação para excluir a zona "${deleteZoneName}".`}
      />
    </div>
  );
}

// =============================================================================
// TAB 3: eSocial
// =============================================================================

function EsocialTab() {
  const queryClient = useQueryClient();

  // Config query
  const { data: configData, isLoading: isLoadingConfig } =
    useQuery<EsocialConfig>({
      queryKey: ['esocial', 'config'],
      queryFn: async () => {
        const response = await esocialService.getConfig();
        return response.config;
      },
    });

  // Certificate query
  const { data: certData, isLoading: isLoadingCert } =
    useQuery<EsocialCertificate | null>({
      queryKey: ['esocial', 'certificate'],
      queryFn: async () => {
        const response = await esocialService.getCertificate();
        return response?.certificate ?? null;
      },
    });

  // Config mutation (instant save)
  const configMutation = useMutation({
    mutationFn: (
      data: Partial<{
        environment: EsocialEnvironment;
        autoGenerate: boolean;
        requireApproval: boolean;
        employerType: string;
      }>
    ) => esocialService.updateConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['esocial', 'config'] });
    },
    onError: error => {
      logger.error(
        'Erro ao salvar configuração eSocial',
        error instanceof Error ? error : undefined
      );
      toast.error('Erro ao salvar configuração');
    },
  });

  // Certificate upload state
  const [certFile, setCertFile] = useState<File | null>(null);
  const [certPassphrase, setCertPassphrase] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadCertificate = useCallback(async () => {
    if (!certFile || !certPassphrase) return;
    setIsUploading(true);
    try {
      await esocialService.uploadCertificate(certFile, certPassphrase);
      await queryClient.invalidateQueries({
        queryKey: ['esocial', 'certificate'],
      });
      toast.success('Certificado digital enviado com sucesso');
      setCertFile(null);
      setCertPassphrase('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      logger.error(
        'Erro ao enviar certificado',
        error instanceof Error ? error : undefined
      );
      toast.error('Erro ao enviar certificado digital');
    } finally {
      setIsUploading(false);
    }
  }, [certFile, certPassphrase, queryClient]);

  // Certificate status helpers
  function getCertStatusBadge(cert: EsocialCertificate) {
    if (cert.isExpired) {
      return (
        <span className="inline-flex items-center rounded-full border-2 border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/8 px-3 py-1 text-xs font-medium text-rose-700 dark:text-rose-300">
          Expirado
        </span>
      );
    }
    if (cert.daysLeft <= 30) {
      return (
        <span className="inline-flex items-center rounded-full border-2 border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/8 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
          Expira em {cert.daysLeft} dias
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full border-2 border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/8 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
        Válido ({cert.daysLeft} dias)
      </span>
    );
  }

  if (isLoadingConfig || isLoadingCert) {
    return <GridLoading count={3} layout="list" size="md" />;
  }

  return (
    <div className="space-y-6">
      {/* Top grid: Config + Certificate */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Config card */}
        <Card className="bg-white/5 overflow-hidden py-0">
          <div className="space-y-3 px-4 pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-500/10">
                <Settings className="h-4 w-4 text-violet-500" />
              </div>
              <div>
                <h3 className="text-base font-semibold">
                  Configurações Gerais
                </h3>
                <p className="text-sm text-muted-foreground">
                  Ambiente e regras de geração
                </p>
              </div>
            </div>
            <div className="border-b border-border" />
          </div>

          <div className="p-4 space-y-5">
            {/* Environment */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Ambiente</p>
              <p className="text-xs text-muted-foreground">
                Selecione o ambiente de envio dos eventos
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={
                    configData?.environment === 'PRODUCAO'
                      ? 'default'
                      : 'outline'
                  }
                  className="h-9 px-2.5"
                  onClick={() =>
                    configMutation.mutate({ environment: 'PRODUCAO' })
                  }
                  disabled={configMutation.isPending}
                >
                  Produção
                </Button>
                <Button
                  size="sm"
                  variant={
                    configData?.environment === 'HOMOLOGACAO'
                      ? 'default'
                      : 'outline'
                  }
                  className="h-9 px-2.5"
                  onClick={() =>
                    configMutation.mutate({ environment: 'HOMOLOGACAO' })
                  }
                  disabled={configMutation.isPending}
                >
                  Homologação
                </Button>
              </div>
            </div>

            {/* Auto generate */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Geração Automática</p>
                <p className="text-xs text-muted-foreground">
                  Gerar eventos automaticamente ao alterar dados
                </p>
              </div>
              <Switch
                checked={configData?.autoGenerate ?? false}
                onCheckedChange={checked =>
                  configMutation.mutate({ autoGenerate: checked })
                }
                disabled={configMutation.isPending}
                aria-label="Geração automática"
              />
            </div>

            {/* Require approval */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Exigir Aprovação</p>
                <p className="text-xs text-muted-foreground">
                  Eventos requerem aprovação antes do envio
                </p>
              </div>
              <Switch
                checked={configData?.requireApproval ?? false}
                onCheckedChange={checked =>
                  configMutation.mutate({ requireApproval: checked })
                }
                disabled={configMutation.isPending}
                aria-label="Exigir aprovação"
              />
            </div>

            {/* Employer type */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Tipo de Empregador</p>
              <p className="text-xs text-muted-foreground">
                Tipo de documento do empregador
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={
                    configData?.employerType === 'CNPJ' ? 'default' : 'outline'
                  }
                  className="h-9 px-2.5"
                  onClick={() =>
                    configMutation.mutate({ employerType: 'CNPJ' })
                  }
                  disabled={configMutation.isPending}
                >
                  CNPJ
                </Button>
                <Button
                  size="sm"
                  variant={
                    configData?.employerType === 'CPF' ? 'default' : 'outline'
                  }
                  className="h-9 px-2.5"
                  onClick={() => configMutation.mutate({ employerType: 'CPF' })}
                  disabled={configMutation.isPending}
                >
                  CPF
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Certificate card */}
        <Card className="bg-white/5 overflow-hidden py-0">
          <div className="space-y-3 px-4 pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-500/10">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-base font-semibold">Certificado Digital</h3>
                <p className="text-sm text-muted-foreground">
                  Certificado A1 (PFX/P12)
                </p>
              </div>
            </div>
            <div className="border-b border-border" />
          </div>

          <div className="p-4 space-y-4">
            {certData ? (
              <>
                {/* Certificate info */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">Status</p>
                    {getCertStatusBadge(certData)}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Número de Série
                    </p>
                    <p className="text-sm font-mono truncate">
                      {certData.serialNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Emissor</p>
                    <p className="text-sm truncate">{certData.issuer}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Titular</p>
                    <p className="text-sm truncate">{certData.subject}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Válido de</p>
                      <p className="text-sm">
                        {new Date(certData.validFrom).toLocaleDateString(
                          'pt-BR'
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Válido até
                      </p>
                      <p className="text-sm">
                        {new Date(certData.validUntil).toLocaleDateString(
                          'pt-BR'
                        )}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="border-b border-border" />
              </>
            ) : (
              <div className="text-center py-4">
                <ShieldCheck className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhum certificado cadastrado
                </p>
              </div>
            )}

            {/* Upload form */}
            <div className="space-y-3">
              <p className="text-sm font-medium">
                {certData ? 'Substituir Certificado' : 'Enviar Certificado'}
              </p>
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pfx,.p12"
                  onChange={e => setCertFile(e.target.files?.[0] ?? null)}
                  className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer"
                />
                <Input
                  type="password"
                  placeholder="Senha do certificado"
                  value={certPassphrase}
                  onChange={e => setCertPassphrase(e.target.value)}
                  className="h-9"
                />
              </div>
              <Button
                size="sm"
                className="h-9 px-2.5"
                onClick={handleUploadCertificate}
                disabled={!certFile || !certPassphrase || isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Enviar
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Info card */}
      <Card className="bg-white/5 p-4">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-sky-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Sobre o eSocial</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              O eSocial (Sistema de Escrituração Digital das Obrigações Fiscais,
              Previdenciárias e Trabalhistas) é o sistema do Governo Federal que
              unifica o envio das informações trabalhistas, previdenciárias e
              fiscais relativas a todos os trabalhadores. Mantenha o certificado
              digital atualizado e configure o ambiente correto antes de
              transmitir eventos.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function HRSettingsPage() {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'geral';

  return (
    <PageLayout data-testid="hr-settings-page">
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'RH', href: '/hr' },
            { label: 'Configurações' },
          ]}
        />

        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-purple-600 shadow-lg">
              <Settings className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">Recursos Humanos</p>
              <h1 className="text-xl font-bold truncate">
                Configurações do Módulo
              </h1>
            </div>
          </div>
        </Card>
      </PageHeader>

      <PageBody>
        <Tabs defaultValue={defaultTab}>
          <TabsList className="grid w-full grid-cols-3 h-12 mb-4">
            <TabsTrigger value="geral">Geral</TabsTrigger>
            <TabsTrigger value="ponto">Controle de Ponto</TabsTrigger>
            <TabsTrigger value="esocial">eSocial</TabsTrigger>
          </TabsList>

          <TabsContent value="geral">
            <GeralTab />
          </TabsContent>

          <TabsContent value="ponto">
            <PontoTab />
          </TabsContent>

          <TabsContent value="esocial">
            <EsocialTab />
          </TabsContent>
        </Tabs>
      </PageBody>
    </PageLayout>
  );
}
