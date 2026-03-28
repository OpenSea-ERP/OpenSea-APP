/**
 * OpenSea OS - Geofence Zone Edit Page
 * Follows pattern: PageLayout > PageActionBar (Delete + Save) > Identity Card > Section Cards
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
import { FormErrorIcon } from '@/components/ui/form-error-icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { translateError } from '@/lib/error-messages';
import { logger } from '@/lib/logger';
import type { GeofenceZone } from '@/types/hr';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Loader2,
  MapPin,
  Navigation,
  NotebookText,
  Radius,
  Save,
  Trash2,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  geofenceZonesApi,
  geofenceZoneKeys,
  formatDate,
  formatRadius,
  useUpdateGeofenceZone,
  useDeleteGeofenceZone,
} from '../../src';

// =============================================================================
// SECTION HEADER
// =============================================================================

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
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-foreground" />
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="border-b border-border" />
    </div>
  );
}

// =============================================================================
// PAGE
// =============================================================================

export default function GeofenceZoneEditPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const zoneId = params.id as string;

  // ==========================================================================
  // STATE
  // ==========================================================================

  const [isSaving, setIsSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: '',
    latitude: '',
    longitude: '',
    radiusMeters: '',
    address: '',
    isActive: true,
  });

  // ==========================================================================
  // DATA FETCHING
  // ==========================================================================

  const { data: zone, isLoading } = useQuery<GeofenceZone | null>({
    queryKey: geofenceZoneKeys.detail(zoneId),
    queryFn: async () => {
      const zones = await geofenceZonesApi.list();
      return zones.find(z => z.id === zoneId) ?? null;
    },
  });

  // ==========================================================================
  // MUTATIONS
  // ==========================================================================

  const updateMutation = useUpdateGeofenceZone();
  const deleteMutation = useDeleteGeofenceZone();

  // ==========================================================================
  // EFFECTS
  // ==========================================================================

  useEffect(() => {
    if (zone) {
      setFormData({
        name: zone.name,
        latitude: String(zone.latitude),
        longitude: String(zone.longitude),
        radiusMeters: String(zone.radiusMeters),
        address: zone.address || '',
        isActive: zone.isActive,
      });
    }
  }, [zone]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleSubmit = async () => {
    if (!zone) return;

    if (!formData.name.trim()) {
      setFieldErrors({ name: 'O nome é obrigatório.' });
      return;
    }

    const latitude = parseFloat(formData.latitude);
    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      setFieldErrors({ latitude: 'Latitude inválida (entre -90 e 90).' });
      return;
    }

    const longitude = parseFloat(formData.longitude);
    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      setFieldErrors({ longitude: 'Longitude inválida (entre -180 e 180).' });
      return;
    }

    const radiusMeters = parseInt(formData.radiusMeters, 10);
    if (isNaN(radiusMeters) || radiusMeters <= 0) {
      setFieldErrors({ radiusMeters: 'O raio deve ser maior que zero.' });
      return;
    }

    try {
      setIsSaving(true);
      setFieldErrors({});
      await updateMutation.mutateAsync({
        id: zoneId,
        data: {
          name: formData.name,
          latitude,
          longitude,
          radiusMeters,
          address: formData.address || null,
          isActive: formData.isActive,
        },
      });
      await queryClient.invalidateQueries({
        queryKey: geofenceZoneKeys.lists(),
      });
      await queryClient.invalidateQueries({
        queryKey: geofenceZoneKeys.detail(zoneId),
      });
      toast.success('Zona de geofencing atualizada com sucesso!');
      router.push(`/hr/geofence-zones/${zoneId}`);
    } catch (err) {
      logger.error(
        'Failed to update geofence zone',
        err instanceof Error ? err : undefined
      );
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('already exists') || msg.includes('name already')) {
        setFieldErrors({ name: translateError(msg) });
      } else {
        toast.error(translateError(msg));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!zone) return;
    try {
      await deleteMutation.mutateAsync(zone.id);
      setDeleteModalOpen(false);
      router.push('/hr/geofence-zones');
    } catch (err) {
      logger.error(
        'Failed to delete geofence zone',
        err instanceof Error ? err : undefined
      );
      toast.error(translateError(err));
    }
  };

  // ==========================================================================
  // ACTION BUTTONS
  // ==========================================================================

  const actionButtons: HeaderButton[] = [
    {
      id: 'cancel',
      title: 'Cancelar',
      onClick: () => router.push(`/hr/geofence-zones/${zoneId}`),
      variant: 'ghost',
    },
    {
      id: 'delete',
      title: 'Excluir',
      icon: Trash2,
      onClick: () => setDeleteModalOpen(true),
      variant: 'default' as const,
      className:
        'bg-slate-200 text-slate-700 border-transparent hover:bg-rose-600 hover:text-white dark:bg-slate-800 dark:text-white dark:hover:bg-rose-600',
    },
    {
      id: 'save',
      title: isSaving ? 'Salvando...' : 'Salvar Alterações',
      icon: isSaving ? Loader2 : Save,
      onClick: handleSubmit,
      variant: 'default',
      disabled: isSaving,
    },
  ];

  // ==========================================================================
  // BREADCRUMBS
  // ==========================================================================

  const breadcrumbItems = [
    { label: 'RH', href: '/hr' },
    { label: 'Zonas de Geofencing', href: '/hr/geofence-zones' },
    {
      label: zone?.name || '...',
      href: `/hr/geofence-zones/${zoneId}`,
    },
    { label: 'Editar' },
  ];

  // ==========================================================================
  // LOADING / ERROR
  // ==========================================================================

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridLoading count={3} layout="list" size="md" />
        </PageBody>
      </PageLayout>
    );
  }

  if (!zone) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar breadcrumbItems={breadcrumbItems} />
        </PageHeader>
        <PageBody>
          <GridError
            type="not-found"
            title="Zona de geofencing não encontrada"
            message="A zona de geofencing solicitada não foi encontrada."
            action={{
              label: 'Voltar para Zonas de Geofencing',
              onClick: () => router.push('/hr/geofence-zones'),
            }}
          />
        </PageBody>
      </PageLayout>
    );
  }

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={breadcrumbItems}
          buttons={actionButtons}
        />
      </PageHeader>

      <PageBody>
        {/* Identity Card */}
        <Card className="bg-white/5 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-teal-500 to-emerald-600 shadow-lg">
              <MapPin className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">
                Editando zona de geofencing
              </p>
              <h1 className="text-xl font-bold truncate">{zone.name}</h1>
              <p className="text-sm text-muted-foreground">
                {zone.isActive ? 'Ativa' : 'Inativa'} ·{' '}
                {formatRadius(zone.radiusMeters)} ·{' '}
                Criado em {formatDate(zone.createdAt)}
              </p>
            </div>
          </div>
        </Card>

        {/* Section: Dados da Zona */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={NotebookText}
                title="Dados da Zona"
                subtitle="Nome, endereço e status da zona"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nome */}
                  <div className="grid gap-2">
                    <Label htmlFor="name">
                      Nome <span className="text-rose-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={e => {
                          setFormData({ ...formData, name: e.target.value });
                          if (fieldErrors.name)
                            setFieldErrors(prev => ({ ...prev, name: '' }));
                        }}
                        placeholder="Nome da zona"
                        aria-invalid={!!fieldErrors.name}
                      />
                      {fieldErrors.name && (
                        <FormErrorIcon message={fieldErrors.name} />
                      )}
                    </div>
                  </div>

                  {/* Endereço */}
                  <div className="grid gap-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={e =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      placeholder="Endereço da zona (opcional)"
                    />
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-3">
                  <input
                    id="isActive"
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        isActive: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="isActive" className="cursor-pointer">
                    Zona ativa
                  </Label>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Section: Localização */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={Navigation}
                title="Localização"
                subtitle="Coordenadas geográficas da zona"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Latitude */}
                  <div className="grid gap-2">
                    <Label htmlFor="latitude">
                      Latitude <span className="text-rose-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="latitude"
                        type="number"
                        step="0.000001"
                        min="-90"
                        max="90"
                        value={formData.latitude}
                        onChange={e => {
                          setFormData({
                            ...formData,
                            latitude: e.target.value,
                          });
                          if (fieldErrors.latitude)
                            setFieldErrors(prev => ({
                              ...prev,
                              latitude: '',
                            }));
                        }}
                        placeholder="Ex: -23.550520"
                        aria-invalid={!!fieldErrors.latitude}
                      />
                      {fieldErrors.latitude && (
                        <FormErrorIcon message={fieldErrors.latitude} />
                      )}
                    </div>
                  </div>

                  {/* Longitude */}
                  <div className="grid gap-2">
                    <Label htmlFor="longitude">
                      Longitude <span className="text-rose-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="longitude"
                        type="number"
                        step="0.000001"
                        min="-180"
                        max="180"
                        value={formData.longitude}
                        onChange={e => {
                          setFormData({
                            ...formData,
                            longitude: e.target.value,
                          });
                          if (fieldErrors.longitude)
                            setFieldErrors(prev => ({
                              ...prev,
                              longitude: '',
                            }));
                        }}
                        placeholder="Ex: -46.633308"
                        aria-invalid={!!fieldErrors.longitude}
                      />
                      {fieldErrors.longitude && (
                        <FormErrorIcon message={fieldErrors.longitude} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Section: Área de Cobertura */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="px-6 py-4 space-y-8">
            <div className="space-y-5">
              <SectionHeader
                icon={Radius}
                title="Área de Cobertura"
                subtitle="Raio de abrangência da zona em metros"
              />
              <div className="w-full rounded-xl border border-border bg-white p-6 dark:bg-slate-800/60 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Raio */}
                  <div className="grid gap-2">
                    <Label htmlFor="radiusMeters">
                      Raio (metros) <span className="text-rose-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="radiusMeters"
                        type="number"
                        step="1"
                        min="1"
                        value={formData.radiusMeters}
                        onChange={e => {
                          setFormData({
                            ...formData,
                            radiusMeters: e.target.value,
                          });
                          if (fieldErrors.radiusMeters)
                            setFieldErrors(prev => ({
                              ...prev,
                              radiusMeters: '',
                            }));
                        }}
                        placeholder="Ex: 200"
                        aria-invalid={!!fieldErrors.radiusMeters}
                      />
                      {fieldErrors.radiusMeters && (
                        <FormErrorIcon message={fieldErrors.radiusMeters} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </PageBody>

      {/* Delete PIN Modal */}
      <VerifyActionPinModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onSuccess={handleDeleteConfirm}
        title="Excluir Zona de Geofencing"
        description={`Digite seu PIN de ação para excluir a zona "${zone.name}". Esta ação não pode ser desfeita.`}
      />
    </PageLayout>
  );
}
