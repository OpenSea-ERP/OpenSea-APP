/**
 * Fiscal Configuration Page
 * Configuração do módulo fiscal: provedor, regime tributário, numeração, certificado digital
 */

'use client';

import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { FINANCE_PERMISSIONS } from '@/config/rbac/permission-codes';
import {
  useFiscalConfig,
  useUpdateFiscalConfig,
  useUploadCertificate,
} from '@/hooks/finance';
import { translateError } from '@/lib/error-messages';
import { usePermissions } from '@/hooks/use-permissions';
import type {
  FiscalProviderType,
  NfeEnvironment,
  TaxRegime,
  UpdateFiscalConfigData,
} from '@/types/fiscal';
import { FISCAL_PROVIDER_LABELS, TAX_REGIME_LABELS } from '@/types/fiscal';
import {
  AlertTriangle,
  ChevronDown,
  Cloud,
  FileKey,
  Hash,
  Landmark,
  Loader2,
  Save,
  Shield,
  Upload,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

// =============================================================================
// COLLAPSIBLE SECTION COMPONENT
// =============================================================================

function CollapsibleSection({
  icon: Icon,
  title,
  subtitle,
  defaultOpen = true,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="bg-white dark:bg-slate-800/60 border border-border">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer select-none hover:bg-muted/40 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-violet-50 dark:bg-violet-500/8">
                  <Icon className="h-4 w-4 text-violet-700 dark:text-violet-300" />
                </div>
                <div>
                  <CardTitle className="text-base">{title}</CardTitle>
                  <p className="text-sm text-muted-foreground">{subtitle}</p>
                </div>
              </div>
              <ChevronDown
                className={`h-5 w-5 text-muted-foreground transition-transform ${
                  isOpen ? 'rotate-180' : ''
                }`}
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">{children}</CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

// =============================================================================
// CERTIFICATE INFO COMPONENT
// =============================================================================

function CertificateInfo({ config }: { config: Record<string, unknown> }) {
  const cert = config.certificate as
    | {
        serialNumber?: string;
        subject?: string;
        validFrom?: string;
        validUntil?: string;
      }
    | undefined;

  const daysUntilExpiry = useMemo(() => {
    if (!cert?.validUntil) return null;
    const now = new Date();
    const expiry = new Date(cert.validUntil);
    return Math.ceil(
      (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
  }, [cert?.validUntil]);

  const isExpired = daysUntilExpiry !== null && daysUntilExpiry <= 0;
  const isWarning =
    daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry < 30;
  const isCritical =
    daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry < 7;

  return (
    <div className="p-4 rounded-lg border bg-muted/40">
      <div className="flex items-center gap-2 mb-3">
        <FileKey className="h-4 w-4 text-emerald-500" />
        <span className="font-medium text-sm">Certificado Ativo</span>
        {isExpired ? (
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border border-rose-600/25 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-500/8 text-rose-700 dark:text-rose-300">
            Expirado
          </span>
        ) : (
          <Badge
            variant="outline"
            className="border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300"
          >
            Válido
          </Badge>
        )}
        {!isExpired && isCritical && (
          <Badge className="bg-rose-50 text-rose-700 dark:bg-rose-500/8 dark:text-rose-300 border-rose-200 dark:border-rose-500/20">
            Expira em {daysUntilExpiry} dia{daysUntilExpiry !== 1 ? 's' : ''}
          </Badge>
        )}
        {!isExpired && isWarning && !isCritical && (
          <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-500/8 dark:text-amber-300 border-amber-200 dark:border-amber-500/20">
            Expira em {daysUntilExpiry} dias
          </Badge>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-muted-foreground">ID: </span>
          <span className="font-mono text-xs">
            {config.certificateId as string}
          </span>
        </div>
        {cert?.serialNumber && (
          <div>
            <span className="text-muted-foreground">Número de Série: </span>
            <span className="font-mono text-xs">{cert.serialNumber}</span>
          </div>
        )}
        {cert?.subject && (
          <div>
            <span className="text-muted-foreground">Emitente: </span>
            <span className="text-xs">{cert.subject}</span>
          </div>
        )}
        {cert?.validFrom && (
          <div>
            <span className="text-muted-foreground">Válido Desde: </span>
            <span className="text-xs">
              {new Date(cert.validFrom).toLocaleDateString('pt-BR')}
            </span>
          </div>
        )}
        {cert?.validUntil && (
          <div>
            <span className="text-muted-foreground">Válido Até: </span>
            <span
              className={`text-xs ${isExpired ? 'text-rose-600 dark:text-rose-400 font-medium' : isCritical ? 'text-rose-600 dark:text-rose-400' : isWarning ? 'text-amber-600 dark:text-amber-400' : ''}`}
            >
              {new Date(cert.validUntil).toLocaleDateString('pt-BR')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// LOADING SKELETON
// =============================================================================

function ConfigSkeleton() {
  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Financeiro', href: '/finance' },
            { label: 'Documentos Fiscais', href: '/finance/fiscal' },
            { label: 'Configurações' },
          ]}
        />
      </PageHeader>
      <PageBody>
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-5 w-48 mb-4" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </Card>
        ))}
      </PageBody>
    </PageLayout>
  );
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function FiscalConfigPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const { data, isLoading } = useFiscalConfig();
  const updateConfig = useUpdateFiscalConfig();
  const uploadCertificate = useUploadCertificate();

  const canAdmin = hasPermission(FINANCE_PERMISSIONS.FISCAL.ADMIN);

  // Form state
  const [provider, setProvider] = useState<FiscalProviderType>('NUVEM_FISCAL');
  const [environment, setEnvironment] =
    useState<NfeEnvironment>('HOMOLOGATION');
  const [apiKey, setApiKey] = useState('');
  const [taxRegime, setTaxRegime] = useState<TaxRegime>('SIMPLES');
  const [defaultCfop, setDefaultCfop] = useState('');
  const [defaultNaturezaOperacao, setDefaultNaturezaOperacao] = useState('');
  const [defaultSeries, setDefaultSeries] = useState(1);
  const [lastNfeNumber, setLastNfeNumber] = useState(0);
  const [lastNfceNumber, setLastNfceNumber] = useState(0);
  const [nfceEnabled, setNfceEnabled] = useState(false);
  const [nfceCscId, setNfceCscId] = useState('');
  const [nfceCscToken, setNfceCscToken] = useState('');
  const [apiSecret, setApiSecret] = useState('');

  // Contingência
  const [contingencyMode, setContingencyMode] = useState(false);
  const [contingencyReason, setContingencyReason] = useState('');

  // Certificate
  const [certPassword, setCertPassword] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const config = data?.config;

  // Populate form from fetched data
  useEffect(() => {
    if (config) {
      setProvider(config.provider);
      setEnvironment(config.environment);
      setTaxRegime(config.taxRegime);
      setDefaultCfop(config.defaultCfop ?? '');
      setDefaultNaturezaOperacao(config.defaultNaturezaOperacao ?? '');
      setDefaultSeries(config.defaultSeries);
      setLastNfeNumber(config.lastNfeNumber);
      setLastNfceNumber(config.lastNfceNumber);
      setNfceEnabled(config.nfceEnabled);
      setNfceCscId(config.nfceCscId ?? '');
      setNfceCscToken(config.nfceCscToken ?? '');
    }
  }, [config]);

  const handleSave = useCallback(async () => {
    const payload: UpdateFiscalConfigData = {
      provider,
      environment,
      taxRegime,
      defaultCfop: defaultCfop || undefined,
      defaultNaturezaOperacao: defaultNaturezaOperacao || undefined,
      defaultSeries,
      nfceEnabled,
      ...(apiKey ? { apiKey } : {}),
      ...(apiSecret ? { apiSecret } : {}),
      ...(nfceCscId ? { nfceCscId } : {}),
      ...(nfceCscToken ? { nfceCscToken } : {}),
    };

    try {
      await updateConfig.mutateAsync(payload);
      toast.success('Configurações fiscais salvas com sucesso.');
    } catch (error) {
      toast.error(
        translateError(
          error instanceof Error
            ? error.message
            : 'Erro ao salvar configurações fiscais.'
        )
      );
    }
  }, [
    provider,
    environment,
    apiKey,
    apiSecret,
    taxRegime,
    defaultCfop,
    defaultNaturezaOperacao,
    defaultSeries,
    nfceEnabled,
    nfceCscId,
    nfceCscToken,
    updateConfig,
  ]);

  const handleCertificateUpload = useCallback(async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error('Selecione um arquivo de certificado (.pfx).');
      return;
    }
    if (!certPassword) {
      toast.error('Informe a senha do certificado.');
      return;
    }

    try {
      await uploadCertificate.mutateAsync({ file, password: certPassword });
      toast.success('Certificado digital enviado com sucesso.');
      setCertPassword('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error) {
      toast.error(
        translateError(
          error instanceof Error
            ? error.message
            : 'Erro ao enviar certificado digital.'
        )
      );
    }
  }, [certPassword, uploadCertificate]);

  if (isLoading) return <ConfigSkeleton />;

  if (!canAdmin) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Financeiro', href: '/finance' },
              { label: 'Documentos Fiscais', href: '/finance/fiscal' },
              { label: 'Configurações' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <Card className="p-12 text-center">
            <p className="text-muted-foreground text-lg">
              Você não tem permissão para acessar as configurações fiscais.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push('/finance/fiscal')}
            >
              Voltar
            </Button>
          </Card>
        </PageBody>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Financeiro', href: '/finance' },
            { label: 'Documentos Fiscais', href: '/finance/fiscal' },
            { label: 'Configurações' },
          ]}
          buttons={[
            {
              id: 'save',
              title: 'Salvar',
              icon: Save,
              onClick: handleSave,
              variant: 'default',
              disabled: updateConfig.isPending,
            },
          ]}
        />
      </PageHeader>

      <PageBody>
        {/* Section 1: Provedor de Emissão */}
        <CollapsibleSection
          icon={Cloud}
          title="Provedor de Emissão"
          subtitle="Configure o provedor de emissão de notas fiscais e ambiente"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Provedor</Label>
              <Select
                value={provider}
                onValueChange={v => setProvider(v as FiscalProviderType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o provedor" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(FISCAL_PROVIDER_LABELS).map(
                    ([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Chave de API</Label>
              <Input
                type="password"
                placeholder="Insira a chave de API do provedor"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Chave Secreta da API</Label>
              <Input
                type="password"
                placeholder="Insira a chave secreta da API"
                value={apiSecret}
                onChange={e => setApiSecret(e.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Ambiente</Label>
              <div className="flex items-center gap-4">
                <div
                  className={`flex-1 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    environment === 'HOMOLOGATION'
                      ? 'border-sky-500 bg-sky-50 dark:bg-sky-500/8'
                      : 'border-border hover:border-muted-foreground/30'
                  }`}
                  onClick={() => setEnvironment('HOMOLOGATION')}
                >
                  <p className="font-medium text-sm">Homologação</p>
                  <p className="text-xs text-muted-foreground">
                    Ambiente de testes (SEFAZ)
                  </p>
                </div>
                <div
                  className={`flex-1 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    environment === 'PRODUCTION'
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/8'
                      : 'border-border hover:border-muted-foreground/30'
                  }`}
                  onClick={() => setEnvironment('PRODUCTION')}
                >
                  <p className="font-medium text-sm">Produção</p>
                  <p className="text-xs text-muted-foreground">
                    Ambiente real de emissão
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleSection>

        {/* Section 2: Regime Tributário */}
        <CollapsibleSection
          icon={Landmark}
          title="Regime Tributário"
          subtitle="Defina o regime tributário e padrões fiscais da empresa"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Regime Tributário</Label>
              <Select
                value={taxRegime}
                onValueChange={v => setTaxRegime(v as TaxRegime)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o regime" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TAX_REGIME_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>CFOP Padrão</Label>
              <Input
                placeholder="Ex: 5102"
                value={defaultCfop}
                onChange={e => setDefaultCfop(e.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Natureza da Operação Padrão</Label>
              <Input
                placeholder="Ex: Venda de Mercadoria"
                value={defaultNaturezaOperacao}
                onChange={e => setDefaultNaturezaOperacao(e.target.value)}
              />
            </div>
          </div>
        </CollapsibleSection>

        {/* Section 3: Numeração */}
        <CollapsibleSection
          icon={Hash}
          title="Numeração"
          subtitle="Configure série e numeração de NF-e e NFC-e"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Série Padrão</Label>
              <Input
                type="number"
                min={1}
                value={defaultSeries}
                onChange={e => setDefaultSeries(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label>Último Número NF-e</Label>
              <Input
                type="number"
                min={0}
                value={lastNfeNumber}
                onChange={e => setLastNfeNumber(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label>Último Número NFC-e</Label>
              <Input
                type="number"
                min={0}
                value={lastNfceNumber}
                onChange={e => setLastNfceNumber(Number(e.target.value))}
                disabled={!nfceEnabled}
              />
            </div>

            <div className="md:col-span-3 flex items-center gap-3 p-3 rounded-lg border">
              <Switch
                checked={nfceEnabled}
                onCheckedChange={setNfceEnabled}
                id="nfce-enabled"
              />
              <div>
                <Label htmlFor="nfce-enabled" className="cursor-pointer">
                  Habilitar NFC-e
                </Label>
                <p className="text-xs text-muted-foreground">
                  Permite a emissão de Notas Fiscais ao Consumidor Eletrônica
                </p>
              </div>
            </div>

            {nfceEnabled && (
              <>
                <div className="md:col-span-3 mt-2">
                  <div className="p-4 rounded-lg border bg-sky-50/50 dark:bg-sky-500/5 border-sky-200 dark:border-sky-500/20">
                    <p className="text-sm text-sky-700 dark:text-sky-300 mb-3">
                      O CSC (Código de Segurança do Contribuinte) é obrigatório
                      para a emissão de NFC-e. Solicite junto à SEFAZ do seu
                      estado.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>
                          Código de Segurança do Contribuinte (CSC) - ID
                        </Label>
                        <Input
                          placeholder="Ex: 000001"
                          value={nfceCscId}
                          onChange={e => setNfceCscId(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Token CSC</Label>
                        <Input
                          type="password"
                          placeholder="Token fornecido pela SEFAZ"
                          value={nfceCscToken}
                          onChange={e => setNfceCscToken(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </CollapsibleSection>

        {/* Section 4: Certificado Digital */}
        <CollapsibleSection
          icon={Shield}
          title="Certificado Digital"
          subtitle="Envie e gerencie o certificado digital A1 para emissão de notas"
        >
          <div className="space-y-6">
            {/* Current certificate info */}
            {config?.certificateId && (
              <CertificateInfo
                config={config as unknown as Record<string, unknown>}
              />
            )}

            {/* Upload new certificate */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Arquivo do Certificado (.pfx)</Label>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".pfx,.p12"
                  className="cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <Label>Senha do Certificado</Label>
                <Input
                  type="password"
                  placeholder="Senha do certificado digital"
                  value={certPassword}
                  onChange={e => setCertPassword(e.target.value)}
                />
              </div>
            </div>

            <Button
              onClick={handleCertificateUpload}
              disabled={uploadCertificate.isPending}
              className="gap-2"
            >
              {uploadCertificate.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Enviar Certificado
            </Button>
          </div>
        </CollapsibleSection>

        {/* Section 5: Contingência */}
        <CollapsibleSection
          icon={AlertTriangle}
          title="Modo Contingência"
          subtitle="Ative o modo de contingência quando a SEFAZ estiver indisponível"
          defaultOpen={false}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <Switch
                checked={contingencyMode}
                onCheckedChange={setContingencyMode}
                id="contingency-mode"
              />
              <div>
                <Label htmlFor="contingency-mode" className="cursor-pointer">
                  Ativar Modo Contingência
                </Label>
                <p className="text-xs text-muted-foreground">
                  As notas serão emitidas em modo offline e transmitidas quando
                  a SEFAZ voltar
                </p>
              </div>
            </div>

            {contingencyMode && (
              <div className="space-y-3">
                <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/5">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                      Atenção
                    </span>
                  </div>
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    O modo contingência deve ser utilizado apenas quando a SEFAZ
                    estiver indisponível. As notas emitidas em contingência
                    precisam ser transmitidas assim que o serviço for
                    restabelecido.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Motivo da Contingência *</Label>
                  <Textarea
                    placeholder="Descreva o motivo da ativação do modo contingência (ex: SEFAZ indisponível desde 14:00)"
                    value={contingencyReason}
                    onChange={e => setContingencyReason(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            )}
          </div>
        </CollapsibleSection>
      </PageBody>
    </PageLayout>
  );
}
