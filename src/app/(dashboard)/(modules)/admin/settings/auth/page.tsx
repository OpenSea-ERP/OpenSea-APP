/**
 * OpenSea OS - Admin Authentication Settings
 * Configuração de métodos de login e autenticação do tenant
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
import { Card } from '@/components/ui/card';
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
import { showErrorToast, showSuccessToast } from '@/lib/toast-utils';
import { authLinksService } from '@/services/auth/auth-links.service';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import {
  Apple,
  BadgeCheck,
  CreditCard,
  Github,
  Globe,
  Loader2,
  Mail,
  Monitor,
  Save,
  Settings,
  Sparkles,
  Wand2,
} from 'lucide-react';
import { useEffect, useState } from 'react';

// =============================================================================
// PROVIDER CONFIG
// =============================================================================

interface ProviderInfo {
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
  colorBg: string;
  colorIcon: string;
}

const PROVIDERS: ProviderInfo[] = [
  {
    key: 'EMAIL',
    label: 'Login por Email',
    description: 'Permite login usando email + senha',
    icon: Mail,
    colorBg: 'bg-blue-50 dark:bg-blue-500/8',
    colorIcon: 'text-blue-700 dark:text-blue-300',
  },
  {
    key: 'CPF',
    label: 'Login por CPF',
    description: 'Permite login usando CPF + senha',
    icon: CreditCard,
    colorBg: 'bg-emerald-50 dark:bg-emerald-500/8',
    colorIcon: 'text-emerald-700 dark:text-emerald-300',
  },
  {
    key: 'ENROLLMENT',
    label: 'Login por Matrícula',
    description: 'Permite login usando matrícula do crachá + senha',
    icon: BadgeCheck,
    colorBg: 'bg-violet-50 dark:bg-violet-500/8',
    colorIcon: 'text-violet-700 dark:text-violet-300',
  },
  {
    key: 'GOOGLE',
    label: 'Login com Google',
    description: 'Permite vincular e usar conta Google',
    icon: Globe,
    colorBg: 'bg-sky-50 dark:bg-sky-500/8',
    colorIcon: 'text-sky-700 dark:text-sky-300',
  },
  {
    key: 'MICROSOFT',
    label: 'Login com Microsoft',
    description: 'Permite vincular e usar conta Microsoft',
    icon: Monitor,
    colorBg: 'bg-blue-50 dark:bg-blue-500/8',
    colorIcon: 'text-blue-700 dark:text-blue-300',
  },
  {
    key: 'APPLE',
    label: 'Login com Apple',
    description: 'Permite vincular e usar conta Apple',
    icon: Apple,
    colorBg: 'bg-slate-50 dark:bg-slate-500/8',
    colorIcon: 'text-slate-700 dark:text-slate-300',
  },
  {
    key: 'GITHUB',
    label: 'Login com GitHub',
    description: 'Permite vincular e usar conta GitHub',
    icon: Github,
    colorBg: 'bg-slate-50 dark:bg-slate-500/8',
    colorIcon: 'text-slate-700 dark:text-slate-300',
  },
];

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default function AdminAuthSettingsPage() {
  const queryClient = useQueryClient();

  // Local state for the form
  const [allowedMethods, setAllowedMethods] = useState<string[]>([]);
  const [magicLinkEnabled, setMagicLinkEnabled] = useState(false);
  const [magicLinkExpiresIn, setMagicLinkExpiresIn] = useState(15);
  const [defaultMethod, setDefaultMethod] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Fetch current config
  const { data: config, isLoading } = useQuery({
    queryKey: ['tenant-auth-config'],
    queryFn: async () => {
      return authLinksService.getTenantAuthConfig();
    },
  });

  // Sync fetched config to local state
  useEffect(() => {
    if (config) {
      setAllowedMethods(config.allowedMethods);
      setMagicLinkEnabled(config.magicLinkEnabled);
      setMagicLinkExpiresIn(config.magicLinkExpiresIn);
      setDefaultMethod(config.defaultMethod);
      setIsDirty(false);
    }
  }, [config]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      return authLinksService.updateTenantAuthConfig({
        allowedMethods,
        magicLinkEnabled,
        magicLinkExpiresIn,
        defaultMethod,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-auth-config'] });
      showSuccessToast('Configurações de autenticação salvas com sucesso');
      setIsDirty(false);
    },
    onError: (error: unknown) => {
      showErrorToast({
        title: 'Erro ao salvar configurações',
        description:
          error instanceof Error ? error.message : 'Erro desconhecido',
      });
    },
  });

  // Handlers
  const toggleMethod = (method: string, checked: boolean) => {
    setIsDirty(true);
    if (checked) {
      setAllowedMethods(prev => [...prev, method]);
    } else {
      setAllowedMethods(prev => prev.filter(m => m !== method));
      // If removing the default method, reset it
      if (defaultMethod === method) {
        setDefaultMethod(null);
      }
    }
  };

  const handleMagicLinkToggle = (checked: boolean) => {
    setIsDirty(true);
    setMagicLinkEnabled(checked);
  };

  const handleExpiresInChange = (value: string) => {
    setIsDirty(true);
    const num = parseInt(value, 10);
    if (!isNaN(num) && num >= 5 && num <= 60) {
      setMagicLinkExpiresIn(num);
    }
  };

  const handleDefaultMethodChange = (value: string) => {
    setIsDirty(true);
    setDefaultMethod(value === '_none' ? null : value);
  };

  // Loading state
  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Administração', href: '/admin' },
              { label: 'Configurações' },
              { label: 'Autenticação' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <div className="space-y-6">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </PageBody>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Administração', href: '/admin' },
            { label: 'Configurações' },
            { label: 'Autenticação' },
          ]}
          buttons={[
            {
              id: 'save',
              title: isDirty ? 'Salvar Alterações' : 'Salvo',
              icon: saveMutation.isPending ? Loader2 : Save,
              onClick: () => saveMutation.mutate(),
              disabled: !isDirty || saveMutation.isPending,
            },
          ]}
        />

        {/* Hero Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-start gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-linear-to-br from-violet-500 to-purple-600 shrink-0">
              <Settings className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold tracking-tight">
                Configurações de Autenticação
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Configure os métodos de login disponíveis para os usuários deste
                tenant
              </p>
            </div>
            {isDirty && (
              <Badge variant="warning" className="shrink-0">
                Alterações não salvas
              </Badge>
            )}
          </div>
        </Card>
      </PageHeader>

      <PageBody>
        <div className="space-y-6">
          {/* Section 1: Login Methods */}
          <Card className="bg-white/5 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Settings className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Métodos de Login</h3>
                <p className="text-sm text-muted-foreground">
                  Selecione quais métodos de login estarão disponíveis para os
                  usuários
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {PROVIDERS.map(provider => {
                const Icon = provider.icon;
                const isEnabled = allowedMethods.includes(provider.key);
                return (
                  <div
                    key={provider.key}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/40 border"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex items-center justify-center h-9 w-9 rounded-lg ${provider.colorBg}`}
                      >
                        <Icon
                          className={`h-4 w-4 ${provider.colorIcon}`}
                        />
                      </div>
                      <div>
                        <p className="font-medium">{provider.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {provider.description}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={checked =>
                        toggleMethod(provider.key, checked)
                      }
                    />
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Section 2: Magic Link */}
          <Card className="bg-white/5 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-violet-500/10">
                <Wand2 className="w-5 h-5 text-violet-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Magic Link</h3>
                <p className="text-sm text-muted-foreground">
                  Login sem senha, enviando um link temporário por email
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Toggle */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/40 border">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-violet-50 dark:bg-violet-500/8">
                    <Sparkles className="h-4 w-4 text-violet-700 dark:text-violet-300" />
                  </div>
                  <div>
                    <p className="font-medium">Habilitar Magic Link</p>
                    <p className="text-sm text-muted-foreground">
                      Permite login sem senha, via link enviado por email
                    </p>
                  </div>
                </div>
                <Switch
                  checked={magicLinkEnabled}
                  onCheckedChange={handleMagicLinkToggle}
                />
              </div>

              {/* Expiry (only show when enabled) */}
              {magicLinkEnabled && (
                <div className="p-4 rounded-lg bg-muted/40 border">
                  <div className="flex items-center gap-3 mb-3">
                    <Label htmlFor="magic-link-expiry" className="font-medium">
                      Tempo de expiração (minutos)
                    </Label>
                  </div>
                  <Input
                    id="magic-link-expiry"
                    type="number"
                    min={5}
                    max={60}
                    value={magicLinkExpiresIn}
                    onChange={e => handleExpiresInChange(e.target.value)}
                    className="max-w-[200px]"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    O link de acesso expirará após este período. Mínimo: 5
                    minutos, Máximo: 60 minutos.
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Section 3: Default Method */}
          <Card className="bg-white/5 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Sparkles className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Método Padrão</h3>
                <p className="text-sm text-muted-foreground">
                  Selecione qual método de login é sugerido primeiro na tela de
                  login
                </p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted/40 border">
              <Label htmlFor="default-method" className="font-medium mb-3 block">
                Método sugerido por padrão
              </Label>
              <Select
                value={defaultMethod ?? '_none'}
                onValueChange={handleDefaultMethodChange}
              >
                <SelectTrigger className="max-w-[300px]">
                  <SelectValue placeholder="Nenhum (detectar automaticamente)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">
                    Nenhum (detectar automaticamente)
                  </SelectItem>
                  {allowedMethods.map(method => {
                    const provider = PROVIDERS.find(p => p.key === method);
                    if (!provider) return null;
                    const Icon = provider.icon;
                    return (
                      <SelectItem key={method} value={method}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4" />
                          {provider.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                Este método será o padrão exibido na tela de login. Apenas
                métodos habilitados podem ser selecionados.
              </p>
            </div>
          </Card>
        </div>
      </PageBody>
    </PageLayout>
  );
}
