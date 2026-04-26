'use client';

import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { GridError } from '@/components/handlers/grid-error';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePosTerminal } from '@/hooks/sales/use-pos-terminal';
import { AdministratorsTab } from './_components/administrators-tab';
import { FiscalAdvancedTab } from './_components/fiscal-advanced-tab';
import { OperatorsTab } from './_components/operators-tab';
import { ZonesTab } from './_components/zones-tab';

/**
 * POS Terminal configuration page (Emporion Fase 1).
 *
 * Renders 4 tabs that map to the configurable surfaces of a Terminal:
 *  - Zonas: PRIMARY/SECONDARY zone link management
 *  - Operadores: authorized employees who can sign in via shortId
 *  - Administradores: read-only list of users with `sales.pos.admin`
 *  - Fiscal & Avançado: operator session mode + coordination overrides
 */
export default function TerminalConfigurePage() {
  const params = useParams();
  const id = typeof params?.id === 'string' ? params.id : '';
  const { data: terminal, isLoading, error, refetch } = usePosTerminal(id);

  const breadcrumbItems = [
    { label: 'Dispositivos', href: '/devices' },
    { label: 'Terminais POS', href: '/devices/pos-terminals' },
    {
      label: terminal?.terminalName ?? 'Terminal',
      href: `/devices/pos-terminals#${id}`,
    },
    { label: 'Configuração' },
  ];

  return (
    <PageLayout data-testid="pos-terminal-configure-page">
      <PageHeader>
        <PageActionBar breadcrumbItems={breadcrumbItems} />
      </PageHeader>
      <PageBody>
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error || !terminal ? (
          <GridError
            title="Não foi possível carregar o terminal"
            message={
              error instanceof Error
                ? error.message
                : 'Verifique sua conexão e tente novamente.'
            }
            action={{
              label: 'Tentar novamente',
              onClick: () => {
                void refetch();
              },
            }}
          />
        ) : (
          <>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Configuração do terminal
              </p>
              <h1 className="text-2xl font-semibold tracking-tight">
                {terminal.terminalName}
              </h1>
              <p className="text-sm text-muted-foreground">
                Código{' '}
                <span className="font-mono tracking-widest">
                  {terminal.terminalCode}
                </span>
              </p>
            </div>

            <Tabs defaultValue="zones" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4 h-12">
                <TabsTrigger value="zones" data-testid="tab-zones">
                  Zonas
                </TabsTrigger>
                <TabsTrigger value="operators" data-testid="tab-operators">
                  Operadores
                </TabsTrigger>
                <TabsTrigger
                  value="administrators"
                  data-testid="tab-administrators"
                >
                  Administradores
                </TabsTrigger>
                <TabsTrigger value="fiscal" data-testid="tab-fiscal">
                  Fiscal &amp; Avançado
                </TabsTrigger>
              </TabsList>

              <TabsContent value="zones">
                <ZonesTab terminalId={terminal.id} />
              </TabsContent>
              <TabsContent value="operators">
                <OperatorsTab terminalId={terminal.id} />
              </TabsContent>
              <TabsContent value="administrators">
                <AdministratorsTab />
              </TabsContent>
              <TabsContent value="fiscal">
                <FiscalAdvancedTab terminal={terminal} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </PageBody>
    </PageLayout>
  );
}
