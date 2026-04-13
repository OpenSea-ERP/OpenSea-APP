'use client';

import { PageActionBar } from '@/components/layout/page-action-bar';
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
import { Textarea } from '@/components/ui/textarea';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import {
  useChatbotConfig,
  useUpdateChatbotConfig,
} from '@/hooks/sales/use-chatbot';
import { useForms } from '@/hooks/sales/use-forms';
import { usePermissions } from '@/hooks/use-permissions';
import { translateError } from '@/lib/error-messages';
import { ApiError } from '@/lib/errors/api-error';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  Bot,
  Check,
  Code,
  Copy,
  Loader2,
  MessageSquare,
  Palette,
  Power,
  Save,
  User,
} from 'lucide-react';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

function ChatbotConfigContent() {
  const { hasPermission } = usePermissions();
  const canAccess = hasPermission(SALES_PERMISSIONS.CHATBOT.ACCESS);
  const canAdmin = hasPermission(SALES_PERMISSIONS.CHATBOT.ADMIN);

  const { data, isLoading, isError } = useChatbotConfig();
  const updateConfig = useUpdateChatbotConfig();
  const { data: formsData } = useForms();

  const forms = (formsData?.forms ?? [])
    .map(form => {
      const id = form['id'];
      const name = form['name'];

      if (typeof id !== 'string' || typeof name !== 'string') {
        return null;
      }

      return { id, name };
    })
    .filter((form): form is { id: string; name: string } => form !== null);

  const [greetingMessage, setGreetingMessage] = useState('');
  const [autoReplyMessage, setAutoReplyMessage] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#8b5cf6');
  const [assignToUserId, setAssignToUserId] = useState('');
  const [formId, setFormId] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (data?.config) {
      const cfg = data.config;
      setGreetingMessage(cfg.greetingMessage || '');
      setAutoReplyMessage(cfg.autoReplyMessage || '');
      setPrimaryColor(cfg.primaryColor || '#8b5cf6');
      setAssignToUserId(cfg.assignToUserId || '');
      setFormId(cfg.formId || '');
      setIsActive(cfg.isActive);
    }
  }, [data?.config]);

  const handleSave = useCallback(async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      await updateConfig.mutateAsync({
        greetingMessage: greetingMessage.trim(),
        autoReplyMessage: autoReplyMessage.trim(),
        primaryColor,
        assignToUserId: assignToUserId || undefined,
        formId: formId || undefined,
        isActive,
      });

      toast.success('Configuração do chatbot atualizada com sucesso!');
    } catch (err) {
      const apiError = ApiError.from(err);
      toast.error(translateError(apiError.message));
    } finally {
      setIsSaving(false);
    }
  }, [
    isSaving,
    greetingMessage,
    autoReplyMessage,
    primaryColor,
    assignToUserId,
    formId,
    isActive,
    updateConfig,
  ]);

  const embedCode = data?.config?.embedCode || '';

  function handleCopyEmbed() {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    toast.success('Código copiado para a área de transferência!');
    setTimeout(() => setCopied(false), 2000);
  }

  if (!canAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-500/10">
          <AlertTriangle className="h-10 w-10 text-red-500" />
        </div>
        <h2 className="text-lg font-semibold">Acesso negado</h2>
        <p className="text-sm text-muted-foreground">
          Você não tem permissão para acessar a configuração do chatbot.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <AlertTriangle className="h-8 w-8 text-red-500" />
        <p className="text-sm text-muted-foreground">
          Erro ao carregar configuração do chatbot.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageActionBar
        breadcrumbItems={[
          { label: 'Vendas', href: '/sales' },
          { label: 'Chatbot' },
        ]}
        buttons={
          canAdmin
            ? [
                {
                  id: 'save',
                  title: 'Salvar',
                  icon: isSaving ? Loader2 : Save,
                  variant: 'default' as const,
                  onClick: handleSave,
                  disabled: isSaving,
                },
              ]
            : undefined
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings */}
        <div className="lg:col-span-2 space-y-4">
          {/* Identity Card */}
          <Card className="bg-white/5 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-violet-500/10">
                  <Bot className="h-6 w-6 text-violet-500" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Configuração do Chatbot</h1>
                  <p className="text-sm text-muted-foreground">
                    Configure o widget de chat para seu site.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant="secondary"
                  className={cn(
                    'text-xs',
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/8 dark:text-emerald-300'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-500/10 dark:text-slate-400'
                  )}
                >
                  {isActive ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </div>
          </Card>

          {/* Messages Card */}
          <Card className="bg-white dark:bg-slate-800/60 border border-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="h-5 w-5 text-violet-500" />
              <h2 className="text-base font-semibold">Mensagens</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Mensagem de Boas-vindas</Label>
                <Input
                  value={greetingMessage}
                  onChange={e => setGreetingMessage(e.target.value)}
                  placeholder="Olá! Como posso ajudá-lo?"
                  disabled={!canAdmin}
                />
                <p className="text-xs text-muted-foreground">
                  Exibida quando o visitante abre o chat.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Resposta Automática</Label>
                <Textarea
                  value={autoReplyMessage}
                  onChange={e => setAutoReplyMessage(e.target.value)}
                  placeholder="Obrigado por entrar em contato! Um de nossos agentes responderá em breve."
                  rows={3}
                  disabled={!canAdmin}
                />
                <p className="text-xs text-muted-foreground">
                  Enviada automáticamente quando nenhum agente está disponível.
                </p>
              </div>
            </div>
          </Card>

          {/* Appearance Card */}
          <Card className="bg-white dark:bg-slate-800/60 border border-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="h-5 w-5 text-violet-500" />
              <h2 className="text-base font-semibold">Aparência</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Cor Principal</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={e => setPrimaryColor(e.target.value)}
                    className="h-10 w-10 rounded-lg border border-border cursor-pointer"
                    disabled={!canAdmin}
                  />
                  <Input
                    value={primaryColor}
                    onChange={e => setPrimaryColor(e.target.value)}
                    className="max-w-32"
                    disabled={!canAdmin}
                  />
                  <div
                    className="h-10 flex-1 rounded-lg"
                    style={{ backgroundColor: primaryColor }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Assignment Card */}
          <Card className="bg-white dark:bg-slate-800/60 border border-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-violet-500" />
              <h2 className="text-base font-semibold">
                Atribuição e Formulário
              </h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Atribuir para Usuário</Label>
                <Input
                  value={assignToUserId}
                  onChange={e => setAssignToUserId(e.target.value)}
                  placeholder="ID do usuário (opcional)"
                  disabled={!canAdmin}
                />
                <p className="text-xs text-muted-foreground">
                  As conversas serão atribuídas automáticamente a este usuário.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Formulário Vinculado</Label>
                <Select
                  value={formId || 'none'}
                  onValueChange={v => setFormId(v === 'none' ? '' : v)}
                  disabled={!canAdmin}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Nenhum" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {forms.map(f => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Os dados coletados no chat podem ser vinculados a um
                  formulário.
                </p>
              </div>
            </div>
          </Card>

          {/* Active Toggle Card */}
          <Card className="bg-white dark:bg-slate-800/60 border border-border p-5">
            <div className="flex items-center gap-2 mb-4">
              <Power className="h-5 w-5 text-violet-500" />
              <h2 className="text-base font-semibold">Status do Chatbot</h2>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">
                  {isActive ? 'Chatbot Ativo' : 'Chatbot Inativo'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isActive
                    ? 'O widget está visível no seu site.'
                    : 'O widget não será exibido no seu site.'}
                </p>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
                disabled={!canAdmin}
              />
            </div>
          </Card>

          {/* Embed Code Card */}
          {embedCode && (
            <Card className="bg-white dark:bg-slate-800/60 border border-border p-5">
              <div className="flex items-center gap-2 mb-4">
                <Code className="h-5 w-5 text-violet-500" />
                <h2 className="text-base font-semibold">
                  Código de Incorporação
                </h2>
              </div>

              <div className="relative">
                <pre className="bg-slate-100 dark:bg-slate-900 rounded-lg p-4 text-xs font-mono overflow-x-auto">
                  {embedCode}
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2 gap-1.5 text-xs"
                  onClick={handleCopyEmbed}
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copied ? 'Copiado!' : 'Copiar'}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground mt-2">
                Adicione este código antes do fechamento da tag{' '}
                <code className="bg-muted px-1 py-0.5 rounded">
                  {'</body>'}
                </code>{' '}
                no seu site.
              </p>
            </Card>
          )}
        </div>

        {/* Widget Preview */}
        <div className="space-y-4">
          <Card className="bg-white dark:bg-slate-800/60 border border-border p-5 sticky top-4">
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
              <Bot className="h-5 w-5 text-violet-500" />
              Prévia do Widget
            </h2>

            <div className="border border-border rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-900">
              {/* Chat Header */}
              <div
                className="px-4 py-3 flex items-center gap-3"
                style={{ backgroundColor: primaryColor }}
              >
                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Chat</p>
                  <p className="text-[10px] text-white/70">Online</p>
                </div>
              </div>

              {/* Chat Body */}
              <div className="px-4 py-4 space-y-3 min-h-[200px]">
                {/* Greeting message */}
                {greetingMessage && (
                  <div className="flex justify-start">
                    <div
                      className="max-w-[80%] rounded-2xl rounded-bl-md px-3 py-2 text-xs"
                      style={{
                        backgroundColor: `${primaryColor}15`,
                        color: primaryColor,
                      }}
                    >
                      {greetingMessage}
                    </div>
                  </div>
                )}

                {/* Sample user message */}
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-br-md px-3 py-2 text-xs bg-slate-200 dark:bg-slate-700 text-foreground">
                    Olá, gostaria de saber mais sobre...
                  </div>
                </div>

                {/* Auto reply */}
                {autoReplyMessage && (
                  <div className="flex justify-start">
                    <div
                      className="max-w-[80%] rounded-2xl rounded-bl-md px-3 py-2 text-xs"
                      style={{
                        backgroundColor: `${primaryColor}15`,
                        color: primaryColor,
                      }}
                    >
                      {autoReplyMessage}
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="px-4 py-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white dark:bg-slate-800 rounded-full px-3 py-1.5 text-xs text-muted-foreground border border-border">
                    Digite sua mensagem...
                  </div>
                  <div
                    className="h-7 w-7 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <MessageSquare className="h-3.5 w-3.5 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Floating button preview */}
            <div className="mt-4 flex justify-end">
              <div
                className="h-14 w-14 rounded-full flex items-center justify-center shadow-lg cursor-default"
                style={{ backgroundColor: primaryColor }}
              >
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-right mt-1">
              Botão flutuante
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ChatbotConfigPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-4">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      }
    >
      <ChatbotConfigContent />
    </Suspense>
  );
}
