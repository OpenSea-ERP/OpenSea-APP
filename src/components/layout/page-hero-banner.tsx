'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Package } from 'lucide-react';
import Link from 'next/link';

export interface HeroBannerButton {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
  gradient: string;
  permission?: string;
}

export interface PageHeroBannerProps {
  title: string;
  description: string;
  buttons: HeroBannerButton[];
  hasPermission: (permission: string) => boolean;
  icon?: React.ElementType;
  iconGradient?: string;
}

/**
 * Componente PageHeroBanner reutilizável
 *
 * Renderiza um hero banner no topo da página com:
 * - Título e descrição
 * - Ícone e cor customizáveis antes do título
 * - Botões de ação com permissões
 * - Background com elementos decorativos
 *
 * @example
 * <PageHeroBanner
 *   title="Estoque"
 *   description="Gerencie produtos, movimentações..."
 *   buttons={heroBannerButtons}
 *   hasPermission={hasPermission}
 *   icon={Package}
 *   iconGradient="from-emerald-500 to-emerald-600"
 * />
 */
export function PageHeroBanner({
  title,
  description,
  buttons,
  hasPermission,
  icon: Icon = Package,
  iconGradient = 'from-emerald-500 to-emerald-600',
}: PageHeroBannerProps) {
  return (
    <div>
      <Card className="relative overflow-hidden p-4 sm:p-8 md:p-12 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full opacity-80 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full opacity-80 translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-3 rounded-xl bg-linear-to-br ${iconGradient}`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              {title}
            </h1>
          </div>

          <p className="text-sm sm:text-lg text-gray-600 dark:text-white/60 mb-4 sm:mb-6">
            {description}
          </p>

          <div className="flex flex-wrap gap-3">
            {buttons
              .filter(btn => !btn.permission || hasPermission(btn.permission))
              .map(btn => (
                <Link key={btn.id} href={btn.href}>
                  <Button
                    className={`gap-2 text-white bg-linear-to-r ${btn.gradient} hover:opacity-90`}
                  >
                    <btn.icon className="h-4 w-4" />
                    {btn.label}
                  </Button>
                </Link>
              ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
