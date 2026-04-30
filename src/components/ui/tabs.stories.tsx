import type { Meta, StoryObj } from '@storybook/react';
import {
  BarChart3,
  FileText,
  History,
  Settings,
  ShieldCheck,
  User,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';

const meta = {
  title: 'UI/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-[480px]">
      <TabsList>
        <TabsTrigger value="overview">Visão geral</TabsTrigger>
        <TabsTrigger value="details">Detalhes</TabsTrigger>
        <TabsTrigger value="history">Histórico</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="pt-4 text-sm">
        Resumo geral do registro selecionado, com informações principais.
      </TabsContent>
      <TabsContent value="details" className="pt-4 text-sm">
        Campos detalhados do cadastro, agrupados por seção.
      </TabsContent>
      <TabsContent value="history" className="pt-4 text-sm">
        Linha do tempo de alterações realizadas no registro.
      </TabsContent>
    </Tabs>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <Tabs defaultValue="profile" className="w-[520px]">
      <TabsList>
        <TabsTrigger value="profile">
          <User aria-hidden="true" />
          Perfil
        </TabsTrigger>
        <TabsTrigger value="docs">
          <FileText aria-hidden="true" />
          Documentos
        </TabsTrigger>
        <TabsTrigger value="security">
          <ShieldCheck aria-hidden="true" />
          Segurança
        </TabsTrigger>
      </TabsList>
      <TabsContent value="profile" className="pt-4 text-sm">
        Dados pessoais e informações de contato do colaborador.
      </TabsContent>
      <TabsContent value="docs" className="pt-4 text-sm">
        Documentação anexada e checklist de admissão.
      </TabsContent>
      <TabsContent value="security" className="pt-4 text-sm">
        PIN de ação, sessões ativas e dispositivos confiáveis.
      </TabsContent>
    </Tabs>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Tabs defaultValue="active" className="w-[480px]">
      <TabsList>
        <TabsTrigger value="active">Ativos</TabsTrigger>
        <TabsTrigger value="archived">Arquivados</TabsTrigger>
        <TabsTrigger value="locked" disabled>
          Bloqueados
        </TabsTrigger>
      </TabsList>
      <TabsContent value="active" className="pt-4 text-sm">
        Registros ativos visíveis para a equipe.
      </TabsContent>
      <TabsContent value="archived" className="pt-4 text-sm">
        Registros arquivados (somente leitura).
      </TabsContent>
      <TabsContent value="locked" className="pt-4 text-sm">
        Conteúdo restrito por permissão.
      </TabsContent>
    </Tabs>
  ),
};

// Padrão de detail/edit pages (CLAUDE.md §9): grid w-full grid-cols-N h-12 mb-4
export const DenseGrid: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Padrão usado em páginas de detalhe/edição (CLAUDE.md §9): TabsList com `grid w-full grid-cols-N h-12 mb-4`. Cada gatilho ocupa fração igual do header.',
      },
    },
  },
  render: () => (
    <Tabs defaultValue="overview" className="w-[640px]">
      <TabsList className="grid w-full grid-cols-4 h-12 mb-4">
        <TabsTrigger value="overview">
          <BarChart3 aria-hidden="true" />
          Visão geral
        </TabsTrigger>
        <TabsTrigger value="details">
          <FileText aria-hidden="true" />
          Detalhes
        </TabsTrigger>
        <TabsTrigger value="history">
          <History aria-hidden="true" />
          Histórico
        </TabsTrigger>
        <TabsTrigger value="settings">
          <Settings aria-hidden="true" />
          Configurações
        </TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="text-sm">
        Métricas e indicadores principais do registro.
      </TabsContent>
      <TabsContent value="details" className="text-sm">
        Atributos detalhados e relacionamentos.
      </TabsContent>
      <TabsContent value="history" className="text-sm">
        Eventos auditáveis em ordem cronológica.
      </TabsContent>
      <TabsContent value="settings" className="text-sm">
        Preferências e flags específicas do registro.
      </TabsContent>
    </Tabs>
  ),
};
