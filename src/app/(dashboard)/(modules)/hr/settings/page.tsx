'use client';

import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import type { HeaderButton } from '@/components/layout/types/header.types';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { logger } from '@/lib/logger';
import { hrConfigService } from '@/services/hr/hr-config.service';
import type { HrTenantConfig } from '@/types/hr';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import {
  Baby,
  Building,
  Building2,
  Clock,
  DollarSign,
  Heart,
  Landmark,
  Loader2,
  Percent,
  Save,
  Scale,
  Settings,
  User,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

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
// MAIN PAGE
// =============================================================================

export default function HRSettingsPage() {
  const queryClient = useQueryClient();

  // ---------------------------------------------------------------------------
  // LOCAL STATE
  // ---------------------------------------------------------------------------

  // Empresa Cidadã
  const [empresaCidadaEnabled, setEmpresaCidadaEnabled] = useState(false);
  const [maternityLeaveDays, setMaternityLeaveDays] = useState(120);
  const [paternityLeaveDays, setPaternityLeaveDays] = useState(5);

  // Contribuição Sindical
  const [unionContributionEnabled, setUnionContributionEnabled] = useState(false);
  const [unionContributionRate, setUnionContributionRate] = useState(100);

  // PAT
  const [patEnabled, setPatEnabled] = useState(false);
  const [patMonthlyValue, setPatMonthlyValue] = useState(0);

  // Banco de Horas
  const [timeBankIndividualMonths, setTimeBankIndividualMonths] = useState(6);
  const [timeBankCollectiveMonths, setTimeBankCollectiveMonths] = useState(12);

  // Contribuição Patronal
  const [ratPercent, setRatPercent] = useState(1);
  const [fapFactor, setFapFactor] = useState(1);
  const [terceirosPercent, setTerceirosPercent] = useState(5.8);

  const [isSaving, setIsSaving] = useState(false);

  // ---------------------------------------------------------------------------
  // QUERIES
  // ---------------------------------------------------------------------------

  const { data: configData, isLoading } = useQuery<HrTenantConfig>({
    queryKey: ['hr-config'],
    queryFn: async () => {
      const response = await hrConfigService.getConfig();
      return response.config;
    },
  });

  // Sync local state from server
  useEffect(() => {
    if (configData) {
      setEmpresaCidadaEnabled(configData.empresaCidadaEnabled);
      setMaternityLeaveDays(configData.maternityLeaveDays);
      setPaternityLeaveDays(configData.paternityLeaveDays);
      setUnionContributionEnabled(configData.unionContributionEnabled);
      setUnionContributionRate(configData.unionContributionRate);
      setPatEnabled(configData.patEnabled);
      setPatMonthlyValue(configData.patMonthlyValue);
      setTimeBankIndividualMonths(configData.timeBankIndividualMonths);
      setTimeBankCollectiveMonths(configData.timeBankCollectiveMonths);
      setRatPercent(configData.ratPercent);
      setFapFactor(configData.fapFactor);
      setTerceirosPercent(configData.terceirosPercent);
    }
  }, [configData]);

  // ---------------------------------------------------------------------------
  // HANDLERS
  // ---------------------------------------------------------------------------

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
        patMonthlyValue,
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

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Configurações' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridLoading count={5} layout="list" size="md" />
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
            { label: 'Configurações' },
          ]}
          buttons={actionButtons}
        />

        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-purple-600 shadow-lg">
              <Settings className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">
                Recursos Humanos
              </p>
              <h1 className="text-xl font-bold truncate">Configurações Gerais</h1>
            </div>
          </div>
        </Card>
      </PageHeader>

      <PageBody>
        <div className="space-y-6">
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
                    onChange={e =>
                      setUnionContributionRate(Number(e.target.value))
                    }
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
      </PageBody>
    </PageLayout>
  );
}
