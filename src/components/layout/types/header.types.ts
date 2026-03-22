import type { ReactNode } from 'react';

/**
 * Variantes disponíveis para botões no header
 * @see https://ui.shadcn.com/docs/components/button
 */
export type ButtonVariant =
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'outline'
  | 'ghost'
  | 'link';

/**
 * Estilos customizáveis para botões
 */
export interface ButtonStyle {
  /** Classes Tailwind customizadas */
  className?: string;
  /** Tamanho do ícone */
  iconSize?: 'w-3 h-3' | 'w-4 h-4' | 'w-5 h-5' | 'w-6 h-6';
}

/**
 * Configuração de um botão no header
 */
export interface HeaderButton {
  /** ID único do botão */
  id?: string;
  /** Título/label do botão */
  title?: string;
  /** Alias for title */
  label?: string;
  /** Ícone (Lucide, react-icons, ou qualquer React component). Opcional — se omitido, exibe apenas texto. */
  icon?: React.ElementType;
  /** Função chamada ao clicar */
  onClick: () => void | Promise<void>;
  /** Variante visual do botão */
  variant?: ButtonVariant;
  /** Estilos customizáveis */
  style?: ButtonStyle;
  /** Se o botão está desabilitado */
  disabled?: boolean;
  /** Tooltip para o botão */
  tooltip?: string;
  /** Classes Tailwind adicionais para o botão */
  className?: string;
}

/**
 * Propriedades do componente Header
 */
export interface HeaderProps {
  /** Título principal do header */
  title: string;
  /** Descrição/subtitle (opcional) */
  description?: string | ReactNode;
  /** Array de botões a serem renderizados (opcional - omitir quando Header é usado apenas para título/descrição) */
  buttons?: HeaderButton[];
  /** Classes Tailwind customizadas para o container */
  className?: string;
  /** Classes Tailwind customizadas para o título */
  titleClassName?: string;
  /** Classes Tailwind customizadas para a descrição */
  descriptionClassName?: string;
  /** Classes Tailwind customizadas para o container de botões */
  buttonsContainerClassName?: string;
  /** Espaçamento entre botões */
  buttonSpacing?: 'gap-2' | 'gap-3' | 'gap-4';
  /** Se os botões devem ter layout horizontal ou vertical */
  buttonLayout?: 'horizontal' | 'vertical';
}
