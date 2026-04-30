import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './sheet';

const meta = {
  title: 'UI/Sheet',
  component: Sheet,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="flex min-h-[400px] items-center justify-center p-8">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">Abrir à direita</Button>
        </SheetTrigger>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Filtros</SheetTitle>
            <SheetDescription>
              Refine a listagem de produtos por categoria, status e estoque.
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 px-4 text-sm">Conteúdo dos filtros aqui.</div>
        </SheetContent>
      </Sheet>
    </div>
  ),
};

export const Left: Story = {
  render: () => (
    <div className="flex min-h-[400px] items-center justify-center p-8">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">Abrir à esquerda</Button>
        </SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Navegação</SheetTitle>
            <SheetDescription>
              Menu lateral com seções do módulo.
            </SheetDescription>
          </SheetHeader>
          <nav className="flex-1 px-4 text-sm">
            <ul className="space-y-2">
              <li>Dashboard</li>
              <li>Produtos</li>
              <li>Categorias</li>
              <li>Movimentações</li>
            </ul>
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  ),
};

export const Top: Story = {
  render: () => (
    <div className="flex min-h-[400px] items-center justify-center p-8">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">Abrir no topo</Button>
        </SheetTrigger>
        <SheetContent side="top">
          <SheetHeader>
            <SheetTitle>Notificações</SheetTitle>
            <SheetDescription>
              Avisos e alertas recentes da sua conta.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-4 text-sm">
            Nenhuma notificação no momento.
          </div>
        </SheetContent>
      </Sheet>
    </div>
  ),
};

export const Bottom: Story = {
  render: () => (
    <div className="flex min-h-[400px] items-center justify-center p-8">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline">Abrir embaixo</Button>
        </SheetTrigger>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Ações rápidas</SheetTitle>
            <SheetDescription>
              Selecione uma operação para continuar.
            </SheetDescription>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-2 px-4 pb-4">
            <Button variant="outline">Visualizar</Button>
            <Button variant="outline">Editar</Button>
            <Button variant="outline">Duplicar</Button>
            <Button variant="outline">Compartilhar</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  ),
};

export const WithFooter: Story = {
  render: () => (
    <div className="flex min-h-[400px] items-center justify-center p-8">
      <Sheet>
        <SheetTrigger asChild>
          <Button>Editar perfil</Button>
        </SheetTrigger>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Editar perfil</SheetTitle>
            <SheetDescription>
              Atualize suas informações. Salve quando terminar.
            </SheetDescription>
          </SheetHeader>
          <div className="grid flex-1 gap-4 px-4">
            <div className="grid gap-2">
              <Label htmlFor="sheet-name">Nome</Label>
              <Input id="sheet-name" defaultValue="João da Silva" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sheet-email">E-mail</Label>
              <Input
                id="sheet-email"
                type="email"
                defaultValue="joao@empresa.com"
              />
            </div>
          </div>
          <SheetFooter>
            <Button>Salvar alterações</Button>
            <SheetClose asChild>
              <Button variant="outline">Cancelar</Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  ),
};
