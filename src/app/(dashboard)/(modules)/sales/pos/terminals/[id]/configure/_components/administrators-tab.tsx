'use client';

import Link from 'next/link';
import { ExternalLink, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

/**
 * "Administradores" tab of the POS Terminal configure page (Emporion Fase 1).
 *
 * Read-only by design in Fase 1: Plan A intentionally does NOT model a
 * per-terminal `PosTerminalAdministrator` link. Administrative actions on
 * terminals are gated by the global `sales.pos.admin` RBAC permission.
 * Granular per-terminal admin assignment is deferred to Fase 2.
 */
export function AdministratorsTab() {
  return (
    <div className="space-y-4" data-testid="administrators-tab">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-foreground" />
        <h2 className="text-lg font-semibold">Administradores do terminal</h2>
      </div>

      <Card className="bg-white dark:bg-white/5 border border-border overflow-hidden py-0">
        <div className="space-y-3 p-6">
          <p className="text-sm leading-relaxed">
            Qualquer usuário do tenant que possua a permissão{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
              sales.pos.admin
            </code>{' '}
            pode executar ações administrativas neste e nos demais terminais do
            tenant — fechar caixa, autorizar estornos, configurar zonas,
            operadores e parâmetros fiscais.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            A gestão é feita pelos grupos de permissões do RBAC. A vinculação
            granular de administradores por terminal será disponibilizada em uma
            versão futura (Fase 2).
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/permission-groups">
                <ExternalLink className="h-4 w-4" />
                Gerenciar grupos de permissões
              </Link>
            </Button>
          </div>
        </div>
      </Card>

      <div
        className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200"
        role="note"
      >
        <strong>Boa prática:</strong> mantenha o número de usuários com{' '}
        <code className="font-mono">sales.pos.admin</code> reduzido. Toda
        autorização administrativa é registrada em auditoria.
      </div>
    </div>
  );
}
