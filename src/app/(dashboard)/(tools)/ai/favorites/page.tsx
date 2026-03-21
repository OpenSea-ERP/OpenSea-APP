'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PageActionBar } from '@/components/layout/page-action-bar';
import { aiFavoritesService, aiChatService } from '@/services/ai';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  Star,
  Play,
  Trash2,
  Plus,
  Loader2,
  Hash,
} from 'lucide-react';
import type { AiFavoriteQuery, AiFavoriteCategory } from '@/types/ai';

const CATEGORY_LABELS: Record<AiFavoriteCategory, string> = {
  SALES: 'Vendas',
  STOCK: 'Estoque',
  FINANCE: 'Financeiro',
  HR: 'RH',
  CRM: 'CRM',
  GENERAL: 'Geral',
};

export default function AiFavoritesPage() {
  const queryClient = useQueryClient();
  const [newQuery, setNewQuery] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['ai', 'favorites'],
    queryFn: async () => {
      const response = await aiFavoritesService.list({ limit: 100 });
      return response.favorites;
    },
  });

  const createMutation = useMutation({
    mutationFn: aiFavoritesService.create,
    onSuccess: () => {
      setNewQuery('');
      setShowCreate(false);
      toast.success('Consulta favorita salva!');
      queryClient.invalidateQueries({ queryKey: ['ai', 'favorites'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: aiFavoritesService.delete,
    onSuccess: () => {
      toast.success('Favorito removido.');
      queryClient.invalidateQueries({ queryKey: ['ai', 'favorites'] });
    },
  });

  const runMutation = useMutation({
    mutationFn: (query: string) =>
      aiChatService.sendMessage({ content: query }),
    onSuccess: () => {
      toast.success('Consulta enviada ao assistente!');
    },
  });

  const favorites = data ?? [];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <PageActionBar
        breadcrumbs={[
          { label: 'Ferramentas' },
          { label: 'Assistente IA', href: '/ai' },
          { label: 'Consultas Favoritas' },
        ]}
        actions={
          <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova consulta
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-6">
        {/* Create form */}
        {showCreate && (
          <Card className="p-4 mb-6">
            <h3 className="font-medium text-sm mb-3">Salvar nova consulta favorita</h3>
            <div className="flex gap-2">
              <Input
                value={newQuery}
                onChange={(e) => setNewQuery(e.target.value)}
                placeholder="Ex: Qual o faturamento do mes?"
                className="flex-1"
              />
              <Button
                onClick={() => {
                  if (newQuery.trim()) {
                    createMutation.mutate({ query: newQuery.trim() });
                  }
                }}
                disabled={!newQuery.trim() || createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Salvar'
                )}
              </Button>
            </div>
          </Card>
        )}

        {/* Favorites list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Star className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-1">Nenhuma consulta salva</h3>
            <p className="text-sm text-muted-foreground">
              Salve suas consultas frequentes para reutiliza-las rapidamente.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {favorites.map((fav: AiFavoriteQuery) => (
              <Card key={fav.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Star className="h-4 w-4 text-amber-500 shrink-0" />
                      <span className="font-medium text-sm truncate">
                        {fav.query}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {CATEGORY_LABELS[fav.category]}
                      </Badge>
                      {fav.shortcut && (
                        <span className="flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          {fav.shortcut}
                        </span>
                      )}
                      <span>
                        {fav.usageCount} uso{fav.usageCount !== 1 ? 's' : ''}
                      </span>
                      {fav.lastUsedAt && (
                        <span>
                          Ultimo uso:{' '}
                          {formatDistanceToNow(new Date(fav.lastUsedAt), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => runMutation.mutate(fav.query)}
                      disabled={runMutation.isPending}
                      title="Executar consulta"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteMutation.mutate(fav.id)}
                      disabled={deleteMutation.isPending}
                      title="Remover favorito"
                      className="text-rose-500 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
