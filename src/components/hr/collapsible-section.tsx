'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState, type ElementType, type ReactNode } from 'react';

interface CollapsibleSectionProps {
  icon: ElementType;
  title: string;
  subtitle?: string;
  defaultOpen?: boolean;
  iconColorClass?: string;
  wrapperClassName?: string;
  bodyClassName?: string;
  children: ReactNode;
}

/**
 * Collapsible form section used across HR edit pages (OKRs, Reviews,
 * Payroll, etc.). Replaces the inline implementations that were duplicated
 * in multiple places.
 */
export function CollapsibleSection({
  icon: Icon,
  title,
  subtitle,
  defaultOpen = true,
  iconColorClass = 'text-muted-foreground',
  wrapperClassName = '',
  bodyClassName = 'px-5 pb-4',
  children,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={wrapperClassName}>
      <button
        type="button"
        className="flex w-full items-center justify-between px-5 py-3 hover:bg-accent/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <Icon className={`h-4 w-4 ${iconColorClass}`} />
          <div className="text-left">
            <p className="text-sm font-medium">{title}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {isOpen && <div className={bodyClassName}>{children}</div>}
    </div>
  );
}
