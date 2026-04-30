import type { Meta, StoryObj } from '@storybook/react';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import { Input } from './input';
import { Label } from './label';
import { PasswordStrengthChecklist } from './password-strength-checklist';

const customCriteria = [
  {
    key: 'minLength',
    label: 'Pelo menos 12 caracteres',
    test: (password: string) => password.length >= 12,
  },
  {
    key: 'number',
    label: 'Contém número',
    test: (password: string) => /[0-9]/.test(password),
  },
  {
    key: 'noSpaces',
    label: 'Sem espaços',
    test: (password: string) => !/\s/.test(password),
  },
];

function PasswordStrengthChecklistRender({
  initialPassword,
  criteria,
  inputId,
  label,
}: {
  initialPassword: string;
  criteria?: ComponentProps<typeof PasswordStrengthChecklist>['criteria'];
  inputId: string;
  label: string;
}) {
  const [password, setPassword] = useState(initialPassword);

  return (
    <div className="w-80 space-y-2" aria-label={label}>
      <Label htmlFor={inputId}>{label}</Label>
      <Input
        id={inputId}
        type="password"
        value={password}
        onChange={event => setPassword(event.target.value)}
        placeholder="Digite uma senha"
      />
      <PasswordStrengthChecklist password={password} criteria={criteria} />
    </div>
  );
}

const meta = {
  title: 'UI/PasswordStrengthChecklist',
  component: PasswordStrengthChecklist,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
  argTypes: {
    password: {
      control: 'text',
      name: 'Senha',
    },
    criteria: {
      control: false,
      name: 'Critérios',
    },
    className: {
      control: 'text',
      name: 'Classe CSS',
    },
  },
} satisfies Meta<typeof PasswordStrengthChecklist>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Weak: Story = {
  name: 'Fraca',
  render: () => (
    <PasswordStrengthChecklistRender
      initialPassword="abc"
      inputId="senha-fraca"
      label="Senha fraca"
    />
  ),
};

export const Medium: Story = {
  name: 'Média',
  render: () => (
    <PasswordStrengthChecklistRender
      initialPassword="Abcdef12"
      inputId="senha-media"
      label="Senha média"
    />
  ),
};

export const Strong: Story = {
  name: 'Forte',
  render: () => (
    <PasswordStrengthChecklistRender
      initialPassword="Abcdef12!"
      inputId="senha-forte"
      label="Senha forte"
    />
  ),
};

export const EmptyValue: Story = {
  name: 'Valor vazio',
  render: () => (
    <PasswordStrengthChecklistRender
      initialPassword=""
      inputId="senha-vazia"
      label="Senha vazia"
    />
  ),
};

export const WithCustomRules: Story = {
  name: 'Com regras customizadas',
  render: () => (
    <PasswordStrengthChecklistRender
      initialPassword="OpenSea2026"
      criteria={customCriteria}
      inputId="senha-customizada"
      label="Senha com regras customizadas"
    />
  ),
};
