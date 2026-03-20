'use client';

import { Fragment, useCallback, useMemo } from 'react';
import { ArrowDown, ArrowRight } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import {
  STANDARD_ACTIONS,
  ACTION_LABELS,
  getResourceGroups,
  type MatrixResource,
  type MatrixTab,
  type StandardAction,
} from '../config/permission-matrix-config';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** For each resource row, which permission codes map to which standard action */
export interface ResourcePermissionMap {
  resourceIndex: number;
  actionCodes: Record<StandardAction, Set<string>>;
}

interface PermissionMatrixTableProps {
  tab: MatrixTab;
  resources: MatrixResource[];
  permissionMaps: ResourcePermissionMap[];
  selectedCodes: Set<string>;
  onToggleCode: (code: string) => void;
  onToggleCodes: (codes: string[], forceState?: boolean) => void;
  readOnly?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type SelectionState = 'all' | 'some' | 'none';

function getSelectionState(
  codes: Set<string>,
  selectedCodes: Set<string>
): SelectionState {
  if (codes.size === 0) return 'none';
  let hasSelected = false;
  let hasUnselected = false;
  for (const c of codes) {
    if (selectedCodes.has(c)) {
      hasSelected = true;
    } else {
      hasUnselected = true;
    }
    if (hasSelected && hasUnselected) return 'some';
  }
  return hasSelected ? 'all' : 'none';
}

function selectAllButtonClasses(state: SelectionState): string {
  switch (state) {
    case 'all':
      return 'bg-blue-500/70 text-white';
    case 'some':
      return 'bg-blue-500/30 text-blue-500';
    case 'none':
      return 'bg-muted/30 text-muted-foreground hover:bg-muted/50';
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PermissionMatrixTable({
  tab,
  resources,
  permissionMaps,
  selectedCodes,
  onToggleCodes,
  readOnly = false,
}: PermissionMatrixTableProps) {
  // ----- Column select-all -------------------------------------------------

  const columnCodes = useMemo(() => {
    const map = {} as Record<StandardAction, Set<string>>;
    for (const action of STANDARD_ACTIONS) {
      const codes = new Set<string>();
      for (const pm of permissionMaps) {
        const resource = resources[pm.resourceIndex];
        if (!resource?.availableActions.includes(action)) continue;
        const actionSet = pm.actionCodes[action];
        if (actionSet) {
          for (const c of actionSet) codes.add(c);
        }
      }
      map[action] = codes;
    }
    return map;
  }, [permissionMaps, resources]);

  const handleToggleColumn = useCallback(
    (action: StandardAction) => {
      const codes = columnCodes[action];
      if (codes.size === 0) return;
      const state = getSelectionState(codes, selectedCodes);
      onToggleCodes(Array.from(codes), state !== 'all');
    },
    [columnCodes, selectedCodes, onToggleCodes]
  );

  // ----- Row select-all ----------------------------------------------------

  const handleToggleRow = useCallback(
    (resourceIndex: number) => {
      const pm = permissionMaps.find(p => p.resourceIndex === resourceIndex);
      if (!pm) return;
      const resource = resources[resourceIndex];
      if (!resource) return;

      const codes = new Set<string>();
      for (const action of resource.availableActions) {
        const actionSet = pm.actionCodes[action];
        if (actionSet) {
          for (const c of actionSet) codes.add(c);
        }
      }
      if (codes.size === 0) return;

      const state = getSelectionState(codes, selectedCodes);
      onToggleCodes(Array.from(codes), state !== 'all');
    },
    [permissionMaps, resources, selectedCodes, onToggleCodes]
  );

  // ----- Cell toggle -------------------------------------------------------

  const handleToggleCell = useCallback(
    (pm: ResourcePermissionMap, action: StandardAction) => {
      const codes = pm.actionCodes[action];
      if (!codes || codes.size === 0) return;
      const state = getSelectionState(codes, selectedCodes);
      onToggleCodes(Array.from(codes), state !== 'all');
    },
    [selectedCodes, onToggleCodes]
  );

  // ----- Group resources ---------------------------------------------------

  const groups = useMemo(() => getResourceGroups(tab), [tab]);

  // ----- Render ------------------------------------------------------------

  if (resources.length === 0) {
    return (
      <div className="flex items-center justify-center h-full min-h-[200px] text-muted-foreground text-sm">
        Nenhuma permissão disponível neste módulo
      </div>
    );
  }

  return (
    <div>
      <table className="w-full border-collapse">
        {/* Header */}
        <thead>
          <tr className="sticky top-0 z-10 border-b border-border/50 shadow-[0_1px_3px_-1px_rgba(0,0,0,0.1)]" style={{ backgroundColor: 'var(--modal-bg)' }}>
            <th className="w-[200px] min-w-[200px] text-left px-3 py-2">
              <span className="text-xs font-medium text-muted-foreground">
                Recurso
              </span>
            </th>

            {STANDARD_ACTIONS.map(action => {
              const state = getSelectionState(
                columnCodes[action],
                selectedCodes
              );

              return (
                <th
                  key={action}
                  className="w-[80px] min-w-[80px] text-center px-1 py-2"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-medium text-muted-foreground">
                      {ACTION_LABELS[action]}
                    </span>
                    {!readOnly && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className={cn(
                              'h-5 w-5 rounded inline-flex items-center justify-center transition-colors',
                              selectAllButtonClasses(state)
                            )}
                            onClick={() => handleToggleColumn(action)}
                          >
                            <ArrowDown className="h-3 w-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {state === 'all'
                            ? 'Desmarcar coluna'
                            : 'Selecionar coluna'}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>

        {/* Body — grouped by resource.group */}
        <tbody>
          {groups.map(groupName => {
            const groupResources = resources
              .map((r, idx) => ({ resource: r, idx }))
              .filter(({ resource }) => resource.group === groupName);

            if (groupResources.length === 0) return null;

            return (
              <Fragment key={groupName}>
                {/* Group header row */}
                <tr>
                  <td
                    colSpan={STANDARD_ACTIONS.length + 1}
                    className="pt-4 pb-1.5 px-3"
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {groupName}
                    </span>
                  </td>
                </tr>

                {/* Resource rows in this group */}
                {groupResources.map(({ resource, idx }) => {
                  const pm = permissionMaps.find(
                    p => p.resourceIndex === idx
                  );

                  const rowCodes = new Set<string>();
                  if (pm) {
                    for (const action of resource.availableActions) {
                      const actionSet = pm.actionCodes[action];
                      if (actionSet) {
                        for (const c of actionSet) rowCodes.add(c);
                      }
                    }
                  }
                  const rowState = getSelectionState(rowCodes, selectedCodes);

                  return (
                    <tr
                      key={idx}
                      className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                    >
                      {/* Resource label cell */}
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          {!readOnly && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  className={cn(
                                    'h-5 w-5 rounded shrink-0 inline-flex items-center justify-center transition-colors',
                                    selectAllButtonClasses(rowState)
                                  )}
                                  onClick={() => handleToggleRow(idx)}
                                >
                                  <ArrowRight className="h-3 w-3" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {rowState === 'all'
                                  ? 'Desmarcar linha'
                                  : 'Selecionar linha'}
                              </TooltipContent>
                            </Tooltip>
                          )}
                          <div className="text-sm font-medium truncate min-w-0">
                            {resource.label}
                          </div>
                        </div>
                      </td>

                      {/* Action cells */}
                      {STANDARD_ACTIONS.map(action => {
                        const isAvailable =
                          resource.availableActions.includes(action);
                        const actionSet = pm?.actionCodes[action];
                        const hasAnyCodes = actionSet && actionSet.size > 0;

                        if (!isAvailable || !hasAnyCodes) {
                          return (
                            <td
                              key={action}
                              className="text-center px-1 py-2"
                            >
                              <div className="flex items-center justify-center">
                                <div className="h-4 w-4 rounded border border-muted/30 opacity-20" />
                              </div>
                            </td>
                          );
                        }

                        const cellState = getSelectionState(
                          actionSet,
                          selectedCodes
                        );
                        const checked =
                          cellState === 'all'
                            ? true
                            : cellState === 'some'
                              ? 'indeterminate'
                              : false;

                        return (
                          <td
                            key={action}
                            className="text-center px-1 py-2"
                          >
                            <div className="flex items-center justify-center">
                              <Checkbox
                                checked={checked}
                                disabled={readOnly}
                                onCheckedChange={() =>
                                  handleToggleCell(pm!, action)
                                }
                                className={cn(
                                  action === 'admin' &&
                                    'data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500',
                                  action === 'onlyself' &&
                                    'data-[state=checked]:bg-violet-500 data-[state=checked]:border-violet-500',
                                  readOnly &&
                                    cellState === 'none' &&
                                    'opacity-70'
                                )}
                              />
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
