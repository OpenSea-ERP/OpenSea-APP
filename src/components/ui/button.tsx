import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-[var(--transition-fast)] disabled:pointer-events-none disabled:opacity-[var(--state-disabled-opacity)] [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none select-none cursor-pointer active:scale-[var(--state-active-scale)]",
  {
    variants: {
      variant: {
        default:
          'bg-[rgb(var(--btn-primary-bg))] hover:bg-[rgb(var(--btn-primary-bg-hover))] text-[rgb(var(--btn-primary-text))] border-[var(--btn-primary-border)] shadow-sm',
        destructive:
          'bg-[rgb(var(--btn-destructive-bg))] hover:bg-[rgb(var(--btn-destructive-bg-hover))] text-[rgb(var(--btn-destructive-text))] border-[var(--btn-destructive-border)]',
        outline:
          'border border-[rgb(var(--btn-outline-border))] bg-[var(--btn-outline-bg)] hover:bg-[rgb(var(--btn-outline-bg-hover))] text-[rgb(var(--btn-outline-text))]',
        secondary:
          'bg-[rgb(var(--glass-bg)/0.15)] border border-[rgb(var(--glass-border)/0.2)] hover:bg-[rgb(var(--glass-bg)/0.25)] hover:border-[rgb(var(--glass-border)/0.3)] text-[rgb(var(--color-foreground))]',
        ghost:
          'bg-transparent hover:bg-[rgb(var(--color-background-muted))] text-[rgb(var(--color-foreground))]',
        link: 'text-[rgb(var(--btn-link-text))] hover:text-[rgb(var(--btn-link-text-hover))] underline-offset-4 hover:underline',
        text: 'text-[rgb(var(--btn-text-text))] hover:text-[rgb(var(--btn-text-text-hover))] bg-transparent',
      },
      size: {
        default: 'h-11 px-6 rounded-2xl',
        sm: 'h-9 px-2.5 rounded-lg text-sm',
        plan: 'h-9',
        lg: 'h-12 px-8 rounded-2xl',
        icon: 'size-10 rounded-2xl',
        'icon-sm': 'size-9 rounded-xl',
        'icon-lg': 'size-12 rounded-2xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
