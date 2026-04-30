import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from './drawer';
import { Input } from './input';
import { Label } from './label';

const meta = {
  title: 'UI/Drawer',
  component: Drawer,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="flex min-h-[400px] items-center justify-center p-8">
      <Drawer direction="right">
        <DrawerTrigger asChild>
          <Button variant="outline">Abrir drawer</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Detalhes do produto</DrawerTitle>
            <DrawerDescription>
              Visualize informações rápidas sem sair da listagem.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 text-sm">
            Conteúdo principal do drawer. Útil para visualizações rápidas e
            painéis laterais.
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Fechar</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  ),
};

export const Bottom: Story = {
  render: () => (
    <div className="flex min-h-[400px] items-center justify-center p-8">
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="outline">Abrir drawer (mobile)</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Ações rápidas</DrawerTitle>
            <DrawerDescription>
              Padrão típico em telas mobile. Arraste para baixo para fechar.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-4 text-sm">
            <ul className="space-y-2">
              <li>Visualizar detalhes</li>
              <li>Editar item</li>
              <li>Compartilhar</li>
              <li>Duplicar</li>
            </ul>
          </div>
          <DrawerFooter>
            <Button>Confirmar</Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  ),
};

export const WithForm: Story = {
  render: () => (
    <div className="flex min-h-[400px] items-center justify-center p-8">
      <Drawer direction="right">
        <DrawerTrigger asChild>
          <Button>Novo cliente</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Cadastrar cliente</DrawerTitle>
            <DrawerDescription>
              Preencha as informações básicas para criar o cadastro.
            </DrawerDescription>
          </DrawerHeader>
          <div className="grid gap-4 px-4">
            <div className="grid gap-2">
              <Label htmlFor="drawer-name">Nome completo</Label>
              <Input id="drawer-name" placeholder="João da Silva" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="drawer-email">E-mail</Label>
              <Input
                id="drawer-email"
                type="email"
                placeholder="joao@empresa.com"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="drawer-phone">Telefone</Label>
              <Input
                id="drawer-phone"
                type="tel"
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>
          <DrawerFooter>
            <Button>Salvar cliente</Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  ),
};

export const Scrollable: Story = {
  render: () => (
    <div className="flex min-h-[400px] items-center justify-center p-8">
      <Drawer direction="right">
        <DrawerTrigger asChild>
          <Button variant="outline">Abrir histórico</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Histórico de movimentações</DrawerTitle>
            <DrawerDescription>
              Lista completa de eventos. Role para ver mais.
            </DrawerDescription>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-4">
            <ul className="space-y-3 pb-4">
              {Array.from({ length: 30 }, (_, i) => (
                <li key={i} className="rounded-md border p-3 text-sm">
                  <div className="font-medium">Movimentação #{i + 1}</div>
                  <div className="text-muted-foreground">
                    Operação registrada em {String(i + 1).padStart(2, '0')}
                    /04/2026
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Fechar</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  ),
};
