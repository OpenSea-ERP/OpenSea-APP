import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type {
  CompanyFiscalSettings,
  CreateCompanyFiscalSettingsData,
  UpdateCompanyFiscalSettingsData,
} from '@/types/hr';
import { FileText, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export type FiscalSettingsFormData = Partial<
  CreateCompanyFiscalSettingsData | UpdateCompanyFiscalSettingsData
>;

interface FiscalSettingsModalProps {
  isOpen: boolean;
  fiscalSettings?: CompanyFiscalSettings | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (data: FiscalSettingsFormData) => Promise<void>;
}

export function FiscalSettingsModal({
  isOpen,
  fiscalSettings,
  isSubmitting,
  onClose,
  onSubmit,
}: FiscalSettingsModalProps) {
  const [form, setForm] = useState<FiscalSettingsFormData>({
    nfeEnvironment: 'HOMOLOGATION',
    digitalCertificateType: 'NONE',
    nfceEnabled: false,
  });

  useEffect(() => {
    if (fiscalSettings) {
      setForm({
        nfeEnvironment: fiscalSettings.nfeEnvironment || 'HOMOLOGATION',
        nfeSeries: fiscalSettings.nfeSeries || '',
        nfeLastNumber: fiscalSettings.nfeLastNumber || 0,
        nfeDefaultOperationNature:
          fiscalSettings.nfeDefaultOperationNature || '',
        nfeDefaultCfop: fiscalSettings.nfeDefaultCfop || '',
        digitalCertificateType: fiscalSettings.digitalCertificateType || 'NONE',
        certificateA1ExpiresAt: fiscalSettings.certificateA1ExpiresAt || '',
        nfceEnabled: fiscalSettings.nfceEnabled ?? false,
        nfceCscId: fiscalSettings.nfceCscId || '',
        defaultTaxProfileId: fiscalSettings.defaultTaxProfileId || '',
      });
    } else {
      setForm({
        nfeEnvironment: 'HOMOLOGATION',
        digitalCertificateType: 'NONE',
        nfceEnabled: false,
      });
    }
  }, [fiscalSettings]);

  const handleChange = (
    field: keyof FiscalSettingsFormData,
    value: string | boolean | number
  ) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    await onSubmit(form);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-3xl [&>button]:hidden max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b sticky top-0 bg-background z-10">
          <DialogTitle className="text-lg font-semibold flex items-center gap-3">
            <div className="flex items-center justify-center text-white shrink-0 bg-linear-to-br from-emerald-500 to-teal-600 p-2 rounded-lg">
              <FileText className="h-5 w-5" />
            </div>
            Configurações Fiscais
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="gap-2"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </Button>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-2">
          <div className="col-span-2">
            <h3 className="text-sm font-semibold mb-3">NF-e</h3>
          </div>

          <div>
            <Label htmlFor="fiscal-nfe-env">Ambiente NF-e</Label>
            <Select
              value={String(form.nfeEnvironment || 'HOMOLOGATION')}
              onValueChange={value => handleChange('nfeEnvironment', value)}
            >
              <SelectTrigger id="fiscal-nfe-env">
                <SelectValue placeholder="Selecione o ambiente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HOMOLOGATION">Homologação</SelectItem>
                <SelectItem value="PRODUCTION">Produção</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="fiscal-nfe-series">Série NF-e</Label>
            <Input
              id="fiscal-nfe-series"
              value={form.nfeSeries || ''}
              onChange={e => handleChange('nfeSeries', e.target.value)}
              placeholder="1"
            />
          </div>

          <div>
            <Label htmlFor="fiscal-nfe-last">Último Número NF-e</Label>
            <Input
              id="fiscal-nfe-last"
              value={form.nfeLastNumber || 0}
              onChange={e =>
                handleChange('nfeLastNumber', Number(e.target.value))
              }
              type="number"
              placeholder="0"
            />
          </div>

          <div>
            <Label htmlFor="fiscal-cfop">CFOP Padrão</Label>
            <Input
              id="fiscal-cfop"
              value={form.nfeDefaultCfop || ''}
              onChange={e => handleChange('nfeDefaultCfop', e.target.value)}
              placeholder="5102"
            />
          </div>

          <div className="col-span-2">
            <Label htmlFor="fiscal-op-nature">
              Natureza da Operação Padrão
            </Label>
            <Input
              id="fiscal-op-nature"
              value={form.nfeDefaultOperationNature || ''}
              onChange={e =>
                handleChange('nfeDefaultOperationNature', e.target.value)
              }
              placeholder="Venda de mercadoria"
            />
          </div>

          <div className="col-span-2 border-t pt-4 mt-2">
            <h3 className="text-sm font-semibold mb-3">Certificado Digital</h3>
          </div>

          <div className="col-span-2">
            <Label htmlFor="fiscal-cert-type">Tipo de Certificado</Label>
            <Select
              value={String(form.digitalCertificateType || 'NONE')}
              onValueChange={value =>
                handleChange('digitalCertificateType', value)
              }
            >
              <SelectTrigger id="fiscal-cert-type">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">Nenhum</SelectItem>
                <SelectItem value="A1">A1 (arquivo)</SelectItem>
                <SelectItem value="A3">A3 (token/smartcard)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.digitalCertificateType === 'A1' && (
            <div className="col-span-2">
              <Label htmlFor="fiscal-cert-expires">
                Data de Expiração (A1)
              </Label>
              <Input
                id="fiscal-cert-expires"
                value={form.certificateA1ExpiresAt || ''}
                onChange={e =>
                  handleChange('certificateA1ExpiresAt', e.target.value)
                }
                type="date"
              />
            </div>
          )}

          <div className="col-span-2 border-t pt-4 mt-2">
            <h3 className="text-sm font-semibold mb-3">NFC-e</h3>
          </div>

          <div className="flex items-center justify-between col-span-2 rounded-md border px-4 py-3">
            <div>
              <Label
                htmlFor="fiscal-nfce-enabled"
                className="text-sm font-medium"
              >
                NFC-e Habilitado?
              </Label>
              <p className="text-xs text-muted-foreground">
                Ativar emissão de NFC-e (cupom fiscal eletrônico).
              </p>
            </div>
            <Switch
              id="fiscal-nfce-enabled"
              checked={!!form.nfceEnabled}
              onCheckedChange={value => handleChange('nfceEnabled', value)}
            />
          </div>

          {form.nfceEnabled && (
            <div className="col-span-2">
              <Label htmlFor="fiscal-csc-id">CSC ID (NFC-e)</Label>
              <Input
                id="fiscal-csc-id"
                value={form.nfceCscId || ''}
                onChange={e => handleChange('nfceCscId', e.target.value)}
                placeholder="Código de Segurança do Contribuinte"
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-end gap-2 sticky bottom-0 bg-background pt-4 border-t">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar configurações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
