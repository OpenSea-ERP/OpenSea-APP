'use client';

/**
 * Webhooks new — Phase 11 Plan 11-03 Task 3.
 *
 * Wizard 3 passos (Identificação → Eventos → Resumo + Secret revelado UMA vez).
 *
 * Layout: PageLayout (não Dialog) — rota dedicada `/devices/webhooks/new`.
 * Pattern: pos-terminals/page.tsx (StepWizardDialog inspirado, mas inline).
 *
 * Threat T-11-03: secret cleartext vive APENAS no React state da prop
 * (não persistir em localStorage; ao desmontar, sai da memória).
 */

import { InlineDocSnippet } from '@/components/devices/webhooks/inline-doc-snippet';
import { WebhookEventChipSelector } from '@/components/devices/webhooks/event-chip-selector';
import { WebhookSecretReveal } from '@/components/devices/webhooks/webhook-secret-reveal';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SYSTEM_WEBHOOKS_PERMISSIONS } from '@/constants/permissions';
import { useCreateWebhook } from '@/hooks/system';
import { usePermissions } from '@/hooks/use-permissions';
import {
  WEBHOOK_API_VERSIONS,
  type WebhookEndpointDTO,
  type WebhookEventType,
} from '@/types/system';
import { ArrowLeft, ArrowRight, Check, Webhook } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Step = 1 | 2 | 3;

function isHttpsUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export default function NewWebhookPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const canRegister = hasPermission(SYSTEM_WEBHOOKS_PERMISSIONS.REGISTER);
  const createWebhook = useCreateWebhook();

  const [step, setStep] = useState<Step>(1);

  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [apiVersion, setApiVersion] = useState<string>(WEBHOOK_API_VERSIONS[0]);
  const [events, setEvents] = useState<WebhookEventType[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [createdEndpoint, setCreatedEndpoint] =
    useState<WebhookEndpointDTO | null>(null);
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);

  const step1Valid = url.trim().length > 0 && isHttpsUrl(url.trim());
  const step2Valid = events.length > 0;

  if (!canRegister) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Dispositivos', href: '/devices' },
              { label: 'Webhooks', href: '/devices/webhooks' },
              { label: 'Novo' },
            ]}
            hasPermission={hasPermission}
          />
        </PageHeader>
        <PageBody>
          <Card className="p-8 text-center">
            <h2 className="text-lg font-semibold mb-2">Acesso restrito</h2>
            <p className="text-sm text-muted-foreground">
              Você não tem permissão para criar webhooks.
            </p>
          </Card>
        </PageBody>
      </PageLayout>
    );
  }

  async function handleSubmit() {
    setSubmitError(null);
    try {
      const response = await createWebhook.mutateAsync({
        url: url.trim(),
        description: description.trim() || undefined,
        apiVersion,
        subscribedEvents: events,
      });
      setCreatedEndpoint(response.endpoint);
      setRevealedSecret(response.secret);
      setStep(3);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao criar webhook.';
      // SSRF anti-pattern feedback
      if (
        message.toLowerCase().includes('ssrf') ||
        message.toLowerCase().includes('private')
      ) {
        setSubmitError(
          'URL inválida: hosts internos não são permitidos em produção (anti-SSRF).'
        );
      } else if (
        message.toLowerCase().includes('https') ||
        message.toLowerCase().includes('http')
      ) {
        setSubmitError('URL inválida: em produção, apenas https:// é aceito.');
      } else {
        setSubmitError(message);
      }
    }
  }

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Dispositivos', href: '/devices' },
            { label: 'Webhooks', href: '/devices/webhooks' },
            { label: 'Novo' },
          ]}
          hasPermission={hasPermission}
        />
      </PageHeader>

      <PageBody spacing="gap-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">
            <Webhook className="h-6 w-6" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-semibold leading-tight">
              Novo webhook
            </h1>
            <p className="text-sm text-muted-foreground">
              Cadastre um endpoint para receber eventos do sistema em tempo
              real.
            </p>
          </div>
        </div>

        {/* Stepper progress */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {[1, 2, 3].map((n, i) => (
            <div key={n} className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full border ${
                  step >= n
                    ? 'border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200'
                    : 'border-border bg-background'
                }`}
              >
                {step > n ? <Check className="h-3 w-3" /> : n}
              </div>
              <span
                className={step === n ? 'font-semibold text-foreground' : ''}
              >
                {n === 1 ? 'Identificação' : n === 2 ? 'Eventos' : 'Secret'}
              </span>
              {i < 2 && <span className="text-muted-foreground/40">→</span>}
            </div>
          ))}
        </div>

        {step === 1 && (
          <Card className="p-4 sm:p-6">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="webhook-url">URL de entrega</Label>
                <Input
                  id="webhook-url"
                  type="url"
                  placeholder="https://api.cliente.com/webhooks/opensea"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  inputMode="url"
                />
                <p className="text-xs text-muted-foreground">
                  O endpoint deve aceitar POST com TLS válido. Em produção,
                  apenas https:// é aceito; hosts internos são bloqueados por
                  defesa anti-SSRF.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook-description">
                  Descrição (opcional)
                </Label>
                <Input
                  id="webhook-description"
                  placeholder='Ex.: "BI da matriz", "Folha terceirizada"'
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground">
                  Para sua referência interna. Máximo 200 caracteres.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook-api-version">Versão do payload</Label>
                <select
                  id="webhook-api-version"
                  value={apiVersion}
                  onChange={e => setApiVersion(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {WEBHOOK_API_VERSIONS.map(v => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Versão do schema dos eventos. Recomendamos a mais recente para
                  novas integrações.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <Button asChild variant="outline" size="sm">
                <Link href="/devices/webhooks">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Cancelar
                </Link>
              </Button>
              <Button
                size="sm"
                disabled={!step1Valid}
                onClick={() => setStep(2)}
              >
                Avançar
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card className="p-4 sm:p-6">
            <div className="space-y-3">
              <div>
                <h2 className="font-semibold text-base">
                  Quais eventos este webhook deve receber?
                </h2>
                <p className="text-sm text-muted-foreground">
                  Selecione um ou mais eventos. Você pode alterar a qualquer
                  momento na tela de edição.
                </p>
              </div>
              <WebhookEventChipSelector
                value={events}
                onChange={setEvents}
                error={events.length === 0 && submitError !== null}
              />
              {events.length === 0 && (
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Selecione pelo menos um evento.
                </p>
              )}
            </div>

            {submitError && (
              <div
                role="alert"
                className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200"
              >
                {submitError}
              </div>
            )}

            <div className="mt-6 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep(1)}
                disabled={createWebhook.isPending}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>
              <Button
                size="sm"
                disabled={!step2Valid || createWebhook.isPending}
                onClick={handleSubmit}
              >
                {createWebhook.isPending
                  ? 'Criando webhook...'
                  : 'Criar webhook'}
              </Button>
            </div>
          </Card>
        )}

        {step === 3 && createdEndpoint && revealedSecret && (
          <div className="space-y-6">
            <Card className="p-4 sm:p-6 border-emerald-200 bg-emerald-50/40 dark:border-emerald-500/30 dark:bg-emerald-500/5">
              <h2 className="font-semibold text-base text-emerald-900 dark:text-emerald-200">
                Webhook criado com sucesso
              </h2>
              <p className="text-sm text-emerald-800 dark:text-emerald-200/90 mt-1">
                Copie o secret abaixo agora. Por segurança, não conseguiremos
                exibi-lo novamente.
              </p>
            </Card>

            <WebhookSecretReveal secret={revealedSecret} />

            <Card className="p-4 sm:p-6">
              <h3 className="font-semibold text-sm mb-2">
                Como verificar a assinatura
              </h3>
              <ol className="text-sm text-muted-foreground list-decimal pl-5 space-y-1 mb-4">
                <li>
                  Header:{' '}
                  <code className="font-mono">
                    X-OpenSea-Signature: t=&lt;unix&gt;,v1=&lt;hex&gt;
                  </code>
                </li>
                <li>Calcule HMAC-SHA256 do corpo bruto com seu secret.</li>
                <li>
                  Rejeite entregas com <code className="font-mono">t</code> mais
                  antigo que 5 minutos (300s) do seu relógio.
                </li>
              </ol>
              <InlineDocSnippet />
            </Card>

            <div className="flex justify-end">
              <Button
                size="sm"
                onClick={() => {
                  // limpar secret do state ao navegar (Threat T-11-03)
                  setRevealedSecret(null);
                  router.push(`/devices/webhooks/${createdEndpoint.id}`);
                }}
              >
                Concluir e ir para o webhook
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </PageBody>
    </PageLayout>
  );
}
