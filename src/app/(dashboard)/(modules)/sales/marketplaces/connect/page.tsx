'use client';

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
import { useCreateMarketplaceConnection } from '@/hooks/sales/use-marketplaces';
import type { MarketplaceType } from '@/types/sales';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

const MARKETPLACES: { type: MarketplaceType; label: string; description: string }[] = [
  { type: 'MERCADO_LIVRE', label: 'Mercado Livre', description: 'Maior marketplace da America Latina' },
  { type: 'SHOPEE', label: 'Shopee', description: 'Marketplace com forte presenca no Brasil' },
  { type: 'AMAZON', label: 'Amazon Brasil', description: 'Marketplace global com operacao brasileira' },
  { type: 'MAGALU', label: 'Magazine Luiza', description: 'Grande varejista brasileiro' },
  { type: 'TIKTOK_SHOP', label: 'TikTok Shop', description: 'Social commerce em crescimento' },
  { type: 'AMERICANAS', label: 'Americanas', description: 'Marketplace Via Varejo' },
  { type: 'ALIEXPRESS', label: 'AliExpress', description: 'Marketplace internacional' },
  { type: 'CASAS_BAHIA', label: 'Casas Bahia', description: 'Grande varejista brasileiro' },
  { type: 'SHEIN', label: 'Shein', description: 'Marketplace de moda' },
  { type: 'CUSTOM', label: 'Personalizado', description: 'Configuracao manual de API' },
];

export default function ConnectMarketplacePage() {
  const router = useRouter();
  const createMutation = useCreateMarketplaceConnection();
  const [selectedType, setSelectedType] = useState<MarketplaceType | null>(null);
  const [name, setName] = useState('');
  const [sellerId, setSellerId] = useState('');

  const handleConnect = async () => {
    if (!selectedType || !name.trim()) {
      toast.error('Selecione um marketplace e informe o nome da conexao.');
      return;
    }
    try {
      await createMutation.mutateAsync({
        marketplace: selectedType,
        name: name.trim(),
        sellerId: sellerId.trim() || undefined,
      });
      toast.success('Marketplace conectado com sucesso!');
      router.push('/sales/marketplaces');
    } catch {
      toast.error('Erro ao conectar marketplace.');
    }
  };

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbs={[
            { label: 'Vendas' },
            { label: 'Marketplaces', href: '/sales/marketplaces' },
            { label: 'Conectar' },
          ]}
        >
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-2.5"
            onClick={() => router.push('/sales/marketplaces')}
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Voltar
          </Button>
        </PageActionBar>
      </PageHeader>
      <PageBody>
        <div className="mx-auto max-w-3xl space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Selecione o Marketplace</h2>
            <p className="text-sm text-muted-foreground">
              Escolha o marketplace que deseja conectar ao seu ERP.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {MARKETPLACES.map((mp) => (
              <Card
                key={mp.type}
                className={`cursor-pointer p-4 text-center transition-all ${
                  selectedType === mp.type
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'bg-white dark:bg-slate-800/60 border border-border hover:border-primary/40'
                }`}
                onClick={() => setSelectedType(mp.type)}
              >
                <ShoppingBag className="mx-auto h-8 w-8 text-primary/60" />
                <p className="mt-2 text-sm font-medium">{mp.label}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {mp.description}
                </p>
              </Card>
            ))}
          </div>

          {selectedType && (
            <Card className="bg-white dark:bg-slate-800/60 border border-border p-5 space-y-4">
              <h3 className="font-medium">Configuracao da Conexao</h3>
              <div className="space-y-3">
                <div>
                  <Label>Nome da conexao *</Label>
                  <Input
                    placeholder="Ex: Minha Loja Mercado Livre"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={128}
                  />
                </div>
                <div>
                  <Label>ID do vendedor (opcional)</Label>
                  <Input
                    placeholder="Seu ID de vendedor no marketplace"
                    value={sellerId}
                    onChange={(e) => setSellerId(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleConnect}
                  disabled={createMutation.isPending || !name.trim()}
                >
                  {createMutation.isPending
                    ? 'Conectando...'
                    : 'Conectar Marketplace'}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </PageBody>
    </PageLayout>
  );
}
