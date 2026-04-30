import type { Meta, StoryObj } from '@storybook/react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from './chart';

// ChartContainer is the wrapping primitive — it takes a `config` prop (mapping
// dataKey -> { label, color }) and a single Recharts chart child rendered
// inside a ResponsiveContainer. Stories below cover the four chart shapes the
// project actually uses (Bar / Line / Area / Pie), plus a legend variant.

const meta = {
  title: 'UI/Chart',
  component: ChartContainer,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof ChartContainer>;

export default meta;
type Story = StoryObj<typeof meta>;

// Sample sales-by-month data (PT-BR labels)
const salesByMonth = [
  { month: 'Jan', receitas: 18500, despesas: 12300 },
  { month: 'Fev', receitas: 21200, despesas: 13800 },
  { month: 'Mar', receitas: 26400, despesas: 15600 },
  { month: 'Abr', receitas: 24100, despesas: 14900 },
  { month: 'Mai', receitas: 29800, despesas: 17200 },
  { month: 'Jun', receitas: 33500, despesas: 18700 },
];

const formatBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);

const compactBRL = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(value);

const dualSeriesConfig: ChartConfig = {
  receitas: {
    label: 'Receitas',
    color: 'hsl(142, 76%, 36%)',
  },
  despesas: {
    label: 'Despesas',
    color: 'hsl(0, 84%, 60%)',
  },
};

export const Bar_: Story = {
  name: 'Bar',
  parameters: {
    docs: {
      description: {
        story:
          'Gráfico de barras agrupadas (receitas vs despesas) usando ChartContainer + BarChart. As cores vêm do `config` via CSS var `--color-<key>`.',
      },
    },
  },
  render: () => (
    <Card className="w-[640px]">
      <CardHeader>
        <CardTitle>Vendas por mês</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={dualSeriesConfig} className="h-[280px] w-full">
          <BarChart data={salesByMonth} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={compactBRL}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={value => formatBRL(value as number)}
                />
              }
            />
            <Bar
              dataKey="receitas"
              fill="var(--color-receitas)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="despesas"
              fill="var(--color-despesas)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  ),
};

export const Line_: Story = {
  name: 'Line',
  parameters: {
    docs: {
      description: {
        story: 'Gráfico de linhas comparando receitas e despesas mês a mês.',
      },
    },
  },
  render: () => (
    <Card className="w-[640px]">
      <CardHeader>
        <CardTitle>Tendência mensal</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={dualSeriesConfig} className="h-[280px] w-full">
          <LineChart data={salesByMonth} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={compactBRL}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={value => formatBRL(value as number)}
                />
              }
            />
            <Line
              type="monotone"
              dataKey="receitas"
              stroke="var(--color-receitas)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="despesas"
              stroke="var(--color-despesas)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  ),
};

export const Area_: Story = {
  name: 'Area',
  parameters: {
    docs: {
      description: {
        story:
          'Gráfico de área empilhada — útil para mostrar contribuição cumulativa de cada série.',
      },
    },
  },
  render: () => (
    <Card className="w-[640px]">
      <CardHeader>
        <CardTitle>Receita acumulada</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={dualSeriesConfig} className="h-[280px] w-full">
          <AreaChart data={salesByMonth} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={compactBRL}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={value => formatBRL(value as number)}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="receitas"
              stroke="var(--color-receitas)"
              fill="var(--color-receitas)"
              fillOpacity={0.25}
              stackId="a"
            />
            <Area
              type="monotone"
              dataKey="despesas"
              stroke="var(--color-despesas)"
              fill="var(--color-despesas)"
              fillOpacity={0.25}
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  ),
};

const pieData = [
  { name: 'Roupas', value: 45000, fill: 'hsl(217, 91%, 60%)' },
  { name: 'Acessórios', value: 18200, fill: 'hsl(142, 76%, 36%)' },
  { name: 'Calçados', value: 27800, fill: 'hsl(280, 87%, 65%)' },
  { name: 'Decoração', value: 9300, fill: 'hsl(199, 89%, 48%)' },
];

const pieConfig: ChartConfig = {
  Roupas: { label: 'Roupas', color: 'hsl(217, 91%, 60%)' },
  Acessórios: { label: 'Acessórios', color: 'hsl(142, 76%, 36%)' },
  Calçados: { label: 'Calçados', color: 'hsl(280, 87%, 65%)' },
  Decoração: { label: 'Decoração', color: 'hsl(199, 89%, 48%)' },
};

export const Pie_: Story = {
  name: 'Pie',
  parameters: {
    docs: {
      description: {
        story:
          'Donut/Pie chart com tooltip formatado em BRL. Cada fatia define `fill` no dado.',
      },
    },
  },
  render: () => (
    <Card className="w-[420px]">
      <CardHeader>
        <CardTitle>Vendas por categoria</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={pieConfig} className="h-[280px] w-full">
          <PieChart accessibilityLayer>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={value => formatBRL(value as number)}
                  nameKey="name"
                />
              }
            />
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
            >
              {pieData.map(entry => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  ),
};

export const WithLegend: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Bar chart com `ChartLegend` + `ChartLegendContent` para identificar as séries. A legenda lê labels do `config`.',
      },
    },
  },
  render: () => (
    <Card className="w-[640px]">
      <CardHeader>
        <CardTitle>Receitas vs despesas (com legenda)</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={dualSeriesConfig} className="h-[300px] w-full">
          <BarChart data={salesByMonth} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={compactBRL}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={value => formatBRL(value as number)}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="receitas"
              fill="var(--color-receitas)"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="despesas"
              fill="var(--color-despesas)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  ),
};
