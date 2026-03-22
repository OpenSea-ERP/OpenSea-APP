'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PageActionBar } from '@/components/layout/page-action-bar';
import { aiConfigService } from '@/services/ai';
import { toast } from 'sonner';
import {
  Save,
  Bot,
  Loader2,
  Settings2,
  Cpu,
  Shield,
  Lightbulb,
} from 'lucide-react';
import type { AiTenantConfig, UpdateAiConfigRequest } from '@/types/ai';

export default function AiSettingsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Partial<UpdateAiConfigRequest>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['ai', 'config'],
    queryFn: async () => {
      const response = await aiConfigService.get();
      return response.config;
    },
  });

  // Initialize form when data loads
  useEffect(() => {
    if (data) {
      setForm({
        assistantName: data.assistantName,
        personality: data.personality,
        toneOfVoice: data.toneOfVoice,
        language: data.language,
        greeting: data.greeting,
        enableDedicatedChat: data.enableDedicatedChat,
        enableInlineContext: data.enableInlineContext,
        enableCommandBar: data.enableCommandBar,
        enableVoice: data.enableVoice,
        wakeWord: data.wakeWord,
        tier1Provider: data.tier1Provider,
        tier2Provider: data.tier2Provider,
        tier3Provider: data.tier3Provider,
        canExecuteActions: data.canExecuteActions,
        requireConfirmation: data.requireConfirmation,
        maxActionsPerMinute: data.maxActionsPerMinute,
        enableProactiveInsights: data.enableProactiveInsights,
        insightFrequency: data.insightFrequency,
        enableScheduledReports: data.enableScheduledReports,
      });
      setHasChanges(false);
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: aiConfigService.update,
    onSuccess: () => {
      toast.success('Configuracoes do assistente atualizadas!');
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ['ai', 'config'] });
    },
    onError: () => {
      toast.error('Erro ao salvar configuracoes.');
    },
  });

  const updateField = <K extends keyof UpdateAiConfigRequest>(
    key: K,
    value: UpdateAiConfigRequest[K]
  ) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateMutation.mutate(form);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <PageActionBar
        breadcrumbItems={[
          { label: 'Ferramentas' },
          { label: 'Assistente IA', href: '/ai' },
          { label: 'Configuracoes' },
        ]}
        actions={
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-6 space-y-6 max-w-3xl">
        {/* Identity */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bot className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Identidade do Assistente</h3>
          </div>
          <div className="space-y-4">
            <div>
              <Label>Nome do assistente</Label>
              <Input
                value={form.assistantName ?? ''}
                onChange={e => updateField('assistantName', e.target.value)}
                placeholder="Atlas"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Personalidade</Label>
              <Select
                value={form.personality}
                onValueChange={v =>
                  updateField(
                    'personality',
                    v as UpdateAiConfigRequest['personality']
                  )
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PROFESSIONAL">Profissional</SelectItem>
                  <SelectItem value="FRIENDLY">Amigavel</SelectItem>
                  <SelectItem value="CASUAL">Casual</SelectItem>
                  <SelectItem value="FORMAL">Formal</SelectItem>
                  <SelectItem value="CUSTOM">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tom de voz</Label>
              <Select
                value={form.toneOfVoice}
                onValueChange={v =>
                  updateField(
                    'toneOfVoice',
                    v as UpdateAiConfigRequest['toneOfVoice']
                  )
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NEUTRAL">Neutro</SelectItem>
                  <SelectItem value="WARM">Caloroso</SelectItem>
                  <SelectItem value="DIRECT">Direto</SelectItem>
                  <SelectItem value="ENTHUSIASTIC">Entusiasmado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Mensagem de boas-vindas</Label>
              <Textarea
                value={form.greeting ?? ''}
                onChange={e => updateField('greeting', e.target.value || null)}
                placeholder="Ola! Como posso ajudar?"
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
        </Card>

        {/* Access Modes */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Settings2 className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Modos de Acesso</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Chat dedicado</Label>
                <p className="text-xs text-muted-foreground">
                  Interface completa de chat em /ai
                </p>
              </div>
              <Switch
                checked={form.enableDedicatedChat ?? true}
                onCheckedChange={v => updateField('enableDedicatedChat', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Contexto inline</Label>
                <p className="text-xs text-muted-foreground">
                  Painel de IA dentro das paginas dos modulos
                </p>
              </div>
              <Switch
                checked={form.enableInlineContext ?? true}
                onCheckedChange={v => updateField('enableInlineContext', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Barra de comandos (Cmd+K)</Label>
                <p className="text-xs text-muted-foreground">
                  Busca universal e comandos por IA
                </p>
              </div>
              <Switch
                checked={form.enableCommandBar ?? true}
                onCheckedChange={v => updateField('enableCommandBar', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Voz</Label>
                <p className="text-xs text-muted-foreground">
                  Ativacao por voz com wake word
                </p>
              </div>
              <Switch
                checked={form.enableVoice ?? false}
                onCheckedChange={v => updateField('enableVoice', v)}
              />
            </div>
            {form.enableVoice && (
              <div>
                <Label>Wake word</Label>
                <Input
                  value={form.wakeWord ?? ''}
                  onChange={e =>
                    updateField('wakeWord', e.target.value || null)
                  }
                  placeholder="Hey OpenSea"
                  className="mt-1"
                />
              </div>
            )}
          </div>
        </Card>

        {/* AI Providers */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Provedores de IA (3 niveis)</h3>
          </div>
          <div className="space-y-4">
            <div>
              <Label>Nivel 1 (rapido, simples)</Label>
              <Input
                value={form.tier1Provider ?? ''}
                onChange={e => updateField('tier1Provider', e.target.value)}
                placeholder="GROQ_SMALL"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Nivel 2 (balanceado)</Label>
              <Input
                value={form.tier2Provider ?? ''}
                onChange={e => updateField('tier2Provider', e.target.value)}
                placeholder="GROQ"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Nivel 3 (avancado, complexo)</Label>
              <Input
                value={form.tier3Provider ?? ''}
                onChange={e => updateField('tier3Provider', e.target.value)}
                placeholder="CLAUDE"
                className="mt-1"
              />
            </div>
          </div>
        </Card>

        {/* Autonomy */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Autonomia</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Executar acoes</Label>
                <p className="text-xs text-muted-foreground">
                  Permitir que a IA execute acoes no sistema
                </p>
              </div>
              <Switch
                checked={form.canExecuteActions ?? false}
                onCheckedChange={v => updateField('canExecuteActions', v)}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Exigir confirmacao</Label>
                <p className="text-xs text-muted-foreground">
                  Pedir aprovacao antes de executar acoes
                </p>
              </div>
              <Switch
                checked={form.requireConfirmation ?? true}
                onCheckedChange={v => updateField('requireConfirmation', v)}
              />
            </div>
            <div>
              <Label>Maximo de acoes por minuto</Label>
              <Input
                type="number"
                min={1}
                max={60}
                value={form.maxActionsPerMinute ?? 5}
                onChange={e =>
                  updateField('maxActionsPerMinute', Number(e.target.value))
                }
                className="mt-1 w-24"
              />
            </div>
          </div>
        </Card>

        {/* Insights */}
        <Card className="p-5 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Insights Proativos</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Ativar insights proativos</Label>
                <p className="text-xs text-muted-foreground">
                  A IA gera insights automaticamente analisando seus dados
                </p>
              </div>
              <Switch
                checked={form.enableProactiveInsights ?? true}
                onCheckedChange={v => updateField('enableProactiveInsights', v)}
              />
            </div>
            <div>
              <Label>Frequencia</Label>
              <Select
                value={form.insightFrequency}
                onValueChange={v => updateField('insightFrequency', v)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HOURLY">A cada hora</SelectItem>
                  <SelectItem value="DAILY">Diario</SelectItem>
                  <SelectItem value="WEEKLY">Semanal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Relatorios agendados</Label>
                <p className="text-xs text-muted-foreground">
                  Receber relatorios automaticos por email
                </p>
              </div>
              <Switch
                checked={form.enableScheduledReports ?? false}
                onCheckedChange={v => updateField('enableScheduledReports', v)}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
