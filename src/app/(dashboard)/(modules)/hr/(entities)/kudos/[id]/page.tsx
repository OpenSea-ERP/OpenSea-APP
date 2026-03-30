/**
 * Kudos Detail Page
 * Pagina de visualizacao de um reconhecimento individual
 */

'use client';

import { GridLoading } from '@/components/handlers/grid-loading';
import { GridError } from '@/components/handlers/grid-error';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { Card } from '@/components/ui/card';
import { portalService } from '@/services/hr';
import type { KudosCategory } from '@/types/hr';
import { useQuery } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import {
  Award,
  Calendar,
  Eye,
  EyeOff,
  Handshake,
  Lightbulb,
  Shield,
  Sparkles,
  Star,
  User,
} from 'lucide-react';
import { useParams } from 'next/navigation';

// ============================================================================
// CONSTANTS
// ============================================================================

const CATEGORY_CONFIG: Record<
  KudosCategory,
  {
    label: string;
    icon: LucideIcon;
    badgeClass: string;
    gradient: string;
    color: string;
  }
> = {
  TEAMWORK: {
    label: 'Trabalho em Equipe',
    icon: Handshake,
    badgeClass:
      'bg-blue-50 text-blue-700 dark:bg-blue-500/8 dark:text-blue-300',
    gradient: 'from-blue-500 to-blue-600',
    color: 'text-blue-500',
  },
  INNOVATION: {
    label: 'Inovação',
    icon: Lightbulb,
    badgeClass:
      'bg-amber-50 text-amber-700 dark:bg-amber-500/8 dark:text-amber-300',
    gradient: 'from-amber-500 to-amber-600',
    color: 'text-amber-500',
  },
  LEADERSHIP: {
    label: 'Liderança',
    icon: Shield,
    badgeClass:
      'bg-purple-50 text-purple-700 dark:bg-purple-500/8 dark:text-purple-300',
    gradient: 'from-purple-500 to-purple-600',
    color: 'text-purple-500',
  },
  EXCELLENCE: {
    label: 'Excelência',
    icon: Star,
    badgeClass:
      'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/8 dark:text-emerald-300',
    gradient: 'from-emerald-500 to-emerald-600',
    color: 'text-emerald-500',
  },
  HELPFULNESS: {
    label: 'Prestatividade',
    icon: Sparkles,
    badgeClass:
      'bg-pink-50 text-pink-700 dark:bg-pink-500/8 dark:text-pink-300',
    gradient: 'from-pink-500 to-pink-600',
    color: 'text-pink-500',
  },
};

// ============================================================================
// PAGE
// ============================================================================

export default function KudosDetailPage() {
  const params = useParams();
  const kudosId = params.id as string;

  // The backend doesn't have a GET /v1/hr/kudos/:id endpoint currently,
  // so we fetch from the feed and find by ID. This is a workaround until
  // a dedicated detail endpoint is added.
  const {
    data: kudos,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['hr-kudos-detail', kudosId],
    queryFn: async () => {
      // Try to find in the public feed (paginate through up to 5 pages)
      for (let page = 1; page <= 5; page++) {
        const response = await portalService.listKudosFeed({
          page,
          perPage: 100,
        });
        const found = response.kudos.find(k => k.id === kudosId);
        if (found) return found;
        if (page >= (response.meta?.totalPages ?? 1)) break;
      }
      // Also try sent and received
      const [sentRes, receivedRes] = await Promise.allSettled([
        portalService.listSentKudos({ page: 1, perPage: 100 }),
        portalService.listReceivedKudos({ page: 1, perPage: 100 }),
      ]);
      if (sentRes.status === 'fulfilled') {
        const found = sentRes.value.kudos.find(k => k.id === kudosId);
        if (found) return found;
      }
      if (receivedRes.status === 'fulfilled') {
        const found = receivedRes.value.kudos.find(k => k.id === kudosId);
        if (found) return found;
      }
      throw new Error('Reconhecimento não encontrado');
    },
    enabled: !!kudosId,
    staleTime: 60 * 1000,
  });

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Reconhecimento', href: '/hr/kudos' },
              { label: 'Carregando...' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridLoading count={1} layout="list" size="lg" gap="gap-4" />
        </PageBody>
      </PageLayout>
    );
  }

  if (error || !kudos) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Reconhecimento', href: '/hr/kudos' },
              { label: 'Erro' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Reconhecimento não encontrado"
            message="O reconhecimento solicitado não foi encontrado ou você não tem permissão para visualizá-lo."
            action={{
              label: 'Voltar ao Feed',
              onClick: () => window.history.back(),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  const config = CATEGORY_CONFIG[kudos.category];
  const CategoryIcon = config.icon;

  const senderName = kudos.fromEmployee?.fullName ?? 'Colaborador';
  const receiverName = kudos.toEmployee?.fullName ?? 'Colaborador';
  const senderPosition = kudos.fromEmployee?.position?.name;
  const receiverPosition = kudos.toEmployee?.position?.name;
  const senderDept = kudos.fromEmployee?.department?.name;
  const receiverDept = kudos.toEmployee?.department?.name;

  const formattedDate = new Date(kudos.createdAt).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const formattedTime = new Date(kudos.createdAt).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'RH', href: '/hr' },
            { label: 'Reconhecimento', href: '/hr/kudos' },
            { label: `De ${senderName} para ${receiverName}` },
          ]}
        />
      </PageHeader>

      <PageBody>
        {/* Identity Card */}
        <Card className="bg-white/5 p-6">
          <div className="flex items-start gap-5">
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-linear-to-br ${config.gradient} text-white`}
            >
              <CategoryIcon className="h-7 w-7" />
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-semibold text-foreground">
                Reconhecimento por {config.label}
              </h1>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  {formattedDate} as {formattedTime}
                </span>
                <span className="mx-1">-</span>
                {kudos.isPublic ? (
                  <span className="inline-flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    Público
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1">
                    <EyeOff className="h-3.5 w-3.5" />
                    Privado
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Participants */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sender */}
          <Card className="bg-white dark:bg-slate-800/60 border border-border p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-500/10">
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Enviado por
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {senderName}
                </p>
              </div>
            </div>
            {(senderPosition || senderDept) && (
              <p className="text-xs text-muted-foreground">
                {[senderPosition, senderDept].filter(Boolean).join(' - ')}
              </p>
            )}
          </Card>

          {/* Receiver */}
          <Card className="bg-white dark:bg-slate-800/60 border border-border p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/10">
                <Award className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Reconhecido
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {receiverName}
                </p>
              </div>
            </div>
            {(receiverPosition || receiverDept) && (
              <p className="text-xs text-muted-foreground">
                {[receiverPosition, receiverDept].filter(Boolean).join(' - ')}
              </p>
            )}
          </Card>
        </div>

        {/* Message */}
        <Card className="bg-white dark:bg-slate-800/60 border border-border p-5">
          <h2 className="text-sm font-medium text-muted-foreground mb-3">
            Mensagem
          </h2>
          <p className="text-foreground leading-relaxed whitespace-pre-wrap">
            {kudos.message}
          </p>
        </Card>

        {/* Category badge */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${config.badgeClass}`}
          >
            <CategoryIcon className="h-4 w-4" />
            {config.label}
          </span>
        </div>
      </PageBody>
    </PageLayout>
  );
}
