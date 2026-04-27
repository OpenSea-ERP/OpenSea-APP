'use client';

/**
 * Webhook edit — Phase 11 Plan 11-03 Task 4.
 *
 * Form com URL read-only (D-31 — recriar para alterar) + descrição editável +
 * status switch (ACTIVE↔PAUSED) + eventos multiselect + versão de payload +
 * secret mascarado + Regenerar secret (PIN gate D-08).
 *
 * Após regenerate sucesso: tela "Novo secret revelado" com banner verde +
 * janela de rotação 7d.
 */

import { InlineDocSnippet } from '@/components/devices/webhooks/inline-doc-snippet';
import { WebhookEventChipSelector } from '@/components/devices/webhooks/event-chip-selector';
import { WebhookSecretReveal } from '@/components/devices/webhooks/webhook-secret-reveal';
import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SYSTEM_WEBHOOKS_PERMISSIONS } from '@/constants/permissions';
import {
  useRegenerateWebhookSecret,
  useUpdateWebhook,
  useWebhook,
} from '@/hooks/system';
import { usePermissions } from '@/hooks/use-permissions';
import { type WebhookEventType } from '@/types/system';
import { ArrowRight, Save } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function EditWebhookPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const canModify = hasPermission(SYSTEM_WEBHOOKS_PERMISSIONS.MODIFY);
  const canAdmin = hasPermission(SYSTEM_WEBHOOKS_PERMISSIONS.ADMIN);

  const { data: webhook, isLoading, isError, refetch } = useWebhook(id);
  const updateWebhook = useUpdateWebhook();
  const regenerateSecret = useRegenerateWebhookSecret();

  const [description, setDescription] = useState('');
  const [events, setEvents] = useState<WebhookEventType[]>([]);
  const [active, setActive] = useState(true);

  const [regenerateOpen, setRegenerateOpen] = useState(false);
  const [revealedNewSecret, setRevealedNewSecret] = useState<string | null>(
    null
  );
  const [rotationUntil, setRotationUntil] = useState<string | null>(null);

  useEffect(() => {
    if (!webhook) return;
    setDescription(webhook.description ?? '');
    setEvents(webhook.subscribedEvents as WebhookEventType[]);
    setActive(webhook.status === 'ACTIVE');
  }, [webhook]);

  function handleRegenerateSuccess() {
    if (!id) return;
    void regenerateSecret
      .mutateAsync({ id, actionPinToken: 'verified' })
      .then(res => {
        setRevealedNewSecret(res.secret);
        setRotationUntil(res.endpoint.secretRotationActiveUntil);
      });
  }

  async function handleSave() {
    if (!webhook) return;
    await updateWebhook.mutateAsync({
      id: webhook.id,
      data: {
        description: description.trim() || null,
        subscribedEvents: events,
        status: active ? 'ACTIVE' : 'PAUSED',
      },
    });
    router.push(`/devices/webhooks/${webhook.id}`);
  }

  if (!canModify) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Dispositivos', href: '/devices' },
              { label: 'Webhooks', href: '/devices/webhooks' },
            ]}
            hasPermission={hasPermission}
          />
        </PageHeader>
        <PageBody>
          <Card className="p-8 text-center">
            <h2 className="text-lg font-semibold mb-2">Acesso restrito</h2>
            <p className="text-sm text-muted-foreground">
              Você não tem permissão para editar webhooks.
            </p>
          </Card>
        </PageBody>
      </PageLayout>
    );
  }

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Dispositivos', href: '/devices' },
              { label: 'Webhooks', href: '/devices/webhooks' },
              { label: 'Editar' },
            ]}
            hasPermission={hasPermission}
          />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" />
        </PageBody>
      </PageLayout>
    );
  }

  if (isError || !webhook) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Dispositivos', href: '/devices' },
              { label: 'Webhooks', href: '/devices/webhooks' },
              { label: 'Editar' },
            ]}
            hasPermission={hasPermission}
          />
        </PageHeader>
        <PageBody>
          <GridError
            type="server"
            message="Não conseguimos carregar este webhook."
            action={{
              label: 'Tentar novamente',
              onClick: () => {
                void refetch();
              },
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  // Reveal screen — após regenerate sucesso
  if (revealedNewSecret) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Dispositivos', href: '/devices' },
              { label: 'Webhooks', href: '/devices/webhooks' },
              { label: webhook.description ?? webhook.url },
            ]}
            hasPermission={hasPermission}
          />
        </PageHeader>
        <PageBody spacing="gap-6">
          <Card className="p-4 sm:p-6 border-emerald-200 bg-emerald-50/40 dark:border-emerald-500/30 dark:bg-emerald-500/5">
            <h2 className="font-semibold text-base text-emerald-900 dark:text-emerald-200">
              Secret regenerado com sucesso
            </h2>
            <p className="text-sm text-emerald-800 dark:text-emerald-200/90 mt-1">
              {rotationUntil
                ? `O secret antigo continuará válido até ${new Date(
                    rotationUntil
                  ).toLocaleDateString(
                    'pt-BR'
                  )} para permitir que o cliente externo atualize. Após esse prazo, apenas o novo secret funcionará.`
                : 'O secret anterior foi imediatamente invalidado.'}
            </p>
          </Card>

          <WebhookSecretReveal secret={revealedNewSecret} />

          <Card className="p-4 sm:p-6">
            <h3 className="font-semibold text-sm mb-2">
              Como verificar a assinatura
            </h3>
            <InlineDocSnippet />
          </Card>

          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={() => {
                setRevealedNewSecret(null);
                router.push(`/devices/webhooks/${webhook.id}`);
              }}
            >
              Concluir
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
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
            { label: 'Dispositivos', href: '/devices' },
            { label: 'Webhooks', href: '/devices/webhooks' },
            {
              label: webhook.description ?? webhook.url,
              href: `/devices/webhooks/${webhook.id}`,
            },
            { label: 'Editar' },
          ]}
          hasPermission={hasPermission}
          actions={
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/devices/webhooks/${webhook.id}`}>Cancelar</Link>
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={updateWebhook.isPending}
              >
                <Save className="mr-2 h-4 w-4" />
                {updateWebhook.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          }
        />
      </PageHeader>

      <PageBody spacing="gap-6">
        {/* Identificação */}
        <Card className="p-4 sm:p-6 space-y-5">
          <h2 className="font-semibold text-base">Identificação</h2>

          <div className="space-y-2">
            <Label htmlFor="webhook-url">URL de entrega</Label>
            <Input
              id="webhook-url"
              value={webhook.url}
              readOnly
              disabled
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Para alterar a URL, exclua e recrie o webhook (a assinatura HMAC
              depende do destino).
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="webhook-description">Descrição (opcional)</Label>
            <Input
              id="webhook-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={200}
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={active}
              onCheckedChange={setActive}
              id="webhook-active"
              disabled={webhook.status === 'AUTO_DISABLED'}
            />
            <Label htmlFor="webhook-active">
              {active ? 'Ativo' : 'Pausado'}
            </Label>
            {webhook.status === 'AUTO_DISABLED' && (
              <Badge className="border-0 bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                Auto-desativado — reative na página de detalhes
              </Badge>
            )}
          </div>
        </Card>

        {/* Eventos */}
        <Card className="p-4 sm:p-6 space-y-5">
          <h2 className="font-semibold text-base">Eventos subscritos</h2>
          <WebhookEventChipSelector value={events} onChange={setEvents} />
          {events.length === 0 && (
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Selecione pelo menos um evento.
            </p>
          )}
        </Card>

        {/* Versão de payload — D-23: imutável após criação */}
        <Card className="p-4 sm:p-6 space-y-3">
          <h2 className="font-semibold text-base">Versão do payload</h2>
          <div className="space-y-2">
            <Label htmlFor="webhook-api-version">Versão atual</Label>
            <Input
              id="webhook-api-version"
              value={webhook.apiVersion}
              readOnly
              disabled
              className="font-mono text-sm max-w-xs"
            />
            <p className="text-xs text-muted-foreground">
              Para alterar a versão, recrie o webhook (D-23 — versionamento
              imutável após criação).
              <Link
                href="/devices/webhooks/new"
                className="ml-1 underline underline-offset-2 hover:text-foreground"
              >
                Recriar com nova versão →
              </Link>
            </p>
          </div>
        </Card>

        {/* Secret */}
        <Card className="p-4 sm:p-6 space-y-3">
          <h2 className="font-semibold text-base">Secret</h2>
          <code className="font-mono text-xs">{webhook.secretMasked}</code>
          {webhook.secretRotationActiveUntil && (
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Rotação ativa: secret antigo válido até{' '}
              {new Date(webhook.secretRotationActiveUntil).toLocaleDateString(
                'pt-BR'
              )}
              . Após esse prazo, apenas o novo secret funcionará.
            </p>
          )}
          {canAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRegenerateOpen(true)}
              disabled={regenerateSecret.isPending}
            >
              {regenerateSecret.isPending
                ? 'Regenerando...'
                : 'Regenerar secret'}
            </Button>
          )}
          <p className="text-xs text-muted-foreground">
            Ao regenerar, o secret atual continuará válido por 7 dias para
            permitir migração suave do cliente externo (D-07).
          </p>
        </Card>
      </PageBody>

      <VerifyActionPinModal
        isOpen={regenerateOpen}
        onClose={() => setRegenerateOpen(false)}
        onSuccess={handleRegenerateSuccess}
        title="Regenerar secret"
        description="Digite seu PIN de ação. O secret atual continuará válido por 7 dias para migração suave do cliente externo."
      />
    </PageLayout>
  );
}
