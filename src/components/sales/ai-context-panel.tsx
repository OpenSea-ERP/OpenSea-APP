'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Bot,
  Lightbulb,
  MessageCircle,
  TrendingUp,
  Clock,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface AiContextPanelProps {
  entityType: 'deal' | 'customer' | 'contact' | 'order' | 'catalog';
  entityId: string;
  customerName?: string;
  dealTitle?: string;
  className?: string;
}

const PLACEHOLDER_INSIGHTS: Record<
  string,
  Array<{ icon: typeof Clock; text: string; color: string }>
> = {
  order: [
    {
      icon: Clock,
      text: 'Cliente costuma confirmar pedidos em at\u00e9 3 dias',
      color: 'text-blue-500',
    },
    {
      icon: TrendingUp,
      text: 'Ticket m\u00e9dio deste cliente: R$ 2.450,00',
      color: 'text-emerald-500',
    },
    {
      icon: AlertCircle,
      text: '\u00DAltima compra h\u00e1 45 dias \u2014 acima da m\u00e9dia',
      color: 'text-amber-500',
    },
    {
      icon: Lightbulb,
      text: 'Produtos complementares dispon\u00edveis em estoque',
      color: 'text-violet-500',
    },
  ],
  deal: [
    {
      icon: Clock,
      text: 'Cliente n\u00e3o responde h\u00e1 12 dias',
      color: 'text-amber-500',
    },
    {
      icon: MessageCircle,
      text: 'Sentimento da \u00faltima conversa: neutro',
      color: 'text-blue-500',
    },
    {
      icon: TrendingUp,
      text: 'Lead score: 72/100',
      color: 'text-emerald-500',
    },
    {
      icon: Lightbulb,
      text: 'Sugest\u00e3o: envie proposta revisada com condi\u00e7\u00e3o especial',
      color: 'text-violet-500',
    },
  ],
  customer: [
    {
      icon: TrendingUp,
      text: 'Valor total de compras: R$ 34.200,00',
      color: 'text-emerald-500',
    },
    {
      icon: Clock,
      text: 'Frequ\u00eancia de compra: a cada 30 dias',
      color: 'text-blue-500',
    },
    {
      icon: AlertCircle,
      text: 'Risco de churn: baixo',
      color: 'text-green-500',
    },
    {
      icon: Lightbulb,
      text: 'Oportunidade de upsell em acess\u00f3rios',
      color: 'text-violet-500',
    },
  ],
  contact: [
    {
      icon: MessageCircle,
      text: '\u00DAltimo contato h\u00e1 5 dias',
      color: 'text-blue-500',
    },
    {
      icon: TrendingUp,
      text: 'Engajamento: alto',
      color: 'text-emerald-500',
    },
    {
      icon: Lightbulb,
      text: 'Prefere comunica\u00e7\u00e3o por e-mail',
      color: 'text-violet-500',
    },
  ],
  catalog: [
    {
      icon: TrendingUp,
      text: 'Taxa de convers\u00e3o estimada: 12%',
      color: 'text-emerald-500',
    },
    {
      icon: AlertCircle,
      text: '3 itens com estoque cr\u00edtico',
      color: 'text-amber-500',
    },
    {
      icon: Lightbulb,
      text: 'Sugest\u00e3o: adicionar produtos sazonais em alta',
      color: 'text-violet-500',
    },
  ],
};

const PLACEHOLDER_SUGGESTIONS: Record<string, string> = {
  order:
    'Considere oferecer frete gr\u00e1tis para incentivar a confirma\u00e7\u00e3o r\u00e1pida deste pedido.',
  deal: 'Envie uma proposta revisada com condi\u00e7\u00e3o especial de pagamento para reativar o interesse.',
  customer:
    'Este cliente tem potencial para upgrade. Considere uma oferta personalizada de acess\u00f3rios.',
  contact: 'Agende um follow-up para manter o engajamento com este contato.',
  catalog:
    'Reorganize os itens por popularidade para melhorar a experi\u00eancia de navega\u00e7\u00e3o.',
};

export function AiContextPanel({
  entityType,
  entityId,
  customerName,
  dealTitle,
  className,
}: AiContextPanelProps) {
  const insights =
    PLACEHOLDER_INSIGHTS[entityType] ?? PLACEHOLDER_INSIGHTS.customer;
  const suggestion =
    PLACEHOLDER_SUGGESTIONS[entityType] ?? PLACEHOLDER_SUGGESTIONS.customer;

  return (
    <Card
      className={cn(
        'bg-slate-50 dark:bg-slate-800/40 border border-border p-4',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-500/10">
          <Bot className="h-4 w-4 text-violet-500" />
        </div>
        <h3 className="text-sm font-semibold">Atlas Insights</h3>
        <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          IA
        </span>
      </div>

      {/* Insight Items */}
      <ul className="space-y-2 mb-3">
        {insights.map((insight, index) => {
          const Icon = insight.icon;
          return (
            <li key={index} className="flex items-start gap-2 text-xs">
              <Icon
                className={cn('h-3.5 w-3.5 mt-0.5 shrink-0', insight.color)}
              />
              <span className="text-muted-foreground">{insight.text}</span>
            </li>
          );
        })}
      </ul>

      {/* Suggestion */}
      <div className="rounded-md bg-violet-500/5 border border-violet-500/10 p-2.5 mb-3">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-medium text-violet-600 dark:text-violet-400">
            Sugest\u00e3o:{' '}
          </span>
          {suggestion}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs flex-1"
          asChild
        >
          <Link href="/ai">
            <MessageCircle className="h-3 w-3 mr-1" />
            Perguntar mais
          </Link>
        </Button>
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] text-muted-foreground/60 mt-2 text-center">
        Insights gerados por IA \u2014 dados ilustrativos
      </p>
    </Card>
  );
}
