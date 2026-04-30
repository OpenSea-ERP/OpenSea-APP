import type { Meta, StoryObj } from '@storybook/react';
import { Bell, FileText, ShieldCheck } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './accordion';

const meta = {
  title: 'UI/Accordion',
  component: Accordion,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Accordion>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Accordion type="single" collapsible className="w-96">
      <AccordionItem value="item-1">
        <AccordionTrigger>O que é o OpenSea ERP?</AccordionTrigger>
        <AccordionContent>
          Sistema integrado de gestão empresarial que cobre estoque, vendas,
          financeiro e RH.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Como faço para adicionar usuários?</AccordionTrigger>
        <AccordionContent>
          Acesse o módulo Administração e clique em &ldquo;Novo usuário&rdquo;.
          Defina o papel e as permissões.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>O sistema é multi-tenant?</AccordionTrigger>
        <AccordionContent>
          Sim. Cada empresa tem sua própria instância de dados, isolada das
          demais por padrão.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const Multiple: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '`type="multiple"` permite que vários itens fiquem abertos simultaneamente. Útil para FAQs longas e checklists.',
      },
    },
  },
  render: () => (
    <Accordion
      type="multiple"
      defaultValue={['perm', 'audit']}
      className="w-96"
    >
      <AccordionItem value="perm">
        <AccordionTrigger>Permissões granulares</AccordionTrigger>
        <AccordionContent>
          Mais de 360 códigos de permissão organizados em 7 módulos. Combine
          papéis para construir acessos sob medida.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="audit">
        <AccordionTrigger>Trilha de auditoria</AccordionTrigger>
        <AccordionContent>
          Toda ação sensível gera um registro com usuário, IP, timestamp e
          payload completo do antes/depois.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="lgpd">
        <AccordionTrigger>Conformidade com LGPD</AccordionTrigger>
        <AccordionContent>
          Mascaramento de campos sensíveis, retenção configurável e exportação
          de dados pessoais sob demanda.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const Collapsible: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '`type="single" collapsible` permite fechar o item aberto. Sem `collapsible`, o último item permanece sempre aberto.',
      },
    },
  },
  render: () => (
    <Accordion type="single" collapsible className="w-96">
      <AccordionItem value="step-1">
        <AccordionTrigger>1. Selecione a empresa</AccordionTrigger>
        <AccordionContent>
          Escolha qual tenant deseja acessar logo após o login.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="step-2">
        <AccordionTrigger>2. Configure seu PIN de ação</AccordionTrigger>
        <AccordionContent>
          O PIN é exigido em operações destrutivas (excluir, encerrar
          contratos).
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="step-3">
        <AccordionTrigger>3. Convide sua equipe</AccordionTrigger>
        <AccordionContent>
          Envie convites por e-mail e atribua papéis pré-definidos.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <Accordion type="single" collapsible className="w-96">
      <AccordionItem value="docs">
        <AccordionTrigger>
          <span className="flex items-center gap-2">
            <FileText className="size-4 text-muted-foreground" />
            Documentos obrigatórios
          </span>
        </AccordionTrigger>
        <AccordionContent>
          CPF, RG, comprovante de residência e carteira de trabalho.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="security">
        <AccordionTrigger>
          <span className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-muted-foreground" />
            Segurança da conta
          </span>
        </AccordionTrigger>
        <AccordionContent>
          Ative autenticação em dois fatores e revise sessões abertas
          periodicamente.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="alerts">
        <AccordionTrigger>
          <span className="flex items-center gap-2">
            <Bell className="size-4 text-muted-foreground" />
            Notificações
          </span>
        </AccordionTrigger>
        <AccordionContent>
          Configure quais eventos disparam e-mail, push ou apenas painel
          interno.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};
