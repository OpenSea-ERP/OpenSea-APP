/**
 * OpenSea OS - Edit Message Template Page
 * Página de edição do modelo de mensagem com editor de corpo e inserção de variáveis
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
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  useMessageTemplate,
  useUpdateMessageTemplate,
  useDeleteMessageTemplate,
} from '@/hooks/sales/use-message-templates';
import { usePermissions } from '@/hooks/use-permissions';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import { logger } from '@/lib/logger';
import type { MessageTemplate, MessageChannel } from '@/types/sales';
import { MESSAGE_CHANNEL_LABELS } from '@/types/sales';
import { useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  Loader2,
  Mail,
  MessageCircle,
  Save,
  Send,
  Smartphone,
  Trash2,
  Type,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

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
    <div className="space-y-3">
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

export default function EditMessageTemplatePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const templateId = params.id as string;

  const {
    data: templateData,
    isLoading: isLoadingTemplate,
    error,
  } = useMessageTemplate(templateId);

  const template = templateData?.messageTemplate as MessageTemplate | undefined;

  const updateMutation = useUpdateMessageTemplate();
  const deleteMutation = useDeleteMessageTemplate();

  const [isSaving, setIsSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [channel, setChannel] = useState<MessageChannel>('EMAIL');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (template) {
      setName(template.name || '');
      setChannel(template.channel || 'EMAIL');
      setSubject(template.subject || '');
      setBody(template.body || '');
      setIsActive(template.isActive ?? true);
    }
  }, [template]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    if (!body.trim()) {
      toast.error('Corpo da mensagem é obrigatório');
      return;
    }

    try {
      setIsSaving(true);
      await updateMutation.mutateAsync({
        id: templateId,
        data: {
          name: name.trim(),
          channel,
          subject: subject.trim() || undefined,
          body: body.trim(),
          isActive,
        } as unknown as Record<string, unknown>,
      });

      toast.success('Modelo atualizado com sucesso!');
      await queryClient.invalidateQueries({
        queryKey: ['message-templates', templateId],
      });
      router.push(`/sales/msg-templates/${templateId}`);
    } catch (err) {
      logger.error(
        'Erro ao atualizar modelo',
        err instanceof Error ? err : undefined
      );
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao atualizar modelo', { description: message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteMutation.mutateAsync(templateId);
      toast.success('Modelo excluído com sucesso!');
      router.push('/sales/msg-templates');
    } catch (err) {
      logger.error(
        'Erro ao deletar modelo',
        err instanceof Error ? err : undefined
      );
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      toast.error('Erro ao deletar modelo', { description: message });
    }
  };

  const actionButtons: HeaderButton[] = [
    ...(hasPermission(SALES_PERMISSIONS.MSG_TEMPLATES.ADMIN)
      ? [
          {
            id: 'delete',
            title: 'Excluir',
            icon: Trash2,
            onClick: () => setDeleteModalOpen(true),
            variant: 'default' as const,
            className:
              'bg-slate-200 text-slate-700 border-transparent hover:bg-rose-600 hover:text-white dark:bg-[#334155] dark:text-white dark:hover:bg-rose-600',
          },
        ]
      : []),
    {
      id: 'save',
      title: isSaving ? 'Salvando...' : 'Salvar',
      icon: isSaving ? Loader2 : Save,
      onClick: handleSubmit,
      variant: 'default',
      disabled: isSaving || !name.trim() || !body.trim(),
    },
  ];

  const breadcrumbItems = [
    { label: 'Vendas', href: '/sales' },
    { label: 'Modelos de Mensagem', href: '/sales/msg-templates' },
    {
      label: template?.name || '...',
      href: `/sales/msg-templates/${templateId}`,
    },
    { label: 'Editar' },
  ];

  if (isLoadingTemplate) {
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
            message="O modelo solicitado não foi encontrado."
            action={{
              label: 'Voltar para Modelos',
              onClick: () => router.push('/sales/msg-templates'),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  const ChannelIcon = CHANNEL_ICONS[channel] || Send;

  return (
    <PageLayout data-testid="msg-template-edit">
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
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl shadow-lg ${CHANNEL_GRADIENTS[channel]}`}
            >
              <ChannelIcon className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">Editando modelo</p>
              <h1 className="text-xl font-bold truncate">{template.name}</h1>
            </div>
            <div className="hidden sm:flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-3 rounded-lg bg-white/5 px-4 py-2">
                <div className="text-right">
                  <p className="text-xs font-semibold">Status</p>
                  <p className="text-[11px] text-muted-foreground">
                    {isActive ? 'Ativo' : 'Inativo'}
                  </p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card: Dados Básicos */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={Type}
                title="Dados do Modelo"
                subtitle="Informações básicas de identificação"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">
                      Nome <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Nome do modelo"
                      required
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="channel">
                      Canal <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={channel}
                      onValueChange={v => setChannel(v as MessageChannel)}
                    >
                      <SelectTrigger id="channel">
                        <SelectValue placeholder="Selecione o canal..." />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(MESSAGE_CHANNEL_LABELS).map(
                          ([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {(channel === 'EMAIL' || channel === 'NOTIFICATION') && (
                  <div className="grid gap-2">
                    <Label htmlFor="subject">Assunto</Label>
                    <Input
                      id="subject"
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      placeholder="Assunto da mensagem"
                    />
                  </div>
                )}

                {/* Mobile toggle */}
                <div className="grid grid-cols-1 sm:hidden gap-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-white dark:bg-slate-800/60">
                    <div className="space-y-0.5">
                      <Label className="text-base font-medium">Status</Label>
                      <p className="text-sm text-muted-foreground">
                        {isActive ? 'Ativo' : 'Inativo'}
                      </p>
                    </div>
                    <Switch checked={isActive} onCheckedChange={setIsActive} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Form Card: Corpo da Mensagem */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={Mail}
                title="Corpo da Mensagem"
                subtitle="Conteúdo do modelo com suporte a variáveis"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
                <div className="grid gap-2">
                  <Label htmlFor="body">
                    Corpo <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="body"
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    placeholder="Escreva o corpo da mensagem... Use {{variavel}} para variáveis dinâmicas."
                    rows={8}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use {`{{nome_variavel}}`} para inserir variáveis dinâmicas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </PageBody>

      {/* Delete PIN Modal */}
      <VerifyActionPinModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onSuccess={handleDeleteConfirm}
        title="Excluir Modelo"
        description={`Digite seu PIN de ação para excluir o modelo "${template.name}". Esta ação não pode ser desfeita.`}
      />
    </PageLayout>
  );
}
