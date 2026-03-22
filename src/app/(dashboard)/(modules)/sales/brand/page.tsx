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
import { useBrand, useUpdateBrand } from '@/hooks/sales/use-catalogs';
import { usePermissions } from '@/hooks/use-permissions';
import { SALES_PERMISSIONS } from '@/config/rbac/permission-codes';
import { Palette, Save, Type } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function BrandPage() {
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission(SALES_PERMISSIONS.BRAND.MODIFY);

  const { data, isLoading, error } = useBrand();
  const updateMutation = useUpdateBrand();

  // Form state
  const [primaryColor, setPrimaryColor] = useState('#4F46E5');
  const [secondaryColor, setSecondaryColor] = useState('#0F172A');
  const [accentColor, setAccentColor] = useState('#F59E0B');
  const [backgroundColor, setBackgroundColor] = useState('#FFFFFF');
  const [textColor, setTextColor] = useState('#1E293B');
  const [fontFamily, setFontFamily] = useState('Inter');
  const [fontHeading, setFontHeading] = useState('');
  const [tagline, setTagline] = useState('');

  useEffect(() => {
    if (data?.brand) {
      const b = data.brand;
      setPrimaryColor(b.primaryColor);
      setSecondaryColor(b.secondaryColor);
      setAccentColor(b.accentColor);
      setBackgroundColor(b.backgroundColor);
      setTextColor(b.textColor);
      setFontFamily(b.fontFamily);
      setFontHeading(b.fontHeading ?? '');
      setTagline(b.tagline ?? '');
    }
  }, [data]);

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        primaryColor,
        secondaryColor,
        accentColor,
        backgroundColor,
        textColor,
        fontFamily,
        fontHeading: fontHeading || null,
        tagline: tagline || null,
      });
      toast.success('Identidade visual atualizada com sucesso');
    } catch {
      toast.error('Erro ao atualizar identidade visual');
    }
  };

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Vendas' },
              { label: 'Identidade Visual' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridLoading />
        </PageBody>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <PageHeader>
          <PageActionBar
            breadcrumbItems={[
              { label: 'Vendas' },
              { label: 'Identidade Visual' },
            ]}
          />
        </PageHeader>
        <PageBody>
          <GridError message={error?.message} />
        </PageBody>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Vendas' },
            { label: 'Identidade Visual' },
          ]}
          actions={
            canEdit
              ? [
                  {
                    label: 'Salvar',
                    icon: Save,
                    onClick: handleSave,
                    disabled: updateMutation.isPending,
                  },
                ]
              : []
          }
        />
      </PageHeader>

      <PageBody>
        {/* Color Palette */}
        <Card className="bg-white/5 py-2 overflow-hidden">
          <div className="p-5 space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Palette className="h-5 w-5 text-indigo-500" />
              <h2 className="text-sm font-semibold">Paleta de Cores</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Cor Primária</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="primaryColor"
                    value={primaryColor}
                    onChange={e => setPrimaryColor(e.target.value)}
                    className="h-9 w-9 cursor-pointer rounded border-0"
                    disabled={!canEdit}
                  />
                  <Input
                    value={primaryColor}
                    onChange={e => setPrimaryColor(e.target.value)}
                    className="flex-1"
                    disabled={!canEdit}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondaryColor">Cor Secundária</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="secondaryColor"
                    value={secondaryColor}
                    onChange={e => setSecondaryColor(e.target.value)}
                    className="h-9 w-9 cursor-pointer rounded border-0"
                    disabled={!canEdit}
                  />
                  <Input
                    value={secondaryColor}
                    onChange={e => setSecondaryColor(e.target.value)}
                    className="flex-1"
                    disabled={!canEdit}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accentColor">Cor de Destaque</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="accentColor"
                    value={accentColor}
                    onChange={e => setAccentColor(e.target.value)}
                    className="h-9 w-9 cursor-pointer rounded border-0"
                    disabled={!canEdit}
                  />
                  <Input
                    value={accentColor}
                    onChange={e => setAccentColor(e.target.value)}
                    className="flex-1"
                    disabled={!canEdit}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="backgroundColor">Cor de Fundo</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="backgroundColor"
                    value={backgroundColor}
                    onChange={e => setBackgroundColor(e.target.value)}
                    className="h-9 w-9 cursor-pointer rounded border-0"
                    disabled={!canEdit}
                  />
                  <Input
                    value={backgroundColor}
                    onChange={e => setBackgroundColor(e.target.value)}
                    className="flex-1"
                    disabled={!canEdit}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="textColor">Cor do Texto</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    id="textColor"
                    value={textColor}
                    onChange={e => setTextColor(e.target.value)}
                    className="h-9 w-9 cursor-pointer rounded border-0"
                    disabled={!canEdit}
                  />
                  <Input
                    value={textColor}
                    onChange={e => setTextColor(e.target.value)}
                    className="flex-1"
                    disabled={!canEdit}
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="mt-4">
              <Label className="mb-2 block">Prévia</Label>
              <div
                className="rounded-lg p-6 border"
                style={{ backgroundColor, color: textColor }}
              >
                <div
                  className="inline-block rounded px-3 py-1 text-white text-sm font-medium mb-2"
                  style={{ backgroundColor: primaryColor }}
                >
                  Botão Primário
                </div>
                <div
                  className="inline-block rounded px-3 py-1 text-white text-sm font-medium mb-2 ml-2"
                  style={{ backgroundColor: secondaryColor }}
                >
                  Botão Secundário
                </div>
                <div
                  className="inline-block rounded px-3 py-1 text-white text-sm font-medium mb-2 ml-2"
                  style={{ backgroundColor: accentColor }}
                >
                  Destaque
                </div>
                <p className="mt-2 text-sm" style={{ fontFamily }}>
                  Este é um exemplo de texto no estilo da sua marca.
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Typography */}
        <Card className="mt-4 bg-white/5 py-2 overflow-hidden">
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Type className="h-5 w-5 text-indigo-500" />
              <h2 className="text-sm font-semibold">Tipografia</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fontFamily">Fonte do Corpo</Label>
                <Input
                  id="fontFamily"
                  value={fontFamily}
                  onChange={e => setFontFamily(e.target.value)}
                  placeholder="Inter"
                  disabled={!canEdit}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fontHeading">Fonte dos Títulos</Label>
                <Input
                  id="fontHeading"
                  value={fontHeading}
                  onChange={e => setFontHeading(e.target.value)}
                  placeholder="Mesmo da fonte do corpo"
                  disabled={!canEdit}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tagline">Slogan</Label>
              <Input
                id="tagline"
                value={tagline}
                onChange={e => setTagline(e.target.value)}
                placeholder="Seu slogan aqui"
                disabled={!canEdit}
              />
            </div>
          </div>
        </Card>
      </PageBody>
    </PageLayout>
  );
}
