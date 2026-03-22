'use client';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import type { HeaderProps } from './types/header.types';

/**
 * Componente Header reutilizável
 *
 * Renderiza um header com título, descrição e botões configuráveis.
 * Os botões são gerados dinamicamente a partir de um array tipado.
 *
 * @example
 * const buttons: HeaderButton[] = [
 *   {
 *     title: "Novo Template",
 *     icon: Plus,
 *     onClick: () => handleCreate(),
 *     variant: "default"
 *   },
 *   {
 *     title: "Importar",
 *     icon: Upload,
 *     onClick: () => handleImport(),
 *     variant: "outline"
 *   }
 * ];
 *
 * return <Header title="Templates" description="Gerencie templates" buttons={buttons} />;
 */
export function Header({
  title,
  description,
  buttons,
  className,
  titleClassName,
  descriptionClassName,
  buttonsContainerClassName,
  buttonSpacing = 'gap-2',
  buttonLayout = 'horizontal',
}: HeaderProps) {
  const effectiveButtons = buttons ?? [];
  const [loadingButtonId, setLoadingButtonId] = useState<string | null>(null);

  const handleButtonClick = async (button: (typeof effectiveButtons)[0]) => {
    try {
      setLoadingButtonId(button.id || button.title || button.label || null);
      const result = button.onClick();
      if (result instanceof Promise) {
        await result;
      }
    } finally {
      setLoadingButtonId(null);
    }
  };

  const isLoading = (buttonId?: string) => {
    return loadingButtonId === (buttonId || null);
  };

  const flexDirection = buttonLayout === 'horizontal' ? 'flex-row' : 'flex-col';

  return (
    <div
      className={cn(
        'flex items-center justify-between',
        'flex-row gap-6',
        className
      )}
    >
      {/* Content Section */}
      <div>
        <h1
          className={cn(
            'text-3xl font-bold text-gray-900 dark:text-white',
            titleClassName
          )}
        >
          {title}
        </h1>

        {description && (
          <p
            className={cn(
              'text-gray-600 dark:text-gray-400 mt-1',
              descriptionClassName
            )}
          >
            {description}
          </p>
        )}
      </div>

      {/* Buttons Section */}
      {effectiveButtons.length > 0 && (
        <TooltipProvider>
          <div
            className={cn(
              'flex',
              flexDirection,
              buttonSpacing,
              'shrink-0',
              buttonsContainerClassName
            )}
          >
            {effectiveButtons.map(button => {
              const Icon = button.icon;
              const buttonId = button.id || button.title;
              const isButtonLoading = isLoading(buttonId);

              const tooltipLabel = button.tooltip || button.title;

              const buttonElement = (
                <Button
                  key={buttonId}
                  onClick={() => handleButtonClick(button)}
                  variant={button.variant || 'default'}
                  disabled={button.disabled || isButtonLoading}
                  className={cn('p-4 gap-2', button.className)}
                  size="default"
                  aria-label={button.title}
                >
                  {Icon && (
                    <Icon
                      className={cn(
                        button.style?.iconSize || 'w-4 h-4',
                        button.style?.className
                      )}
                    />
                  )}
                  {/* Esconde o texto em mobile e mantém em telas maiores */}
                  <span className="hidden sm:inline">{button.title}</span>
                </Button>
              );

              // Renderiza tooltip sempre que houver label (tooltip custom ou fallback)
              return (
                <Tooltip key={buttonId}>
                  <TooltipTrigger asChild>{buttonElement}</TooltipTrigger>
                  <TooltipContent>{tooltipLabel}</TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </TooltipProvider>
      )}
    </div>
  );
}

export {
  type ButtonStyle,
  type ButtonVariant,
  type HeaderButton,
  type HeaderProps,
} from './types/header.types';
