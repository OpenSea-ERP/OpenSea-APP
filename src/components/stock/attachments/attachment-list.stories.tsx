import type { Meta, StoryObj } from '@storybook/react';
import type { Attachment } from '@/types/stock';
import { AttachmentList } from './attachment-list';

/**
 * `AttachmentList` exibe anexos de produto/template com:
 * - Ícone por mime type (imagem, PDF, genérico)
 * - Tamanho formatado (B / KB / MB)
 * - Badge de label (ex: "Manual", "Ficha técnica")
 * - Link de download externo + botão excluir (visível no hover)
 *
 * Pure-props: aceita `attachments`, `onDelete?` e `isDeleting?`.
 */
const meta = {
  title: 'Modules/Stock/AttachmentList',
  component: AttachmentList,
  tags: ['autodocs', 'stable'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Lista de anexos com ícone por tipo (imagem, PDF, outros), tamanho formatado e ações de download/excluir. Usada em páginas de detalhe de produto e template.',
      },
    },
  },
} satisfies Meta<typeof AttachmentList>;

export default meta;
type Story = StoryObj<typeof meta>;

const wrap = (children: React.ReactNode) => (
  <div className="bg-background min-h-[300px] p-6 max-w-2xl">{children}</div>
);

const noop = () => {};

const sampleAttachments: Attachment[] = [
  {
    id: 'a-1',
    fileUrl: 'https://example.com/manual.pdf',
    fileName: 'Manual técnico - Camiseta básica.pdf',
    fileSize: 524288,
    mimeType: 'application/pdf',
    label: 'Manual',
    order: 0,
    createdAt: '2026-04-15T10:00:00Z',
    updatedAt: '2026-04-15T10:00:00Z',
  },
  {
    id: 'a-2',
    fileUrl: 'https://example.com/foto.jpg',
    fileName: 'foto-frontal-modelo.jpg',
    fileSize: 1843200,
    mimeType: 'image/jpeg',
    label: 'Catálogo',
    order: 1,
    createdAt: '2026-04-15T10:05:00Z',
    updatedAt: '2026-04-15T10:05:00Z',
  },
  {
    id: 'a-3',
    fileUrl: 'https://example.com/ficha.pdf',
    fileName: 'ficha-tecnica-completa.pdf',
    fileSize: 102400,
    mimeType: 'application/pdf',
    label: 'Ficha técnica',
    order: 2,
    createdAt: '2026-04-16T09:00:00Z',
    updatedAt: '2026-04-16T09:00:00Z',
  },
  {
    id: 'a-4',
    fileUrl: 'https://example.com/planilha.xlsx',
    fileName: 'tabela-de-medidas.xlsx',
    fileSize: 8192,
    mimeType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    label: null,
    order: 3,
    createdAt: '2026-04-17T11:30:00Z',
    updatedAt: '2026-04-17T11:30:00Z',
  },
];

export const Default: Story = {
  render: () =>
    wrap(<AttachmentList attachments={sampleAttachments} onDelete={noop} />),
};

export const Empty: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Empty state com borda tracejada e mensagem "Nenhum anexo adicionado".',
      },
    },
  },
  render: () => wrap(<AttachmentList attachments={[]} onDelete={noop} />),
};

export const ImagesOnly: Story = {
  render: () =>
    wrap(
      <AttachmentList
        attachments={sampleAttachments
          .filter(a => a.mimeType.startsWith('image/'))
          .concat([
            {
              id: 'a-img-2',
              fileUrl: 'https://example.com/foto-traseira.png',
              fileName: 'foto-traseira-modelo.png',
              fileSize: 2097152,
              mimeType: 'image/png',
              label: 'Catálogo',
              order: 4,
              createdAt: '2026-04-18T08:00:00Z',
              updatedAt: '2026-04-18T08:00:00Z',
            },
          ])}
        onDelete={noop}
      />
    ),
};

export const ReadOnly: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Sem `onDelete`: o botão excluir não aparece. Usado quando o usuário não tem permissão de modificação.',
      },
    },
  },
  render: () => wrap(<AttachmentList attachments={sampleAttachments} />),
};

export const Deleting: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '`isDeleting=true` desabilita os botões de excluir enquanto a mutação está em andamento.',
      },
    },
  },
  render: () =>
    wrap(
      <AttachmentList
        attachments={sampleAttachments}
        onDelete={noop}
        isDeleting
      />
    ),
};

export const Dark: Story = {
  globals: { theme: 'dark' },
  render: () =>
    wrap(<AttachmentList attachments={sampleAttachments} onDelete={noop} />),
};
