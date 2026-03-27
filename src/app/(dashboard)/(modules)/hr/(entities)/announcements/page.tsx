/**
 * HR Announcements Management Page
 * Gestao de comunicados da empresa (acesso de RH)
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
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { HR_PERMISSIONS } from '@/app/(dashboard)/(modules)/hr/_shared/constants/hr-permissions';
import { usePermissions } from '@/hooks/use-permissions';
import { portalService } from '@/services/hr';
import type {
  CompanyAnnouncement,
  AnnouncementPriority,
  CreateAnnouncementData,
  UpdateAnnouncementData,
} from '@/types/hr';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Bell,
  Edit2,
  Info,
  Loader2,
  Megaphone,
  Plus,
  Trash2,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

// ============================================================================
// CONSTANTS
// ============================================================================

const PRIORITY_CONFIG: Record<
  AnnouncementPriority,
  { label: string; icon: React.ReactNode; badgeClass: string }
> = {
  URGENT: {
    label: 'Urgente',
    icon: <AlertTriangle className="h-3 w-3" />,
    badgeClass: 'bg-rose-50 text-rose-700 dark:bg-rose-500/8 dark:text-rose-300',
  },
  IMPORTANT: {
    label: 'Importante',
    icon: <Info className="h-3 w-3" />,
    badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-500/8 dark:text-amber-300',
  },
  NORMAL: {
    label: 'Normal',
    icon: <Bell className="h-3 w-3" />,
    badgeClass: 'bg-gray-50 text-gray-700 dark:bg-white/8 dark:text-gray-300',
  },
};

// ============================================================================
// PAGE
// ============================================================================

export default function AnnouncementsPage() {
  const { hasPermission } = usePermissions();
  const queryClient = useQueryClient();

  const canCreate = hasPermission(HR_PERMISSIONS.EMPLOYEES.MANAGE);
  const canDelete = hasPermission(HR_PERMISSIONS.EMPLOYEES.MANAGE);

  // Modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<CompanyAnnouncement | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CompanyAnnouncement | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<AnnouncementPriority>('NORMAL');
  const [expiresAt, setExpiresAt] = useState('');

  // Query
  const {
    data: announcementsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['hr-announcements'],
    queryFn: async () => {
      const response = await portalService.listAnnouncements({ perPage: 100 });
      return response.announcements;
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateAnnouncementData) =>
      portalService.createAnnouncement(data),
    onSuccess: () => {
      toast.success('Comunicado criado com sucesso');
      queryClient.invalidateQueries({ queryKey: ['hr-announcements'] });
      handleCloseForm();
    },
    onError: () => {
      toast.error('Erro ao criar comunicado');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateAnnouncementData;
    }) => portalService.updateAnnouncement(id, data),
    onSuccess: () => {
      toast.success('Comunicado atualizado');
      queryClient.invalidateQueries({ queryKey: ['hr-announcements'] });
      handleCloseForm();
    },
    onError: () => {
      toast.error('Erro ao atualizar comunicado');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => portalService.deleteAnnouncement(id),
    onSuccess: () => {
      toast.success('Comunicado removido');
      queryClient.invalidateQueries({ queryKey: ['hr-announcements'] });
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error('Erro ao remover comunicado');
    },
  });

  const handleCloseForm = useCallback(() => {
    setIsCreateOpen(false);
    setEditingAnnouncement(null);
    setTitle('');
    setContent('');
    setPriority('NORMAL');
    setExpiresAt('');
  }, []);

  const handleEdit = useCallback((announcement: CompanyAnnouncement) => {
    setEditingAnnouncement(announcement);
    setTitle(announcement.title);
    setContent(announcement.content);
    setPriority(announcement.priority);
    setExpiresAt(announcement.expiresAt ? announcement.expiresAt.split('T')[0] : '');
    setIsCreateOpen(true);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!title.trim() || !content.trim()) {
      toast.error('Titulo e conteudo sao obrigatorios');
      return;
    }

    if (editingAnnouncement) {
      updateMutation.mutate({
        id: editingAnnouncement.id,
        data: {
          title: title.trim(),
          content: content.trim(),
          priority,
          expiresAt: expiresAt || null,
        },
      });
    } else {
      createMutation.mutate({
        title: title.trim(),
        content: content.trim(),
        priority,
        expiresAt: expiresAt || undefined,
      });
    }
  }, [title, content, priority, expiresAt, editingAnnouncement, createMutation, updateMutation]);

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Recursos Humanos', href: '/hr' },
            { label: 'Comunicados' },
          ]}
        />
      </PageHeader>

      <PageBody>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold">Comunicados</h2>
            <p className="text-sm text-muted-foreground">
              Gerencie comunicados e avisos para os colaboradores
            </p>
          </div>
          {canCreate && (
            <Button
              size="sm"
              className="h-9 px-2.5"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Novo Comunicado
            </Button>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <GridLoading count={4} layout="list" size="md" />
        ) : error ? (
          <GridError message="Erro ao carregar comunicados" />
        ) : !announcementsData || announcementsData.length === 0 ? (
          <Card className="p-12 text-center bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
            <Megaphone className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium mb-1">Nenhum comunicado</p>
            <p className="text-sm text-muted-foreground mb-4">
              Crie o primeiro comunicado para os colaboradores
            </p>
            {canCreate && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsCreateOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Criar Comunicado
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-3">
            {announcementsData.map((announcement: CompanyAnnouncement) => {
              const config = PRIORITY_CONFIG[announcement.priority];
              return (
                <Card
                  key={announcement.id}
                  className="p-4 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="font-semibold text-sm">
                          {announcement.title}
                        </h4>
                        <Badge
                          variant="outline"
                          className={`text-xs border-0 gap-1 ${config.badgeClass}`}
                        >
                          {config.icon}
                          {config.label}
                        </Badge>
                        {!announcement.isActive && (
                          <Badge variant="secondary" className="text-xs">
                            Inativo
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                        {announcement.content}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>
                          Publicado em{' '}
                          {new Date(announcement.publishedAt).toLocaleDateString(
                            'pt-BR'
                          )}
                        </span>
                        {announcement.expiresAt && (
                          <span>
                            Expira em{' '}
                            {new Date(
                              announcement.expiresAt
                            ).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                        {announcement.authorEmployee && (
                          <span>
                            por {announcement.authorEmployee.fullName}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {canCreate && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => handleEdit(announcement)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                          onClick={() => setDeleteTarget(announcement)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={v => !v && handleCloseForm()}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingAnnouncement
                  ? 'Editar Comunicado'
                  : 'Novo Comunicado'}
              </DialogTitle>
              <DialogDescription>
                {editingAnnouncement
                  ? 'Atualize as informacoes do comunicado'
                  : 'Crie um comunicado para os colaboradores'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Titulo</Label>
                <Input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Titulo do comunicado"
                />
              </div>

              <div className="space-y-2">
                <Label>Conteudo</Label>
                <Textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Conteudo do comunicado..."
                  rows={5}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select
                    value={priority}
                    onValueChange={v =>
                      setPriority(v as AnnouncementPriority)
                    }
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
                  <Label>Data de Expiracao</Label>
                  <Input
                    type="date"
                    value={expiresAt}
                    onChange={e => setExpiresAt(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleCloseForm}>
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={
                  createMutation.isPending || updateMutation.isPending
                }
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                )}
                {editingAnnouncement ? 'Salvar' : 'Publicar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <VerifyActionPinModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onSuccess={() => {
            if (deleteTarget) {
              deleteMutation.mutate(deleteTarget.id);
            }
          }}
          title="Confirmar Exclusao"
          description={`Digite seu PIN de acao para excluir o comunicado "${deleteTarget?.title}".`}
        />
      </PageBody>
    </PageLayout>
  );
}
