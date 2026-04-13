'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PageActionBar } from '@/components/layout/page-action-bar';
import { PageBody, PageLayout } from '@/components/layout/page-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePairDevice } from '@/hooks/sales';
import { Loader2 } from 'lucide-react';

function detectDeviceLabel(): string {
  if (typeof navigator === 'undefined') return 'Dispositivo PDV';
  const ua = navigator.userAgent;
  if (/iPad/i.test(ua)) return 'iPad';
  if (/iPhone/i.test(ua)) return 'iPhone';
  if (/Android/i.test(ua)) return 'Android';
  if (/Windows/i.test(ua)) return 'Windows PC';
  if (/Mac/i.test(ua)) return 'Mac';
  return 'Dispositivo PDV';
}

export default function PosPairPage() {
  const router = useRouter();
  const pairDevice = usePairDevice();

  const [code, setCode] = useState('');
  const [deviceLabel, setDeviceLabel] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setDeviceLabel(detectDeviceLabel());
  }, []);

  async function handlePair() {
    setErrorMessage(null);
    if (code.trim().length !== 6 || !deviceLabel.trim()) return;
    try {
      await pairDevice.mutateAsync({
        pairingCode: code.trim().toUpperCase(),
        deviceLabel: deviceLabel.trim(),
      });
      router.replace('/sales/pos');
    } catch {
      setErrorMessage(
        'Código inválido ou expirado. Solicite um novo código ao administrador.'
      );
    }
  }

  return (
    <PageLayout>
      <PageActionBar
        breadcrumbItems={[
          { label: 'Vendas', href: '/sales' },
          { label: 'PDV', href: '/sales/pos' },
          { label: 'Parear Terminal' },
        ]}
      />
      <PageBody>
        <div className="max-w-md mx-auto py-8">
          <Card className="p-6 space-y-5 bg-white dark:bg-slate-800/60 border border-border">
            <div className="text-center">
              <h2 className="text-xl font-semibold">Parear Terminal</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Digite o código de 6 caracteres exibido no painel de terminais.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pairing-code">Código de pareamento</Label>
              <Input
                id="pairing-code"
                value={code}
                onChange={e => {
                  setErrorMessage(null);
                  setCode(e.target.value.toUpperCase().slice(0, 6));
                }}
                placeholder="XXXXXX"
                maxLength={6}
                className="font-mono text-center text-2xl tracking-widest h-14 uppercase"
                autoComplete="off"
                autoFocus
              />
              {errorMessage ? (
                <p className="text-xs text-rose-600 dark:text-rose-400 text-center">
                  {errorMessage}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground text-center">
                  Solicite o código ao administrador no painel{' '}
                  <code className="font-mono">/sales/terminals</code>.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="device-label">Nome do dispositivo</Label>
              <Input
                id="device-label"
                value={deviceLabel}
                onChange={e => setDeviceLabel(e.target.value)}
                placeholder="Ex.: Tablet do Caixa 01"
              />
            </div>

            <Button
              type="button"
              className="w-full h-11"
              onClick={handlePair}
              disabled={
                pairDevice.isPending ||
                code.trim().length !== 6 ||
                !deviceLabel.trim()
              }
            >
              {pairDevice.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Pareando...
                </>
              ) : (
                'Parear Terminal'
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Após o pareamento, este dispositivo permanecerá vinculado ao
              terminal até que o administrador o revogue.
            </p>
          </Card>
        </div>
      </PageBody>
    </PageLayout>
  );
}
