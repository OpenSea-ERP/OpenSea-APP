'use client';

import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateGoal } from '@/hooks/sales/use-analytics';
import type { GoalType, GoalPeriod, GoalScope } from '@/types/sales';
import { Save, Target } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export default function NewGoalPage() {
  const router = useRouter();
  const createGoal = useCreateGoal();

  const [name, setName] = useState('');
  const [type, setType] = useState<GoalType>('REVENUE');
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('BRL');
  const [period, setPeriod] = useState<GoalPeriod>('MONTHLY');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [scope, setScope] = useState<GoalScope>('TENANT');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim() || !targetValue || !startDate || !endDate) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }

    try {
      await createGoal.mutateAsync({
        name: name.trim(),
        type,
        targetValue: Number(targetValue),
        unit,
        period,
        startDate,
        endDate,
        scope,
      });

      toast.success('Meta criada com sucesso.');
      router.push('/sales/analytics/goals');
    } catch {
      toast.error('Erro ao criar meta.');
    }
  }

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbs={[
            { label: 'Vendas' },
            { label: 'Analytics', href: '/sales/analytics' },
            { label: 'Metas', href: '/sales/analytics/goals' },
            { label: 'Nova Meta' },
          ]}
        >
          <Button
            size="sm"
            className="h-9 px-2.5"
            onClick={handleSubmit}
            disabled={createGoal.isPending}
          >
            <Save className="h-4 w-4 mr-1" />
            Salvar
          </Button>
        </PageActionBar>
      </PageHeader>

      <PageBody>
        <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
          {/* Identity Card */}
          <Card className="bg-white/5 p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-500/10">
                <Target className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <Input
                  placeholder="Nome da meta"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-lg font-medium border-0 p-0 h-auto focus-visible:ring-0"
                />
              </div>
            </div>
          </Card>

          {/* Form Card */}
          <Card className="bg-white/5 py-2 overflow-hidden">
            <CardHeader>
              <CardTitle className="text-sm font-medium">Configuração da Meta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={type} onValueChange={(v) => setType(v as GoalType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REVENUE">Receita</SelectItem>
                      <SelectItem value="QUANTITY">Quantidade</SelectItem>
                      <SelectItem value="DEALS_WON">Negócios Fechados</SelectItem>
                      <SelectItem value="NEW_CUSTOMERS">Novos Clientes</SelectItem>
                      <SelectItem value="TICKET_AVERAGE">Ticket Médio</SelectItem>
                      <SelectItem value="CONVERSION_RATE">Taxa de Conversão</SelectItem>
                      <SelectItem value="COMMISSION">Comissão</SelectItem>
                      <SelectItem value="CUSTOM">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Escopo</Label>
                  <Select value={scope} onValueChange={(v) => setScope(v as GoalScope)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                      <SelectItem value="TEAM">Equipe</SelectItem>
                      <SelectItem value="TENANT">Empresa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor Alvo</Label>
                  <Input
                    type="number"
                    placeholder="100000"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Unidade</Label>
                  <Select value={unit} onValueChange={setUnit}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">BRL (R$)</SelectItem>
                      <SelectItem value="un">Unidades</SelectItem>
                      <SelectItem value="%">Percentual (%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Período</Label>
                <Select value={period} onValueChange={(v) => setPeriod(v as GoalPeriod)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAILY">Diário</SelectItem>
                    <SelectItem value="WEEKLY">Semanal</SelectItem>
                    <SelectItem value="MONTHLY">Mensal</SelectItem>
                    <SelectItem value="QUARTERLY">Trimestral</SelectItem>
                    <SelectItem value="YEARLY">Anual</SelectItem>
                    <SelectItem value="CUSTOM">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data Início</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Data Fim</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </PageBody>
    </PageLayout>
  );
}
