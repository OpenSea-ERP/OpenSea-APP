/**
 * Create Contract Page
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  useBankAccounts,
  useCostCenters,
  useFinanceCategories,
  useCreateContract,
} from '@/hooks/finance';
import type { PaymentFrequency } from '@/types/finance';
import { PAYMENT_FREQUENCY_LABELS } from '@/types/finance';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export default function NewContractPage() {
  const router = useRouter();
  const createMutation = useCreateContract();

  const { data: bankAccountsData } = useBankAccounts();
  const { data: costCentersData } = useCostCenters();
  const { data: categoriesData } = useFinanceCategories();

  const bankAccounts = bankAccountsData?.bankAccounts ?? [];
  const costCenters = costCentersData?.costCenters ?? [];
  const categories = categoriesData?.categories ?? [];

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    companyName: '',
    contactName: '',
    contactEmail: '',
    totalValue: 0,
    paymentFrequency: 'MONTHLY' as PaymentFrequency,
    paymentAmount: 0,
    categoryId: '',
    costCenterId: '',
    bankAccountId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    autoRenew: false,
    renewalPeriodMonths: 12,
    alertDaysBefore: 30,
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createMutation.mutateAsync({
        title: formData.title,
        companyName: formData.companyName,
        totalValue: formData.totalValue,
        paymentFrequency: formData.paymentFrequency,
        paymentAmount: formData.paymentAmount,
        startDate: formData.startDate,
        endDate: formData.endDate,
        description: formData.description || undefined,
        contactName: formData.contactName || undefined,
        contactEmail: formData.contactEmail || undefined,
        categoryId: formData.categoryId || undefined,
        costCenterId: formData.costCenterId || undefined,
        bankAccountId: formData.bankAccountId || undefined,
        autoRenew: formData.autoRenew,
        renewalPeriodMonths: formData.autoRenew
          ? formData.renewalPeriodMonths
          : undefined,
        alertDaysBefore: formData.alertDaysBefore,
        notes: formData.notes || undefined,
      });
      toast.success('Contrato criado com sucesso.');
      router.push('/finance/contracts');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Erro ao criar contrato';
      toast.error(message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/finance/contracts">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Novo Contrato</h1>
        </div>
      </div>

      {/* Form Card */}
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section: Dados Basicos */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Dados do Contrato</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Label htmlFor="title">Titulo *</Label>
                <Input
                  id="title"
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="Ex: Contrato de fornecimento de materia-prima"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="description">Descricao</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={2}
                  placeholder="Descricao detalhada do contrato"
                />
              </div>
            </div>
          </div>

          {/* Section: Fornecedor */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Fornecedor</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="companyName">Nome da Empresa *</Label>
                <Input
                  id="companyName"
                  required
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData({ ...formData, companyName: e.target.value })
                  }
                  placeholder="Razao social ou nome fantasia"
                />
              </div>

              <div>
                <Label htmlFor="contactName">Nome do Contato</Label>
                <Input
                  id="contactName"
                  value={formData.contactName}
                  onChange={(e) =>
                    setFormData({ ...formData, contactName: e.target.value })
                  }
                  placeholder="Responsavel pelo contrato"
                />
              </div>

              <div>
                <Label htmlFor="contactEmail">E-mail do Contato</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, contactEmail: e.target.value })
                  }
                  placeholder="email@empresa.com"
                />
              </div>
            </div>
          </div>

          {/* Section: Valores e Frequencia */}
          <div>
            <h2 className="text-lg font-semibold mb-4">
              Valores e Pagamento
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="totalValue">Valor Total (R$) *</Label>
                <Input
                  id="totalValue"
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  value={formData.totalValue || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      totalValue: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="paymentAmount">Valor da Parcela (R$) *</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  value={formData.paymentAmount || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      paymentAmount: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="paymentFrequency">
                  Frequencia de Pagamento *
                </Label>
                <Select
                  value={formData.paymentFrequency}
                  onValueChange={(value: string) =>
                    setFormData({
                      ...formData,
                      paymentFrequency: value as PaymentFrequency,
                    })
                  }
                >
                  <SelectTrigger id="paymentFrequency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PAYMENT_FREQUENCY_LABELS).map(
                      ([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Section: Classificacao */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Classificacao</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="categoryId">Categoria</Label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, categoryId: value })
                  }
                >
                  <SelectTrigger id="categoryId">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="costCenterId">Centro de Custo</Label>
                <Select
                  value={formData.costCenterId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, costCenterId: value })
                  }
                >
                  <SelectTrigger id="costCenterId">
                    <SelectValue placeholder="Selecione um centro de custo" />
                  </SelectTrigger>
                  <SelectContent>
                    {costCenters.map((cc) => (
                      <SelectItem key={cc.id} value={cc.id}>
                        {cc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="bankAccountId">Conta Bancaria</Label>
                <Select
                  value={formData.bankAccountId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, bankAccountId: value })
                  }
                >
                  <SelectTrigger id="bankAccountId">
                    <SelectValue placeholder="Selecione uma conta" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((ba) => (
                      <SelectItem key={ba.id} value={ba.id}>
                        {ba.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Section: Vigencia */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Vigencia</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <Label htmlFor="startDate">Data de Inicio *</Label>
                <Input
                  id="startDate"
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="endDate">Data de Termino *</Label>
                <Input
                  id="endDate"
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="alertDaysBefore">
                  Alerta (dias antes do vencimento)
                </Label>
                <Input
                  id="alertDaysBefore"
                  type="number"
                  min="1"
                  max="365"
                  value={formData.alertDaysBefore}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      alertDaysBefore: parseInt(e.target.value) || 30,
                    })
                  }
                />
              </div>

              <div className="flex flex-col gap-3">
                <Label>Renovacao Automatica</Label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="autoRenew"
                    checked={formData.autoRenew}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        autoRenew: checked === true,
                      })
                    }
                  />
                  <Label htmlFor="autoRenew" className="font-normal text-sm">
                    Renovar automaticamente
                  </Label>
                </div>
                {formData.autoRenew && (
                  <div>
                    <Input
                      type="number"
                      min="1"
                      max="120"
                      value={formData.renewalPeriodMonths}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          renewalPeriodMonths: parseInt(e.target.value) || 12,
                        })
                      }
                      placeholder="Meses de renovacao"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Periodo em meses
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Observacoes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
              placeholder="Observacoes adicionais sobre o contrato"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Link href="/finance/contracts">
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={createMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {createMutation.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
