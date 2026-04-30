import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Label } from './label';
import { Switch } from './switch';

function CheckedRender() {
  const [checked, setChecked] = useState(true);
  return (
    <Switch
      checked={checked}
      onCheckedChange={setChecked}
      aria-label="Notificações ativadas"
    />
  );
}

function InFormRender() {
  const [marketing, setMarketing] = useState(false);
  const [updates, setUpdates] = useState(true);

  return (
    <div className="w-96 space-y-4 rounded-lg border p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Label htmlFor="switch-marketing">E-mails de marketing</Label>
          <p className="text-sm text-muted-foreground">
            Receba novidades, ofertas e dicas da plataforma.
          </p>
        </div>
        <Switch
          id="switch-marketing"
          checked={marketing}
          onCheckedChange={setMarketing}
        />
      </div>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Label htmlFor="switch-updates">Atualizações de segurança</Label>
          <p className="text-sm text-muted-foreground">
            Avisos críticos sobre sua conta e acessos.
          </p>
        </div>
        <Switch
          id="switch-updates"
          checked={updates}
          onCheckedChange={setUpdates}
        />
      </div>
    </div>
  );
}

const meta = {
  title: 'UI/Switch',
  component: Switch,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    checked: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { 'aria-label': 'Ativar opção' },
};

export const Checked: Story = {
  render: () => <CheckedRender />,
};

export const Disabled: Story = {
  args: { disabled: true, 'aria-label': 'Opção bloqueada' },
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Switch id="switch-notifications" />
      <Label htmlFor="switch-notifications">Receber notificações</Label>
    </div>
  ),
};

export const InForm: Story = {
  render: () => <InFormRender />,
};
