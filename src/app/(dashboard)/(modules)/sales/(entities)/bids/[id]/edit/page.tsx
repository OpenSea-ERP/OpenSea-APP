'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
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
import { useBid, useUpdateBid } from '@/hooks/sales/use-bids';
import type { BidStatus } from '@/types/sales';
import { BID_STATUS_LABELS } from '@/types/sales';
import { Gavel, Save, Trash2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function BidEditPage() {
  const params = useParams();
  const router = useRouter();
  const bidId = params.id as string;

  const { data: bid, isLoading, error } = useBid(bidId);
  const updateMutation = useUpdateBid();

  const [formData, setFormData] = useState({
    object: '',
    objectSummary: '',
    status: '' as BidStatus | '',
    viabilityScore: '',
    viabilityReason: '',
    ourProposalValue: '',
    finalValue: '',
    margin: '',
    tags: '',
    notes: '',
  });

  useEffect(() => {
    if (bid) {
      setFormData({
        object: bid.object,
        objectSummary: bid.objectSummary ?? '',
        status: bid.status,
        viabilityScore: bid.viabilityScore?.toString() ?? '',
        viabilityReason: bid.viabilityReason ?? '',
        ourProposalValue: bid.ourProposalValue?.toString() ?? '',
        finalValue: bid.finalValue?.toString() ?? '',
        margin: bid.margin?.toString() ?? '',
        tags: bid.tags.join(', '),
        notes: bid.notes ?? '',
      });
    }
  }, [bid]);

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        id: bidId,
        data: {
          object: formData.object || undefined,
          objectSummary: formData.objectSummary || undefined,
          status: (formData.status as BidStatus) || undefined,
          viabilityScore: formData.viabilityScore
            ? parseInt(formData.viabilityScore)
            : undefined,
          viabilityReason: formData.viabilityReason || undefined,
          ourProposalValue: formData.ourProposalValue
            ? parseFloat(formData.ourProposalValue)
            : undefined,
          finalValue: formData.finalValue
            ? parseFloat(formData.finalValue)
            : undefined,
          margin: formData.margin ? parseFloat(formData.margin) : undefined,
          tags: formData.tags
            ? formData.tags
                .split(',')
                .map(t => t.trim())
                .filter(Boolean)
            : undefined,
          notes: formData.notes || undefined,
        },
      });
      toast.success('Licitação atualizada com sucesso');
      router.push(`/sales/bids/${bidId}`);
    } catch {
      toast.error('Erro ao atualizar licitação');
    }
  };

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Vendas' },
              { label: 'Licitações', href: '/sales/bids' },
              { label: 'Carregando...' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridLoading />
        </PageBody>
      </PageLayout>
    );
  }

  if (error || !bid) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Vendas' },
              { label: 'Licitações', href: '/sales/bids' },
              { label: 'Erro' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridError message="Licitação não encontrada" />
        </PageBody>
      </PageLayout>
    );
  }

  return (
    <PageLayout data-testid="bid-edit">
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Vendas' },
            { label: 'Licitações', href: '/sales/bids' },
            { label: bid.editalNumber, href: `/sales/bids/${bidId}` },
            { label: 'Editar' },
          ]}
          actions={[
            {
              label: 'Salvar',
              icon: <Save className="h-4 w-4" />,
              onClick: handleSave,
              variant: 'default',
              loading: updateMutation.isPending,
            },
          ]}
        />
      </PageHeader>
      <PageBody>
        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10">
              <Gavel className="h-5 w-5 text-indigo-500" />
            </div>
            <div>
              <h2 className="font-medium">{bid.editalNumber}</h2>
              <p className="text-xs text-muted-foreground">{bid.organName}</p>
            </div>
          </div>
        </Card>

        {/* Form */}
        <Card className="mt-4 bg-white/5 py-2 overflow-hidden">
          <div className="p-4 space-y-4">
            <div>
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={v =>
                  setFormData(p => ({ ...p, status: v as BidStatus }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(BID_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Objeto</Label>
              <Textarea
                value={formData.object}
                onChange={e =>
                  setFormData(p => ({ ...p, object: e.target.value }))
                }
                rows={3}
              />
            </div>

            <div>
              <Label>Resumo do Objeto</Label>
              <Input
                value={formData.objectSummary}
                onChange={e =>
                  setFormData(p => ({ ...p, objectSummary: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valor da Nossa Proposta (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.ourProposalValue}
                  onChange={e =>
                    setFormData(p => ({
                      ...p,
                      ourProposalValue: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label>Valor Final (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.finalValue}
                  onChange={e =>
                    setFormData(p => ({ ...p, finalValue: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Margem (%)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.margin}
                  onChange={e =>
                    setFormData(p => ({ ...p, margin: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label>Score de Viabilidade (0-100)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.viabilityScore}
                  onChange={e =>
                    setFormData(p => ({ ...p, viabilityScore: e.target.value }))
                  }
                />
              </div>
            </div>

            <div>
              <Label>Razao da Viabilidade</Label>
              <Input
                value={formData.viabilityReason}
                onChange={e =>
                  setFormData(p => ({ ...p, viabilityReason: e.target.value }))
                }
              />
            </div>

            <div>
              <Label>Tags (separadas por virgula)</Label>
              <Input
                value={formData.tags}
                onChange={e =>
                  setFormData(p => ({ ...p, tags: e.target.value }))
                }
                placeholder="tag1, tag2, tag3"
              />
            </div>

            <div>
              <Label>Notas</Label>
              <Textarea
                value={formData.notes}
                onChange={e =>
                  setFormData(p => ({ ...p, notes: e.target.value }))
                }
                rows={3}
              />
            </div>
          </div>
        </Card>
      </PageBody>
    </PageLayout>
  );
}
