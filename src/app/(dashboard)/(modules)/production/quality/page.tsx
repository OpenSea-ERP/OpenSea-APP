/**
 * Quality Page (Placeholder)
 * Página de qualidade - Em breve
 */

'use client';

import { PageActionBar } from '@/components/layout/page-action-bar';
import { PageHeroBanner } from '@/components/layout/page-hero-banner';
import { usePermissions } from '@/hooks/use-permissions';
import { Card } from '@/components/ui/card';
import { ClipboardCheck, FlaskConical, ShieldAlert, Target } from 'lucide-react';

export default function QualityPage() {
  const { hasPermission } = usePermissions();

  return (
    <div className="space-y-8" data-testid="quality-page">
      <PageActionBar
        breadcrumbItems={[
          { label: 'Produção', href: '/production' },
          { label: 'Qualidade', href: '/production/quality' },
        ]}
      />

      <PageHeroBanner
        title="Qualidade"
        description="Inspeções de qualidade, não-conformidades e ações corretivas para controle da produção."
        icon={FlaskConical}
        iconGradient="from-slate-500 to-slate-600"
        buttons={[]}
        hasPermission={hasPermission}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-slate-400 to-slate-500 flex items-center justify-center">
              <ClipboardCheck className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Inspeções
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-white/60">
            Planos de inspeção, checklists e amostragem em pontos-chave do
            processo produtivo.
          </p>
          <span className="inline-flex items-center mt-4 rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-500/20 dark:bg-slate-500/8 dark:text-slate-300">
            Em breve
          </span>
        </Card>

        <Card className="p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-slate-400 to-slate-500 flex items-center justify-center">
              <ShieldAlert className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Não-Conformidades
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-white/60">
            Registro e acompanhamento de não-conformidades identificadas na
            produção.
          </p>
          <span className="inline-flex items-center mt-4 rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-500/20 dark:bg-slate-500/8 dark:text-slate-300">
            Em breve
          </span>
        </Card>

        <Card className="p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-slate-400 to-slate-500 flex items-center justify-center">
              <Target className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Ações Corretivas
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-white/60">
            CAPA (Ações Corretivas e Preventivas) com rastreamento de causa-raiz
            e eficácia.
          </p>
          <span className="inline-flex items-center mt-4 rounded-full border border-slate-300 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-500/20 dark:bg-slate-500/8 dark:text-slate-300">
            Em breve
          </span>
        </Card>
      </div>
    </div>
  );
}
