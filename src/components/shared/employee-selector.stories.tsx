import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { EmployeeSelector } from './employee-selector';

const meta = {
  title: 'Shared/EmployeeSelector',
  component: EmployeeSelector,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Combobox de funcionários (Popover + Command). **Limitação no Storybook:** o componente busca dados via `employeesService.listEmployees()` (TanStack Query) — quando aberto, a chamada falha sem MSW configurado e a lista fica vazia. Estados aqui exercitam apenas o trigger fechado: vazio, com placeholder customizado e desabilitado. Para storiar o popover aberto com itens, configure MSW no preview e mocke `GET /v1/hr/employees`.',
      },
    },
  },
} satisfies Meta<typeof EmployeeSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

function DefaultRender() {
  const [value, setValue] = useState('');
  return (
    <div className="w-[420px]">
      <EmployeeSelector value={value} onChange={setValue} />
    </div>
  );
}

function CustomPlaceholderRender() {
  const [value, setValue] = useState('');
  return (
    <div className="w-[420px]">
      <EmployeeSelector
        value={value}
        onChange={setValue}
        placeholder="Escolha um colaborador para a tarefa..."
      />
    </div>
  );
}

function DisabledRender() {
  return (
    <div className="w-[420px]">
      <EmployeeSelector value="" onChange={() => {}} disabled />
    </div>
  );
}

function CustomClassNameRender() {
  const [value, setValue] = useState('');
  return (
    <div className="w-[260px]">
      <EmployeeSelector
        value={value}
        onChange={setValue}
        className="border-blue-400"
      />
    </div>
  );
}

// Trigger fechado, placeholder padrão. Abrir o popover dispara fetch real
// (sem MSW configurado, lista fica vazia).
export const Default: Story = {
  render: () => <DefaultRender />,
};

// Placeholder customizado (caso de uso comum: "Selecionar responsável...").
export const CustomPlaceholder: Story = {
  render: () => <CustomPlaceholderRender />,
};

// Estado desabilitado — usado em formulários read-only ou quando o valor
// vem fixado por outra regra.
export const Disabled: Story = {
  render: () => <DisabledRender />,
};

// Ajuste de largura/borda via prop `className`.
export const CustomClassName: Story = {
  render: () => <CustomClassNameRender />,
};

// Tema escuro — usa o decorator global de tema.
export const Dark: Story = {
  globals: { theme: 'dark' },
  render: () => <DefaultRender />,
};
