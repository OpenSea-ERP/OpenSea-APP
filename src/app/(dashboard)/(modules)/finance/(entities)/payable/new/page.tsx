/**
 * Create Payable Entry Page
 */

'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { CurrencyInput } from '@/components/finance/currency-input';
import {
  useBankAccounts,
  useCostCenters,
  useCreateFinanceEntry,
  useFinanceCategories,
} from '@/hooks/finance';
import { RECURRENCE_TYPE_LABELS } from '@/types/finance';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function NewPayablePage() {
  const router = useRouter();
  const createMutation = useCreateFinanceEntry();

  const { data: categoriesData } = useFinanceCategories({ type: 'EXPENSE' });
  const { data: costCentersData } = useCostCenters();
  const { data: bankAccountsData } = useBankAccounts();

  const categories = categoriesData?.categories ?? [];
  const costCenters = costCentersData?.costCenters ?? [];
  const bankAccounts = bankAccountsData?.bankAccounts ?? [];

  const [formData, setFormData] = useState({
    description: '',
    categoryId: '',
    costCenterId: '',
    bankAccountId: '',
    expectedAmount: 0,
    discount: 0,
    interest: 0,
    penalty: 0,
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date().toISOString().split('T')[0],
    supplierName: '',
    recurrenceType: 'SINGLE',
    notes: '',
    tags: [] as string[],
    currency: 'BRL',
  });

  const [tagInput, setTagInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createMutation.mutateAsync({
        type: 'PAYABLE',
        description: formData.description,
        categoryId: formData.categoryId,
        costCenterId: formData.costCenterId,
        bankAccountId: formData.bankAccountId || undefined,
        expectedAmount: formData.expectedAmount,
        discount: formData.discount,
        interest: formData.interest,
        penalty: formData.penalty,
        issueDate: formData.issueDate,
        dueDate: formData.dueDate,
        supplierName: formData.supplierName || undefined,
        recurrenceType: formData.recurrenceType as
          | 'SINGLE'
          | 'RECURRING'
          | 'INSTALLMENT',
        notes: formData.notes || undefined,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        currency: formData.currency !== 'BRL' ? formData.currency : undefined,
      });
      router.push('/finance/payable');
    } catch {
      alert('Erro ao criar conta a pagar');
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/finance/payable">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-5 w-5 mr-2" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Nova Conta a Pagar</h1>
        </div>
      </div>

      {/* Form Card */}
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Label htmlFor="description">Descrição *</Label>
              <Input
                id="description"
                required
                value={formData.description}
                onChange={e =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="categoryId">Categoria *</Label>
              <Select
                value={formData.categoryId}
                onValueChange={value =>
                  setFormData({ ...formData, categoryId: value })
                }
                required
              >
                <SelectTrigger id="categoryId">
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="costCenterId">Centro de Custo *</Label>
              <Select
                value={formData.costCenterId}
                onValueChange={value =>
                  setFormData({ ...formData, costCenterId: value })
                }
                required
              >
                <SelectTrigger id="costCenterId">
                  <SelectValue placeholder="Selecione um centro de custo" />
                </SelectTrigger>
                <SelectContent>
                  {costCenters.map(cc => (
                    <SelectItem key={cc.id} value={cc.id}>
                      {cc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="bankAccountId">Conta Bancária</Label>
              <Select
                value={formData.bankAccountId}
                onValueChange={value =>
                  setFormData({ ...formData, bankAccountId: value })
                }
              >
                <SelectTrigger id="bankAccountId">
                  <SelectValue placeholder="Selecione (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map(ba => (
                    <SelectItem key={ba.id} value={ba.id}>
                      {ba.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="supplierName">Fornecedor</Label>
              <Input
                id="supplierName"
                value={formData.supplierName}
                onChange={e =>
                  setFormData({ ...formData, supplierName: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="expectedAmount">Valor Esperado *</Label>
              <Input
                id="expectedAmount"
                type="number"
                step="0.01"
                required
                value={formData.expectedAmount}
                onChange={e =>
                  setFormData({
                    ...formData,
                    expectedAmount: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div>
              <Label>Moeda</Label>
              <CurrencyInput
                value={formData.currency}
                onChange={(currency) => setFormData({ ...formData, currency })}
                amount={formData.expectedAmount}
              />
            </div>

            <div>
              <Label htmlFor="discount">Desconto (R$)</Label>
              <Input
                id="discount"
                type="number"
                step="0.01"
                value={formData.discount}
                onChange={e =>
                  setFormData({
                    ...formData,
                    discount: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div>
              <Label htmlFor="interest">Juros (R$)</Label>
              <Input
                id="interest"
                type="number"
                step="0.01"
                value={formData.interest}
                onChange={e =>
                  setFormData({
                    ...formData,
                    interest: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div>
              <Label htmlFor="penalty">Multa (R$)</Label>
              <Input
                id="penalty"
                type="number"
                step="0.01"
                value={formData.penalty}
                onChange={e =>
                  setFormData({
                    ...formData,
                    penalty: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div>
              <Label htmlFor="issueDate">Data de Emissão *</Label>
              <Input
                id="issueDate"
                type="date"
                required
                value={formData.issueDate}
                onChange={e =>
                  setFormData({ ...formData, issueDate: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="dueDate">Data de Vencimento *</Label>
              <Input
                id="dueDate"
                type="date"
                required
                value={formData.dueDate}
                onChange={e =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="recurrenceType">Recorrência</Label>
              <Select
                value={formData.recurrenceType}
                onValueChange={value =>
                  setFormData({ ...formData, recurrenceType: value })
                }
              >
                <SelectTrigger id="recurrenceType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(RECURRENCE_TYPE_LABELS).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={e =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button type="button" onClick={addTag}>
                  Adicionar
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className="bg-secondary px-2 py-1 rounded text-sm flex items-center gap-1"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-destructive"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Link href="/finance/payable">
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
