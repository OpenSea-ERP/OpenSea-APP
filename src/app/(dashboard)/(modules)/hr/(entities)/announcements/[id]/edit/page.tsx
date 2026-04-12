/**
 * HR Announcement Edit Page
 * Edição de comunicado
 */

'use client';

import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { Badge } from '@/components/ui/badge';
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
import { logger } from '@/lib/logger';
import type { CompanyAnnouncement, AnnouncementPriority } from '@/types/hr';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Megaphone, Save, X } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { portalService } from '@/services/hr';

export default function AnnouncementEditPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const announcementId = params.id as string;

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<AnnouncementPriority>('NORMAL');
  const [expiresAt, setExpiresAt] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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

  // Sync form states
  useEffect(() => {
    if (announcement) {
      setTitle(announcement.title);
      setContent(announcement.content);
      setPriority(announcement.priority);
      setExpiresAt(
        announcement.expiresAt ? announcement.expiresAt.split('T')[0] : ''
      );
      setIsActive(announcement.isActive);
    }
  }, [announcement]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Título e conteúdo são obrigatórios');
      return;
    }

    setIsSaving(true);
    try {
      await portalService.updateAnnouncement(announcementId, {
        title: title.trim(),
        content: content.trim(),
        priority,
        expiresAt: expiresAt || null,
        isActive,
      });
      await queryClient.invalidateQueries({ queryKey: ['hr-announcements'] });
      toast.success('Comunicado atualizado com sucesso!');
      router.push(`/hr/announcements/${announcementId}`);
    } catch (error) {
      logger.error(
        'Erro ao salvar comunicado',
        error instanceof Error ? error : undefined
      );
      toast.error('Erro ao salvar comunicado');
    } finally {
      setIsSaving(false);
    }
  };

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

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'RH', href: '/hr' },
            { label: 'Comunicados', href: '/hr/announcements' },
            {
              label: announcement.title,
              href: `/hr/announcements/${announcementId}`,
            },
            { label: 'Editar' },
          ]}
          buttons={[
            {
              id: 'cancel',
              title: 'Cancelar',
              icon: X,
              onClick: () => router.push(`/hr/announcements/${announcementId}`),
              variant: 'outline',
              disabled: isSaving,
            },
            {
              id: 'save',
              title: 'Salvar',
              icon: Save,
              onClick: handleSave,
              disabled: isSaving,
            },
          ]}
        />

        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl shrink-0 bg-linear-to-br from-violet-500 to-violet-600">
              <Megaphone className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold tracking-tight">
                Editar Comunicado
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {announcement.title}
              </p>
            </div>
            <Badge variant={announcement.isActive ? 'success' : 'secondary'}>
              {announcement.isActive ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        </Card>
      </PageHeader>

      <PageBody className="space-y-6">
        <Card className="p-6 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <h3 className="text-lg font-semibold mb-4">Dados do Comunicado</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                placeholder="Título do comunicado"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Conteúdo *</Label>
              <textarea
                id="content"
                placeholder="Conteúdo do comunicado..."
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={6}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select
                  value={priority}
                  onValueChange={v => setPriority(v as AnnouncementPriority)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="IMPORTANT">Importante</SelectItem>
                    <SelectItem value="URGENT">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiresAt">Data de Expiração</Label>
                <Input
                  id="expiresAt"
                  type="date"
                  value={expiresAt}
                  onChange={e => setExpiresAt(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">Status</Label>
                <p className="text-sm text-muted-foreground">
                  {isActive ? 'Comunicado ativo' : 'Comunicado inativo'}
                </p>
              </div>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>
        </Card>
      </PageBody>
    </PageLayout>
  );
}
