'use client';

import { useState } from 'react';
import { PageActionBar } from '@/components/layout/page-action-bar';
import { PageBody } from '@/components/layout/page-body';
import { PageLayout } from '@/components/layout/page-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { GridLoading } from '@/components/shared/grid-loading';
import { GridError } from '@/components/shared/grid-error';
import {
  usePosTerminals,
  useCreatePosTerminal,
  useDeletePosTerminal,
} from '@/hooks/sales';
import type { PosTerminalMode, PosTerminal } from '@/types/sales';
import {
  Plus,
  Monitor,
  Smartphone,
  TabletSmartphone,
  Globe,
  MoreVertical,
  Pencil,
  Trash2,
  Power,
  PowerOff,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

const MODE_LABELS: Record<
  PosTerminalMode,
  { label: string; icon: React.ElementType }
> = {
  FAST_CHECKOUT: { label: 'Caixa Rapido', icon: Monitor },
  CONSULTIVE: { label: 'Consultivo', icon: TabletSmartphone },
  SELF_SERVICE: { label: 'Autoatendimento', icon: Smartphone },
  EXTERNAL: { label: 'Venda Externa', icon: Globe },
};

export default function PosTerminalsPage() {
  const { data, isLoading, error } = usePosTerminals();
  const createTerminal = useCreatePosTerminal();
  const deleteTerminal = useDeletePosTerminal();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTerminal, setNewTerminal] = useState({
    name: '',
    deviceId: '',
    mode: 'FAST_CHECKOUT' as PosTerminalMode,
    warehouseId: '',
  });

  const handleCreate = async () => {
    if (!newTerminal.name || !newTerminal.deviceId || !newTerminal.warehouseId)
      return;

    await createTerminal.mutateAsync({
      name: newTerminal.name,
      deviceId: newTerminal.deviceId,
      mode: newTerminal.mode,
      warehouseId: newTerminal.warehouseId,
    });

    setIsCreateOpen(false);
    setNewTerminal({
      name: '',
      deviceId: '',
      mode: 'FAST_CHECKOUT',
      warehouseId: '',
    });
  };

  const handleDelete = async (terminal: PosTerminal) => {
    if (confirm(`Deseja excluir o terminal "${terminal.name}"?`)) {
      await deleteTerminal.mutateAsync(terminal.id);
    }
  };

  return (
    <PageLayout>
      <PageActionBar
        breadcrumbs={[
          { label: 'Vendas', href: '/sales' },
          { label: 'PDV', href: '/sales/pos' },
          { label: 'Terminais' },
        ]}
        actions={
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Terminal
          </Button>
        }
      />

      <PageBody>
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Gerenciar Terminais</h1>
          <p className="text-muted-foreground mt-1">
            Configure os terminais de venda do PDV
          </p>
        </div>

        {isLoading ? (
          <GridLoading />
        ) : error ? (
          <GridError />
        ) : (
          <div className="space-y-3">
            {data?.data.map(terminal => {
              const modeConfig = MODE_LABELS[terminal.mode];
              const ModeIcon = modeConfig.icon;

              return (
                <Card
                  key={terminal.id}
                  className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800/60 border border-border"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <ModeIcon className="h-5 w-5 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{terminal.name}</h3>
                      <Badge
                        variant={terminal.isActive ? 'default' : 'secondary'}
                      >
                        {terminal.isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {modeConfig.label} | ID: {terminal.deviceId}
                    </p>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        {terminal.isActive ? (
                          <>
                            <PowerOff className="mr-2 h-4 w-4" />
                            Desativar
                          </>
                        ) : (
                          <>
                            <Power className="mr-2 h-4 w-4" />
                            Ativar
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-rose-500 focus:text-rose-500"
                        onClick={() => handleDelete(terminal)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </Card>
              );
            })}

            {data?.data.length === 0 && (
              <Card className="flex flex-col items-center justify-center p-12 border-dashed">
                <Monitor className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="font-semibold text-lg mb-1">
                  Nenhum terminal cadastrado
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Crie seu primeiro terminal para comecar
                </p>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Terminal
                </Button>
              </Card>
            )}
          </div>
        )}

        {/* Create Terminal Dialog */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Terminal</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome do Terminal</Label>
                <Input
                  placeholder="Ex: Caixa 01, Tablet Vendas"
                  value={newTerminal.name}
                  onChange={e =>
                    setNewTerminal(prev => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>ID do Dispositivo</Label>
                <Input
                  placeholder="Identificador unico do dispositivo"
                  value={newTerminal.deviceId}
                  onChange={e =>
                    setNewTerminal(prev => ({
                      ...prev,
                      deviceId: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Modo de Operacao</Label>
                <Select
                  value={newTerminal.mode}
                  onValueChange={value =>
                    setNewTerminal(prev => ({
                      ...prev,
                      mode: value as PosTerminalMode,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FAST_CHECKOUT">Caixa Rapido</SelectItem>
                    <SelectItem value="CONSULTIVE">Consultivo</SelectItem>
                    <SelectItem value="SELF_SERVICE">
                      Autoatendimento
                    </SelectItem>
                    <SelectItem value="EXTERNAL">Venda Externa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>ID do Armazem</Label>
                <Input
                  placeholder="UUID do armazem padrao"
                  value={newTerminal.warehouseId}
                  onChange={e =>
                    setNewTerminal(prev => ({
                      ...prev,
                      warehouseId: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCreate}
                disabled={
                  createTerminal.isPending ||
                  !newTerminal.name ||
                  !newTerminal.deviceId ||
                  !newTerminal.warehouseId
                }
              >
                {createTerminal.isPending ? 'Criando...' : 'Criar Terminal'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageBody>
    </PageLayout>
  );
}
