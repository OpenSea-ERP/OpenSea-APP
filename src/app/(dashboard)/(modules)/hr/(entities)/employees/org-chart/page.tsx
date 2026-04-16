/**
 * Employees Org Chart Page
 *
 * Organograma interativo (estilo Rippling) baseado em React Flow:
 * - Layout top-down hierárquico calculado a partir do campo
 *   `supervisorId` de cada funcionário
 * - Zoom, pan, fit-view e lock via Controls nativos
 * - MiniMap no canto inferior direito
 * - Filtro por departamento (multi-select) e profundidade máxima
 * - Custom node `EmployeeNode` (avatar + status + cargo + departamento)
 *
 * Como não há endpoint dedicado de "org-tree" no backend, a árvore é
 * construída no cliente a partir de `GET /v1/hr/employees`.
 */

'use client';

import { useListDepartments } from '@/app/(dashboard)/(modules)/hr/(entities)/departments/src';
import { GridError } from '@/components/handlers/grid-error';
import { EmployeeNode } from '@/components/hr/employee-node';
import { PageActionBar } from '@/components/layout/page-action-bar';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FilterDropdown } from '@/components/ui/filter-dropdown';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { useTheme } from 'next-themes';
import { buildOrgTree } from '@/lib/hr/build-org-tree';
import { employeesService } from '@/services/hr';
import type { Employee } from '@/types/hr';
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  type Edge,
  type Node,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useInfiniteQuery } from '@tanstack/react-query';
import {
  Building2,
  GitBranchPlus,
  Layers,
  RotateCcw,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// ============================================================================
// CONSTANTS
// ============================================================================

const PAGE_SIZE = 100;
const DEFAULT_MAX_DEPTH = 5;
const MIN_DEPTH = 1;
const MAX_DEPTH_LIMIT = 10;

const NODE_TYPES: NodeTypes = {
  employee: EmployeeNode,
};

// ============================================================================
// PAGE
// ============================================================================

export default function EmployeesOrgChartPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reactFlowInstanceRef = useRef<{ fitView: () => void } | null>(null);
  const { theme } = useTheme();

  // ============================================================================
  // FILTERS — read from URL
  // ============================================================================

  const departmentIds = useMemo(() => {
    const raw = searchParams.get('department');
    return raw ? raw.split(',').filter(Boolean) : [];
  }, [searchParams]);

  const depthFromUrl = useMemo(() => {
    const raw = searchParams.get('depth');
    const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
    if (Number.isNaN(parsed)) return DEFAULT_MAX_DEPTH;
    return Math.min(Math.max(parsed, MIN_DEPTH), MAX_DEPTH_LIMIT);
  }, [searchParams]);

  const [maxDepth, setMaxDepth] = useState<number>(depthFromUrl);

  useEffect(() => {
    setMaxDepth(depthFromUrl);
  }, [depthFromUrl]);

  const buildFilterUrl = useCallback(
    (overrides: { department?: string[]; depth?: number }) => {
      const department =
        overrides.department !== undefined ? overrides.department : departmentIds;
      const depth = overrides.depth !== undefined ? overrides.depth : maxDepth;

      const parts: string[] = [];
      if (department.length > 0) parts.push(`department=${department.join(',')}`);
      if (depth !== DEFAULT_MAX_DEPTH) parts.push(`depth=${depth}`);

      return parts.length > 0
        ? `/hr/employees/org-chart?${parts.join('&')}`
        : '/hr/employees/org-chart';
    },
    [departmentIds, maxDepth]
  );

  const handleDepartmentFilterChange = useCallback(
    (ids: string[]) => {
      router.push(buildFilterUrl({ department: ids }));
    },
    [router, buildFilterUrl]
  );

  const handleDepthChange = useCallback(
    (next: number[]) => {
      const value = next[0] ?? DEFAULT_MAX_DEPTH;
      setMaxDepth(value);
      router.push(buildFilterUrl({ depth: value }));
    },
    [router, buildFilterUrl]
  );

  const handleResetView = useCallback(() => {
    reactFlowInstanceRef.current?.fitView();
  }, []);

  // ============================================================================
  // DATA — fetch all employees (paginated until exhausted)
  // ============================================================================

  const {
    data: infiniteData,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['employees', 'org-chart'],
    queryFn: async ({ pageParam = 1 }) =>
      employeesService.listEmployees({
        page: pageParam,
        perPage: PAGE_SIZE,
        includeDeleted: false,
      }),
    initialPageParam: 1,
    getNextPageParam: lastPage => {
      const currentPage = lastPage.meta?.page ?? lastPage.page ?? 1;
      const totalPages = lastPage.meta?.totalPages ?? lastPage.totalPages ?? 1;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
  });

  // Auto-fetch every page so we can render the entire tree at once.
  useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allEmployees = useMemo<Employee[]>(
    () => infiniteData?.pages.flatMap(page => page.employees ?? []) ?? [],
    [infiniteData]
  );

  // ============================================================================
  // DEPARTMENT REFERENCE LIST (for filter dropdown)
  // ============================================================================

  const { data: departmentsData } = useListDepartments({ perPage: 200 });

  const departmentFilterOptions = useMemo(
    () =>
      departmentsData?.departments?.map(department => ({
        id: department.id,
        label: department.name,
      })) ?? [],
    [departmentsData]
  );

  // ============================================================================
  // BUILD TREE
  // ============================================================================

  const orgTreeResult = useMemo(() => {
    if (allEmployees.length === 0) {
      return { flowNodes: [], flowEdges: [], roots: [], maxLevel: 0 };
    }

    return buildOrgTree(allEmployees, {
      maxDepth: maxDepth - 1,
      departmentIds: departmentIds.length > 0 ? new Set(departmentIds) : undefined,
    });
  }, [allEmployees, maxDepth, departmentIds]);

  const flowNodes = useMemo<Node[]>(
    () =>
      orgTreeResult.flowNodes.map(node => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data as unknown as Record<string, unknown>,
        draggable: false,
      })),
    [orgTreeResult]
  );

  const flowEdges = useMemo<Edge[]>(
    () =>
      orgTreeResult.flowEdges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type,
        animated: false,
        style: { strokeWidth: 1.5 },
      })),
    [orgTreeResult]
  );

  const totalVisible = flowNodes.length;
  const totalRoots = orgTreeResult.roots.length;
  const isStillFetchingPages = isFetchingNextPage || hasNextPage;

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'RH', href: '/hr' },
            { label: 'Funcionários', href: '/hr/employees' },
            { label: 'Organograma' },
          ]}
        />
      </PageHeader>

      <PageBody>
        <div data-testid="org-chart-page" className="contents" />

        {/* Toolbar */}
        <div className="mb-4 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div data-testid="org-chart-filter-department">
              <FilterDropdown
                label="Departamento"
                icon={Building2}
                options={departmentFilterOptions}
                selected={departmentIds}
                onSelectionChange={handleDepartmentFilterChange}
                activeColor="blue"
                searchPlaceholder="Buscar departamento..."
                emptyText="Nenhum departamento encontrado."
              />
            </div>

            <div
              className="flex items-center gap-3 rounded-lg border border-border bg-white px-3 py-2 dark:bg-slate-900/40"
              data-testid="org-chart-depth-control"
            >
              <Layers className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Profundidade
              </span>
              <Slider
                value={[maxDepth]}
                onValueChange={handleDepthChange}
                min={MIN_DEPTH}
                max={MAX_DEPTH_LIMIT}
                step={1}
                className="w-32"
              />
              <span className="min-w-[2ch] text-center text-sm font-semibold tabular-nums">
                {maxDepth}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {totalVisible} funcionário{totalVisible === 1 ? '' : 's'} ·{' '}
              {totalRoots} raiz{totalRoots === 1 ? '' : 'es'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetView}
              className="h-9 px-2.5"
            >
              <RotateCcw className="mr-1.5 h-4 w-4" />
              Reposicionar
            </Button>
          </div>
        </div>

        {/* Chart area */}
        {isLoading ? (
          <OrgChartSkeleton />
        ) : error ? (
          <GridError
            type="server"
            title="Erro ao carregar o organograma"
            message="Não foi possível carregar a hierarquia de funcionários. Tente novamente."
            action={{
              label: 'Tentar Novamente',
              onClick: () => {
                void refetch();
              },
            }}
          />
        ) : flowNodes.length === 0 ? (
          <OrgChartEmptyState />
        ) : (
          <div
            className="relative overflow-hidden rounded-xl border border-border bg-white/50 dark:bg-slate-900/50"
            style={{ height: 'calc(100vh - 260px)', minHeight: '520px' }}
            data-testid="org-chart-flow"
          >
            <ReactFlow
              nodes={flowNodes}
              edges={flowEdges}
              nodeTypes={NODE_TYPES}
              fitView
              fitViewOptions={{ padding: 0.2, includeHiddenNodes: false }}
              minZoom={0.15}
              maxZoom={2}
              proOptions={{ hideAttribution: true }}
              onInit={instance => {
                reactFlowInstanceRef.current = instance;
              }}
              colorMode={theme === 'dark' ? 'dark' : 'light'}
              defaultEdgeOptions={{
                type: 'smoothstep',
                style: { strokeWidth: 1.5 },
              }}
            >
              <Background
                variant={BackgroundVariant.Dots}
                gap={20}
                size={1.2}
                className="opacity-60"
              />
              <Controls
                showInteractive
                position="top-left"
                className="!shadow-sm"
              />
              <MiniMap
                pannable
                zoomable
                position="bottom-right"
                maskColor="rgba(15, 23, 42, 0.05)"
                nodeStrokeWidth={2}
                nodeColor="#64748b"
                className="!shadow-sm"
              />
            </ReactFlow>

            {isStillFetchingPages && (
              <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full border border-border bg-white/90 px-3 py-1.5 text-xs text-muted-foreground shadow-sm dark:bg-slate-900/90">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                Carregando funcionários adicionais...
              </div>
            )}
          </div>
        )}
      </PageBody>
    </PageLayout>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function OrgChartSkeleton() {
  return (
    <div
      className="rounded-xl border border-border bg-white/50 p-8 dark:bg-slate-900/50"
      style={{ minHeight: '520px' }}
    >
      <div className="flex flex-col items-center gap-8">
        <Skeleton className="h-24 w-56 rounded-xl" />
        <div className="flex gap-8">
          <Skeleton className="h-24 w-56 rounded-xl" />
          <Skeleton className="h-24 w-56 rounded-xl" />
          <Skeleton className="h-24 w-56 rounded-xl" />
        </div>
        <div className="flex gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-44 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

function OrgChartEmptyState() {
  return (
    <Card className="bg-white/5 p-12 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600">
        <Users className="h-8 w-8 text-white" />
      </div>
      <h2 className="mb-2 text-2xl font-semibold">
        Nenhum funcionário cadastrado
      </h2>
      <p className="mb-6 text-muted-foreground">
        Cadastre o primeiro colaborador para começar a visualizar o
        organograma da organização.
      </p>
      <Button asChild>
        <Link href="/hr/employees">
          <GitBranchPlus className="mr-2 h-4 w-4" />
          Adicionar primeiro colaborador
        </Link>
      </Button>
    </Card>
  );
}
