/**
 * Create Template Modal
 * Modal para criar/editar template completo
 */

'use client';

import { Button } from '@/components/ui/button';
import { logger } from '@/lib/logger';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  CreateTemplateRequest,
  TemplateAttribute,
  TemplateAttributes,
  TemplateAttributeType,
  UnitOfMeasure,
} from '@/types/stock';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface Attribute {
  key: string;
  label: string;
  type: TemplateAttributeType;
  required: boolean;
  options?: string[];
}

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTemplateRequest) => Promise<void>;
  initialData?: {
    name: string;
    variantAttributes?: Record<string, unknown>;
    itemAttributes?: Record<string, unknown>;
  };
}

export function CreateTemplateModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: CreateTemplateModalProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [unitOfMeasure, setUnitOfMeasure] = useState<string>('UNITS');
  const [variantAttributes, setVariantAttributes] = useState<Attribute[]>(
    parseAttributes(initialData?.variantAttributes || {})
  );
  const [itemAttributes, setItemAttributes] = useState<Attribute[]>(
    parseAttributes(initialData?.itemAttributes || {})
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  function parseAttributes(attrs: Record<string, unknown>): Attribute[] {
    return Object.entries(attrs).map(([key, value]) => {
      const attr = value as TemplateAttribute;
      return {
        key,
        label: attr.label || key,
        type: attr.type || 'string',
        required: attr.required || false,
        options: attr.options,
      };
    });
  }

  function formatAttributes(attrs: Attribute[]): TemplateAttributes {
    const result: TemplateAttributes = {};
    attrs.forEach(attr => {
      if (attr.key) {
        result[attr.key] = {
          label: attr.label,
          type: attr.type,
          required: attr.required,
          ...(attr.options && attr.options.length > 0
            ? { options: attr.options }
            : {}),
        };
      }
    });
    return result;
  }

  const addVariantAttribute = () => {
    setVariantAttributes([
      ...variantAttributes,
      { key: '', label: '', type: 'string', required: false },
    ]);
  };

  const addItemAttribute = () => {
    setItemAttributes([
      ...itemAttributes,
      { key: '', label: '', type: 'string', required: false },
    ]);
  };

  const removeVariantAttribute = (index: number) => {
    setVariantAttributes(variantAttributes.filter((_, i) => i !== index));
  };

  const removeItemAttribute = (index: number) => {
    setItemAttributes(itemAttributes.filter((_, i) => i !== index));
  };

  const updateVariantAttribute = (
    index: number,
    field: keyof Attribute,
    value: unknown
  ) => {
    const updated = [...variantAttributes];
    updated[index] = { ...updated[index], [field]: value };
    setVariantAttributes(updated);
  };

  const updateItemAttribute = (
    index: number,
    field: keyof Attribute,
    value: unknown
  ) => {
    const updated = [...itemAttributes];
    updated[index] = { ...updated[index], [field]: value };
    setItemAttributes(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const data: CreateTemplateRequest = {
        name: name.trim(),
        unitOfMeasure: unitOfMeasure as UnitOfMeasure,
        variantAttributes: formatAttributes(variantAttributes),
        itemAttributes: formatAttributes(itemAttributes),
      };
      await onSubmit(data);
      handleClose();
    } catch (error) {
      logger.error(
        'Erro ao salvar template',
        error instanceof Error ? error : undefined
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName('');
    setUnitOfMeasure('UNITS');
    setVariantAttributes([]);
    setItemAttributes([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {initialData ? 'Editar Template' : 'Novo Template'}
          </DialogTitle>
          <DialogDescription>
            Configure os atributos que definem a estrutura de produtos e itens
            deste template.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6 py-4">
              {/* Template Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Template *</Label>
                <Input
                  id="name"
                  placeholder="Ex: Camisetas, Eletrônicos, etc."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="h-12"
                  required
                />
              </div>

              {/* Unit of Measure */}
              <div className="space-y-2">
                <Label htmlFor="unitOfMeasure">Unidade de Medida *</Label>
                <Select value={unitOfMeasure} onValueChange={setUnitOfMeasure}>
                  <SelectTrigger id="unitOfMeasure" className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UNITS">Unidades</SelectItem>
                    <SelectItem value="METERS">Metros</SelectItem>
                    <SelectItem value="KILOGRAMS">Quilogramas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Variant Attributes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Atributos de Variantes</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Definem características das variações do produto (cor,
                      tamanho, etc.)
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addVariantAttribute}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar
                  </Button>
                </div>

                {variantAttributes.map((attr, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl bg-white/50 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 space-y-3"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label>Chave</Label>
                        <Input
                          placeholder="Ex: color"
                          value={attr.key}
                          onChange={e =>
                            updateVariantAttribute(index, 'key', e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label>Label</Label>
                        <Input
                          placeholder="Ex: Cor"
                          value={attr.label}
                          onChange={e =>
                            updateVariantAttribute(
                              index,
                              'label',
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label>Tipo</Label>
                        <Select
                          value={attr.type}
                          onValueChange={value =>
                            updateVariantAttribute(index, 'type', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="string">Texto</SelectItem>
                            <SelectItem value="number">Número</SelectItem>
                            <SelectItem value="boolean">Sim/Não</SelectItem>
                            <SelectItem value="date">Data</SelectItem>
                            <SelectItem value="select">Seleção</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-end">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={attr.required}
                            onChange={e =>
                              updateVariantAttribute(
                                index,
                                'required',
                                e.target.checked
                              )
                            }
                            className="w-4 h-4 rounded"
                          />
                          <span className="text-sm">Obrigatório</span>
                        </label>
                      </div>

                      <div className="flex items-end justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeVariantAttribute(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {attr.type === 'select' && (
                      <div>
                        <Label>Opções (separadas por vírgula)</Label>
                        <Input
                          placeholder="Ex: Vermelho, Azul, Verde"
                          value={attr.options?.join(', ') || ''}
                          onChange={e =>
                            updateVariantAttribute(
                              index,
                              'options',
                              e.target.value.split(',').map(s => s.trim())
                            )
                          }
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Item Attributes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Atributos de Itens</Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Definem características de itens individuais (número de
                      série, lote, etc.)
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addItemAttribute}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar
                  </Button>
                </div>

                {itemAttributes.map((attr, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl bg-white/50 dark:bg-white/5 border border-gray-200/50 dark:border-white/10 space-y-3"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label>Chave</Label>
                        <Input
                          placeholder="Ex: serial_number"
                          value={attr.key}
                          onChange={e =>
                            updateItemAttribute(index, 'key', e.target.value)
                          }
                        />
                      </div>
                      <div>
                        <Label>Label</Label>
                        <Input
                          placeholder="Ex: Número de Série"
                          value={attr.label}
                          onChange={e =>
                            updateItemAttribute(index, 'label', e.target.value)
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <Label>Tipo</Label>
                        <Select
                          value={attr.type}
                          onValueChange={value =>
                            updateItemAttribute(index, 'type', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="string">Texto</SelectItem>
                            <SelectItem value="number">Número</SelectItem>
                            <SelectItem value="boolean">Sim/Não</SelectItem>
                            <SelectItem value="date">Data</SelectItem>
                            <SelectItem value="select">Seleção</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-end">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={attr.required}
                            onChange={e =>
                              updateItemAttribute(
                                index,
                                'required',
                                e.target.checked
                              )
                            }
                            className="w-4 h-4 rounded"
                          />
                          <span className="text-sm">Obrigatório</span>
                        </label>
                      </div>

                      <div className="flex items-end justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItemAttribute(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {attr.type === 'select' && (
                      <div>
                        <Label>Opções (separadas por vírgula)</Label>
                        <Input
                          placeholder="Ex: Opção 1, Opção 2, Opção 3"
                          value={attr.options?.join(', ') || ''}
                          onChange={e =>
                            updateItemAttribute(
                              index,
                              'options',
                              e.target.value.split(',').map(s => s.trim())
                            )
                          }
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="bg-linear-to-br from-blue-500 to-purple-600"
            >
              {isSubmitting
                ? 'Salvando...'
                : initialData
                  ? 'Atualizar'
                  : 'Criar Template'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
