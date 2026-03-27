'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmployeeSelector } from '@/components/shared/employee-selector';
import { portalService } from '@/services/hr';
import type { EmployeeKudos, KudosCategory, SendKudosData } from '@/types/hr';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Heart,
  Lightbulb,
  Loader2,
  Medal,
  Plus,
  Sparkles,
  Star,
  Trophy,
  Users,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

// ============================================================================
// CONSTANTS
// ============================================================================

const KUDOS_CATEGORY_CONFIG: Record<
  KudosCategory,
  { label: string; icon: React.ReactNode; color: string }
> = {
  TEAMWORK: {
    label: 'Trabalho em Equipe',
    icon: <Users className="h-3.5 w-3.5" />,
    color: 'bg-blue-50 text-blue-700 dark:bg-blue-500/8 dark:text-blue-300',
  },
  INNOVATION: {
    label: 'Inovacao',
    icon: <Lightbulb className="h-3.5 w-3.5" />,
    color: 'bg-amber-50 text-amber-700 dark:bg-amber-500/8 dark:text-amber-300',
  },
  LEADERSHIP: {
    label: 'Lideranca',
    icon: <Medal className="h-3.5 w-3.5" />,
    color: 'bg-violet-50 text-violet-700 dark:bg-violet-500/8 dark:text-violet-300',
  },
  EXCELLENCE: {
    label: 'Excelencia',
    icon: <Trophy className="h-3.5 w-3.5" />,
    color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/8 dark:text-emerald-300',
  },
  HELPFULNESS: {
    label: 'Colaboracao',
    icon: <Heart className="h-3.5 w-3.5" />,
    color: 'bg-pink-50 text-pink-700 dark:bg-pink-500/8 dark:text-pink-300',
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function KudosTab() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subTab, setSubTab] = useState<'received' | 'sent'>('received');

  // Form state
  const [toEmployeeId, setToEmployeeId] = useState('');
  const [category, setCategory] = useState<KudosCategory | ''>('');
  const [message, setMessage] = useState('');

  // Fetch kudos
  const { data: receivedData, isLoading: isLoadingReceived } = useQuery({
    queryKey: ['kudos-received'],
    queryFn: async () => {
      const response = await portalService.listReceivedKudos({ perPage: 50 });
      return response.kudos;
    },
    enabled: subTab === 'received',
  });

  const { data: sentData, isLoading: isLoadingSent } = useQuery({
    queryKey: ['kudos-sent'],
    queryFn: async () => {
      const response = await portalService.listSentKudos({ perPage: 50 });
      return response.kudos;
    },
    enabled: subTab === 'sent',
  });

  // Send mutation
  const sendMutation = useMutation({
    mutationFn: (data: SendKudosData) => portalService.sendKudos(data),
    onSuccess: () => {
      toast.success('Reconhecimento enviado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['kudos-received'] });
      queryClient.invalidateQueries({ queryKey: ['kudos-sent'] });
      queryClient.invalidateQueries({ queryKey: ['kudos-feed'] });
      handleCloseModal();
    },
    onError: () => {
      toast.error('Erro ao enviar reconhecimento');
    },
  });

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setToEmployeeId('');
    setCategory('');
    setMessage('');
  }, []);

  const handleSend = useCallback(() => {
    if (!toEmployeeId || !category || !message.trim()) return;
    sendMutation.mutate({
      toEmployeeId,
      message: message.trim(),
      category: category as KudosCategory,
      isPublic: true,
    });
  }, [toEmployeeId, category, message, sendMutation]);

  const isLoading = subTab === 'received' ? isLoadingReceived : isLoadingSent;
  const kudosList = subTab === 'received' ? receivedData : sentData;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Reconhecimentos</h3>
          <p className="text-sm text-muted-foreground">
            Envie e receba reconhecimentos dos colegas
          </p>
        </div>
        <Button
          size="sm"
          className="h-9 px-2.5"
          onClick={() => setIsModalOpen(true)}
        >
          <Sparkles className="h-4 w-4 mr-1.5" />
          Enviar Kudos
        </Button>
      </div>

      {/* Sub-tabs */}
      <Tabs
        value={subTab}
        onValueChange={v => setSubTab(v as 'received' | 'sent')}
      >
        <TabsList className="grid w-full grid-cols-2 h-10">
          <TabsTrigger value="received" className="gap-1.5">
            <Star className="h-4 w-4" />
            Recebidos
          </TabsTrigger>
          <TabsTrigger value="sent" className="gap-1.5">
            <Sparkles className="h-4 w-4" />
            Enviados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="mt-4">
          <KudosList
            kudos={kudosList || []}
            isLoading={isLoading}
            emptyMessage="Voce ainda nao recebeu reconhecimentos"
            direction="received"
          />
        </TabsContent>

        <TabsContent value="sent" className="mt-4">
          <KudosList
            kudos={kudosList || []}
            isLoading={isLoading}
            emptyMessage="Voce ainda nao enviou reconhecimentos"
            direction="sent"
          />
        </TabsContent>
      </Tabs>

      {/* Send Kudos Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar Reconhecimento</DialogTitle>
            <DialogDescription>
              Reconheca um colega de trabalho pelo seu otimo desempenho
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Colaborador</Label>
              <EmployeeSelector
                value={toEmployeeId}
                onChange={setToEmployeeId}
              />
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select
                value={category}
                onValueChange={v => setCategory(v as KudosCategory)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(KUDOS_CATEGORY_CONFIG).map(
                    ([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          {config.icon}
                          {config.label}
                        </div>
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Mensagem</Label>
              <Textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Escreva uma mensagem de reconhecimento..."
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {message.length}/500
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button
              onClick={handleSend}
              disabled={
                !toEmployeeId ||
                !category ||
                !message.trim() ||
                sendMutation.isPending
              }
            >
              {sendMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : (
                <Sparkles className="h-4 w-4 mr-1.5" />
              )}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================================
// KUDOS LIST
// ============================================================================

interface KudosListProps {
  kudos: EmployeeKudos[];
  isLoading: boolean;
  emptyMessage: string;
  direction: 'received' | 'sent';
}

function KudosList({ kudos, isLoading, emptyMessage, direction }: KudosListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <Card key={i} className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (kudos.length === 0) {
    return (
      <Card className="p-12 text-center bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
        <Star className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
        <p className="text-lg font-medium mb-1">Nenhum reconhecimento</p>
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {kudos.map((item: EmployeeKudos) => {
        const categoryConfig = KUDOS_CATEGORY_CONFIG[item.category];
        const person =
          direction === 'received' ? item.fromEmployee : item.toEmployee;

        return (
          <Card
            key={item.id}
            className="p-4 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 text-sm font-semibold shrink-0">
                {person?.fullName?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-sm">
                    {direction === 'received' ? 'De: ' : 'Para: '}
                    {person?.fullName || 'Desconhecido'}
                  </p>
                  <Badge
                    variant="outline"
                    className={`text-xs border-0 gap-1 ${categoryConfig.color}`}
                  >
                    {categoryConfig.icon}
                    {categoryConfig.label}
                  </Badge>
                </div>
                {person?.position?.name && (
                  <p className="text-xs text-muted-foreground">
                    {person.position.name}
                    {person.department?.name
                      ? ` - ${person.department.name}`
                      : ''}
                  </p>
                )}
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.message}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {new Date(item.createdAt).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
