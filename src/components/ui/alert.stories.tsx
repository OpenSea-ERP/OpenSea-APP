import type { Meta, StoryObj } from '@storybook/react';
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './alert';

const meta = {
  title: 'UI/Alert',
  component: Alert,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive'],
    },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Alert className="w-[420px]">
      <Info aria-hidden="true" />
      <AlertTitle>Atualização disponível</AlertTitle>
      <AlertDescription>
        Há uma nova versão pronta para ser instalada.
      </AlertDescription>
    </Alert>
  ),
};

export const Destructive: Story = {
  render: () => (
    <Alert variant="destructive" className="w-[420px]">
      <AlertCircle aria-hidden="true" />
      <AlertTitle>Falha ao salvar alterações</AlertTitle>
      <AlertDescription>
        Verifique sua conexão e tente novamente.
      </AlertDescription>
    </Alert>
  ),
};

// API note: alert.tsx cva expõe somente { default, destructive }.
// Variantes "info/warning/success" são compostas via classes Tailwind
// no consumidor (mantendo ícone + texto para passar a11y wcag2aa).
export const AllVariants: Story = {
  render: () => (
    <div className="flex w-[480px] flex-col gap-3">
      <Alert>
        <Info aria-hidden="true" />
        <AlertTitle>Informação</AlertTitle>
        <AlertDescription>
          Variante padrão para mensagens neutras.
        </AlertDescription>
      </Alert>
      <Alert variant="destructive">
        <AlertCircle aria-hidden="true" />
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>
          Variante destructive para erros e ações irreversíveis.
        </AlertDescription>
      </Alert>
      <Alert className="border-amber-500/40 text-amber-700 dark:text-amber-400 [&>svg]:text-current">
        <TriangleAlert aria-hidden="true" />
        <AlertTitle>Atenção</AlertTitle>
        <AlertDescription>
          Variante de aviso composta via classes utilitárias.
        </AlertDescription>
      </Alert>
      <Alert className="border-emerald-500/40 text-emerald-700 dark:text-emerald-400 [&>svg]:text-current">
        <CheckCircle2 aria-hidden="true" />
        <AlertTitle>Sucesso</AlertTitle>
        <AlertDescription>
          Variante de sucesso composta via classes utilitárias.
        </AlertDescription>
      </Alert>
    </div>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <Alert className="w-[420px]">
      <Info aria-hidden="true" />
      <AlertTitle>Backup concluído</AlertTitle>
      <AlertDescription>
        Seus dados foram copiados com sucesso para o armazenamento seguro.
      </AlertDescription>
    </Alert>
  ),
};

export const WithTitle: Story = {
  render: () => (
    <Alert className="w-[420px]">
      <Info aria-hidden="true" />
      <AlertTitle>Manutenção programada</AlertTitle>
      <AlertDescription>
        O sistema ficará indisponível das 02:00 às 04:00.
      </AlertDescription>
    </Alert>
  ),
};

export const TitleOnly: Story = {
  render: () => (
    <Alert className="w-[420px]">
      <Info aria-hidden="true" />
      <AlertTitle>Alteração salva automaticamente</AlertTitle>
    </Alert>
  ),
};

export const DescriptionOnly: Story = {
  render: () => (
    <Alert className="w-[420px]">
      <Info aria-hidden="true" />
      <AlertDescription>
        Suas preferências foram aplicadas a este dispositivo.
      </AlertDescription>
    </Alert>
  ),
};
