/**
 * /hr/compliance/esocial-config — Configuração eSocial + campo INPI
 * (Phase 06 / Plan 06-06 — D-06 fechada).
 *
 * Campo `inpiNumber` (17 dígitos) é a novidade desta plan: fecha o
 * placeholder '99999999999999999' que estava hardcoded no controller
 * AFD desde Plan 06-02. Coluna EsocialConfig.inpiNumber adicionada
 * em Plan 06-05 migration 20260423200000.
 *
 * Permission: hr.compliance.config.modify.
 */

'use client';

import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Settings,
  ShieldAlert,
} from 'lucide-react';

import { usePermissions } from '@/hooks/use-permissions';
import { HR_PERMISSIONS } from '@/app/(dashboard)/(modules)/hr/_shared/constants/hr-permissions';
import { PageActionBar } from '@/components/layout/page-action-bar';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useEsocialConfig,
  useUpdateEsocialConfig,
} from '@/hooks/hr/use-esocial-config';
import { GridError } from '@/components/handlers/grid-error';
import { toast } from 'sonner';

const INPI_PLACEHOLDER = '99999999999999999';
const INPI_REGEX = /^\d{17}$/;

function EsocialConfigForm() {
  const { data, isLoading, error, refetch } = useEsocialConfig();
  const update = useUpdateEsocialConfig();

  const [environment, setEnvironment] = useState<'HOMOLOGACAO' | 'PRODUCAO'>(
    'HOMOLOGACAO'
  );
  const [inpiNumber, setInpiNumber] = useState<string>('');
  const [clientError, setClientError] = useState<string | null>(null);

  // Reinicializa form quando query carrega.
  useEffect(() => {
    if (data?.config) {
      setEnvironment(data.config.environment);
      setInpiNumber(data.config.inpiNumber ?? '');
    }
  }, [data?.config]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl">
        <GridError
          type="server"
          title="Falha ao carregar configuração"
          message={error instanceof Error ? error.message : 'Erro ao carregar'}
          action={{
            label: 'Tentar novamente',
            onClick: () => {
              void refetch();
            },
          }}
        />
      </div>
    );
  }

  const config = data?.config;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError(null);

    const cleanInpi = inpiNumber.replace(/\D/g, '');
    if (cleanInpi && !INPI_REGEX.test(cleanInpi)) {
      setClientError('INPI deve conter exatamente 17 dígitos numéricos.');
      return;
    }

    try {
      await update.mutateAsync({
        environment,
        inpiNumber: cleanInpi || null,
      });
      toast.success('Configuração eSocial atualizada.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao salvar';
      toast.error(msg);
      setClientError(msg);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <Card className="border-border bg-white p-5 dark:bg-slate-800/60">
        <div className="flex items-start gap-3">
          <Settings className="mt-0.5 h-5 w-5 text-indigo-500" />
          <div className="space-y-1">
            <h2 className="text-base font-semibold">Configuração eSocial</h2>
            <p className="text-sm text-muted-foreground">
              Defina o ambiente (homologação/produção) e o número INPI do REP.
              Mudanças são auditadas (audit log{' '}
              <code className="font-mono text-xs">ESOCIAL_CONFIG_UPDATED</code>
              ).
            </p>
          </div>
        </div>
      </Card>

      <Card className="border-border bg-white p-6 dark:bg-slate-800/60">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="esc-env">Ambiente *</Label>
            <Select
              value={environment}
              onValueChange={v =>
                setEnvironment(v as 'HOMOLOGACAO' | 'PRODUCAO')
              }
            >
              <SelectTrigger id="esc-env">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HOMOLOGACAO">
                  Homologação (sandbox gov.br)
                </SelectItem>
                <SelectItem value="PRODUCAO">
                  Produção (eventos oficiais)
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Em homologação, os eventos S-1200 ficam isolados do ambiente
              fiscal real — ideal para testes.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="esc-cnpj">
              CNPJ do empregador (somente leitura)
            </Label>
            <Input
              id="esc-cnpj"
              value={config?.nrInsc ?? ''}
              disabled
              placeholder="Configurado separadamente em /hr/settings"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="esc-inpi">Número INPI (REP-P)</Label>
            <Input
              id="esc-inpi"
              value={inpiNumber}
              onChange={e =>
                setInpiNumber(e.target.value.replace(/\D/g, '').slice(0, 17))
              }
              placeholder="17 dígitos — deixe em branco se não houver"
              inputMode="numeric"
              maxLength={17}
            />
            <p className="text-xs text-muted-foreground">
              Deixe em branco se sua empresa não possui registro INPI para REP-P
              — usaremos <code className="font-mono">{INPI_PLACEHOLDER}</code>{' '}
              como placeholder conforme convenção REP-A (aceito pelo Validador
              AFD MTP).
            </p>
            {inpiNumber && !INPI_REGEX.test(inpiNumber) && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Ainda faltam {17 - inpiNumber.length} dígito(s).
              </p>
            )}
            {inpiNumber && INPI_REGEX.test(inpiNumber) && (
              <p className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3 w-3" />
                INPI válido com 17 dígitos.
              </p>
            )}
          </div>

          {clientError && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{clientError}</span>
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="submit"
              size="sm"
              disabled={update.isPending}
              className="gap-2"
            >
              {update.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Salvar configuração
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function EsocialConfigPage() {
  const { hasPermission, isLoading } = usePermissions();

  if (isLoading) return null;
  if (!hasPermission(HR_PERMISSIONS.COMPLIANCE.CONFIG_MODIFY)) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <ShieldAlert className="h-12 w-12 text-muted-foreground/40" />
        <h2 className="text-lg font-semibold">Sem permissão</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Você precisa da permissão{' '}
          <code className="font-mono text-xs">hr.compliance.config.modify</code>{' '}
          para editar a configuração eSocial.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageActionBar
        breadcrumbItems={[
          { label: 'RH', href: '/hr' },
          { label: 'Compliance', href: '/hr/compliance' },
          {
            label: 'Configuração eSocial',
            href: '/hr/compliance/esocial-config',
          },
        ]}
        hasPermission={hasPermission}
      />
      <EsocialConfigForm />
    </div>
  );
}
