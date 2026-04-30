import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from './error-boundary';

const meta = {
  title: 'Shared/ErrorBoundary',
  component: ErrorBoundary,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Error Boundary que captura erros de componentes filhos e exibe UI amigável com botões de reset/voltar para home. Em desenvolvimento, mostra detalhes do erro + component stack.',
      },
    },
  },
} satisfies Meta<typeof ErrorBoundary>;

export default meta;
type Story = StoryObj<typeof meta>;

// Component that throws when triggered — must be a top-level component to
// satisfy react-hooks/rules-of-hooks (state hook stays in PascalCase render).
function ThrowingChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Erro simulado dentro do ErrorBoundary');
  }
  return (
    <div className="p-6 text-center text-sm text-muted-foreground">
      Componente saudável — clique no botão acima para forçar um erro.
    </div>
  );
}

function HappyPathRender() {
  return (
    <ErrorBoundary>
      <div className="p-12 text-center">
        <h2 className="text-xl font-semibold mb-2">Conteúdo normal</h2>
        <p className="text-sm text-muted-foreground">
          Quando os filhos não lançam erro, o ErrorBoundary é transparente.
        </p>
      </div>
    </ErrorBoundary>
  );
}

function WithErrorRender() {
  const [shouldThrow, setShouldThrow] = useState(false);

  return (
    <div>
      <div className="p-4 border-b flex items-center gap-3 bg-muted/30">
        <Button
          size="sm"
          variant="destructive"
          onClick={() => setShouldThrow(true)}
        >
          Disparar erro
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShouldThrow(false)}
        >
          Resetar (parent)
        </Button>
      </div>
      <ErrorBoundary>
        <ThrowingChild shouldThrow={shouldThrow} />
      </ErrorBoundary>
    </div>
  );
}

function CustomFallbackRender() {
  return (
    <ErrorBoundary
      fallback={(error, reset) => (
        <div className="p-8 max-w-md mx-auto bg-rose-50 border border-rose-200 rounded-lg text-center">
          <h3 className="text-lg font-semibold text-rose-900 mb-2">
            Falha no widget
          </h3>
          <p className="text-sm text-rose-700 mb-4">{error.message}</p>
          <Button size="sm" onClick={reset}>
            Tentar novamente
          </Button>
        </div>
      )}
    >
      <ThrowingChild shouldThrow />
    </ErrorBoundary>
  );
}

// Happy path — children render normally, ErrorBoundary stays invisible.
export const HappyPath: Story = {
  render: () => <HappyPathRender />,
};

// Default fallback UI — full-screen friendly error view with reset/home CTAs.
// Toggle the button to throw and see the fallback render.
export const WithError: Story = {
  render: () => <WithErrorRender />,
};

// Custom fallback render-prop — caller decides the UI; receives `error` +
// `reset()` to clear the boundary state.
export const CustomFallback: Story = {
  render: () => <CustomFallbackRender />,
};
