'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCareOptions } from '@/hooks/stock/use-care-options';
import {
  useProductCareInstructions,
  useAddProductCareInstruction,
  useDeleteProductCareInstruction,
} from '@/hooks/stock/use-product-care-instructions';
import type { CareCategory, CareOption, Template } from '@/types/stock';
import { useState } from 'react';
import { MdAdd, MdClose } from 'react-icons/md';
import Image from 'next/image';
import { toast } from 'sonner';

interface CareInstructionsSectionProps {
  productId: string;
  template?: Template;
}

const CATEGORY_LABELS: Record<CareCategory, string> = {
  WASH: 'Lavagem',
  BLEACH: 'Alvejamento',
  DRY: 'Secagem',
  IRON: 'Passagem',
  PROFESSIONAL: 'Limpeza Profissional',
};

/**
 * Seção de instruções de cuidado para a página de detalhe do produto.
 * Só renderiza se o template tem CARE_INSTRUCTIONS em specialModules.
 */
export function CareInstructionsSection({
  productId,
  template,
}: CareInstructionsSectionProps) {
  const hasCareModule = template?.specialModules?.includes('CARE_INSTRUCTIONS');
  const [selectedCareId, setSelectedCareId] = useState('');

  const { data: careInstructions = [], isLoading: isLoadingInstructions } =
    useProductCareInstructions(productId);
  const { data: careOptions, isLoading: isLoadingOptions } = useCareOptions();

  const addMutation = useAddProductCareInstruction(productId);
  const deleteMutation = useDeleteProductCareInstruction(productId);

  if (!hasCareModule) return null;

  // Flatten all care options for lookup
  const allOptions: CareOption[] = careOptions
    ? [
        ...careOptions.WASH,
        ...careOptions.BLEACH,
        ...careOptions.DRY,
        ...careOptions.IRON,
        ...careOptions.PROFESSIONAL,
      ]
    : [];

  const existingIds = new Set(careInstructions.map(ci => ci.careInstructionId));
  const availableOptions = allOptions.filter(opt => !existingIds.has(opt.id));

  const handleAdd = async () => {
    if (!selectedCareId) return;
    try {
      await addMutation.mutateAsync({
        careInstructionId: selectedCareId,
        order: careInstructions.length,
      });
      setSelectedCareId('');
      toast.success('Instrução de cuidado adicionada');
    } catch {
      toast.error('Erro ao adicionar instrução de cuidado');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Instrução de cuidado removida');
    } catch {
      toast.error('Erro ao remover instrução de cuidado');
    }
  };

  const resolveOption = (careInstructionId: string) =>
    allOptions.find(o => o.id === careInstructionId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Instruções de Conservação
          </h3>
          <p className="text-xs text-muted-foreground">
            Símbolos ISO 3758 para etiqueta de conservação têxtil
          </p>
        </div>
      </div>

      {/* Existing instructions grid */}
      {isLoadingInstructions || isLoadingOptions ? (
        <div className="grid grid-cols-6 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-16 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse"
            />
          ))}
        </div>
      ) : careInstructions.length > 0 ? (
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
          {careInstructions.map(ci => {
            const option = resolveOption(ci.careInstructionId);
            if (!option) return null;
            return (
              <div
                key={ci.id}
                className="relative group flex flex-col items-center gap-1 p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
              >
                <button
                  type="button"
                  onClick={() => handleDelete(ci.id)}
                  className="absolute -top-1.5 -right-1.5 hidden group-hover:flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                  title="Remover"
                >
                  <MdClose className="h-3 w-3" />
                </button>
                {option.assetPath ? (
                  <Image
                    src={option.assetPath}
                    alt={option.label}
                    width={32}
                    height={32}
                    className="h-8 w-8 object-contain dark:invert"
                    unoptimized
                  />
                ) : (
                  <div className="h-8 w-8 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs">
                    {option.code}
                  </div>
                )}
                <span className="text-[10px] text-center text-muted-foreground leading-tight">
                  {option.label}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-6 text-center border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
          <p className="text-sm text-muted-foreground">
            Nenhuma instrução de cuidado adicionada
          </p>
        </div>
      )}

      {/* Add new instruction */}
      <div className="flex gap-2">
        <Select value={selectedCareId} onValueChange={setSelectedCareId}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Selecione uma instrução..." />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(CATEGORY_LABELS) as CareCategory[]).map(category => {
              const options = availableOptions.filter(
                o => o.category === category
              );
              if (options.length === 0) return null;
              return (
                <div key={category}>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    {CATEGORY_LABELS[category]}
                  </div>
                  {options.map(opt => (
                    <SelectItem key={opt.id} value={opt.id}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </div>
              );
            })}
          </SelectContent>
        </Select>
        <Button
          type="button"
          size="sm"
          onClick={handleAdd}
          disabled={!selectedCareId || addMutation.isPending}
          className="gap-1"
        >
          <MdAdd className="h-4 w-4" />
          Adicionar
        </Button>
      </div>
    </div>
  );
}
