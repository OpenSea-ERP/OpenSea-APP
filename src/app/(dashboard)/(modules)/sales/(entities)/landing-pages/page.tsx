'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageActionBar } from '@/components/layout/page-action-bar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { usePermissions } from '@/hooks/use-permissions';
import {
  useLandingPages,
  useDeleteLandingPage,
} from '@/hooks/sales/use-landing-pages';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Globe,
  Plus,
  Search,
  MoreVertical,
  Eye,
  AlertTriangle,
  FileText,
  Layout,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { LandingPage, LandingPageStatus } from '@/types/sales';
import {
  LANDING_PAGE_STATUS_LABELS,
  LANDING_PAGE_TEMPLATE_LABELS,
} from '@/types/sales';
import { CreateLandingPageWizard } from './src/components/create-landing-page-wizard';

const STATUS_COLORS: Record<LandingPageStatus, string> = {
  DRAFT: 'bg-amber-50 text-amber-700 dark:bg-amber-500/8 dark:text-amber-300',
  PUBLISHED:
    'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/8 dark:text-emerald-300',
  ARCHIVED:
    'bg-slate-100 text-slate-500 dark:bg-slate-500/10 dark:text-slate-400',
};

export default function LandingPagesListPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const canAccess = hasPermission(SALES_PERMISSIONS.LANDING_PAGES.ACCESS);
  const canAdmin = hasPermission(SALES_PERMISSIONS.LANDING_PAGES.ADMIN);

  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<LandingPage | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  const { data, isLoading, isError } = useLandingPages({
    search: search || undefined,
  });

  const deleteLandingPage = useDeleteLandingPage();

  const landingPages = data?.landingPages ?? [];

  function handleDelete() {
    if (!deleteTarget) return;
    deleteLandingPage.mutate(deleteTarget.id, {
      onSuccess: () => {
        toast.success('Página de captura excluída com sucesso.');
        setDeleteTarget(null);
      },
      onError: () => {
        toast.error('Erro ao excluir página de captura.');
      },
    });
  }

  if (!canAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-500/10">
          <AlertTriangle className="h-10 w-10 text-red-500" />
        </div>
        <h2 className="text-lg font-semibold">Acesso negado</h2>
        <p className="text-sm text-muted-foreground">
          Você não tem permissão para acessar as páginas de captura.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4" data-testid="landing-pages-page">
      <PageActionBar
        breadcrumbItems={[
          { label: 'Vendas', href: '/sales' },
          { label: 'Páginas de Captura' },
        ]}
        buttons={
          canAdmin
            ? [
                {
                  id: 'create',
                  title: 'Nova Página',
                  icon: Plus,
                  variant: 'default' as const,
                  onClick: () => setWizardOpen(true),
                },
              ]
            : undefined
        }
      />

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar páginas..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <AlertTriangle className="h-8 w-8 text-red-500" />
          <p className="text-sm text-muted-foreground">
            Erro ao carregar páginas de captura.
          </p>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && landingPages.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="p-4 rounded-2xl bg-violet-50 dark:bg-violet-500/10">
            <Globe className="h-10 w-10 text-violet-500" />
          </div>
          <h2 className="text-lg font-semibold">
            Nenhuma página de captura encontrada
          </h2>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            Crie sua primeira página de captura para gerar leads e converter
            visitantes.
          </p>
        </div>
      )}

      {/* Cards Grid */}
      {!isLoading && !isError && landingPages.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {landingPages.map(page => (
            <Card
              key={page.id}
              className={cn(
                'relative p-5 cursor-pointer transition-all',
                'bg-white dark:bg-slate-800/60 border border-border',
                'hover:shadow-md hover:border-violet-300 dark:hover:border-violet-500/30',
                page.status === 'ARCHIVED' && 'opacity-60'
              )}
              onClick={() => router.push(`/sales/landing-pages/${page.id}`)}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-500/10">
                    <Globe className="h-5 w-5 text-sky-500" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold truncate">
                      {page.title}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      /{page.slug}
                    </p>
                  </div>
                </div>

                {canAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={e => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={e => {
                          e.stopPropagation();
                          router.push(`/sales/landing-pages/${page.id}`);
                        }}
                      >
                        Visualizar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={e => {
                          e.stopPropagation();
                          router.push(`/sales/landing-pages/${page.id}/edit`);
                        }}
                      >
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-rose-600 dark:text-rose-400 focus:text-rose-600 dark:focus:text-rose-400"
                        onClick={e => {
                          e.stopPropagation();
                          setDeleteTarget(page);
                        }}
                      >
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Badge
                  variant="secondary"
                  className={cn('text-xs', STATUS_COLORS[page.status])}
                >
                  {LANDING_PAGE_STATUS_LABELS[page.status]}
                </Badge>
                <Badge
                  variant="secondary"
                  className="text-xs bg-slate-100 text-slate-600 dark:bg-white/5 dark:text-slate-400"
                >
                  <Layout className="h-3 w-3 mr-1" />
                  {LANDING_PAGE_TEMPLATE_LABELS[page.template]}
                </Badge>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5" />
                  <span>
                    {page.viewCount}{' '}
                    {page.viewCount === 1 ? 'visualização' : 'visualizações'}
                  </span>
                </div>
                {page.formName && (
                  <div className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" />
                    <span className="truncate">{page.formName}</span>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Modal */}
      <VerifyActionPinModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={handleDelete}
        title="Confirmar Exclusão"
        description={`Digite seu PIN de ação para excluir a página "${deleteTarget?.title}".`}
      />

      {/* Create Wizard */}
      <CreateLandingPageWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
  );
}
