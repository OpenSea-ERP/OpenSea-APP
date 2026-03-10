'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
  MoneyInput,
} from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { logger } from '@/lib/logger';
import type {
  CreateVariantRequest,
  Pattern,
  Product,
  Template,
  TemplateAttribute,
  UpdateVariantRequest,
  Variant,
} from '@/types/stock';
import { PATTERN_LABELS } from '@/types/stock';
import { PatternDisplay } from './pattern-display';
import { AlertCircle, Info, Loader2, Save } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface VariantFormProps {
  productId: string;
  variant?: Variant;
  product?: Product;
  template?: Template;
  onSave: (data: CreateVariantRequest | UpdateVariantRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string;
}

/**
 * Formulário completo para criar/editar variante
 * Inclui todos os campos necessários: preço, custo, códigos, estoque, etc
 */
export function VariantForm({
  productId,
  variant,
  product,
  template,
  onSave,
  onCancel,
  isLoading = false,
  error,
}: VariantFormProps) {
  const [formData, setFormData] = useState<
    CreateVariantRequest | UpdateVariantRequest
  >(() => {
    if (variant) {
      return {
        sku: variant.sku || '',
        name: variant.name,
        price: variant.price,
        reference: variant.reference || '',
        colorHex: variant.colorHex || '',
        colorPantone: variant.colorPantone || '',
        costPrice: variant.costPrice || 0,
        profitMargin: variant.profitMargin || 0,
        barcode: variant.barcode || '',
        qrCode: variant.qrCode || '',
        eanCode: variant.eanCode || '',
        upcCode: variant.upcCode || '',
        minStock: variant.minStock || 0,
        maxStock: variant.maxStock || 0,
        reorderPoint: variant.reorderPoint || 0,
        reorderQuantity: variant.reorderQuantity || 0,
        attributes: variant.attributes || {},
      };
    }
    return {
      productId,
      name: '',
      price: 0,
      reference: '',
      colorHex: '',
      colorPantone: '',
      costPrice: 0,
      profitMargin: 0,
      minStock: 0,
      maxStock: 0,
      reorderPoint: 0,
      reorderQuantity: 0,
      attributes: {},
    };
  });

  const [activeSection, setActiveSection] = useState<
    'basic' | 'pricing' | 'stock' | 'codes' | 'attributes' | 'similars'
  >('basic');

  // Campos para os novos dados de variante
  const [reference, setReference] = useState(() => {
    return (variant?.reference as string) || '';
  });
  const [colorHex, setColorHex] = useState(() => {
    return (variant?.colorHex as string) || '';
  });
  const [colorPantone, setColorPantone] = useState(() => {
    return (variant?.colorPantone as string) || '';
  });
  const [secondaryColorHex, setSecondaryColorHex] = useState(() => {
    return (variant?.secondaryColorHex as string) || '';
  });
  const [secondaryColorPantone, setSecondaryColorPantone] = useState(() => {
    return (variant?.secondaryColorPantone as string) || '';
  });
  const [pattern, setPattern] = useState<Pattern | ''>(() => {
    return variant?.pattern || '';
  });
  const [isDiscontinued, setIsDiscontinued] = useState(() => {
    return variant?.outOfLine || false;
  });
  const [isActive, setIsActive] = useState(() => {
    return variant?.isActive ?? true;
  });
  const [similars, setSimilars] = useState<unknown[]>(
    (variant?.similars as unknown[]) || []
  );

  // Preços calculados vs informados
  const [calculatedCostPrice] = useState(variant?.costPrice || 0); // Viria da média dos items
  const [informedCostPrice, setInformedCostPrice] = useState(
    variant?.costPrice || 0
  );
  const [profitMarginPercent, setProfitMarginPercent] = useState(
    variant?.profitMargin || 0
  );
  const [calculatedSalePrice, setCalculatedSalePrice] = useState(0);
  const [definedSalePrice, setDefinedSalePrice] = useState(variant?.price || 0);
  const [calculatedProfitMargin, setCalculatedProfitMargin] = useState(0);

  // Calcular preço de venda baseado na margem
  useEffect(() => {
    if (informedCostPrice > 0 && profitMarginPercent > 0) {
      const calculated = informedCostPrice * (1 + profitMarginPercent / 100);
      setCalculatedSalePrice(Number(calculated.toFixed(2)));
    } else {
      setCalculatedSalePrice(0);
    }
  }, [informedCostPrice, profitMarginPercent]);

  // Calcular margem baseada no preço de venda definido
  useEffect(() => {
    if (informedCostPrice > 0 && definedSalePrice > 0) {
      const margin =
        ((definedSalePrice - informedCostPrice) / informedCostPrice) * 100;
      setCalculatedProfitMargin(Number(margin.toFixed(2)));
    } else {
      setCalculatedProfitMargin(0);
    }
  }, [informedCostPrice, definedSalePrice]);

  // Sincronizar estados quando variant.id mudar (para modo edit)
  useEffect(() => {
    if (variant) {
      setReference(variant.reference || '');
      setColorHex(variant.colorHex || '');
      setColorPantone(variant.colorPantone || '');
      setSecondaryColorHex(variant.secondaryColorHex || '');
      setSecondaryColorPantone(variant.secondaryColorPantone || '');
      setPattern(variant.pattern || '');
      setIsDiscontinued(variant.outOfLine || false);
      setIsActive(variant.isActive ?? true);
      setSimilars((variant.similars as unknown[]) || []);
      setInformedCostPrice(variant.costPrice || 0);
      setProfitMarginPercent(variant.profitMargin || 0);
      setDefinedSalePrice(variant.price || 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variant?.id]);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      const numFields = [
        'price',
        'costPrice',
        'profitMargin',
        'minStock',
        'maxStock',
        'reorderPoint',
        'reorderQuantity',
      ];

      setFormData(prev => ({
        ...prev,
        [name]: numFields.includes(name) ? parseFloat(value) || 0 : value,
      }));
    },
    []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      return;
    }

    try {
      // Clean up empty strings to undefined for optional fields
      const cleanData = {
        ...formData,
        price:
          definedSalePrice > 0 ? definedSalePrice : calculatedSalePrice || 0,
        costPrice: informedCostPrice || undefined,
        profitMargin: profitMarginPercent || undefined,
        sku: formData.sku?.trim() || undefined,
        barcode: formData.barcode?.trim() || undefined,
        qrCode: formData.qrCode?.trim() || undefined,
        eanCode: formData.eanCode?.trim() || undefined,
        upcCode: formData.upcCode?.trim() || undefined,
        reference: reference?.trim() || undefined,
        colorHex: colorHex?.trim() || undefined,
        colorPantone: colorPantone?.trim() || undefined,
        secondaryColorHex: secondaryColorHex?.trim() || undefined,
        secondaryColorPantone: secondaryColorPantone?.trim() || undefined,
        pattern: pattern || undefined,
        outOfLine: isDiscontinued,
        isActive,
        similars: similars.length > 0 ? similars : undefined,
        attributes: formData.attributes,
      };

      await onSave(cleanData);
    } catch (err) {
      logger.error(
        'Erro ao salvar variante',
        err instanceof Error ? err : undefined
      );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header com ações */}
      <div className="flex items-center justify-between sticky top-0 py-4 z-10 border-b border-gray-200 dark:border-slate-700 -mx-6 px-6 pb-8">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {variant ? 'Editar Variante' : 'Nova Variante'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {variant
              ? `Editando: ${variant.name}`
              : 'Complete todos os campos obrigatórios'}
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex gap-3 p-4 rounded-lg bg-red-50 border border-red-200 dark:bg-red-950/20 dark:border-red-900">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Section Tabs */}
      <div className="flex gap-4  dark:border-slate-700 mb-8 bg-slate-800/50 rounded-lg h-12">
        {(
          [
            'basic',
            'pricing',
            'stock',
            'codes',
            'attributes',
            'similars',
          ] as const
        ).map(section => (
          <button
            key={section}
            type="button"
            onClick={() => setActiveSection(section)}
            className={`px-4 py-2 cursor-pointer text-sm font-medium transition-colors ${
              activeSection === section
                ? '  text-blue-600 dark:text-blue-400'
                : ' text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 '
            }`}
          >
            {section === 'basic' && 'Informações Básicas'}
            {section === 'pricing' && 'Preços'}
            {section === 'stock' && 'Estoque'}
            {section === 'codes' && 'Códigos'}
            {section === 'attributes' && 'Atributos'}
            {section === 'similars' && 'Itens Semelhantes'}
          </button>
        ))}
      </div>

      {/* Section: Basic */}
      {activeSection === 'basic' && (
        <div className="space-y-4">
          {/* Linha 1: Nome, Referência */}
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">
                Nome da Variante <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                name="name"
                value={(formData.name as string) || ''}
                onChange={handleInputChange}
                placeholder="Ex: Azul - Tamanho M"
                required
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reference">Referência da Variante</Label>
              <Input
                id="reference"
                name="reference"
                value={reference}
                onChange={e => setReference(e.target.value)}
                placeholder="Código de referência"
                disabled={isLoading}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center gap-4 justify-start">
                <div className="flex gap-2 ">
                  <Label htmlFor="isDiscontinued" className="cursor-pointer">
                    Fora de Linha
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Produto descontinuado</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Switch
                  id="isDiscontinued"
                  checked={isDiscontinued}
                  onCheckedChange={setIsDiscontinued}
                  disabled={isLoading}
                />
              </div>

              <div className="flex flex-col items-center gap-4 justify-start">
                <div className="flex gap-2 ">
                  <Label htmlFor="isActive" className="cursor-pointer">
                    Ativo
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Produto disponível para venda</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={setIsActive}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Linha 1.5: Fora de Linha, Ativo */}

          {/* Linha 2: Cor, Pantone */}
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="colorHex">Cor de Exibição</Label>
              <div className="flex gap-2">
                <Input
                  value={colorHex || ''}
                  onChange={e => setColorHex(e.target.value)}
                  placeholder="#000000"
                  disabled={isLoading}
                  className="flex-1"
                />
                <Input
                  id="colorHex"
                  name="colorHex"
                  type="color"
                  value={colorHex || '#000000'}
                  onChange={e => setColorHex(e.target.value)}
                  disabled={isLoading}
                  className="w-16 h-12 p-1  cursor-pointer"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="colorPantone">Pantone</Label>
              <Input
                id="colorPantone"
                name="colorPantone"
                value={colorPantone}
                onChange={e => setColorPantone(e.target.value)}
                placeholder="Ex: PANTONE 19-4052"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Linha 3: Cor Secundária */}
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="secondaryColorHex">Cor Secundária</Label>
              <div className="flex gap-2">
                <Input
                  value={secondaryColorHex || ''}
                  onChange={e => setSecondaryColorHex(e.target.value)}
                  placeholder="#000000"
                  disabled={isLoading}
                  className="flex-1"
                />
                <Input
                  id="secondaryColorHex"
                  name="secondaryColorHex"
                  type="color"
                  value={secondaryColorHex || '#d1d5db'}
                  onChange={e => setSecondaryColorHex(e.target.value)}
                  disabled={isLoading}
                  className="w-16 h-12 p-1 cursor-pointer"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="secondaryColorPantone">Pantone Secundário</Label>
              <Input
                id="secondaryColorPantone"
                name="secondaryColorPantone"
                value={secondaryColorPantone}
                onChange={e => setSecondaryColorPantone(e.target.value)}
                placeholder="Ex: PANTONE 14-0105"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Linha 4: Padrão */}
          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="pattern">Padrão</Label>
              <div className="flex items-center gap-3">
                <Select
                  value={pattern}
                  onValueChange={value => setPattern(value as Pattern)}
                >
                  <SelectTrigger id="pattern" className="flex-1">
                    <SelectValue placeholder="Selecione o padrão..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(PATTERN_LABELS) as [Pattern, string][]).map(
                      ([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      )
                    )}
                  </SelectContent>
                </Select>
                {pattern && (
                  <PatternDisplay
                    pattern={pattern}
                    colorHex={colorHex || undefined}
                    secondaryColorHex={secondaryColorHex || undefined}
                    size="lg"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section: Pricing */}
      {activeSection === 'pricing' && (
        <TooltipProvider>
          <div className="space-y-4">
            {/* Linha 1: Custo Calculado, Custo Informado, Margem */}
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="calculatedCostPrice">
                    Preço de Custo Calculado
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Média do custo dos items</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText>R$</InputGroupText>
                  </InputGroupAddon>
                  <MoneyInput
                    id="calculatedCostPrice"
                    value={calculatedCostPrice}
                    disabled
                    className="bg-muted"
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupText>BRL</InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="informedCostPrice">
                  Preço de Custo Informado
                </Label>
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText>R$</InputGroupText>
                  </InputGroupAddon>
                  <MoneyInput
                    id="informedCostPrice"
                    value={informedCostPrice}
                    onChange={value => setInformedCostPrice(value)}
                    placeholder="0,00"
                    disabled={isLoading}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupText>BRL</InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="profitMarginPercent">Margem de Lucro (%)</Label>
                <Input
                  id="profitMarginPercent"
                  type="number"
                  step="0.1"
                  min="0"
                  value={profitMarginPercent || ''}
                  onChange={e =>
                    setProfitMarginPercent(parseFloat(e.target.value) || 0)
                  }
                  placeholder="0.0"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Linha 2: Preço Calculado, Preço Definido, Margem Calculada */}
            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="calculatedSalePrice">
                    Preço de Venda Calculado
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Baseado na margem de lucro</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText>R$</InputGroupText>
                  </InputGroupAddon>
                  <MoneyInput
                    id="calculatedSalePrice"
                    value={calculatedSalePrice}
                    disabled
                    className="bg-muted"
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupText>BRL</InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="definedSalePrice">
                  Preço de Venda Definido
                </Label>
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText>R$</InputGroupText>
                  </InputGroupAddon>
                  <MoneyInput
                    id="definedSalePrice"
                    value={definedSalePrice}
                    onChange={value => setDefinedSalePrice(value)}
                    placeholder="0,00"
                    disabled={isLoading}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupText>BRL</InputGroupText>
                  </InputGroupAddon>
                </InputGroup>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="calculatedProfitMargin">
                    Margem de Lucro Calculada (%)
                  </Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Baseado no preço definido</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="calculatedProfitMargin"
                  type="number"
                  step="0.01"
                  value={calculatedProfitMargin.toFixed(2)}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>
          </div>
        </TooltipProvider>
      )}

      {/* Section: Stock */}
      {activeSection === 'stock' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="minStock">Estoque Mínimo</Label>
              <Input
                id="minStock"
                name="minStock"
                type="number"
                min="0"
                value={
                  ((formData as CreateVariantRequest).minStock as number) || ''
                }
                onChange={handleInputChange}
                placeholder="0"
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="maxStock">Estoque Máximo</Label>
              <Input
                id="maxStock"
                name="maxStock"
                type="number"
                min="0"
                value={
                  ((formData as CreateVariantRequest).maxStock as number) || ''
                }
                onChange={handleInputChange}
                placeholder="0"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="reorderPoint">Ponto de Reposição</Label>
              <Input
                id="reorderPoint"
                name="reorderPoint"
                type="number"
                min="0"
                value={
                  ((formData as CreateVariantRequest).reorderPoint as number) ||
                  ''
                }
                onChange={handleInputChange}
                placeholder="0"
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reorderQuantity">Quantidade de Reposição</Label>
              <Input
                id="reorderQuantity"
                name="reorderQuantity"
                type="number"
                min="0"
                value={
                  ((formData as CreateVariantRequest)
                    .reorderQuantity as number) || ''
                }
                onChange={handleInputChange}
                placeholder="0"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
      )}

      {/* Section: Codes */}
      {activeSection === 'codes' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="barcode">Código de Barras</Label>
              <Input
                id="barcode"
                name="barcode"
                value={
                  ((formData as CreateVariantRequest).barcode as string) || ''
                }
                onChange={handleInputChange}
                placeholder="Ex: 1234567890"
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="qrCode">QR Code</Label>
              <Input
                id="qrCode"
                name="qrCode"
                value={
                  ((formData as CreateVariantRequest).qrCode as string) || ''
                }
                onChange={handleInputChange}
                placeholder="Conteúdo do QR code"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="eanCode">Código EAN</Label>
              <Input
                id="eanCode"
                name="eanCode"
                value={
                  ((formData as CreateVariantRequest).eanCode as string) || ''
                }
                onChange={handleInputChange}
                placeholder="Ex: 5901234123457"
                disabled={isLoading}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="upcCode">Código UPC</Label>
              <Input
                id="upcCode"
                name="upcCode"
                value={
                  ((formData as CreateVariantRequest).upcCode as string) || ''
                }
                onChange={handleInputChange}
                placeholder="Ex: 12345670"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
      )}

      {/* Section: Attributes */}
      {activeSection === 'attributes' && (
        <TooltipProvider>
          <div className="space-y-4">
            {template?.variantAttributes &&
            Object.keys(template.variantAttributes).length > 0 ? (
              <div className="grid grid-cols-3 gap-4">
                {Object.entries(template.variantAttributes).map(
                  ([key, config]: [string, TemplateAttribute]) => {
                    const rawAttrValue = (
                      formData.attributes as Record<string, unknown>
                    )?.[key];
                    const currentValue = String(rawAttrValue ?? '');
                    const configType: string = config.type;
                    const isBooleanType =
                      configType === 'boolean' || configType === 'sim/nao';

                    return (
                      <div key={key} className="grid gap-2">
                        {isBooleanType ? (
                          <>
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`attr-${key}`}>
                                {config.label || key}
                                {config.required && (
                                  <span className="text-red-500">*</span>
                                )}
                              </Label>
                              {config.description && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{config.description}</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                            <Switch
                              id={`attr-${key}`}
                              checked={
                                rawAttrValue === true ||
                                currentValue === 'true' ||
                                currentValue === 'sim' ||
                                currentValue === '1'
                              }
                              onCheckedChange={checked => {
                                setFormData(prev => ({
                                  ...prev,
                                  attributes: {
                                    ...prev.attributes,
                                    [key]: checked,
                                  },
                                }));
                              }}
                              disabled={isLoading}
                            />
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`attr-${key}`}>
                                {config.label || key}
                                {config.required && (
                                  <span className="text-red-500">*</span>
                                )}
                              </Label>
                              {config.description && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{config.description}</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>

                            {config.type === 'select' ? (
                              <Select
                                value={currentValue}
                                onValueChange={value => {
                                  setFormData(prev => ({
                                    ...prev,
                                    attributes: {
                                      ...prev.attributes,
                                      [key]: value,
                                    },
                                  }));
                                }}
                                disabled={isLoading}
                              >
                                <SelectTrigger id={`attr-${key}`}>
                                  <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {config.options?.map((option: string) => (
                                    <SelectItem key={option} value={option}>
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : config.type === 'number' ? (
                              <Input
                                id={`attr-${key}`}
                                type="number"
                                value={currentValue}
                                onChange={e => {
                                  setFormData(prev => ({
                                    ...prev,
                                    attributes: {
                                      ...prev.attributes,
                                      [key]: parseFloat(e.target.value) || 0,
                                    },
                                  }));
                                }}
                                placeholder={config.placeholder || ''}
                                required={config.required}
                                disabled={isLoading}
                              />
                            ) : config.type === 'date' ? (
                              <Input
                                id={`attr-${key}`}
                                type="date"
                                value={currentValue}
                                onChange={e => {
                                  setFormData(prev => ({
                                    ...prev,
                                    attributes: {
                                      ...prev.attributes,
                                      [key]: e.target.value,
                                    },
                                  }));
                                }}
                                required={config.required}
                                disabled={isLoading}
                              />
                            ) : (
                              <Input
                                id={`attr-${key}`}
                                type="text"
                                value={currentValue}
                                onChange={e => {
                                  setFormData(prev => ({
                                    ...prev,
                                    attributes: {
                                      ...prev.attributes,
                                      [key]: e.target.value,
                                    },
                                  }));
                                }}
                                placeholder={config.placeholder || ''}
                                required={config.required}
                                disabled={isLoading}
                              />
                            )}
                          </>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Nenhum atributo personalizado definido no template
                </p>
              </div>
            )}
          </div>
        </TooltipProvider>
      )}

      {/* Section: Similars */}
      {activeSection === 'similars' && (
        <div className="space-y-4">
          <div className="p-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
            <Label className="mb-3 block">Itens Semelhantes</Label>
            <p className="text-sm text-muted-foreground mb-4">
              Adicione IDs de variantes de outros produtos que são semelhantes a
              esta variante.
            </p>
            <div className="space-y-2">
              {similars.map((similarId, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={String(similarId || '')}
                    onChange={e => {
                      const newSimilars = [...similars];
                      newSimilars[index] = e.target.value;
                      setSimilars(newSimilars);
                    }}
                    placeholder="ID da variante semelhante"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setSimilars(similars.filter((_, i) => i !== index));
                    }}
                    disabled={isLoading}
                    aria-label="Remover item semelhante"
                  >
                    ×
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => setSimilars([...similars, ''])}
                disabled={isLoading}
                className="w-full"
              >
                + Adicionar Item Semelhante
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 border-t border-gray-200 dark:border-slate-700 pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading} className="gap-2 ml-auto">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {variant ? 'Atualizar' : 'Criar'} Variante
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
