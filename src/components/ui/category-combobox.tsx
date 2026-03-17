'use client';

import { Check, ChevronRight, ChevronsUpDown } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { Category } from '@/types/stock';

// =============================================================================
// TYPES
// =============================================================================

interface CategoryNode {
  category: Category;
  children: CategoryNode[];
  depth: number;
}

interface CategoryComboboxProps {
  categories: Category[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  /** Category ID to exclude from the list (e.g. self when selecting parent) */
  excludeId?: string;
  /** Also exclude all descendants of excludeId */
  excludeDescendants?: boolean;
}

// =============================================================================
// HELPERS
// =============================================================================

function buildTree(
  categories: Category[],
  excludeId?: string,
  excludeDescendants?: boolean
): CategoryNode[] {
  const excludeIds = new Set<string>();

  if (excludeId) {
    excludeIds.add(excludeId);
    if (excludeDescendants) {
      // Collect all descendant IDs recursively
      const collectDescendants = (parentId: string) => {
        for (const cat of categories) {
          if (cat.parentId === parentId && !excludeIds.has(cat.id)) {
            excludeIds.add(cat.id);
            collectDescendants(cat.id);
          }
        }
      };
      collectDescendants(excludeId);
    }
  }

  const filtered = categories.filter(c => c.isActive && !excludeIds.has(c.id));
  const filteredIds = new Set(filtered.map(c => c.id));

  const byParent = new Map<string, Category[]>();
  for (const cat of filtered) {
    // If parentId is missing or parent doesn't exist in the list, treat as root
    const key =
      cat.parentId && filteredIds.has(cat.parentId) ? cat.parentId : '__root__';
    const list = byParent.get(key) ?? [];
    list.push(cat);
    byParent.set(key, list);
  }

  // Sort each group by displayOrder
  for (const [, list] of byParent) {
    list.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  }

  const buildNodes = (parentId: string, depth: number): CategoryNode[] => {
    const children = byParent.get(parentId) ?? [];
    return children.map(cat => ({
      category: cat,
      depth,
      children: buildNodes(cat.id, depth + 1),
    }));
  };

  return buildNodes('__root__', 0);
}

/** Flatten tree into ordered list for rendering */
function flattenTree(nodes: CategoryNode[]): CategoryNode[] {
  const result: CategoryNode[] = [];
  for (const node of nodes) {
    result.push(node);
    if (node.children.length > 0) {
      result.push(...flattenTree(node.children));
    }
  }
  return result;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function CategoryCombobox({
  categories,
  value,
  onValueChange,
  placeholder = 'Selecionar categoria...',
  emptyText = 'Nenhuma categoria encontrada.',
  searchPlaceholder = 'Buscar categoria...',
  disabled = false,
  excludeId,
  excludeDescendants = true,
}: CategoryComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const tree = React.useMemo(
    () => buildTree(categories, excludeId, excludeDescendants),
    [categories, excludeId, excludeDescendants]
  );

  const flatItems = React.useMemo(() => flattenTree(tree), [tree]);

  const selectedLabel = React.useMemo(() => {
    if (!value) return placeholder;
    const found = categories.find(c => c.id === value);
    return found?.name ?? placeholder;
  }, [value, categories, placeholder]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-12 w-full rounded-(--input-radius) justify-between font-normal bg-(--input-bg) border-[rgb(var(--color-border))] hover:bg-(--input-bg)"
          disabled={disabled}
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} className="h-9" />
          <CommandEmpty>{emptyText}</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {flatItems.map(node => {
                const isSelected = node.category.id === value;
                const depthClass =
                  node.depth === 1 ? 'pl-6' : node.depth >= 2 ? 'pl-12' : '';

                return (
                  <CommandItem
                    key={node.category.id}
                    value={node.category.name}
                    className={cn('cursor-pointer', depthClass)}
                    onSelect={() => {
                      onValueChange?.(
                        node.category.id === value ? '' : node.category.id
                      );
                      setOpen(false);
                    }}
                  >
                    {node.depth > 0 && (
                      <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                    )}
                    <span className="truncate">{node.category.name}</span>
                    {isSelected && (
                      <Check className="ml-auto h-4 w-4 shrink-0" />
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
