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
import { brasilApiService } from '@/services/brasilapi.service';
import type {
  CompanyAddress,
  CreateCompanyAddressData,
  UpdateCompanyAddressData,
} from '@/types/hr';
import { Loader2, MapPin, Search, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

export type AddressFormData = Partial<
  CreateCompanyAddressData | UpdateCompanyAddressData
>;

interface AddressModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  address?: CompanyAddress | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (data: AddressFormData) => Promise<void>;
}

const ADDRESS_TYPES = [
  { label: 'Fiscal', value: 'FISCAL' },
  { label: 'Entrega', value: 'DELIVERY' },
  { label: 'Cobrança', value: 'BILLING' },
  { label: 'Outro', value: 'OTHER' },
];

export function AddressModal({
  isOpen,
  mode,
  address,
  isSubmitting,
  onClose,
  onSubmit,
}: AddressModalProps) {
  const [form, setForm] = useState<AddressFormData>({
    type: 'FISCAL',
    countryCode: 'BR',
    isPrimary: false,
  });
  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const numberInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (address) {
      setForm({
        type: address.type,
        street: address.street || '',
        number: address.number || '',
        complement: address.complement || '',
        district: address.district || '',
        city: address.city || '',
        state: address.state || '',
        zip: address.zip || '',
        countryCode: (address.countryCode || 'BR').substring(0, 4),
        isPrimary: address.isPrimary ?? false,
      });
    } else {
      setForm({ type: 'FISCAL', countryCode: 'BR', isPrimary: false });
    }
  }, [address]);

  const title = useMemo(
    () => (mode === 'create' ? 'Novo endereço' : 'Editar endereço'),
    [mode]
  );

  const handleChange = (
    field: keyof AddressFormData,
    value: string | boolean
  ) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCepSearch = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');

    if (cleanCep.length !== 8) return;

    setIsSearchingCep(true);
    try {
      const data = await brasilApiService.getCep(cleanCep);

      setForm(prev => ({
        ...prev,
        zip: data.cep,
        state: data.state,
        city: data.city,
        district: data.neighborhood || '',
        street: data.street || '',
      }));

      toast.success('CEP encontrado! Dados preenchidos automaticamente.');

      // Focar no campo número após preencher os dados
      setTimeout(() => {
        numberInputRef.current?.focus();
      }, 100);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Erro ao buscar CEP';
      toast.error(message);
    } finally {
      setIsSearchingCep(false);
    }
  };

  const handleCepChange = (value: string) => {
    handleChange('zip', value);

    // Auto-buscar quando tiver 8 dígitos
    const cleanCep = value.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      handleCepSearch(value);
    }
  };

  const handleSubmit = async () => {
    if (!form.zip || !form.street) return;

    // Remover ibgeCityCode do form antes de enviar (se existir)
    const { ibgeCityCode: _ibgeCityCode, ...formData } =
      form as AddressFormData & { ibgeCityCode?: string | null };

    await onSubmit(formData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto [&>button]:hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <DialogTitle className="text-lg font-semibold flex items-center gap-3">
            <div className="flex items-center justify-center text-white shrink-0 bg-linear-to-br from-emerald-500 to-teal-600 p-2 rounded-lg">
              <MapPin className="h-5 w-5" />
            </div>
            {title}
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

        <div className="space-y-6 py-4">
          {/* Tipo de Endereço */}
          <div className="space-y-2">
            <Label htmlFor="addr-type">Tipo de Endereço *</Label>
            <Select
              value={String(form.type || '')}
              onValueChange={value => handleChange('type', value)}
            >
              <SelectTrigger id="addr-type">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {ADDRESS_TYPES.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* CEP com busca */}
          <div className="space-y-2">
            <Label htmlFor="addr-zip">CEP *</Label>
            <div className="relative">
              <Input
                id="addr-zip"
                value={form.zip || ''}
                onChange={e => handleCepChange(e.target.value)}
                placeholder="00000-000"
                required
                disabled={isSearchingCep}
                className="pr-10"
              />
              {isSearchingCep && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
              {!isSearchingCep &&
                form.zip &&
                form.zip.replace(/\D/g, '').length === 8 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                    onClick={() => handleCepSearch(form.zip || '')}
                    aria-label="Buscar CEP"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                )}
            </div>
            <p className="text-xs text-muted-foreground">
              Digite o CEP para buscar automaticamente o endereço
            </p>
          </div>

          {/* Logradouro e Número */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="addr-street">Logradouro *</Label>
              <Input
                id="addr-street"
                value={form.street || ''}
                onChange={e => handleChange('street', e.target.value)}
                placeholder="Rua, Avenida, Travessa..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addr-number">Número *</Label>
              <Input
                id="addr-number"
                ref={numberInputRef}
                value={form.number || ''}
                onChange={e => handleChange('number', e.target.value)}
                placeholder="123"
                required
              />
            </div>
          </div>

          {/* Complemento e Bairro */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="addr-complement">Complemento</Label>
              <Input
                id="addr-complement"
                value={form.complement || ''}
                onChange={e => handleChange('complement', e.target.value)}
                placeholder="Sala, Conjunto, Andar..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addr-district">Bairro *</Label>
              <Input
                id="addr-district"
                value={form.district || ''}
                onChange={e => handleChange('district', e.target.value)}
                placeholder="Centro"
                required
              />
            </div>
          </div>

          {/* Cidade e Estado */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="addr-city">Cidade *</Label>
              <Input
                id="addr-city"
                value={form.city || ''}
                onChange={e => handleChange('city', e.target.value)}
                placeholder="São Paulo"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addr-state">Estado *</Label>
              <Input
                id="addr-state"
                value={form.state || ''}
                onChange={e =>
                  handleChange('state', e.target.value.toUpperCase())
                }
                placeholder="SP"
                maxLength={2}
                required
              />
            </div>
          </div>

          {/* País */}
          <div className="space-y-2">
            <Label htmlFor="addr-country">País</Label>
            <Input
              id="addr-country"
              value={form.countryCode || ''}
              onChange={e =>
                handleChange(
                  'countryCode',
                  e.target.value.toUpperCase().substring(0, 4)
                )
              }
              placeholder="BR"
              maxLength={4}
            />
          </div>

          {/* Endereço Primário */}
          <div
            className="flex items-center justify-between rounded-lg border dark:bg-slate-800 p-4 bg-muted/50 cursor-pointer hover:bg-muted/70 transition-colors"
            role="button"
            tabIndex={0}
            onClick={() => handleChange('isPrimary', !form.isPrimary)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleChange('isPrimary', !form.isPrimary);
              }
            }}
          >
            <div className="space-y-0.5">
              <Label
                htmlFor="addr-primary"
                className="text-sm font-medium cursor-pointer"
              >
                Endereço primário
              </Label>
              <p className="text-xs text-muted-foreground">
                Marcar como endereço principal deste tipo
              </p>
            </div>
            <Switch
              id="addr-primary"
              checked={!!form.isPrimary}
              onCheckedChange={value => handleChange('isPrimary', value)}
              onClick={e => e.stopPropagation()}
            />
          </div>
        </div>

        <DialogFooter className="flex items-center justify-end gap-2 pt-4 border-t">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !form.zip || !form.street}
          >
            {isSubmitting ? 'Salvando...' : 'Salvar endereço'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
