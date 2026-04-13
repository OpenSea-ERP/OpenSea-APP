/**
 * OpenSea OS - Message Template Detail Page
 * Página de detalhes do modelo de mensagem com preview e variáveis
 */

'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import type { HeaderButton } from '@/components/layout/types/header.types';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMessageTemplate } from '@/hooks/sales/use-message-templates';
import { usePermissions } from '@/hooks/use-permissions';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import type { MessageTemplate, MessageChannel } from '@/types/sales';
import { MESSAGE_CHANNEL_LABELS } from '@/types/sales';
import {
  Bell,
  Calendar,
  Code,
  Edit,
  Eye,
  Mail,
  MessageCircle,
  Send,
  Smartphone,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

const CHANNEL_ICONS: Record<MessageChannel, React.ElementType> = {
  EMAIL: Mail,
  WHATSAPP: MessageCircle,
  SMS: Smartphone,
  NOTIFICATION: Bell,
};

const CHANNEL_GRADIENTS: Record<MessageChannel, string> = {
  EMAIL: 'bg-linear-to-br from-sky-500 to-blue-600',
  WHATSAPP: 'bg-linear-to-br from-emerald-500 to-green-600',
  SMS: 'bg-linear-to-br from-violet-500 to-purple-600',
  NOTIFICATION: 'bg-linear-to-br from-teal-500 to-cyan-600',
};

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | undefined | null;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

export default function MessageTemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const templateId = params.id as string;

  const {
    data: templateData,
    isLoading,
    error,
  } = useMessageTemplate(templateId);

  const template = templateData?.messageTemplate as MessageTemplate | undefined;

  const actionButtons: HeaderButton[] = [
    ...(hasPermission(SALES_PERMISSIONS.MSG_TEMPLATES.ADMIN)
      ? [
          {
            id: 'edit',
            title: 'Editar Modelo',
            icon: Edit,
            onClick: () =>
              router.push(`/sales/msg-templates/${templateId}/edit`),
            variant: 'default' as const,
          },
        ]
      : []),
  ];

  const breadcrumbItems = [
    { label: 'Vendas', href: '/sales' },
    { label: 'Modelos de Mensagem', href: '/sales/msg-templates' },
    { label: template?.name || '...' },
  ];

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" size="md" />
        </PageBody>
      </PageLayout>
    );
  }

  if (error || !template) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Modelo não encontrado"
            message="O modelo de mensagem que você está procurando não existe ou foi removido."
            action={{
              label: 'Voltar para Modelos',
              onClick: () => router.push('/sales/msg-templates'),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  const channelLabel =
    MESSAGE_CHANNEL_LABELS[template.channel] || template.channel;
  const ChannelIcon = CHANNEL_ICONS[template.channel] || Send;

  const createdDate = new Date(template.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <PageLayout data-testid="msg-template-detail">
      <PageHeader>
        <PageActionBar
          breadcrumbItems={breadcrumbItems}
          buttons={actionButtons}
        />
      </PageHeader>
      <PageBody>
        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl shadow-lg ${CHANNEL_GRADIENTS[template.channel]}`}
            >
              <ChannelIcon className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">{channelLabel}</p>
              <h1 className="text-xl font-bold truncate">{template.name}</h1>
              {template.subject && (
                <p className="text-sm text-muted-foreground">
                  {template.subject}
                </p>
              )}
            </div>
            <div className="hidden sm:flex items-center gap-3 shrink-0">
              <div
                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${
                  template.isActive
                    ? 'border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/8 text-emerald-700 dark:text-emerald-300'
                    : 'border-gray-300 dark:border-white/[0.1] bg-gray-100 dark:bg-white/[0.04] text-gray-600 dark:text-gray-400'
                }`}
              >
                {template.isActive ? 'Ativo' : 'Inativo'}
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12 mb-4">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="variables">Variáveis</TabsTrigger>
          </TabsList>

          {/* TAB: Preview */}
          <TabsContent value="preview" className="space-y-6">
            <Card className="bg-white/5 py-2 overflow-hidden">
              <div className="px-6 py-4 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Eye className="h-5 w-5 text-foreground" />
                    <div>
                      <h3 className="text-base font-semibold">
                        Preview do Modelo
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Visualização do conteúdo da mensagem
                      </p>
                    </div>
                  </div>
                  <div className="border-b border-border" />
                </div>

                <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InfoRow
                      icon={ChannelIcon}
                      label="Canal"
                      value={channelLabel}
                    />
                    <InfoRow
                      icon={Calendar}
                      label="Criado em"
                      value={createdDate}
                    />
                  </div>

                  {template.subject && (
                    <div className="pt-4 border-t border-border">
                      <p className="text-xs text-muted-foreground mb-1">
                        Assunto
                      </p>
                      <p className="text-sm font-medium">{template.subject}</p>
                    </div>
                  )}

                  <div className="pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-2">
                      Corpo da Mensagem
                    </p>
                    <div className="rounded-lg bg-gray-50 dark:bg-slate-900/50 p-4">
                      <p className="text-sm whitespace-pre-wrap">
                        {template.body}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* TAB: Variáveis */}
          <TabsContent value="variables" className="space-y-6">
            <Card className="bg-white/5 py-2 overflow-hidden">
              <div className="px-6 py-4 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Code className="h-5 w-5 text-foreground" />
                    <div>
                      <h3 className="text-base font-semibold">
                        Variáveis Disponíveis
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Variáveis que podem ser usadas no corpo da mensagem
                      </p>
                    </div>
                  </div>
                  <div className="border-b border-border" />
                </div>

                {template.variables.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Code className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <h3 className="text-base font-semibold text-muted-foreground">
                      Nenhuma variável
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Este modelo não utiliza variáveis dinâmicas.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {template.variables.map((variable, index) => (
                      <div
                        key={index}
                        className="w-full rounded-xl border border-border bg-white p-3 dark:bg-slate-800/60"
                      >
                        <code className="text-sm font-mono text-violet-700 dark:text-violet-300">
                          {`{{${variable}}}`}
                        </code>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </PageBody>
    </PageLayout>
  );
}
