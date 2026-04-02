/**
 * BankApiSetupModal
 * NavigationWizardDialog para configurar integração de API bancária em uma conta.
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import {
  NavigationWizardDialog,
  type NavigationSection,
} from '@/components/ui/navigation-wizard-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  ShieldCheck,
  Settings2,
  Zap,
  Loader2,
  CheckCircle2,
  XCircle,
  Info,
  Upload,
  Clock,
  FlaskConical,
} from 'lucide-react';
import { toast } from 'sonner';
import { bankAccountsService } from '@/services/finance';
import { storageFilesService } from '@/services/storage/files.service';
import type { BankAccount, BankApiConfigData } from '@/types/finance';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface BankApiSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bankAccountId: string;
  bankAccount?: BankAccount | null;
  onSaved?: () => void;
}

type SectionId = 'provider' | 'certificate' | 'settings' | 'test';

type CertMode = 'pfx' | 'pem';

interface FormState {
  apiProvider: string;
  apiClientId: string;
  apiScopes: string;
  apiEnabled: boolean;
  autoEmitBoleto: boolean;
  autoLowThreshold: string;
  apiWebhookSecret: string;
  certificatePath: string;
  keyPath: string;
}

type HealthCheckResult = {
  provider: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latencyMs: number;
  checks: {
    auth: { ok: boolean; error?: string };
    balance: { ok: boolean; error?: string };
    timestamp: string;
  };
  sandbox: boolean;
};

// ============================================================================
// PROVIDER OPTIONS
// ============================================================================

const PROVIDER_OPTIONS = [
  { value: 'SICOOB', label: 'Sicoob' },
  { value: 'SICREDI', label: 'Sicredi' },
  { value: 'BANCO_DO_BRASIL', label: 'Banco do Brasil' },
  { value: 'BRADESCO', label: 'Bradesco' },
  { value: 'ITAU', label: 'Itaú' },
  { value: 'CAIXA', label: 'Caixa Econômica Federal' },
  { value: 'SANTANDER', label: 'Santander' },
];

const DEFAULT_SCOPES: Record<string, string> = {
  SICOOB:
    'cobranca_boletos.consulta,cobranca_boletos.inclusao,cobranca_boletos.alteracao,cobranca_boletos.exclusao,pix.read,pix.write',
  SICREDI: 'openid,boleto_cobranca_consultar,pix_recebimentos_consultar',
  BANCO_DO_BRASIL: 'boletos.read,boletos.write,pix.read,pix.write',
  BRADESCO: 'cobrancas,pix',
  ITAU: 'boleto_cobranca,pix',
  CAIXA: 'boleto,pix',
  SANTANDER: 'cobrancas.boleto,pix',
};

// ============================================================================
// SECTIONS
// ============================================================================

const SECTIONS: NavigationSection[] = [
  {
    id: 'provider',
    label: 'Provedor',
    icon: <Building2 className="h-4 w-4" />,
    description: 'Banco e credenciais de acesso',
  },
  {
    id: 'certificate',
    label: 'Certificado',
    icon: <ShieldCheck className="h-4 w-4" />,
    description: 'Certificado e chave privada',
  },
  {
    id: 'settings',
    label: 'Configurações',
    icon: <Settings2 className="h-4 w-4" />,
    description: 'Opções de automação e webhook',
  },
  {
    id: 'test',
    label: 'Teste',
    icon: <Zap className="h-4 w-4" />,
    description: 'Verificar conexão com o banco',
  },
];

// ============================================================================
// HELPERS
// ============================================================================

function formatCurrencyValue(raw: string): string {
  const numeric = raw.replace(/\D/g, '');
  if (!numeric) return '';
  const value = parseInt(numeric, 10) / 100;
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function parseCurrencyValue(formatted: string): number {
  return parseFloat(formatted.replace(/\./g, '').replace(',', '.')) || 0;
}

// ============================================================================
// SECTION COMPONENTS
// ============================================================================

function ProviderSection({
  form,
  onChange,
}: {
  form: FormState;
  onChange: (patch: Partial<FormState>) => void;
}) {
  const handleProviderChange = (value: string) => {
    onChange({
      apiProvider: value,
      apiScopes: DEFAULT_SCOPES[value] ?? '',
    });
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="apiProvider">Provedor de API</Label>
        <Select value={form.apiProvider} onValueChange={handleProviderChange}>
          <SelectTrigger id="apiProvider">
            <SelectValue placeholder="Selecione o banco..." />
          </SelectTrigger>
          <SelectContent>
            {PROVIDER_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Selecione o banco desta conta para carregar as configurações de API
          correspondentes.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="apiClientId">Client ID</Label>
        <Input
          id="apiClientId"
          value={form.apiClientId}
          onChange={e => onChange({ apiClientId: e.target.value })}
          placeholder="Ex: 00000000-0000-0000-0000-000000000000"
          autoComplete="off"
        />
        <p className="text-xs text-muted-foreground">
          Identificador do cliente fornecido pelo banco ao registrar a
          aplicação.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="apiScopes">Escopos (separados por vírgula)</Label>
        <textarea
          id="apiScopes"
          className={cn(
            'flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
            'ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none',
            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50 resize-none font-mono'
          )}
          value={form.apiScopes}
          onChange={e => onChange({ apiScopes: e.target.value })}
          placeholder="cobranca_boletos.consulta,cobranca_boletos.inclusao,pix.read,pix.write"
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          Escopos de permissão para solicitar ao banco. Os padrões são
          preenchidos automaticamente ao selecionar o provedor.
        </p>
      </div>

      {form.apiProvider && (
        <div className="rounded-lg bg-sky-50 dark:bg-sky-500/8 border border-sky-600/20 dark:border-sky-500/20 p-3 flex gap-2">
          <Info className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
          <p className="text-xs text-sky-700 dark:text-sky-300">
            Para obter o Client ID, acesse o portal de desenvolvedores do{' '}
            {PROVIDER_OPTIONS.find(o => o.value === form.apiProvider)?.label} e
            registre sua aplicação com as permissões de cobrança e PIX.
          </p>
        </div>
      )}
    </div>
  );
}

function CertificateSection({
  form,
  onChange,
  certFileRef,
  keyFileRef,
  certMode,
  setCertMode,
  pfxFileRef,
  pfxFileName,
  setPfxFileName,
  pfxPassword,
  setPfxPassword,
}: {
  form: FormState;
  onChange: (patch: Partial<FormState>) => void;
  certFileRef: React.MutableRefObject<File | null>;
  keyFileRef: React.MutableRefObject<File | null>;
  certMode: CertMode;
  setCertMode: (mode: CertMode) => void;
  pfxFileRef: React.MutableRefObject<File | null>;
  pfxFileName: string;
  setPfxFileName: (name: string) => void;
  pfxPassword: string;
  setPfxPassword: (pw: string) => void;
}) {
  const handleFileChange = (
    field: 'certificatePath' | 'keyPath',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (field === 'certificatePath') certFileRef.current = file;
      else keyFileRef.current = file;
      onChange({ [field]: file.name });
      toast.info(
        `Arquivo "${file.name}" selecionado. O envio ocorrerá ao salvar.`
      );
    }
  };

  const handlePfxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      pfxFileRef.current = file;
      setPfxFileName(file.name);
      toast.info(
        `Arquivo "${file.name}" selecionado. O envio ocorrerá ao salvar.`
      );
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-lg bg-amber-50 dark:bg-amber-500/8 border border-amber-600/20 dark:border-amber-500/20 p-3 flex gap-2">
        <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 dark:text-amber-300">
          Os certificados são armazenados de forma criptografada e nunca
          expostos via API. Apenas o servidor de backend possui acesso à chave
          de descriptografia.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setCertMode('pfx')}
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
            certMode === 'pfx'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          )}
        >
          Certificado PFX
        </button>
        <button
          type="button"
          onClick={() => setCertMode('pem')}
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
            certMode === 'pem'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          )}
        >
          PEM (Avançado)
        </button>
      </div>

      {certMode === 'pfx' ? (
        <>
          {/* PFX file input */}
          <div className="space-y-1.5">
            <Label>Arquivo de Certificado (.pfx / .p12)</Label>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'flex-1 flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm',
                  'text-muted-foreground'
                )}
              >
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span className="truncate">
                  {pfxFileName || 'Nenhum arquivo selecionado'}
                </span>
              </div>
              <label
                htmlFor="pfx-upload"
                className={cn(
                  'flex items-center gap-2 h-9 px-2.5 rounded-lg text-sm font-medium cursor-pointer',
                  'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors'
                )}
              >
                <Upload className="h-4 w-4" />
                Selecionar
                <input
                  id="pfx-upload"
                  type="file"
                  accept=".pfx,.p12"
                  className="sr-only"
                  onChange={handlePfxChange}
                />
              </label>
            </div>
            {pfxFileName && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{pfxFileName}</span>
              </div>
            )}
          </div>

          {/* PFX password */}
          <div className="space-y-1.5">
            <Label htmlFor="pfx-password">Senha do certificado</Label>
            <Input
              id="pfx-password"
              type="password"
              value={pfxPassword}
              onChange={e => setPfxPassword(e.target.value)}
              placeholder="••••••••••••••••"
              autoComplete="new-password"
            />
            <p className="text-xs text-muted-foreground">
              Senha utilizada para proteger o arquivo PFX/P12.
            </p>
          </div>

          {/* Info box */}
          <div className="rounded-lg bg-sky-50 dark:bg-sky-500/8 border border-sky-600/20 dark:border-sky-500/20 p-3 flex gap-2">
            <Info className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
            <p className="text-xs text-sky-700 dark:text-sky-300">
              Arquivo PFX/P12 será convertido automaticamente para o formato
              necessário.
            </p>
          </div>
        </>
      ) : (
        <>
          {/* PEM cert file */}
          <div className="space-y-1.5">
            <Label>Certificado (.pem)</Label>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'flex-1 flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm',
                  'text-muted-foreground'
                )}
              >
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span className="truncate">
                  {form.certificatePath || 'Nenhum arquivo selecionado'}
                </span>
              </div>
              <label
                htmlFor="cert-upload"
                className={cn(
                  'flex items-center gap-2 h-9 px-2.5 rounded-lg text-sm font-medium cursor-pointer',
                  'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors'
                )}
              >
                <Upload className="h-4 w-4" />
                Selecionar
                <input
                  id="cert-upload"
                  type="file"
                  accept=".pem,.crt"
                  className="sr-only"
                  onChange={e => handleFileChange('certificatePath', e)}
                />
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              Arquivo de certificado digital em formato PEM ou CRT, emitido pelo
              banco.
            </p>
            {form.certificatePath && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{form.certificatePath}</span>
              </div>
            )}
          </div>

          {/* PEM key file */}
          <div className="space-y-1.5">
            <Label>Chave Privada (.key)</Label>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'flex-1 flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm',
                  'text-muted-foreground'
                )}
              >
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span className="truncate">
                  {form.keyPath || 'Nenhum arquivo selecionado'}
                </span>
              </div>
              <label
                htmlFor="key-upload"
                className={cn(
                  'flex items-center gap-2 h-9 px-2.5 rounded-lg text-sm font-medium cursor-pointer',
                  'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors'
                )}
              >
                <Upload className="h-4 w-4" />
                Selecionar
                <input
                  id="key-upload"
                  type="file"
                  accept=".key,.pem"
                  className="sr-only"
                  onChange={e => handleFileChange('keyPath', e)}
                />
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              Arquivo de chave privada correspondente ao certificado, em formato KEY
              ou PEM.
            </p>
            {form.keyPath && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{form.keyPath}</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function SettingsSection({
  form,
  onChange,
}: {
  form: FormState;
  onChange: (patch: Partial<FormState>) => void;
}) {
  const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      onChange({ autoLowThreshold: '' });
      return;
    }
    const formatted = formatCurrencyValue(raw);
    onChange({ autoLowThreshold: formatted });
  };

  return (
    <div className="space-y-5">
      {/* Toggle: API habilitada */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-background p-4">
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">Ativar integração</Label>
          <p className="text-xs text-muted-foreground">
            Habilita o uso da API bancária para emissão e consulta de cobranças.
          </p>
        </div>
        <Switch
          checked={form.apiEnabled}
          onCheckedChange={checked => onChange({ apiEnabled: checked })}
        />
      </div>

      {/* Toggle: Emissão automática de boleto */}
      <div
        className={cn(
          'flex items-center justify-between rounded-xl border border-border bg-background p-4 transition-opacity',
          !form.apiEnabled && 'opacity-50 pointer-events-none'
        )}
      >
        <div className="space-y-0.5">
          <Label className="text-sm font-medium">
            Emitir boleto automaticamente
          </Label>
          <p className="text-xs text-muted-foreground">
            Ao registrar uma nova conta a receber, o boleto é emitido
            automaticamente.
          </p>
        </div>
        <Switch
          checked={form.autoEmitBoleto}
          disabled={!form.apiEnabled}
          onCheckedChange={checked => onChange({ autoEmitBoleto: checked })}
        />
      </div>

      {/* Campo: Valor limite para baixa automática */}
      <div
        className={cn(
          'space-y-1.5 transition-opacity',
          !form.apiEnabled && 'opacity-50 pointer-events-none'
        )}
      >
        <Label htmlFor="autoLowThreshold">
          Valor limite para baixa automática (R$)
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            R$
          </span>
          <Input
            id="autoLowThreshold"
            className="pl-9"
            value={form.autoLowThreshold}
            onChange={handleThresholdChange}
            disabled={!form.apiEnabled}
            placeholder="0,00"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Boletos com valor abaixo deste limite serão baixados automaticamente
          após o vencimento. Deixe em branco para desativar.
        </p>
      </div>

      {/* Campo: Webhook secret */}
      <div
        className={cn(
          'space-y-1.5 transition-opacity',
          !form.apiEnabled && 'opacity-50 pointer-events-none'
        )}
      >
        <Label htmlFor="apiWebhookSecret">
          Secret para validação de webhooks
        </Label>
        <Input
          id="apiWebhookSecret"
          type="password"
          value={form.apiWebhookSecret}
          onChange={e => onChange({ apiWebhookSecret: e.target.value })}
          disabled={!form.apiEnabled}
          placeholder="••••••••••••••••"
          autoComplete="new-password"
        />
        <p className="text-xs text-muted-foreground">
          Chave secreta usada para validar a autenticidade das notificações
          enviadas pelo banco via webhook. Configure o mesmo valor no portal do
          banco.
        </p>
      </div>
    </div>
  );
}

type TestStatus = 'idle' | 'loading' | 'success' | 'error';

function TestSection({
  bankAccountId,
  form,
}: {
  bankAccountId: string;
  form: FormState;
}) {
  const [status, setStatus] = useState<TestStatus>('idle');
  const [healthResult, setHealthResult] = useState<HealthCheckResult | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState('');

  const handleTest = async () => {
    if (!form.apiProvider || !form.apiClientId) {
      toast.error(
        'Preencha o provedor e o Client ID antes de testar a conexão.'
      );
      return;
    }

    setStatus('loading');
    setHealthResult(null);
    setErrorMessage('');

    try {
      const data = await bankAccountsService.healthCheck(bankAccountId);
      setHealthResult(data.health);
      setStatus(data.health.status === 'unhealthy' ? 'error' : 'success');
    } catch (err: unknown) {
      setStatus('error');
      const e = err as { response?: { data?: { message?: string } } };
      setErrorMessage(
        e?.response?.data?.message ||
          'Não foi possível executar o health check.'
      );
    }
  };

  const statusColors = {
    healthy: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300',
    degraded: 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300',
    unhealthy: 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300',
  };

  const statusLabels = {
    healthy: 'Saudável',
    degraded: 'Degradado',
    unhealthy: 'Indisponível',
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <p className="text-sm font-medium">Verificar conexão</p>
        <p className="text-xs text-muted-foreground">
          Clique no botão abaixo para executar um health check completo na API
          do banco, verificando autenticação mTLS + OAuth2 e consulta de saldo.
        </p>
      </div>

      {/* Resumo da configuração */}
      <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Configuração atual
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">Provedor:</span>{' '}
            <span className="font-medium">
              {PROVIDER_OPTIONS.find(o => o.value === form.apiProvider)
                ?.label ?? '—'}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Client ID:</span>{' '}
            <span className="font-mono text-xs">
              {form.apiClientId ? `${form.apiClientId.slice(0, 8)}...` : '—'}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Integração:</span>{' '}
            <Badge
              className={cn(
                'border-0 text-xs',
                form.apiEnabled
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400'
              )}
            >
              {form.apiEnabled ? 'Ativada' : 'Desativada'}
            </Badge>
          </div>
          <div>
            <span className="text-muted-foreground">Certificado:</span>{' '}
            <span className="text-xs">
              {form.certificatePath ? '✓ Configurado' : '— Não configurado'}
            </span>
          </div>
        </div>
      </div>

      <Button
        className="w-full gap-2"
        onClick={handleTest}
        disabled={status === 'loading'}
      >
        {status === 'loading' ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Executando health check...
          </>
        ) : (
          <>
            <Zap className="h-4 w-4" />
            Executar Health Check
          </>
        )}
      </Button>

      {/* Resultado do health check */}
      {healthResult && (
        <div
          className={cn(
            'rounded-xl border p-4 space-y-3',
            healthResult.status === 'healthy'
              ? 'bg-emerald-50 dark:bg-emerald-500/8 border-emerald-600/20 dark:border-emerald-500/20'
              : healthResult.status === 'degraded'
                ? 'bg-amber-50 dark:bg-amber-500/8 border-amber-600/20 dark:border-amber-500/20'
                : 'bg-rose-50 dark:bg-rose-500/8 border-rose-600/20 dark:border-rose-500/20'
          )}
        >
          {/* Header com status e badges */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {healthResult.status !== 'unhealthy' ? (
                <CheckCircle2
                  className={cn(
                    'h-4 w-4 shrink-0',
                    healthResult.status === 'healthy'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400'
                  )}
                />
              ) : (
                <XCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
              )}
              <span
                className={cn(
                  'font-medium text-sm',
                  healthResult.status === 'healthy'
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : healthResult.status === 'degraded'
                      ? 'text-amber-700 dark:text-amber-300'
                      : 'text-rose-700 dark:text-rose-300'
                )}
              >
                {healthResult.status === 'healthy'
                  ? 'Conexão bem-sucedida!'
                  : healthResult.status === 'degraded'
                    ? 'Conexão com alertas'
                    : 'Falha na conexão'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {healthResult.sandbox && (
                <Badge
                  className="border-0 text-xs bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
                >
                  <FlaskConical className="h-3 w-3 mr-1" />
                  Sandbox
                </Badge>
              )}
              <Badge
                className={cn('border-0 text-xs', statusColors[healthResult.status])}
              >
                {statusLabels[healthResult.status]}
              </Badge>
            </div>
          </div>

          {/* Checks individuais */}
          <div className="space-y-2">
            {/* Auth check */}
            <div className="flex items-start gap-2 text-sm">
              {healthResult.checks.auth.ok ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <span
                  className={cn(
                    'font-medium',
                    healthResult.checks.auth.ok
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : 'text-rose-700 dark:text-rose-300'
                  )}
                >
                  Autenticação (mTLS + OAuth2)
                </span>
                {!healthResult.checks.auth.ok &&
                  healthResult.checks.auth.error && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5 truncate">
                      {healthResult.checks.auth.error}
                    </p>
                  )}
              </div>
            </div>

            {/* Balance check */}
            <div className="flex items-start gap-2 text-sm">
              {healthResult.checks.balance.ok ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <span
                  className={cn(
                    'font-medium',
                    healthResult.checks.balance.ok
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : 'text-rose-700 dark:text-rose-300'
                  )}
                >
                  Consulta de Saldo
                </span>
                {!healthResult.checks.balance.ok &&
                  healthResult.checks.balance.error && (
                    <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5 truncate">
                      {healthResult.checks.balance.error}
                    </p>
                  )}
              </div>
            </div>
          </div>

          {/* Latência */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1 border-t border-current/10">
            <Clock className="h-3.5 w-3.5" />
            <span>Latência: {healthResult.latencyMs} ms</span>
          </div>
        </div>
      )}

      {/* Erro genérico (sem healthResult) */}
      {status === 'error' && !healthResult && (
        <div className="rounded-xl bg-rose-50 dark:bg-rose-500/8 border border-rose-600/20 dark:border-rose-500/20 p-4 space-y-2">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300">
            <XCircle className="h-4 w-4 shrink-0" />
            <span className="font-medium text-sm">Falha na conexão</span>
          </div>
          <p className="text-xs text-rose-600 dark:text-rose-400">
            {errorMessage}
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function BankApiSetupModal({
  open,
  onOpenChange,
  bankAccountId,
  bankAccount,
  onSaved,
}: BankApiSetupModalProps) {
  const [activeSection, setActiveSection] = useState<SectionId>('provider');
  const [isPending, setIsPending] = useState(false);

  // File refs — lifted here so handleSave can access them
  const certFileRef = useRef<File | null>(null);
  const keyFileRef = useRef<File | null>(null);

  // PFX state
  const [certMode, setCertMode] = useState<CertMode>('pfx');
  const pfxFileRef = useRef<File | null>(null);
  const [pfxFileName, setPfxFileName] = useState('');
  const [pfxPassword, setPfxPassword] = useState('');

  const [form, setForm] = useState<FormState>({
    apiProvider: '',
    apiClientId: '',
    apiScopes: '',
    apiEnabled: false,
    autoEmitBoleto: false,
    autoLowThreshold: '',
    apiWebhookSecret: '',
    certificatePath: '',
    keyPath: '',
  });

  // Initialize form from existing bank account data
  useEffect(() => {
    if (!open) return;

    // Reset file refs and PFX state when modal opens
    certFileRef.current = null;
    keyFileRef.current = null;
    pfxFileRef.current = null;
    setPfxFileName('');
    setPfxPassword('');
    setCertMode('pfx');

    if (bankAccount) {
      const threshold = bankAccount.autoLowThreshold
        ? formatCurrencyValue(
            String(Math.round(bankAccount.autoLowThreshold * 100))
          )
        : '';

      setForm({
        apiProvider: bankAccount.apiProvider ?? '',
        apiClientId: bankAccount.apiClientId ?? '',
        apiScopes: bankAccount.apiScopes ?? '',
        apiEnabled: bankAccount.apiEnabled ?? false,
        autoEmitBoleto: bankAccount.autoEmitBoleto ?? false,
        autoLowThreshold: threshold,
        apiWebhookSecret: bankAccount.apiWebhookSecret ?? '',
        certificatePath: bankAccount.apiCertificatePath ?? '',
        keyPath: bankAccount.apiKeyPath ?? '',
      });
    }

    setActiveSection('provider');
  }, [open, bankAccount]);

  const handleChange = useCallback((patch: Partial<FormState>) => {
    setForm(prev => ({ ...prev, ...patch }));
  }, []);

  const handleSave = async () => {
    setIsPending(true);
    try {
      let certFileId = bankAccount?.apiCertFileId ?? undefined;
      let keyFileId = bankAccount?.apiCertKeyFileId ?? undefined;

      // PFX conversion — runs before individual PEM uploads
      if (certMode === 'pfx' && pfxFileRef.current && pfxPassword) {
        const formData = new FormData();
        formData.append('file', pfxFileRef.current);
        formData.append('password', pfxPassword);

        const pfxRes = await apiClient.post<{ certFileId: string; keyFileId: string }>(
          `/v1/finance/bank-accounts/${bankAccountId}/convert-pfx`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );

        certFileId = pfxRes.certFileId;
        keyFileId = pfxRes.keyFileId;
      }

      // Upload certificate files if new ones were selected (PEM mode)
      if (certMode === 'pem' && certFileRef.current) {
        const certRes = await storageFilesService.uploadFile(
          null,
          certFileRef.current,
          {
            entityType: 'bank-certificate',
            entityId: bankAccountId,
          }
        );
        certFileId = certRes.file.id;
      }

      if (certMode === 'pem' && keyFileRef.current) {
        const keyRes = await storageFilesService.uploadFile(
          null,
          keyFileRef.current,
          {
            entityType: 'bank-certificate-key',
            entityId: bankAccountId,
          }
        );
        keyFileId = keyRes.file.id;
      }

      const payload: BankApiConfigData = {
        apiProvider: form.apiProvider || undefined,
        apiClientId: form.apiClientId || undefined,
        apiCertFileId: certFileId || undefined,
        apiCertKeyFileId: keyFileId || undefined,
        apiScopes: form.apiScopes || undefined,
        apiEnabled: form.apiEnabled,
        autoEmitBoleto: form.autoEmitBoleto,
        autoLowThreshold: form.autoLowThreshold
          ? parseCurrencyValue(form.autoLowThreshold)
          : undefined,
        apiWebhookSecret: form.apiWebhookSecret || undefined,
      };

      await bankAccountsService.updateApiConfig(bankAccountId, payload);
      toast.success('Configuração de API bancária salva com sucesso.');
      onSaved?.();
      onOpenChange(false);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(
        e?.response?.data?.message ?? 'Erro ao salvar configuração de API.'
      );
    } finally {
      setIsPending(false);
    }
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'provider':
        return <ProviderSection form={form} onChange={handleChange} />;
      case 'certificate':
        return (
          <CertificateSection
            form={form}
            onChange={handleChange}
            certFileRef={certFileRef}
            keyFileRef={keyFileRef}
            certMode={certMode}
            setCertMode={setCertMode}
            pfxFileRef={pfxFileRef}
            pfxFileName={pfxFileName}
            setPfxFileName={setPfxFileName}
            pfxPassword={pfxPassword}
            setPfxPassword={setPfxPassword}
          />
        );
      case 'settings':
        return <SettingsSection form={form} onChange={handleChange} />;
      case 'test':
        return <TestSection bankAccountId={bankAccountId} form={form} />;
    }
  };

  return (
    <NavigationWizardDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Integração API"
      subtitle={`Configurar API bancária para ${bankAccount?.name ?? 'esta conta'}`}
      sections={SECTIONS}
      activeSection={activeSection}
      onSectionChange={id => setActiveSection(id as SectionId)}
      isPending={isPending}
      footer={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isPending}
            className="gap-2"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Salvar Configuração
          </Button>
        </>
      }
    >
      {renderSection()}
    </NavigationWizardDialog>
  );
}
