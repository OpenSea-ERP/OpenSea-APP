'use client';

import { PageActionBar } from '@/components/layout/page-action-bar';
import { PageBody } from '@/components/layout/page-body';
import { PageLayout } from '@/components/layout/page-layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GridLoading } from '@/components/shared/grid-loading';
import { GridError } from '@/components/shared/grid-error';
import { usePosTerminals } from '@/hooks/sales';
import { useRouter } from 'next/navigation';
import {
  Monitor,
  Smartphone,
  TabletSmartphone,
  Globe,
  Plus,
  Settings,
} from 'lucide-react';

const MODE_CONFIG = {
  FAST_CHECKOUT: {
    label: 'Caixa Rapido',
    icon: Monitor,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  CONSULTIVE: {
    label: 'Consultivo',
    icon: TabletSmartphone,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
  },
  SELF_SERVICE: {
    label: 'Autoatendimento',
    icon: Smartphone,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  EXTERNAL: {
    label: 'Venda Externa',
    icon: Globe,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
} as const;

export default function PosTerminalSelectorPage() {
  const router = useRouter();
  const { data, isLoading, error } = usePosTerminals({ isActive: true });

  return (
    <PageLayout>
      <PageActionBar
        breadcrumbs={[{ label: 'Vendas', href: '/sales' }, { label: 'PDV' }]}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/sales/pos/terminals')}
            >
              <Settings className="mr-2 h-4 w-4" />
              Gerenciar Terminais
            </Button>
          </div>
        }
      />

      <PageBody>
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Ponto de Venda</h1>
          <p className="text-muted-foreground mt-1">
            Selecione um terminal para iniciar as vendas
          </p>
        </div>

        {isLoading ? (
          <GridLoading />
        ) : error ? (
          <GridError />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data?.data.map(terminal => {
              const config = MODE_CONFIG[terminal.mode];
              const ModeIcon = config.icon;

              return (
                <Card
                  key={terminal.id}
                  className="group relative cursor-pointer overflow-hidden border border-border bg-white dark:bg-slate-800/60 p-5 transition-all hover:shadow-md hover:border-primary/30"
                  onClick={() => router.push(`/sales/pos/${terminal.id}`)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${config.bgColor}`}
                    >
                      <ModeIcon className={`h-6 w-6 ${config.color}`} />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {config.label}
                    </Badge>
                  </div>

                  <h3 className="font-semibold text-lg mb-1">
                    {terminal.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {terminal.deviceId}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        terminal.lastOnlineAt &&
                        new Date(terminal.lastOnlineAt).getTime() >
                          Date.now() - 5 * 60 * 1000
                          ? 'bg-emerald-500'
                          : 'bg-slate-400'
                      }`}
                    />
                    {terminal.lastOnlineAt
                      ? `Ultimo acesso: ${new Date(terminal.lastOnlineAt).toLocaleDateString('pt-BR')}`
                      : 'Nunca conectado'}
                  </div>
                </Card>
              );
            })}

            {/* Empty state */}
            {data?.data.length === 0 && (
              <Card className="col-span-full flex flex-col items-center justify-center p-12 border-dashed">
                <Monitor className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-semibold text-lg mb-1">
                  Nenhum terminal cadastrado
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Cadastre seu primeiro terminal para comecar a vender
                </p>
                <Button onClick={() => router.push('/sales/pos/terminals')}>
                  <Plus className="mr-2 h-4 w-4" />
                  Cadastrar Terminal
                </Button>
              </Card>
            )}
          </div>
        )}
      </PageBody>
    </PageLayout>
  );
}
