import { cn } from '@/lib/utils';
import { HTMLAttributes, forwardRef } from 'react';

export interface CentralCardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

/**
 * Card limpo usando CSS variables do tema Central.
 * Substitui o GlassCard com design flat dual-theme.
 */
export const CentralCard = forwardRef<HTMLDivElement, CentralCardProps>(
  ({ className, hover = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'central-card central-transition',
          hover &&
            'hover:scale-[1.01] hover:shadow-md cursor-pointer transition-transform',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CentralCard.displayName = 'CentralCard';
