import type { Meta, StoryObj } from '@storybook/react';
import { Settings2 } from 'lucide-react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from './popover';

const meta = {
  title: 'UI/Popover',
  component: Popover,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Abrir popover</Button>
      </PopoverTrigger>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>Sobre este registro</PopoverTitle>
          <PopoverDescription>
            Clique fora ou pressione Esc para fechar.
          </PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  ),
};

export const WithForm: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Popover com formulário curto. Inputs sempre com `<Label htmlFor>` ligado ao `id` (regra de a11y do projeto).',
      },
    },
  },
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Renomear</Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <form
          className="flex flex-col gap-3"
          onSubmit={event => event.preventDefault()}
        >
          <PopoverHeader>
            <PopoverTitle>Renomear registro</PopoverTitle>
            <PopoverDescription>
              O novo nome ficará visível para toda a equipe.
            </PopoverDescription>
          </PopoverHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="popover-rename">Nome</Label>
            <Input
              id="popover-rename"
              placeholder="Digite o novo nome"
              defaultValue="Produto exemplo"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" size="sm">
              Cancelar
            </Button>
            <Button type="submit" size="sm">
              Salvar
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  ),
};

export const WithSizing: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Largura customizada via `className` no `PopoverContent` (default é `w-72`). Aqui usamos `w-96` para acomodar painel de configurações.',
      },
    },
  },
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          aria-label="Configurações da visão"
        >
          <Settings2 className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96">
        <PopoverHeader>
          <PopoverTitle>Configurações da visão</PopoverTitle>
          <PopoverDescription>
            Ajuste densidade, colunas visíveis e ordem padrão.
          </PopoverDescription>
        </PopoverHeader>
        <div className="mt-3 flex flex-col gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span>Densidade compacta</span>
            <Button variant="ghost" size="sm">
              Ativar
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <span>Mostrar colunas auxiliares</span>
            <Button variant="ghost" size="sm">
              Ocultar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
};
