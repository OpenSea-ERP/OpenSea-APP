/**
 * OpenSea OS - EntityCard Component
 * Componente de card unificado para entidades do sistema
 *
 * Suporta três variantes de layout (grid, list, compact) e três tipos de footer:
 * - Sem footer
 * - Footer com botão único
 * - Footer com dois botões divididos
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ChevronRight, LucideIcon, RefreshCw, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React, { ComponentType, ReactNode, forwardRef } from 'react';

// =============================================================================
// TYPES
// =============================================================================

/** Variantes de layout do card */
export type EntityCardVariant = 'grid' | 'list' | 'compact';

/** Badge customizado para o card */
export interface EntityCardBadge {
  /** Texto do badge */
  label: string;
  /** Variante visual */
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'warning';
  /** Cor customizada (Tailwind classes) */
  color?: string;
  /** Ícone do badge */
  icon?: LucideIcon | ComponentType<{ className?: string }>;
}

/** Cores disponíveis para footer buttons */
export type FooterButtonColor =
  | 'emerald'
  | 'blue'
  | 'violet'
  | 'cyan'
  | 'amber';

/** Botão de footer com ação ou link */
export interface FooterButton {
  /** Ícone do botão */
  icon: LucideIcon | ComponentType<{ className?: string }>;
  /** Texto do botão */
  label: string;
  /** URL do link (mutuamente exclusivo com onClick) */
  href?: string;
  /** Handler de clique (mutuamente exclusivo com href) */
  onClick?: (e: React.MouseEvent) => void;
  /** Cor do botão */
  color?: FooterButtonColor;
}

/** Footer sem botões */
export interface NoFooter {
  type: 'none';
}

/** Footer com botão único */
export interface SingleButtonFooter {
  type: 'single';
  button: FooterButton;
}

/** Footer com dois botões divididos */
export interface SplitButtonFooter {
  type: 'split';
  left: FooterButton;
  right: FooterButton;
}

/** Union type para footer */
export type EntityCardFooter =
  | NoFooter
  | SingleButtonFooter
  | SplitButtonFooter;

/** Props do EntityCard */
export interface EntityCardProps {
  /** ID único do item */
  id: string;
  /** Variante de exibição */
  variant?: EntityCardVariant;

  // Conteúdo Principal
  /** Título/nome do item (truncado automaticamente). Aceita ReactNode para composição com badges. */
  title: ReactNode;
  /** Subtítulo/descrição (max 2 linhas no grid, truncado no list/compact) */
  subtitle?: string;
  /** Linha de metadados (ReactNode para flexibilidade) */
  metadata?: ReactNode;

  // Visual
  /** Ícone do card */
  icon?: LucideIcon | ComponentType<{ className?: string }>;
  /** Cor de fundo do ícone (Tailwind classes) */
  iconBgColor?: string;
  /** Estilo inline para o fundo do ícone (ex: gradient com cor dinâmica) */
  iconBgStyle?: React.CSSProperties;
  /** URL da imagem/thumbnail */
  thumbnail?: string;
  /** Placeholder para imagem quando não há thumbnail */
  thumbnailFallback?: ReactNode;

  // Badges
  /** Lista de badges customizados */
  badges?: EntityCardBadge[];
  /** Data de criação (para badge "Novo" automático) */
  createdAt?: Date | string;
  /** Data de atualização (para badge "Atualizado" automático) */
  updatedAt?: Date | string;
  /** Mostrar badges de Novo/Atualizado automaticamente (default: true) */
  showStatusBadges?: boolean;

  // Seleção
  /** Se o card está selecionado */
  isSelected?: boolean;
  /** Se mostra checkbox de seleção */
  showSelection?: boolean;
  /** Callback quando checkbox muda */
  onSelectionChange?: (checked: boolean) => void;

  // Interação
  /** Callback ao clicar no card (não no footer) */
  onClick?: (e: React.MouseEvent) => void;
  /** Callback ao duplo clique */
  onDoubleClick?: (e: React.MouseEvent) => void;
  /** Se o card é clicável (default: true) */
  clickable?: boolean;

  // Footer
  /** Configuração do footer (tipado) */
  footer?: EntityCardFooter;
  /** Footer customizado (ReactNode). Renderiza flush no fundo do card, igual aos botões de footer. Tem prioridade sobre `footer` se ambos forem definidos. */
  customFooter?: ReactNode;

  // Customização
  /** Classes customizadas para o container */
  className?: string;
  /** Conteúdo customizado adicional */
  children?: ReactNode;

  // Data attribute para detecção de drag
  'data-entity-card'?: boolean;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Mapa de cores para botões do footer - variante grid (botão cheio) */
const FOOTER_BUTTON_COLORS_GRID: Record<FooterButtonColor, string> = {
  emerald:
    'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400',
  blue: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400',
  violet:
    'bg-violet-600 hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-400',
  cyan: 'bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-500 dark:hover:bg-cyan-400',
  amber:
    'bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-400',
};

/** Mapa de cores para botões do footer - variante list (texto colorido) */
const FOOTER_BUTTON_COLORS_LIST: Record<FooterButtonColor, string> = {
  emerald:
    'text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300',
  blue: 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300',
  violet:
    'text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300',
  cyan: 'text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300',
  amber:
    'text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300',
};

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Calcula se um item é novo ou foi atualizado nas últimas 24 horas
 */
function getStatusBadges(
  createdAt?: Date | string,
  updatedAt?: Date | string
): { isNew: boolean; isUpdated: boolean } {
  if (!createdAt) {
    return { isNew: false, isUpdated: false };
  }

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const created =
    typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  const updated = updatedAt
    ? typeof updatedAt === 'string'
      ? new Date(updatedAt)
      : updatedAt
    : null;

  const isNew = created > oneDayAgo;
  const isUpdated =
    updated !== null && updated > oneDayAgo && updated > created;

  return { isNew, isUpdated };
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/** Renderiza o ícone ou thumbnail do card */
interface IconRendererProps {
  variant: EntityCardVariant;
  icon?: LucideIcon | ComponentType<{ className?: string }>;
  iconBgColor: string;
  iconBgStyle?: React.CSSProperties;
  thumbnail?: string;
  thumbnailFallback?: ReactNode;
  title: string;
  isSelected: boolean;
}

function IconRenderer({
  variant,
  icon: Icon,
  iconBgColor,
  iconBgStyle,
  thumbnail,
  thumbnailFallback,
  title,
  isSelected,
}: IconRendererProps) {
  const sizeClasses = {
    grid: 'w-12 h-12 rounded-xl',
    list: 'w-10 h-10 rounded-lg',
    compact: 'w-8 h-8 rounded-md',
  };

  const innerSizeClasses = {
    grid: 'w-6 h-6',
    list: 'w-5 h-5',
    compact: 'w-4 h-4',
  };

  // When selected, always use blue; when iconBgStyle is provided, use it instead of class-based bg
  const useInlineStyle = !isSelected && iconBgStyle;
  const bgColor = isSelected
    ? 'bg-blue-600'
    : !iconBgStyle
      ? iconBgColor
      : undefined;

  if (thumbnail) {
    return (
      <div
        className={cn(
          sizeClasses[variant],
          'overflow-hidden shrink-0 flex items-center justify-center p-2',
          bgColor
        )}
        style={useInlineStyle ? iconBgStyle : undefined}
      >
        <Image
          src={thumbnail}
          alt={title}
          width={variant === 'grid' ? 48 : variant === 'list' ? 40 : 32}
          height={variant === 'grid' ? 48 : variant === 'list' ? 40 : 32}
          className="w-full h-full object-contain brightness-0 invert"
        />
      </div>
    );
  }

  if (Icon) {
    return (
      <div
        className={cn(
          sizeClasses[variant],
          'flex items-center justify-center text-white shrink-0',
          bgColor
        )}
        style={useInlineStyle ? iconBgStyle : undefined}
      >
        <Icon
          className={cn(innerSizeClasses[variant], 'brightness-0 invert')}
        />
      </div>
    );
  }

  if (thumbnailFallback) {
    return (
      <div
        className={cn(
          sizeClasses[variant],
          'flex items-center justify-center shrink-0',
          bgColor
        )}
        style={useInlineStyle ? iconBgStyle : undefined}
      >
        <div className="flex items-center justify-center brightness-0 invert">
          {thumbnailFallback}
        </div>
      </div>
    );
  }

  return null;
}

/** Renderiza badges de status (Novo/Atualizado) */
interface StatusBadgesProps {
  isNew: boolean;
  isUpdated: boolean;
}

function StatusBadges({ isNew, isUpdated }: StatusBadgesProps) {
  if (!isNew && !isUpdated) return null;

  return (
    <div className="flex gap-1 shrink-0">
      {isNew && (
        <Badge
          variant="default"
          className="bg-cyan-400 dark:bg-cyan-500/70 text-white shadow-md shadow-cyan-400/50 dark:shadow-cyan-500/20"
        >
          <Sparkles className="w-3 h-3" />
        </Badge>
      )}
      {isUpdated && (
        <Badge
          variant="secondary"
          className="bg-amber-400 dark:bg-amber-500/70 text-white flex items-center gap-1 shadow-md shadow-amber-400/50 dark:shadow-amber-500/20"
        >
          <RefreshCw className="w-3 h-3" />
        </Badge>
      )}
    </div>
  );
}

/** Renderiza badges customizados */
interface CustomBadgesProps {
  badges: EntityCardBadge[];
}

function CustomBadges({ badges }: CustomBadgesProps) {
  if (badges.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {badges.map((badge, index) => {
        const BadgeIcon = badge.icon;
        return (
          <Badge
            key={index}
            variant={badge.variant || 'secondary'}
            className={cn('text-xs', badge.color)}
          >
            {BadgeIcon && <BadgeIcon className="w-3 h-3 mr-1" />}
            {badge.label}
          </Badge>
        );
      })}
    </div>
  );
}

/** Renderiza um botão de footer (para grid) */
interface FooterButtonRendererProps {
  button: FooterButton;
  isGrid: boolean;
  roundedClass?: string;
}

function FooterButtonRenderer({
  button,
  isGrid,
  roundedClass = '',
}: FooterButtonRendererProps) {
  const { icon: Icon, label, href, onClick, color = 'emerald' } = button;

  const gridClasses = cn(
    'w-full flex items-center justify-between px-3 py-4 text-xs font-medium text-white transition-colors cursor-pointer',
    FOOTER_BUTTON_COLORS_GRID[color],
    roundedClass
  );

  const listClasses = cn(
    'inline-flex items-center gap-1 text-xs font-medium transition-colors',
    FOOTER_BUTTON_COLORS_LIST[color]
  );

  const content = (
    <>
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4" />
        <span className="truncate">{label}</span>
      </div>
      <ChevronRight className="w-4 h-4 shrink-0" />
    </>
  );

  const listContent = (
    <>
      <Icon className={isGrid ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
      <span className="truncate">{label}</span>
      <ChevronRight className={isGrid ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
    </>
  );

  if (href) {
    if (isGrid) {
      return (
        <Link href={href} className="flex-1">
          <button className={gridClasses}>{content}</button>
        </Link>
      );
    }
    return (
      <Link href={href}>
        <span className={listClasses}>{listContent}</span>
      </Link>
    );
  }

  if (isGrid) {
    return (
      <button onClick={onClick} className={gridClasses}>
        {content}
      </button>
    );
  }

  return (
    <button onClick={onClick} className={listClasses}>
      {listContent}
    </button>
  );
}

/** Renderiza o footer do card */
interface FooterRendererProps {
  footer: EntityCardFooter;
  variant: EntityCardVariant;
}

function FooterRenderer({ footer, variant }: FooterRendererProps) {
  if (footer.type === 'none') return null;

  const isGrid = variant === 'grid';

  if (footer.type === 'single') {
    if (isGrid) {
      return (
        <FooterButtonRenderer
          button={footer.button}
          isGrid={true}
          roundedClass="rounded-b-xl"
        />
      );
    }
    return (
      <div className="mt-2">
        <FooterButtonRenderer button={footer.button} isGrid={false} />
      </div>
    );
  }

  // Split footer
  if (isGrid) {
    return (
      <div className="flex rounded-b-xl overflow-hidden">
        <FooterButtonRenderer button={footer.left} isGrid={true} />
        <div className="w-px bg-white/20 dark:bg-white/10" />
        <FooterButtonRenderer button={footer.right} isGrid={true} />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 mt-2">
      <FooterButtonRenderer button={footer.left} isGrid={false} />
      <span className="text-gray-300 dark:text-gray-600">|</span>
      <FooterButtonRenderer button={footer.right} isGrid={false} />
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const EntityCard = forwardRef<HTMLDivElement, EntityCardProps>(
  (
    {
      id,
      variant = 'grid',
      title,
      subtitle,
      metadata,
      icon,
      iconBgColor = 'bg-linear-to-br from-blue-500 to-purple-600',
      iconBgStyle,
      thumbnail,
      thumbnailFallback,
      badges = [],
      createdAt,
      updatedAt,
      showStatusBadges = true,
      isSelected = false,
      showSelection = false,
      onSelectionChange,
      onClick,
      onDoubleClick,
      clickable = true,
      footer = { type: 'none' },
      customFooter,
      className,
      children,
      'data-entity-card': dataEntityCard = true,
    },
    ref
  ) => {
    const { isNew, isUpdated } = showStatusBadges
      ? getStatusBadges(createdAt, updatedAt)
      : { isNew: false, isUpdated: false };

    const hasFooterButtons = footer.type !== 'none' || !!customFooter;

    // Base classes
    const baseClasses = cn(
      'border-gray-200/50 dark:border-white/10 transition-all duration-200',
      clickable && 'cursor-pointer',
      isSelected
        ? 'bg-blue-500/20 dark:bg-blue-500/20 border-blue-500 ring-2 ring-blue-500'
        : 'bg-white/90 dark:bg-white/5 hover:bg-white/95 dark:hover:bg-white/10',
      clickable && !isSelected && 'hover:shadow-lg'
    );

    const paddingClasses = {
      grid: hasFooterButtons ? 'p-6 pb-2' : 'p-6',
      list: 'p-4',
      compact: 'p-3',
    };

    // Checkbox renderer
    const renderCheckbox = () => {
      if (!showSelection) return null;
      return (
        <Checkbox
          checked={isSelected}
          onCheckedChange={onSelectionChange}
          onClick={e => e.stopPropagation()}
          className="h-4 w-4 shrink-0"
        />
      );
    };

    // ==========================================================================
    // VARIANT: GRID
    // ==========================================================================
    if (variant === 'grid') {
      return (
        <Card
          ref={ref}
          data-entity-card={dataEntityCard || undefined}
          onClick={onClick}
          onDoubleClick={onDoubleClick}
          className={cn(baseClasses, 'p-0', className)}
        >
          <div className={cn(paddingClasses[variant], 'flex flex-col gap-4')}>
            {/* Header: Icon + Title + Status Badges */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {renderCheckbox()}
                <IconRenderer
                  variant={variant}
                  icon={icon}
                  iconBgColor={iconBgColor}
                  iconBgStyle={iconBgStyle}
                  thumbnail={thumbnail}
                  thumbnailFallback={thumbnailFallback}
                  title={typeof title === 'string' ? title : ''}
                  isSelected={isSelected}
                />
                <div className="min-w-0 flex-1">
                  {/* Title - truncated to single line, tooltip on hover */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <h3 className="font-semibold text-lg text-gray-900 dark:text-white truncate">
                        {title}
                      </h3>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      {title}
                    </TooltipContent>
                  </Tooltip>
                  {/* Subtitle - truncated */}
                  {subtitle && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>
              <StatusBadges isNew={isNew} isUpdated={isUpdated} />
            </div>

            {/* Children */}
            {children}

            {/* Metadata */}
            {metadata && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {metadata}
              </div>
            )}

            {/* Badges */}
            {badges.length > 0 && <CustomBadges badges={badges} />}
          </div>

          {/* Footer */}
          {customFooter || <FooterRenderer footer={footer} variant={variant} />}
        </Card>
      );
    }

    // ==========================================================================
    // VARIANT: LIST
    // ==========================================================================
    if (variant === 'list') {
      return (
        <Card
          ref={ref}
          data-entity-card={dataEntityCard || undefined}
          onClick={onClick}
          onDoubleClick={onDoubleClick}
          className={cn(baseClasses, paddingClasses[variant], className)}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {renderCheckbox()}
              <IconRenderer
                variant={variant}
                icon={icon}
                iconBgColor={iconBgColor}
                thumbnail={thumbnail}
                thumbnailFallback={thumbnailFallback}
                title={typeof title === 'string' ? title : ''}
                isSelected={isSelected}
              />
              <div className="flex-1 min-w-0">
                {/* Title - truncated, tooltip on hover */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {title}
                    </h3>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">{title}</TooltipContent>
                </Tooltip>
                {/* Subtitle - truncated */}
                {subtitle && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {subtitle}
                  </p>
                )}
                {/* Metadata */}
                {metadata && (
                  <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {metadata}
                  </div>
                )}
                {/* Footer (inline for list) */}
                <FooterRenderer footer={footer} variant={variant} />
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <CustomBadges badges={badges} />
              <StatusBadges isNew={isNew} isUpdated={isUpdated} />
              {children}
            </div>
          </div>
        </Card>
      );
    }

    // ==========================================================================
    // VARIANT: COMPACT
    // ==========================================================================
    return (
      <Card
        ref={ref}
        data-entity-card={dataEntityCard || undefined}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        className={cn(baseClasses, paddingClasses[variant], className)}
      >
        <div className="flex items-center gap-3">
          {renderCheckbox()}
          <IconRenderer
            variant={variant}
            icon={icon}
            iconBgColor={iconBgColor}
            thumbnail={thumbnail}
            thumbnailFallback={thumbnailFallback}
            title={typeof title === 'string' ? title : ''}
            isSelected={isSelected}
          />
          <div className="flex-1 min-w-0">
            {/* Title - truncated, tooltip on hover */}
            <Tooltip>
              <TooltipTrigger asChild>
                <h3 className="font-medium text-gray-900 dark:text-white truncate">
                  {title}
                </h3>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">{title}</TooltipContent>
            </Tooltip>
            {/* Subtitle - truncated */}
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {subtitle}
              </p>
            )}
          </div>
          <CustomBadges badges={badges} />
          <StatusBadges isNew={isNew} isUpdated={isUpdated} />
          {children}
        </div>
      </Card>
    );
  }
);

EntityCard.displayName = 'EntityCard';

export default EntityCard;
