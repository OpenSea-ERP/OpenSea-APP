'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { showErrorToast, showSuccessToast } from '@/lib/toast-utils';
import { logger } from '@/lib/logger';
import * as rbacService from '@/services/rbac/rbac.service';
import type {
  AllPermissionsResponse,
  PermissionGroup,
  PermissionWithEffect,
} from '@/types/rbac';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { ChevronRight, Loader2, Shield, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  MATRIX_TABS,
  STANDARD_ACTIONS,
  mapActionToStandard,
  resolveDataPermission,
  type StandardAction,
} from '../config/permission-matrix-config';
import {
  PermissionMatrixTable,
  type ResourcePermissionMap,
} from '../components/permission-matrix-table';

interface ManagePermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: PermissionGroup | null;
  onSuccess: () => void;
}

export function ManagePermissionsModal({
  isOpen,
  onClose,
  group,
  onSuccess,
}: ManagePermissionsModalProps) {
  const [allPermissions, setAllPermissions] =
    useState<AllPermissionsResponse | null>(null);
  const [currentCodes, setCurrentCodes] = useState<Set<string>>(new Set());
  const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(MATRIX_TABS[0].id);
  const [showUnmapped, setShowUnmapped] = useState(false);

  // Load data when modal opens
  const loadData = useCallback(async () => {
    if (!group) return;
    setIsLoading(true);
    try {
      const [permissionsResponse, groupPermissions] = await Promise.all([
        rbacService.listAllPermissions(),
        rbacService.listGroupPermissions(group.id),
      ]);

      setAllPermissions(permissionsResponse);

      const codes = new Set(
        groupPermissions.map((p: PermissionWithEffect) => p.code)
      );
      setCurrentCodes(codes);
      setSelectedCodes(new Set(codes));
    } catch (error) {
      logger.error(
        'Erro ao carregar permissões',
        error instanceof Error ? error : undefined
      );
      showErrorToast({
        title: 'Erro ao carregar permissões',
        description: 'Não foi possível carregar as permissões do grupo.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [group]);

  useEffect(() => {
    if (isOpen && group) {
      loadData();
    }
  }, [isOpen, group, loadData]);

  // ---------------------------------------------------------------------------
  // Build permission maps for matrix
  // ---------------------------------------------------------------------------

  const { permissionMaps, selectedCounts, totalCounts, unmappedCodes } =
    useMemo(() => {
      if (!allPermissions)
        return {
          permissionMaps: {} as Record<string, ResourcePermissionMap[]>,
          selectedCounts: {} as Record<string, number>,
          totalCounts: {} as Record<string, number>,
          unmappedCodes: [] as string[],
        };

      const codesByBackendResource = new Map<
        string,
        Map<string, Set<string>>
      >();

      for (const moduleGroup of allPermissions.permissions) {
        const moduleLower = moduleGroup.module.toLowerCase();
        for (const [resourceKey, resourceGroup] of Object.entries(
          moduleGroup.resources
        )) {
          const backendKey = `${moduleLower}.${resourceKey}`;
          if (!codesByBackendResource.has(backendKey)) {
            codesByBackendResource.set(backendKey, new Map());
          }
          const actionMap = codesByBackendResource.get(backendKey)!;
          for (const perm of resourceGroup.permissions) {
            // Handle data.import.* / data.export.* → redirect to target resource
            const dataResolved = resolveDataPermission(perm.code);
            if (dataResolved) {
              const targetKey = dataResolved.targetBackendResource;
              if (!codesByBackendResource.has(targetKey)) {
                codesByBackendResource.set(targetKey, new Map());
              }
              const targetMap = codesByBackendResource.get(targetKey)!;
              if (!targetMap.has(dataResolved.action)) {
                targetMap.set(dataResolved.action, new Set());
              }
              targetMap.get(dataResolved.action)!.add(perm.code);
              continue;
            }

            const standardAction = mapActionToStandard(perm.action);
            if (!actionMap.has(standardAction)) {
              actionMap.set(standardAction, new Set());
            }
            actionMap.get(standardAction)!.add(perm.code);
          }
        }
      }

      const allPermMaps: Record<string, ResourcePermissionMap[]> = {};
      const selCounts: Record<string, number> = {};
      const totCounts: Record<string, number> = {};

      for (const tab of MATRIX_TABS) {
        const maps: ResourcePermissionMap[] = [];
        let tabTotal = 0;
        let tabSelected = 0;

        tab.resources.forEach((resource, idx) => {
          const actionCodes = {} as Record<StandardAction, Set<string>>;
          for (const action of STANDARD_ACTIONS) {
            actionCodes[action] = new Set();
          }

          for (const br of resource.backendResources) {
            const actionMap = codesByBackendResource.get(br);
            if (!actionMap) continue;
            for (const [action, codes] of actionMap) {
              const stdAction = action as StandardAction;
              for (const code of codes) {
                actionCodes[stdAction].add(code);
              }
            }
          }

          let resourceTotal = 0;
          let resourceSelected = 0;
          for (const action of resource.availableActions) {
            for (const code of actionCodes[action]) {
              resourceTotal++;
              if (selectedCodes.has(code)) resourceSelected++;
            }
          }
          tabTotal += resourceTotal;
          tabSelected += resourceSelected;

          maps.push({ resourceIndex: idx, actionCodes });
        });

        allPermMaps[tab.id] = maps;
        selCounts[tab.id] = tabSelected;
        totCounts[tab.id] = tabTotal;
      }

      const mappedCodes = new Set<string>();
      for (const tab of MATRIX_TABS) {
        const maps = allPermMaps[tab.id];
        if (!maps) continue;
        for (const pm of maps) {
          const resource = tab.resources[pm.resourceIndex];
          for (const action of resource.availableActions) {
            for (const code of pm.actionCodes[action]) {
              mappedCodes.add(code);
            }
          }
        }
      }

      const allApiCodes: string[] = [];
      for (const moduleGroup of allPermissions.permissions) {
        for (const [, resourceGroup] of Object.entries(
          moduleGroup.resources
        )) {
          for (const perm of resourceGroup.permissions) {
            allApiCodes.push(perm.code);
          }
        }
      }

      const unmapped = allApiCodes.filter(c => !mappedCodes.has(c));

      return {
        permissionMaps: allPermMaps,
        selectedCounts: selCounts,
        totalCounts: totCounts,
        unmappedCodes: unmapped,
      };
    }, [allPermissions, selectedCodes]);

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------

  const activeTabConfig = useMemo(
    () => MATRIX_TABS.find(t => t.id === activeTab),
    [activeTab]
  );

  // ---------------------------------------------------------------------------
  // Toggle handlers
  // ---------------------------------------------------------------------------

  const handleToggleCodes = useCallback(
    (codes: string[], forceState?: boolean) => {
      setSelectedCodes(prev => {
        const next = new Set(prev);
        if (forceState === true) {
          codes.forEach(c => next.add(c));
        } else if (forceState === false) {
          codes.forEach(c => next.delete(c));
        } else {
          const allSelected = codes.every(c => next.has(c));
          if (allSelected) {
            codes.forEach(c => next.delete(c));
          } else {
            codes.forEach(c => next.add(c));
          }
        }
        return next;
      });
    },
    []
  );

  const handleToggleCode = useCallback((code: string) => {
    setSelectedCodes(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }, []);

  const handleSelectAllInTab = useCallback(() => {
    const maps = permissionMaps[activeTab];
    if (!maps) return;
    const tab = MATRIX_TABS.find(t => t.id === activeTab);
    if (!tab) return;
    const codes: string[] = [];
    maps.forEach(pm => {
      const resource = tab.resources[pm.resourceIndex];
      for (const action of resource.availableActions) {
        pm.actionCodes[action].forEach(c => codes.push(c));
      }
    });
    handleToggleCodes(codes, true);
  }, [activeTab, permissionMaps, handleToggleCodes]);

  const handleClearAllInTab = useCallback(() => {
    const maps = permissionMaps[activeTab];
    if (!maps) return;
    const tab = MATRIX_TABS.find(t => t.id === activeTab);
    if (!tab) return;
    const codes: string[] = [];
    maps.forEach(pm => {
      const resource = tab.resources[pm.resourceIndex];
      for (const action of resource.availableActions) {
        pm.actionCodes[action].forEach(c => codes.push(c));
      }
    });
    handleToggleCodes(codes, false);
  }, [activeTab, permissionMaps, handleToggleCodes]);

  // ---------------------------------------------------------------------------
  // Save changes (diff-based)
  // ---------------------------------------------------------------------------

  const handleSave = async () => {
    if (!group) return;
    setIsSaving(true);

    try {
      const toAdd = [...selectedCodes].filter(c => !currentCodes.has(c));
      const toRemove = [...currentCodes].filter(c => !selectedCodes.has(c));

      if (toAdd.length > 0) {
        await rbacService.addPermissionsToGroupBulk(
          group.id,
          toAdd.map(code => ({ permissionCode: code, effect: 'allow' }))
        );
      }

      if (toRemove.length > 0) {
        await Promise.all(
          toRemove.map(code =>
            rbacService.removePermissionFromGroup(group.id, code)
          )
        );
      }

      showSuccessToast('Permissões atualizadas com sucesso');
      onSuccess();
      onClose();
    } catch (error) {
      logger.error(
        'Erro ao salvar permissões',
        error instanceof Error ? error : undefined
      );
      showErrorToast({
        title: 'Erro ao salvar permissões',
        description:
          error instanceof Error ? error.message : 'Erro desconhecido',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    selectedCodes.size !== currentCodes.size ||
    [...selectedCodes].some(c => !currentCodes.has(c));

  if (!group) return null;

  // ---------------------------------------------------------------------------
  // Badge color for nav items
  // ---------------------------------------------------------------------------

  function getBadgeStyle(tabId: string) {
    const selected = selectedCounts[tabId] ?? 0;
    const total = totalCounts[tabId] ?? 0;
    if (total === 0 || selected === 0) {
      // Neutral
      return 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-white/40';
    }
    if (selected === total) {
      // All defined — green
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400';
    }
    // Partial — blue
    return 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400';
  }

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-[1100px] max-w-[1100px] h-[650px] p-0 gap-0 overflow-hidden flex flex-row"
        onPointerDownOutside={e => {
          if (isSaving) e.preventDefault();
        }}
        onEscapeKeyDown={e => {
          if (isSaving) e.preventDefault();
        }}
      >
        <VisuallyHidden>
          <DialogTitle>Gerenciar Permissões</DialogTitle>
        </VisuallyHidden>

        {/* ── Left column ── */}
        <div className="shrink-0 flex flex-col border-r border-border/50 bg-slate-50 dark:bg-white/[0.03] w-[270px]">
          {/* Nav header */}
          <div className="px-4 pt-5 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                <Shield className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-foreground/80 uppercase tracking-wider">
                  Gerenciar Permissões
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  Grupo {group.name}
                </p>
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="mx-4 border-b border-border/50" />

          {/* Nav items */}
          <nav className="flex-1 overflow-y-auto px-3 pt-3 pb-3 space-y-1.5">
            {isLoading
              ? Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 w-full px-3.5 py-3 rounded-xl"
                  >
                    <div className="w-9 h-9 rounded-lg bg-muted animate-pulse shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3.5 w-24 rounded bg-muted animate-pulse" />
                      <div className="h-2.5 w-16 rounded bg-muted animate-pulse" />
                    </div>
                  </div>
                ))
              : MATRIX_TABS.map(tab => {
                  const isActive = tab.id === activeTab;
                  const Icon = tab.icon;
                  const selected = selectedCounts[tab.id] ?? 0;
                  const total = totalCounts[tab.id] ?? 0;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      disabled={isSaving}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'relative flex items-center gap-3 w-full px-3.5 py-3 rounded-xl text-left transition-all duration-200',
                        'disabled:pointer-events-none disabled:opacity-50',
                        isActive
                          ? 'bg-white dark:bg-white/10 shadow-sm ring-1 ring-black/[0.04] dark:ring-white/[0.08]'
                          : 'hover:bg-white/60 dark:hover:bg-white/[0.06]'
                      )}
                    >
                      <span
                        className={cn(
                          'flex items-center justify-center w-9 h-9 rounded-lg shrink-0 transition-colors',
                          isActive
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                            : 'bg-gray-200/60 dark:bg-white/10 text-gray-500 dark:text-white/50'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <span
                          className={cn(
                            'block text-sm font-medium truncate',
                            isActive
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-gray-700 dark:text-white/80'
                          )}
                        >
                          {tab.label}
                        </span>
                        <span className="block text-[11px] text-muted-foreground truncate mt-0.5">
                          {tab.resources.length} recursos
                        </span>
                      </div>
                      {/* Badge */}
                      <span
                        className={cn(
                          'shrink-0 text-[11px] font-medium tabular-nums rounded-full px-2 py-0.5',
                          getBadgeStyle(tab.id)
                        )}
                      >
                        {selected}/{total}
                      </span>
                    </button>
                  );
                })}
          </nav>
        </div>

        {/* ── Right column ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header */}
          {(() => {
            const Icon = activeTabConfig?.icon;
            return (
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border/50 shrink-0">
                <div className="flex items-center gap-3">
                  {Icon && (
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                      <Icon className="h-4 w-4" />
                    </span>
                  )}
                  <div>
                    <h3 className="text-base font-semibold leading-none">
                      {activeTabConfig?.label ?? ''}
                    </h3>
                    {!isLoading && (
                      <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                        {selectedCounts[activeTab] ?? 0} de{' '}
                        {totalCounts[activeTab] ?? 0} permissões ativas
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isLoading && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearAllInTab}
                        disabled={isSaving}
                      >
                        Limpar tudo
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSelectAllInTab}
                        disabled={isSaving}
                      >
                        Selecionar tudo
                      </Button>
                    </>
                  )}
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={onClose}
                    className="ml-2 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-40"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Fechar</span>
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Content */}
          <ScrollArea className="flex-1 min-w-0">
            <div className="p-6">
              {isLoading ? (
                <div className="space-y-3">
                  <div className="flex gap-1 pb-2">
                    <div className="h-3 w-[180px] rounded bg-muted animate-pulse" />
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-3 w-[72px] rounded bg-muted animate-pulse"
                      />
                    ))}
                  </div>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-1 py-1.5">
                      <div className="h-4 w-[180px] rounded bg-muted animate-pulse" />
                      {Array.from({ length: 8 }).map((_, j) => (
                        <div
                          key={j}
                          className="h-4 w-[72px] flex items-center justify-center"
                        >
                          <div className="h-4 w-4 rounded bg-muted animate-pulse" />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <PermissionMatrixTable
                    tab={activeTabConfig!}
                    resources={activeTabConfig?.resources ?? []}
                    permissionMaps={permissionMaps[activeTab] ?? []}
                    selectedCodes={selectedCodes}
                    onToggleCode={handleToggleCode}
                    onToggleCodes={handleToggleCodes}
                  />

                  {/* Unmapped permissions overflow */}
                  {unmappedCodes.length > 0 && (
                    <div className="mt-4 border-t border-border pt-3">
                      <Collapsible
                        open={showUnmapped}
                        onOpenChange={setShowUnmapped}
                      >
                        <CollapsibleTrigger className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground hover:bg-muted/30 rounded-lg transition-colors">
                          <ChevronRight
                            className={cn(
                              'h-4 w-4 transition-transform',
                              showUnmapped && 'rotate-90'
                            )}
                          />
                          Outras permissões ({unmappedCodes.length})
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div className="grid grid-cols-2 gap-1 px-3 py-2">
                            {unmappedCodes.map(code => (
                              <label
                                key={code}
                                className="flex items-center gap-2 py-1 px-2 rounded hover:bg-muted/30 cursor-pointer text-sm"
                              >
                                <Checkbox
                                  checked={selectedCodes.has(code)}
                                  onCheckedChange={() =>
                                    handleToggleCode(code)
                                  }
                                  className="h-3.5 w-3.5"
                                />
                                <span className="truncate text-xs">
                                  {code}
                                </span>
                              </label>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border/50 shrink-0">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Permissões'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
