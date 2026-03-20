/**
 * Edit Manufacturer Page
 * Follows the standard edit page pattern: PageLayout > PageHeader > PageBody
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
import type { HeaderButton } from '@/components/layout/types/header.types';
import { VerifyActionPinModal } from '@/components/modals/verify-action-pin-modal';
import { Card } from '@/components/ui/card';
import {
  CountrySelect,
  COUNTRIES,
  getCountryName,
} from '@/components/ui/country-select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { logger } from '@/lib/logger';
import { formatCEP, formatPhone } from '@/lib/masks';
import type { Manufacturer, UpdateManufacturerRequest } from '@/types/stock';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Factory,
  Globe,
  Info,
  Loader2,
  MapPinHouse,
  NotebookText,
  Phone,
  Save,
  Star,
  Trash2,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { manufacturersApi } from '../../src';

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-foreground" />
          <div>
            <h3 className="text-base font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </div>
      </div>
      <div className="border-b border-border" />
    </div>
  );
}

/** Resolve country name → ISO code */
function getCountryCodeFromName(name: string): string {
  if (!name) return 'BR';
  const lower = name.toLowerCase().trim();
  const match = COUNTRIES.find(c => c.name.toLowerCase() === lower);
  return match?.code ?? 'BR';
}

export default function EditManufacturerPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const manufacturerId = params.id as string;

  // Form state
  const [name, setName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [countryCode, setCountryCode] = useState('BR');
  const [rating, setRating] = useState(0);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [notes, setNotes] = useState('');

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const {
    data: manufacturer,
    isLoading,
    error,
  } = useQuery<Manufacturer>({
    queryKey: ['manufacturers', manufacturerId],
    queryFn: () => manufacturersApi.get(manufacturerId),
    enabled: !!manufacturerId,
  });

  // Load manufacturer data into form
  useEffect(() => {
    if (manufacturer) {
      setName(manufacturer.name || '');
      setLegalName(manufacturer.legalName || '');
      setCnpj(manufacturer.cnpj || '');
      setCountryCode(getCountryCodeFromName(manufacturer.country || ''));
      setEmail(manufacturer.email || '');
      setPhone(manufacturer.phone || '');
      setWebsite(manufacturer.website || '');
      setAddressLine1(manufacturer.addressLine1 || '');
      setAddressLine2(manufacturer.addressLine2 || '');
      setCity(manufacturer.city || '');
      setState(manufacturer.state || '');
      setPostalCode(manufacturer.postalCode || '');
      setIsActive(manufacturer.isActive ?? true);
      setRating(manufacturer.rating || 0);
      setNotes(manufacturer.notes || '');
    }
  }, [manufacturer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !countryCode) {
      toast.error('Nome e País são obrigatórios');
      return;
    }

    try {
      setIsSaving(true);
      const data: UpdateManufacturerRequest = {
        name: name.trim(),
        legalName: legalName.trim() || undefined,
        cnpj: cnpj.trim() || undefined,
        country: getCountryName(countryCode),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        website: website.trim() || undefined,
        addressLine1: addressLine1.trim() || undefined,
        addressLine2: addressLine2.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        postalCode: postalCode.trim() || undefined,
        isActive,
        rating: rating || undefined,
        notes: notes.trim() || undefined,
      };

      await manufacturersApi.update(manufacturerId, data);
      await queryClient.invalidateQueries({ queryKey: ['manufacturers'] });
      toast.success('Fabricante atualizado com sucesso');
      router.push(`/stock/manufacturers/${manufacturerId}`);
    } catch (err) {
      logger.error(
        'Failed to update manufacturer',
        err instanceof Error ? err : new Error(String(err))
      );
      toast.error('Não foi possível atualizar o fabricante');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveClick = () => {
    const form = document.getElementById(
      'manufacturer-form'
    ) as HTMLFormElement;
    if (form) {
      form.dispatchEvent(
        new Event('submit', { cancelable: true, bubbles: true })
      );
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await manufacturersApi.delete(manufacturerId);
      await queryClient.invalidateQueries({ queryKey: ['manufacturers'] });
      toast.success('Fabricante excluído com sucesso!');
      router.push('/stock/manufacturers');
    } catch (err) {
      logger.error(
        'Failed to delete manufacturer',
        err instanceof Error ? err : new Error(String(err)),
        { manufacturerId }
      );
      toast.error('Erro ao excluir fabricante');
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Estoque', href: '/stock' },
              { label: 'Fabricantes', href: '/stock/manufacturers' },
              { label: '...' },
              { label: 'Editar' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" size="md" />
        </PageBody>
      </PageLayout>
    );
  }

  // Error state
  if (error || !manufacturer) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Estoque', href: '/stock' },
              { label: 'Fabricantes', href: '/stock/manufacturers' },
              { label: 'Erro' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Fabricante não encontrado"
            message="O fabricante que você está procurando não existe ou foi removido."
            action={{
              label: 'Voltar para Fabricantes',
              onClick: () => router.push('/stock/manufacturers'),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  const actionButtons: HeaderButton[] = [
    {
      id: 'cancel',
      title: 'Cancelar',
      onClick: () => router.push(`/stock/manufacturers/${manufacturerId}`),
      variant: 'ghost',
    },
    {
      id: 'delete',
      title: 'Excluir',
      icon: Trash2,
      onClick: () => setDeleteModalOpen(true),
      variant: 'default',
      className:
        'bg-slate-200 text-slate-700 border-transparent hover:bg-rose-600 hover:text-white dark:bg-[#334155] dark:text-white dark:hover:bg-rose-600',
      disabled: isDeleting,
    },
    {
      id: 'save',
      title: isSaving ? 'Salvando...' : 'Salvar alterações',
      icon: isSaving ? Loader2 : Save,
      onClick: handleSaveClick,
      variant: 'default',
      disabled: isSaving,
    },
  ];

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Estoque', href: '/stock' },
            { label: 'Fabricantes', href: '/stock/manufacturers' },
            {
              label: manufacturer.name,
              href: `/stock/manufacturers/${manufacturerId}`,
            },
            { label: 'Editar' },
          ]}
          buttons={actionButtons}
        />
      </PageHeader>

      <PageBody>
        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-violet-500 to-purple-600 shadow-lg">
              <Factory className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted-foreground">
                Editando fabricante
              </p>
              <h1 className="truncate text-xl font-bold">
                {manufacturer.name}
              </h1>
            </div>
            <div className="hidden sm:flex items-center gap-3 shrink-0 rounded-lg bg-white/5 px-4 py-2">
              <div className="text-right">
                <p className="text-xs font-semibold">Status</p>
                <p className="text-[11px] text-muted-foreground">
                  {isActive ? 'Ativo' : 'Inativo'}
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
          </div>
        </Card>

        {/* Form Card */}
        <Card className="bg-white/5 overflow-hidden py-2">
          <form
            id="manufacturer-form"
            onSubmit={handleSubmit}
            className="space-y-8 px-6 py-4"
          >
            {/* Identificação */}
            <div className="space-y-5">
              <SectionHeader
                icon={Info}
                title="Identificação"
                subtitle="Dados principais do fabricante"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
                {/* Linha 1: Razão Social + Nome Fantasia */}
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="legalName">Razão Social</Label>
                    <Input
                      id="legalName"
                      value={legalName}
                      onChange={e => setLegalName(e.target.value)}
                      placeholder="Razão social completa"
                      maxLength={256}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="name">
                      Nome Fantasia <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Nome do fabricante"
                      required
                      maxLength={255}
                    />
                  </div>
                </div>

                {/* Linha 2: CNPJ + País */}
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                      id="cnpj"
                      value={cnpj}
                      onChange={e => setCnpj(e.target.value)}
                      placeholder="00.000.000/0000-00"
                      maxLength={18}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>
                      País <span className="text-rose-500">*</span>
                    </Label>
                    <CountrySelect
                      value={countryCode}
                      onValueChange={setCountryCode}
                    />
                  </div>
                </div>

                {/* Linha 3: Website + Avaliação (estrelas) */}
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={website}
                      onChange={e => setWebsite(e.target.value)}
                      placeholder="https://fabricante.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Avaliação</Label>
                    <div className="flex items-center gap-1 h-9">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(rating === star ? 0 : star)}
                          className="p-0.5 rounded hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`h-5 w-5 ${
                              star <= rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'fill-none text-gray-300 dark:text-gray-600 hover:text-amber-300'
                            }`}
                          />
                        </button>
                      ))}
                      {rating > 0 && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {rating}/5
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contato */}
            <div className="space-y-5">
              <SectionHeader
                icon={Phone}
                title="Contato"
                subtitle="Informações de contato"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="contato@fabricante.com"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={e => setPhone(formatPhone(e.target.value))}
                      placeholder="(00) 00000-0000"
                      maxLength={20}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Endereço */}
            <div className="space-y-5">
              <SectionHeader
                icon={MapPinHouse}
                title="Endereço"
                subtitle="Localização do fabricante"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="addressLine1">Endereço Linha 1</Label>
                    <Input
                      id="addressLine1"
                      value={addressLine1}
                      onChange={e => setAddressLine1(e.target.value)}
                      placeholder="Rua, número"
                      maxLength={255}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="addressLine2">Endereço Linha 2</Label>
                    <Input
                      id="addressLine2"
                      value={addressLine2}
                      onChange={e => setAddressLine2(e.target.value)}
                      placeholder="Complemento, bairro"
                      maxLength={255}
                    />
                  </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <div className="grid gap-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      placeholder="São Paulo"
                      maxLength={100}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="state">Estado</Label>
                    <Input
                      id="state"
                      value={state}
                      onChange={e => setState(e.target.value)}
                      placeholder="SP"
                      maxLength={100}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="postalCode">CEP</Label>
                    <Input
                      id="postalCode"
                      value={postalCode}
                      onChange={e => setPostalCode(formatCEP(e.target.value))}
                      placeholder="00000-000"
                      maxLength={20}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-5">
              <SectionHeader
                icon={NotebookText}
                title="Observações"
                subtitle="Notas adicionais"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60">
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Observações adicionais"
                    rows={4}
                    maxLength={1000}
                  />
                </div>
              </div>
            </div>
          </form>
        </Card>
      </PageBody>

      {/* Delete PIN Confirmation Modal */}
      <VerifyActionPinModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onSuccess={handleDelete}
        title="Excluir Fabricante"
        description={`Digite seu PIN de ação para excluir o fabricante "${manufacturer.name}". Esta ação não pode ser desfeita.`}
      />
    </PageLayout>
  );
}
