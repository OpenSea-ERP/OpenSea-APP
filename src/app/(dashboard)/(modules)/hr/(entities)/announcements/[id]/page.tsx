/**
 * HR Announcement Detail Page
 * Detalhes do comunicado
 */

'use client';

import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { InfoField } from '@/components/shared/info-field';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { HR_PERMISSIONS } from '@/app/(dashboard)/(modules)/hr/_shared/constants/hr-permissions';
import { usePermissions } from '@/hooks/use-permissions';
import { portalService } from '@/services/hr';
import type { CompanyAnnouncement, AnnouncementPriority } from '@/types/hr';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  Bell,
  Calendar,
  Clock,
  Edit,
  Info,
  Megaphone,
  Trash,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

const PRIORITY_CONFIG: Record<
  AnnouncementPriority,
  {
    label: string;
    icon: LucideIcon;
    badgeClass: string;
    gradient: string;
  }
> = {
  URGENT: {
    label: 'Urgente',
    icon: AlertTriangle,
    badgeClass:
      'bg-rose-50 text-rose-700 dark:bg-rose-500/8 dark:text-rose-300',
    gradient: 'from-rose-500 to-rose-600',
  },
  IMPORTANT: {
    label: 'Importante',
    icon: Info,
    badgeClass:
      'bg-amber-50 text-amber-700 dark:bg-amber-500/8 dark:text-amber-300',
    gradient: 'from-amber-500 to-amber-600',
  },
  NORMAL: {
    label: 'Normal',
    icon: Bell,
    badgeClass:
      'bg-blue-50 text-blue-700 dark:bg-blue-500/8 dark:text-blue-300',
    gradient: 'from-violet-500 to-violet-600',
  },
};

export default function AnnouncementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const announcementId = params.id as string;

  const canEdit = hasPermission(HR_PERMISSIONS.EMPLOYEES.MANAGE);
  const canDelete = hasPermission(HR_PERMISSIONS.EMPLOYEES.MANAGE);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

  const { data: announcementsData, isLoading } = useQuery({
    queryKey: ['hr-announcements'],
    queryFn: async () => {
      const response = await portalService.listAnnouncements({ perPage: 100 });
      return response.announcements;
    },
  });

  const announcement = announcementsData?.find(
    (a: CompanyAnnouncement) => a.id === announcementId
  );

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const deleteMutation = useMutation({
    mutationFn: (id: string) => portalService.deleteAnnouncement(id),
    onSuccess: () => {
      toast.success('Comunicado excluído com sucesso');
      queryClient.invalidateQueries({ queryKey: ['hr-announcements'] });
      router.push('/hr/announcements');
    },
    onError: () => {
      toast.error('Erro ao excluir comunicado');
    },
  });

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Comunicados', href: '/hr/announcements' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" size="md" />
        </PageBody>
      </PageLayout>
    );
  }

  if (!announcement) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'RH', href: '/hr' },
              { label: 'Comunicados', href: '/hr/announcements' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <Card className="bg-white/5 p-12 text-center">
            <Megaphone className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">
              Comunicado não encontrado
            </h2>
            <Button onClick={() => router.push('/hr/announcements')}>
              Voltar para Comunicados
            </Button>
          </Card>
        </PageBody>
      </PageLayout>
    );
  }

  const config = PRIORITY_CONFIG[announcement.priority];

  // ============================================================================
  // RENDER
  // ============================================================================

  const actionButtons = [];
  if (canDelete) {
    actionButtons.push({
      id: 'delete',
      title: 'Excluir',
      icon: Trash,
      onClick: () => setIsDeleteDialogOpen(true),
      variant: 'outline' as const,
    });
  }
  if (canEdit) {
    actionButtons.push({
      id: 'edit',
      title: 'Editar',
      icon: Edit,
      onClick: () => router.push(`/hr/announcements/${announcementId}/edit`),
    });
  }

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'RH', href: '/hr' },
            { label: 'Comunicados', href: '/hr/announcements' },
            { label: announcement.title },
          ]}
          buttons={actionButtons}
        />

        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-xl shrink-0 bg-linear-to-br ${config.gradient}`}
            >
              <Megaphone className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">
                  {announcement.title}
                </h1>
                <Badge
                  variant="outline"
                  className={`border-0 gap-1 ${config.badgeClass}`}
                >
                  {config.label}
                </Badge>
                {!announcement.isActive && (
                  <Badge variant="secondary">Inativo</Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                {announcement.authorEmployee && (
                  <span>por {announcement.authorEmployee.fullName}</span>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2 shrink-0 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4 text-violet-500" />
                <span>
                  {new Date(announcement.publishedAt).toLocaleDateString(
                    'pt-BR'
                  )}
                </span>
              </div>
              {announcement.expiresAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4 text-amber-500" />
                  <span>
                    Expira em{' '}
                    {new Date(announcement.expiresAt).toLocaleDateString(
                      'pt-BR'
                    )}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </PageHeader>

      <PageBody className="space-y-6">
        {/* Detalhes */}
        <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4">
            <Megaphone className="h-5 w-5" />
            Detalhes do Comunicado
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <InfoField
              label="Título"
              value={announcement.title}
              showCopyButton
            />
            <InfoField
              label="Prioridade"
              value={config.label}
              badge={
                <Badge
                  variant="outline"
                  className={`border-0 gap-1 ${config.badgeClass}`}
                >
                  {config.label}
                </Badge>
              }
            />
            <InfoField
              label="Status"
              value={announcement.isActive ? 'Ativo' : 'Inativo'}
              badge={
                <Badge
                  variant={announcement.isActive ? 'success' : 'secondary'}
                >
                  {announcement.isActive ? 'Ativo' : 'Inativo'}
                </Badge>
              }
            />
            {announcement.authorEmployee && (
              <InfoField
                label="Autor"
                value={announcement.authorEmployee.fullName}
              />
            )}
            <InfoField
              label="Publicado em"
              value={new Date(announcement.publishedAt).toLocaleDateString(
                'pt-BR',
                { day: '2-digit', month: 'long', year: 'numeric' }
              )}
            />
            {announcement.expiresAt && (
              <InfoField
                label="Expira em"
                value={new Date(announcement.expiresAt).toLocaleDateString(
                  'pt-BR',
                  { day: '2-digit', month: 'long', year: 'numeric' }
                )}
              />
            )}
          </div>
        </Card>

        {/* Conteúdo */}
        <Card className="p-4 sm:p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <h3 className="text-lg items-center flex uppercase font-semibold gap-2 mb-4">
            <Info className="h-5 w-5" />
            Conteúdo
          </h3>
          <div className="p-4 rounded-lg border bg-muted/30 whitespace-pre-wrap text-sm">
            {announcement.content}
          </div>
        </Card>
      </PageBody>

      <VerifyActionPinModal
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onSuccess={() => deleteMutation.mutate(announcementId)}
        title="Excluir Comunicado"
        description={`Digite seu PIN de ação para excluir o comunicado "${announcement.title}". Esta ação não pode ser desfeita.`}
      />
    </PageLayout>
  );
}
