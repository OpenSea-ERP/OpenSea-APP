import type { Meta, StoryObj } from '@storybook/react';
import { Lock } from 'lucide-react';
import { useState } from 'react';
import { Label } from './label';
import { PasswordInput } from './password-input';
import { PasswordStrengthChecklist } from './password-strength-checklist';

// Project PasswordInput renders an `<input type="password">` with an internal
// eye/eye-off toggle button. The visibility state is owned by the component —
// there is no `defaultVisible`/`visible` prop. The "Visible" story below
// documents the toggle behavior; the eye icon is interactable in Storybook.

const meta = {
  title: 'UI/PasswordInput',
  component: PasswordInput,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof PasswordInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="w-80 space-y-2">
      <Label htmlFor="senha">Senha</Label>
      <PasswordInput
        id="senha"
        placeholder="Digite sua senha"
        autoComplete="current-password"
      />
    </div>
  ),
};

// The eye icon toggles visibility internally. Click it on the docs canvas
// to flip between hidden (●●●●) and revealed text.
export const Visible: Story = {
  render: () => (
    <div className="w-80 space-y-2">
      <Label htmlFor="senha-visivel">Senha (clique no olho para revelar)</Label>
      <PasswordInput
        id="senha-visivel"
        defaultValue="MinhaSenha@123"
        iconLeft={<Lock className="size-4 text-muted-foreground" />}
      />
    </div>
  ),
};

function WithStrengthRender() {
  const [password, setPassword] = useState('Op3n');
  return (
    <div className="w-80 space-y-2">
      <Label htmlFor="nova-senha">Nova senha</Label>
      <PasswordInput
        id="nova-senha"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="Crie uma senha forte"
        aria-describedby="nova-senha-checklist"
        autoComplete="new-password"
      />
      <div id="nova-senha-checklist">
        <PasswordStrengthChecklist password={password} />
      </div>
    </div>
  );
}

export const WithStrength: Story = {
  render: () => <WithStrengthRender />,
};

export const WithError: Story = {
  render: () => (
    <div className="w-80 space-y-2">
      <Label htmlFor="senha-erro" className="text-destructive">
        Senha
      </Label>
      <PasswordInput
        id="senha-erro"
        defaultValue="123"
        aria-invalid
        aria-describedby="senha-erro-msg"
        autoComplete="current-password"
      />
      <p id="senha-erro-msg" className="text-sm text-destructive">
        Senha muito curta — mínimo de 8 caracteres.
      </p>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="w-80 space-y-2">
      <Label htmlFor="senha-bloq">Senha (bloqueada)</Label>
      <PasswordInput
        id="senha-bloq"
        defaultValue="••••••••"
        disabled
        autoComplete="current-password"
      />
    </div>
  ),
};
