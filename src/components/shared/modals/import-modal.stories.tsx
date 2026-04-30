import type { Meta, StoryObj } from '@storybook/react';
import { Users } from 'lucide-react';
import { useState } from 'react';
import { ImportModal } from './import-modal';

const meta = {
  title: 'Shared/Modals/ImportModal',
  component: ImportModal,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof ImportModal>;

export default meta;
type Story = StoryObj<typeof meta>;

// Stub File the component can render in its preview block. We never actually
// upload it to a server — the `onImport` callback decides what happens.
const sampleFile = new File(
  ['nome,email\nMaria Silva,maria@teste.com\nJoão Souza,joao@teste.com'],
  'clientes.csv',
  { type: 'text/csv' }
);

const noopImport = () =>
  new Promise<void>(resolve => {
    setTimeout(resolve, 600);
  });

function DefaultRender() {
  const [open, setOpen] = useState(true);
  return (
    <ImportModal
      isOpen={open}
      onClose={() => setOpen(false)}
      onImport={noopImport}
      title="Importar produtos"
      description="Faça upload de um arquivo CSV ou Excel para importar produtos em massa."
      onDownloadTemplate={() => {
        // no-op in storybook
      }}
    />
  );
}

// Component is uncontrolled internally (useState selectedFile), so we drive
// the "with file" preview by submitting from the dropzone in the real UI.
// In Storybook we instead expose a wrapper that programmatically pushes the
// stub file into the file input on mount via DataTransfer when supported.
function PreloadedFileRender() {
  const [open, setOpen] = useState(true);

  // Wrap onImport so it never resolves — keeps the modal in the "Importando..."
  // state for visual inspection of the disabled button copy.
  const stuckImport = () => new Promise<void>(() => {});

  return (
    <div
      ref={node => {
        if (!node) return;
        const input = node.querySelector<HTMLInputElement>('#file-upload');
        if (!input || input.files?.length) return;
        try {
          const dt = new DataTransfer();
          dt.items.add(sampleFile);
          input.files = dt.files;
          input.dispatchEvent(new Event('change', { bubbles: true }));
        } catch {
          // DataTransfer not available in some test environments — skip.
        }
      }}
    >
      <ImportModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onImport={stuckImport}
        title="Importar produtos"
      />
    </div>
  );
}

function WithErrorsRender() {
  const [open, setOpen] = useState(true);
  return (
    <ImportModal
      isOpen={open}
      onClose={() => setOpen(false)}
      onImport={async () => {
        await new Promise(resolve => setTimeout(resolve, 300));
        throw new Error(
          'Erros de validação:\n• Linha 2: e-mail inválido\n• Linha 7: CPF duplicado'
        );
      }}
      title="Importar clientes"
      description="A importação anterior falhou em 2 linhas. Corrija o arquivo e tente novamente."
      icon={<Users className="w-5 h-5 text-blue-500" />}
    />
  );
}

function SuccessRender() {
  const [open, setOpen] = useState(true);
  return (
    <ImportModal
      isOpen={open}
      onClose={() => setOpen(false)}
      onImport={async () => {
        await new Promise(resolve => setTimeout(resolve, 200));
      }}
      title="Importação concluída"
      description="42 produtos foram importados com sucesso na última operação. Selecione um novo arquivo para repetir o processo."
      templateUrl="https://example.com/template-produtos.csv"
    />
  );
}

// Default open state — empty dropzone, with download-template button visible.
export const Default: Story = {
  render: () => <DefaultRender />,
};

// File pre-loaded into the input via DataTransfer; `onImport` is stuck so
// the "Importando..." button copy remains visible. Use this to inspect the
// disabled state, the file name + size preview, and the "Remover arquivo"
// button. Note: requires browser support for DataTransfer constructor (which
// Vitest/Playwright/JSDOM all provide).
export const Uploading: Story = {
  render: () => <PreloadedFileRender />,
};

// Error state — `onImport` rejects after a short delay. The component logs
// the error and stays open with `isImporting=false` reset.
export const WithErrors: Story = {
  render: () => <WithErrorsRender />,
};

// Post-upload "ready for next" state — description nudges the user toward
// repeating the operation, with a real templateUrl populated.
export const Success: Story = {
  render: () => <SuccessRender />,
};
