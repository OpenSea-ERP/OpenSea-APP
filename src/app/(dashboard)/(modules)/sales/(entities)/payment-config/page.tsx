'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  usePaymentConfig,
  useProviders,
  useSavePaymentConfig,
  useTestConnection,
} from '@/hooks/sales/use-payment-config';
import { usePermissions } from '@/hooks/use-permissions';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import type {
  ConfigField,
  PaymentProviderName,
  ProviderInfo,
  SavePaymentConfigRequest,
} from '@/types/sales';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Shield,
  ShieldCheck,
  ShieldOff,
  Settings2,
  Zap,
  Loader2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  CreditCard,
  QrCode,
  Banknote,
  FileText,
  Wallet,
  LayoutGrid,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

// =============================================================================
// CONSTANTS
// =============================================================================

const METHOD_ICONS: Record<string, React.ElementType> = {
  PIX: QrCode,
  CREDIT_CARD: CreditCard,
  DEBIT_CARD: CreditCard,
  BOLETO: FileText,
  PAYMENT_LINK: Wallet,
};

const METHOD_LABELS: Record<string, string> = {
  PIX: 'PIX',
  CREDIT_CARD: 'Cartão de Crédito',
  DEBIT_CARD: 'Cartão de Débito',
  BOLETO: 'Boleto',
  PAYMENT_LINK: 'Link de Pagamento',
  CASH: 'Dinheiro',
  STORE_CREDIT: 'Crédito Loja',
  OTHER: 'Outro',
};

const ALL_METHODS = [
  'PIX',
  'CREDIT_CARD',
  'DEBIT_CARD',
  'BOLETO',
  'PAYMENT_LINK',
  'CASH',
];

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default function PaymentConfigPage() {
  const { hasPermission } = usePermissions();
  const canAdmin = hasPermission(SALES_PERMISSIONS.POS.ADMIN);

  const { data: config, isLoading: configLoading } = usePaymentConfig();
  const { data: providers, isLoading: providersLoading } = useProviders();
  const saveConfig = useSavePaymentConfig();
  const testConnection = useTestConnection();

  const [activeSection, setActiveSection] = useState<
    'primary' | 'fallback' | 'summary'
  >('primary');

  // Form state
  const [primaryProvider, setPrimaryProvider] =
    useState<PaymentProviderName>('manual');
  const [primaryFields, setPrimaryFields] = useState<Record<string, string>>(
    {}
  );
  const [fallbackProvider, setFallbackProvider] = useState<
    PaymentProviderName | ''
  >('');
  const [fallbackFields, setFallbackFields] = useState<Record<string, string>>(
    {}
  );

  // Password visibility toggles
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(
    new Set()
  );

  // Test connection results
  const [primaryTestResult, setPrimaryTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [fallbackTestResult, setFallbackTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  // Hydrate from server config
  useEffect(() => {
    if (config) {
      setPrimaryProvider(config.primaryProvider);
      if (config.fallbackProvider) {
        setFallbackProvider(config.fallbackProvider);
      }
    }
  }, [config]);

  const providerMap = useMemo(() => {
    if (!providers) return new Map<PaymentProviderName, ProviderInfo>();
    return new Map(providers.map(p => [p.name, p]));
  }, [providers]);

  const selectedPrimary = providerMap.get(primaryProvider);
  const selectedFallback = fallbackProvider
    ? providerMap.get(fallbackProvider as PaymentProviderName)
    : null;

  const togglePasswordVisibility = useCallback((fieldKey: string) => {
    setVisiblePasswords(prev => {
      const next = new Set(prev);
      if (next.has(fieldKey)) {
        next.delete(fieldKey);
      } else {
        next.add(fieldKey);
      }
      return next;
    });
  }, []);

  // Build method resolution map for summary
  const methodResolution = useMemo(() => {
    const result: Array<{
      method: string;
      provider: string;
      displayName: string;
    }> = [];
    const primaryMethods = new Set(selectedPrimary?.supportedMethods ?? []);
    const fallbackMethods = new Set(selectedFallback?.supportedMethods ?? []);

    for (const method of ALL_METHODS) {
      if (method === 'CASH') {
        result.push({
          method,
          provider: 'manual',
          displayName: 'Manual (sempre)',
        });
      } else if (primaryMethods.has(method)) {
        result.push({
          method,
          provider: primaryProvider,
          displayName: selectedPrimary?.displayName ?? primaryProvider,
        });
      } else if (fallbackMethods.has(method)) {
        result.push({
          method,
          provider: fallbackProvider as string,
          displayName:
            selectedFallback?.displayName ?? (fallbackProvider as string),
        });
      } else {
        result.push({ method, provider: 'manual', displayName: 'Manual' });
      }
    }

    return result;
  }, [primaryProvider, fallbackProvider, selectedPrimary, selectedFallback]);

  async function handleTestConnection(target: 'primary' | 'fallback') {
    const setResult =
      target === 'primary' ? setPrimaryTestResult : setFallbackTestResult;
    setResult(null);

    try {
      const result = await testConnection.mutateAsync(target);
      setResult(result);
      if (result.ok) {
        toast.success('Conexão testada com sucesso.');
      } else {
        toast.error(result.message || 'Falha no teste de conexão.');
      }
    } catch {
      setResult({ ok: false, message: 'Erro ao testar conexão.' });
      toast.error('Erro ao testar conexão.');
    }
  }

  async function handleSave() {
    const payload: SavePaymentConfigRequest = {
      primaryProvider,
      primaryConfig: primaryFields,
    };

    if (fallbackProvider) {
      payload.fallbackProvider = fallbackProvider as PaymentProviderName;
      payload.fallbackConfig = fallbackFields;
    }

    saveConfig.mutate(payload);
  }

  if (!canAdmin) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <ShieldOff className="mx-auto size-12 text-zinc-400" />
          <p className="mt-4 text-lg font-medium text-zinc-600 dark:text-zinc-400">
            Sem permissão para acessar esta página
          </p>
        </div>
      </div>
    );
  }

  if (configLoading || providersLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/sales"
          className="flex size-10 items-center justify-center rounded-lg border border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Gateway de Pagamento
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Configure os gateways de pagamento para cobranças automáticas
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-1 rounded-xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-700 dark:bg-zinc-900">
        {[
          {
            id: 'primary' as const,
            label: 'Gateway Primário',
            icon: Shield,
          },
          {
            id: 'fallback' as const,
            label: 'Gateway Secundário',
            icon: ShieldCheck,
          },
          {
            id: 'summary' as const,
            label: 'Resumo',
            icon: LayoutGrid,
          },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSection(tab.id)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all',
              activeSection === tab.id
                ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
            )}
          >
            <tab.icon className="size-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Primary Gateway Section */}
      {activeSection === 'primary' && (
        <GatewaySection
          title="Gateway Primário"
          description="Selecione o gateway principal para processar pagamentos automáticamente."
          provider={primaryProvider}
          onProviderChange={v => {
            setPrimaryProvider(v);
            setPrimaryFields({});
            setPrimaryTestResult(null);
          }}
          fields={primaryFields}
          onFieldsChange={setPrimaryFields}
          providerInfo={selectedPrimary}
          providers={providers ?? []}
          testResult={primaryTestResult}
          onTest={() => handleTestConnection('primary')}
          isTesting={testConnection.isPending}
          isConfigured={config?.primaryConfigured ?? false}
          maskedKey={config?.primaryMaskedKey}
          testedAt={config?.primaryTestedAt}
          visiblePasswords={visiblePasswords}
          onTogglePassword={togglePasswordVisibility}
        />
      )}

      {/* Fallback Gateway Section */}
      {activeSection === 'fallback' && (
        <GatewaySection
          title="Gateway Secundário (Fallback)"
          description="Quando o primário não suportar um método, o secundário será usado automáticamente."
          provider={fallbackProvider as PaymentProviderName}
          onProviderChange={v => {
            setFallbackProvider(v);
            setFallbackFields({});
            setFallbackTestResult(null);
          }}
          fields={fallbackFields}
          onFieldsChange={setFallbackFields}
          providerInfo={selectedFallback}
          providers={providers ?? []}
          testResult={fallbackTestResult}
          onTest={() => handleTestConnection('fallback')}
          isTesting={testConnection.isPending}
          isConfigured={config?.fallbackConfigured ?? false}
          maskedKey={config?.fallbackMaskedKey}
          testedAt={config?.fallbackTestedAt}
          visiblePasswords={visiblePasswords}
          onTogglePassword={togglePasswordVisibility}
          optional
          uncoveredMethods={
            selectedPrimary
              ? ALL_METHODS.filter(
                  m =>
                    m !== 'CASH' &&
                    !selectedPrimary.supportedMethods.includes(m)
                )
              : []
          }
        />
      )}

      {/* Summary Section */}
      {activeSection === 'summary' && (
        <Card className="bg-white p-6 dark:bg-zinc-900">
          <h2 className="mb-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Resumo da Configuração
          </h2>
          <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
            Veja qual gateway será usado para cada método de pagamento.
          </p>

          <div className="space-y-2">
            {methodResolution.map(item => {
              const Icon = METHOD_ICONS[item.method] ?? Banknote;
              return (
                <div
                  key={item.method}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-700"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="size-5 text-violet-600 dark:text-violet-400" />
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {METHOD_LABELS[item.method] ?? item.method}
                    </span>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      'px-3 py-1 font-medium',
                      item.provider === 'manual'
                        ? 'border-zinc-300 text-zinc-600 dark:border-zinc-600 dark:text-zinc-400'
                        : 'border-violet-300 text-violet-700 dark:border-violet-500/50 dark:text-violet-300'
                    )}
                  >
                    {item.displayName}
                  </Badge>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saveConfig.isPending}
          className="h-10 gap-2 bg-violet-600 px-6 text-white hover:bg-violet-700"
        >
          {saveConfig.isPending && <Loader2 className="size-4 animate-spin" />}
          Salvar Configuração
        </Button>
      </div>
    </div>
  );
}

// =============================================================================
// GATEWAY SECTION COMPONENT
// =============================================================================

interface GatewaySectionProps {
  title: string;
  description: string;
  provider: PaymentProviderName;
  onProviderChange: (v: PaymentProviderName) => void;
  fields: Record<string, string>;
  onFieldsChange: (fields: Record<string, string>) => void;
  providerInfo: ProviderInfo | undefined | null;
  providers: ProviderInfo[];
  testResult: { ok: boolean; message: string } | null;
  onTest: () => void;
  isTesting: boolean;
  isConfigured: boolean;
  maskedKey?: string;
  testedAt?: string | null;
  visiblePasswords: Set<string>;
  onTogglePassword: (key: string) => void;
  optional?: boolean;
  uncoveredMethods?: string[];
}

function GatewaySection({
  title,
  description,
  provider,
  onProviderChange,
  fields,
  onFieldsChange,
  providerInfo,
  providers,
  testResult,
  onTest,
  isTesting,
  isConfigured,
  maskedKey,
  testedAt,
  visiblePasswords,
  onTogglePassword,
  optional,
  uncoveredMethods,
}: GatewaySectionProps) {
  const configFields = providerInfo?.configFields ?? [];

  return (
    <Card className="bg-white p-6 dark:bg-zinc-900">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          {title}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
      </div>

      {/* Uncovered methods hint */}
      {optional && uncoveredMethods && uncoveredMethods.length > 0 && (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 dark:border-sky-500/30 dark:bg-sky-500/10">
          <Settings2 className="mt-0.5 size-5 shrink-0 text-sky-600 dark:text-sky-400" />
          <div>
            <p className="text-sm font-medium text-sky-700 dark:text-sky-300">
              Métodos não cobertos pelo gateway primário:
            </p>
            <div className="mt-1 flex flex-wrap gap-1">
              {uncoveredMethods.map(m => (
                <Badge
                  key={m}
                  variant="outline"
                  className="border-sky-300 text-sky-700 dark:border-sky-500/50 dark:text-sky-300"
                >
                  {METHOD_LABELS[m] ?? m}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Provider Select */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Gateway</Label>
          <Select
            value={provider || ''}
            onValueChange={v => onProviderChange(v as PaymentProviderName)}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Selecione o gateway" />
            </SelectTrigger>
            <SelectContent>
              {optional && (
                <SelectItem value="none">Nenhum (desativado)</SelectItem>
              )}
              {providers.map(p => (
                <SelectItem key={p.name} value={p.name}>
                  {p.displayName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Supported methods badges */}
        {providerInfo && providerInfo.supportedMethods.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Métodos suportados
            </Label>
            <div className="flex flex-wrap gap-2">
              {providerInfo.supportedMethods.map(m => {
                const Icon = METHOD_ICONS[m] ?? Banknote;
                return (
                  <Badge
                    key={m}
                    variant="outline"
                    className="gap-1.5 border-emerald-300 px-2.5 py-1 text-emerald-700 dark:border-emerald-500/50 dark:text-emerald-300"
                  >
                    <Icon className="size-3.5" />
                    {METHOD_LABELS[m] ?? m}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}

        {/* Existing config indicator */}
        {isConfigured && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 dark:border-emerald-500/30 dark:bg-emerald-500/10">
            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              Configurado
              {maskedKey && (
                <span className="ml-2 font-mono text-xs text-emerald-600 dark:text-emerald-400">
                  ({maskedKey})
                </span>
              )}
            </span>
            {testedAt && (
              <span className="ml-auto text-xs text-emerald-600 dark:text-emerald-400">
                Testado em{' '}
                {new Date(testedAt).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            )}
          </div>
        )}

        {/* Dynamic config fields */}
        {configFields.length > 0 && (
          <div className="space-y-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              Credenciais
              {isConfigured && (
                <span className="ml-2 text-xs text-zinc-400 dark:text-zinc-500">
                  (deixe em branco para manter as atuais)
                </span>
              )}
            </p>
            {configFields.map(field => (
              <DynamicField
                key={field.key}
                field={field}
                value={fields[field.key] ?? ''}
                onChange={v => onFieldsChange({ ...fields, [field.key]: v })}
                isVisible={visiblePasswords.has(field.key)}
                onToggleVisibility={() => onTogglePassword(field.key)}
              />
            ))}
          </div>
        )}

        {/* Test connection */}
        {providerInfo && providerInfo.name !== 'manual' && (
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={onTest}
              disabled={isTesting}
              className="h-10 gap-2"
            >
              {isTesting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Zap className="size-4" />
              )}
              Testar Conexão
            </Button>

            {testResult && (
              <div
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium',
                  testResult.ok
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'
                )}
              >
                {testResult.ok ? (
                  <CheckCircle2 className="size-4" />
                ) : (
                  <XCircle className="size-4" />
                )}
                {testResult.message}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

// =============================================================================
// DYNAMIC FIELD COMPONENT
// =============================================================================

function DynamicField({
  field,
  value,
  onChange,
  isVisible,
  onToggleVisibility,
}: {
  field: ConfigField;
  value: string;
  onChange: (v: string) => void;
  isVisible: boolean;
  onToggleVisibility: () => void;
}) {
  if (field.type === 'select' && field.options) {
    return (
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">
          {field.label}
          {field.required && <span className="ml-1 text-rose-500">*</span>}
        </Label>
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="h-11">
            <SelectValue placeholder={field.placeholder ?? 'Selecione...'} />
          </SelectTrigger>
          <SelectContent>
            {field.options.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {field.helpText && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            {field.helpText}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">
        {field.label}
        {field.required && <span className="ml-1 text-rose-500">*</span>}
      </Label>
      <div className="relative">
        <Input
          type={field.type === 'password' && !isVisible ? 'password' : 'text'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={field.placeholder ?? ''}
          className="h-11 pr-10"
        />
        {field.type === 'password' && (
          <button
            type="button"
            onClick={onToggleVisibility}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          >
            {isVisible ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        )}
      </div>
      {field.helpText && (
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          {field.helpText}
        </p>
      )}
    </div>
  );
}
