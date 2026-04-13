/**
 * OpenSea OS - Printers Page
 * Gerenciamento de impressoras para recibos POS
 */

'use client';

import { GridError } from '@/components/handlers/grid-error';
import { GridLoading } from '@/components/handlers/grid-loading';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { Header } from '@/components/layout/header';
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
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import {
  useDeletePrinter,
  usePrinters,
  useRegisterPrinter,
} from '@/hooks/sales/use-printing';
import type { PrinterConnection, PrinterType } from '@/types/sales';
import { cn } from '@/lib/utils';
import {
  Loader2,
  Plus,
  Printer,
  Trash2,
  Wifi,
  Usb,
  Bluetooth,
  Cable,
} from 'lucide-react';
import { Suspense, useState } from 'react';
import { toast } from 'sonner';

const PRINTER_TYPE_LABELS: Record<PrinterType, string> = {
  THERMAL: 'Térmica',
  INKJET: 'Jato de Tinta',
  LABEL: 'Etiqueta',
};

const CONNECTION_LABELS: Record<PrinterConnection, string> = {
  NETWORK: 'Rede',
  USB: 'USB',
  BLUETOOTH: 'Bluetooth',
  SERIAL: 'Serial',
};

const CONNECTION_ICONS: Record<PrinterConnection, typeof Wifi> = {
  NETWORK: Wifi,
  USB: Usb,
  BLUETOOTH: Bluetooth,
  SERIAL: Cable,
};

export default function PrintersPage() {
  return (
    <Suspense
      fallback={<GridLoading count={6} layout="grid" size="md" gap="gap-4" />}
    >
      <PrintersPageContent />
    </Suspense>
  );
}

function PrintersPageContent() {
  const { data, isLoading, error, refetch } = usePrinters();
  const registerPrinter = useRegisterPrinter();
  const deletePrinter = useDeletePrinter();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<PrinterType>('THERMAL');
  const [connection, setConnection] = useState<PrinterConnection>('NETWORK');
  const [ipAddress, setIpAddress] = useState('');
  const [port, setPort] = useState('9100');
  const [paperWidth, setPaperWidth] = useState<string>('80');

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const printers = data?.printers ?? [];

  const resetForm = () => {
    setName('');
    setType('THERMAL');
    setConnection('NETWORK');
    setIpAddress('');
    setPort('9100');
    setPaperWidth('80');
    setShowForm(false);
  };

  const handleRegister = async () => {
    if (!name.trim()) {
      toast.error('Nome da impressora é obrigatório');
      return;
    }

    try {
      await registerPrinter.mutateAsync({
        name: name.trim(),
        type,
        connection,
        ipAddress:
          connection === 'NETWORK' ? ipAddress || undefined : undefined,
        port: connection === 'NETWORK' ? Number(port) || 9100 : undefined,
        paperWidth: Number(paperWidth) as 80 | 58,
      });
      toast.success('Impressora cadastrada com sucesso!');
      resetForm();
    } catch {
      toast.error('Erro ao cadastrar impressora');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deletePrinter.mutateAsync(deleteTarget);
      toast.success('Impressora removida com sucesso!');
      setDeleteModalOpen(false);
      setDeleteTarget(null);
    } catch {
      toast.error('Erro ao remover impressora');
    }
  };

  return (
    <PageLayout data-testid="printers-page">
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Vendas', href: '/sales' },
            { label: 'Impressoras', href: '/sales/printers' },
          ]}
          buttons={
            !showForm
              ? [
                  {
                    id: 'add-printer',
                    title: 'Nova Impressora',
                    icon: Plus,
                    onClick: () => setShowForm(true),
                    variant: 'default',
                  },
                ]
              : []
          }
        />
        <Header
          title="Impressoras"
          description="Cadastro e gerenciamento de impressoras para recibos POS"
        />
      </PageHeader>

      <PageBody>
        {/* Register Form */}
        {showForm && (
          <Card
            data-testid="printer-register-form"
            className="bg-white/5 py-2 overflow-hidden"
          >
            <div className="px-6 py-4 space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Printer className="h-5 w-5 text-foreground" />
                  <div>
                    <h3 className="text-base font-semibold">Nova Impressora</h3>
                    <p className="text-sm text-muted-foreground">
                      Preencha os dados da impressora
                    </p>
                  </div>
                </div>
                <div className="border-b border-border" />
              </div>

              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="printer-name">
                      Nome <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="printer-name"
                      data-testid="printer-field-name"
                      placeholder="Ex: Impressora Caixa 01"
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="printer-type">Tipo</Label>
                    <Select
                      value={type}
                      onValueChange={v => setType(v as PrinterType)}
                    >
                      <SelectTrigger
                        id="printer-type"
                        data-testid="printer-field-type"
                      >
                        <SelectValue placeholder="Selecione o tipo..." />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(PRINTER_TYPE_LABELS).map(
                          ([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="printer-connection">Conexão</Label>
                    <Select
                      value={connection}
                      onValueChange={v => setConnection(v as PrinterConnection)}
                    >
                      <SelectTrigger
                        id="printer-connection"
                        data-testid="printer-field-connection"
                      >
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CONNECTION_LABELS).map(
                          ([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {connection === 'NETWORK' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="printer-ip">Endereço IP</Label>
                      <Input
                        id="printer-ip"
                        data-testid="printer-field-ip"
                        placeholder="192.168.1.100"
                        value={ipAddress}
                        onChange={e => setIpAddress(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="printer-port">Porta</Label>
                      <Input
                        id="printer-port"
                        data-testid="printer-field-port"
                        type="number"
                        placeholder="9100"
                        value={port}
                        onChange={e => setPort(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="printer-paper">Largura do Papel</Label>
                    <Select value={paperWidth} onValueChange={setPaperWidth}>
                      <SelectTrigger
                        id="printer-paper"
                        data-testid="printer-field-paper"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="80">80 mm</SelectItem>
                        <SelectItem value="58">58 mm</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    data-testid="printer-register-btn"
                    onClick={handleRegister}
                    disabled={!name.trim() || registerPrinter.isPending}
                  >
                    {registerPrinter.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Cadastrar
                  </Button>
                  <Button variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Printers List */}
        {isLoading ? (
          <GridLoading count={6} layout="grid" size="md" gap="gap-4" />
        ) : error ? (
          <GridError
            type="server"
            title="Erro ao carregar impressoras"
            message="Ocorreu um erro. Por favor, tente novamente."
            action={{
              label: 'Tentar Novamente',
              onClick: () => {
                refetch();
              },
            }}
          />
        ) : printers.length === 0 ? (
          <div
            data-testid="printers-empty"
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4">
              <Printer className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold">
              Nenhuma impressora cadastrada
            </h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Cadastre uma impressora para começar a imprimir recibos e
              etiquetas.
            </p>
            {!showForm && (
              <Button className="mt-4" onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Impressora
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {printers.map(printer => {
              const ConnIcon = CONNECTION_ICONS[printer.connection] || Wifi;
              return (
                <div
                  key={printer.id}
                  data-testid={`printer-card-${printer.id}`}
                  className="group relative rounded-xl border bg-card p-4 transition-all hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white bg-gradient-to-br from-slate-600 to-slate-800">
                      <Printer className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                        {printer.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {PRINTER_TYPE_LABELS[printer.type] || printer.type}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border border-sky-600/25 bg-sky-50 dark:bg-sky-500/8 text-sky-700 dark:text-sky-300">
                      <ConnIcon className="h-3 w-3" />
                      {CONNECTION_LABELS[printer.connection] ||
                        printer.connection}
                    </span>
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium border border-gray-300 bg-gray-50 dark:bg-white/[0.04] text-gray-500">
                      {printer.paperWidth} mm
                    </span>
                    {printer.ipAddress && (
                      <span className="text-[11px] text-muted-foreground">
                        {printer.ipAddress}:{printer.port ?? 9100}
                      </span>
                    )}
                  </div>

                  <button
                    data-testid={`printer-delete-${printer.id}`}
                    onClick={e => {
                      e.stopPropagation();
                      setDeleteTarget(printer.id);
                      setDeleteModalOpen(true);
                    }}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <VerifyActionPinModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setDeleteTarget(null);
          }}
          onSuccess={handleDeleteConfirm}
          title="Confirmar Exclusão"
          description="Digite seu PIN de ação para remover esta impressora. Esta ação não pode ser desfeita."
        />
      </PageBody>
    </PageLayout>
  );
}
