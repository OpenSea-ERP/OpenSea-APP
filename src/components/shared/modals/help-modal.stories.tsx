import type { Meta, StoryObj } from '@storybook/react';
import { Package } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { HelpModal, type FAQItem } from './help-modal';

const meta = {
  title: 'Shared/Modals/HelpModal',
  component: HelpModal,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof HelpModal>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleFaqs: FAQItem[] = [
  {
    question: 'Como cadastrar um novo produto?',
    answer:
      'Acesse o menu Estoque > Produtos e clique no botão "Novo produto". Preencha os campos obrigatórios e clique em "Salvar".',
  },
  {
    question: 'Como faço para importar produtos em massa?',
    answer:
      'Use o botão "Importar" na listagem de produtos. Baixe o modelo CSV, preencha os dados e faça o upload do arquivo.',
  },
  {
    question: 'O que são variantes de produto?',
    answer:
      'Variantes representam combinações específicas de um produto (ex.: tamanho M, cor azul). Cada variante possui SKU, preço e estoque próprios.',
  },
  {
    question: 'Posso desativar um produto sem excluí-lo?',
    answer:
      'Sim. Acesse o produto, edite o status para "Inativo" e salve. Produtos inativos não aparecem em vendas, mas mantêm o histórico.',
  },
];

const longFaqs: FAQItem[] = [
  ...sampleFaqs,
  {
    question: 'Como ajustar o estoque manualmente?',
    answer:
      'Use a função de movimentação manual em Estoque > Movimentações. Informe o motivo do ajuste para fins de auditoria.',
  },
  {
    question: 'É possível precificar com markup automático?',
    answer:
      'Sim. Defina o markup padrão por categoria e o sistema calcula o preço de venda automaticamente a partir do custo.',
  },
  {
    question: 'Como funcionam os warehouses (depósitos)?',
    answer:
      'Cada produto pode ter estoque distribuído em múltiplos depósitos. As movimentações sempre indicam o depósito de origem e destino.',
  },
  {
    question: 'Quais formatos de etiqueta são suportados?',
    answer:
      'Suportamos modelos Pimaco padrão (A4) e impressoras térmicas Zebra (ZPL). Configure o template em Estoque > Etiquetas.',
  },
  {
    question: 'Posso integrar com marketplaces?',
    answer:
      'A integração com marketplaces (Mercado Livre, Shopee) está disponível no módulo Sales para tenants do plano Enterprise.',
  },
  {
    question: 'O sistema gera código de barras automaticamente?',
    answer:
      'Sim. Ao cadastrar uma variante sem código de barras informado, o sistema gera um EAN-13 válido automaticamente.',
  },
  {
    question: 'Como exportar relatório de inventário?',
    answer:
      'Em Estoque > Relatórios escolha "Inventário atual" e exporte em CSV, XLSX ou PDF.',
  },
  {
    question: 'O que é o módulo de produção?',
    answer:
      'O módulo de produção permite registrar processos de manufatura com bill of materials (BOM) e ordens de produção.',
  },
];

function DefaultRender() {
  const [open, setOpen] = useState(true);
  return (
    <HelpModal
      isOpen={open}
      onClose={() => setOpen(false)}
      title="Produtos"
      faqs={sampleFaqs}
      icon={<Package className="w-5 h-5 text-purple-500" />}
    />
  );
}

function WithLongContentRender() {
  const [open, setOpen] = useState(true);
  return (
    <HelpModal
      isOpen={open}
      onClose={() => setOpen(false)}
      title="Estoque"
      description="Tire suas dúvidas sobre o módulo de estoque, produtos e variantes."
      faqs={longFaqs}
    />
  );
}

function ClosedRender() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex h-screen items-center justify-center">
      <Button onClick={() => setOpen(true)}>Abrir ajuda</Button>
      <HelpModal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Produtos"
        faqs={sampleFaqs}
      />
    </div>
  );
}

// Default open state with a small FAQ array — exercises the accordion
// expand/collapse animation.
export const Default: Story = {
  render: () => <DefaultRender />,
};

// 10+ FAQs to verify the internal ScrollArea behavior at max-h-[60vh].
export const WithLongContent: Story = {
  render: () => <WithLongContentRender />,
};

// Closed state — modal is mounted but `isOpen={false}`. Demonstrates the
// typical trigger-from-button integration pattern.
export const Closed: Story = {
  render: () => <ClosedRender />,
};
