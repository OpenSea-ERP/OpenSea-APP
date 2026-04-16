/**
 * Build Org Tree Helper
 *
 * Constrói uma estrutura hierárquica de funcionários a partir de uma lista
 * plana, usando o campo `supervisorId` como referência ao gestor direto.
 *
 * Também calcula posições x/y para uso em React Flow (xyflow), distribuindo
 * os nós em níveis horizontais (top-down) e centralizando os filhos abaixo
 * do pai. Algoritmo simples baseado em pós-ordem que mede a largura da
 * subárvore para evitar sobreposição.
 */

import type { Employee } from '@/types/hr';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Largura padrão de cada card de funcionário (px). */
export const ORG_NODE_WIDTH = 220;

/** Altura padrão de cada card de funcionário (px). */
export const ORG_NODE_HEIGHT = 96;

/** Espaçamento horizontal entre nós irmãos (px). */
export const ORG_HORIZONTAL_SPACING = 40;

/** Espaçamento vertical entre níveis (px). */
export const ORG_VERTICAL_SPACING = 80;

// ============================================================================
// TYPES
// ============================================================================

export interface OrgTreeNode {
  /** ID do funcionário. */
  id: string;
  /** Funcionário associado. */
  employee: Employee;
  /** Nível na hierarquia (0 = raiz). */
  level: number;
  /** ID do gestor direto, se houver. */
  supervisorId: string | null;
  /** Filhos diretos. */
  children: OrgTreeNode[];
  /** Largura total da subárvore em "slots" (1 slot = ORG_NODE_WIDTH + spacing). */
  subtreeWidth: number;
  /** Posição calculada para React Flow. */
  position: { x: number; y: number };
}

export interface OrgTreeFlowResult {
  /** Nós no formato React Flow. */
  flowNodes: Array<{
    id: string;
    type: 'employee';
    position: { x: number; y: number };
    data: { employee: Employee; level: number; childCount: number };
  }>;
  /** Arestas no formato React Flow. */
  flowEdges: Array<{
    id: string;
    source: string;
    target: string;
    type: 'smoothstep';
  }>;
  /** Raízes da árvore (sem supervisor ou cujo supervisor não está na lista). */
  roots: OrgTreeNode[];
  /** Nível máximo presente na árvore (0-based). */
  maxLevel: number;
}

export interface BuildOrgTreeOptions {
  /** Limite de profundidade (inclusive). Nós além desse nível são omitidos. */
  maxDepth?: number;
  /** Filtro por departamento — se informado, apenas funcionários cujo departmentId esteja no set. */
  departmentIds?: Set<string>;
}

// ============================================================================
// MAIN BUILDER
// ============================================================================

/**
 * Constrói nodes/edges para React Flow a partir de uma lista plana de
 * funcionários.
 */
export function buildOrgTree(
  employees: Employee[],
  options: BuildOrgTreeOptions = {}
): OrgTreeFlowResult {
  const { maxDepth, departmentIds } = options;

  // 1. Filtra funcionários ativos / não excluídos.
  const visibleEmployees = employees.filter(employee => {
    if (employee.deletedAt) return false;
    if (departmentIds && departmentIds.size > 0) {
      if (!employee.departmentId || !departmentIds.has(employee.departmentId)) {
        return false;
      }
    }
    return true;
  });

  // 2. Indexa por id para cruzamento O(1).
  const byId = new Map<string, Employee>();
  for (const employee of visibleEmployees) {
    byId.set(employee.id, employee);
  }

  // 3. Cria nós base (sem filhos ainda).
  const nodeMap = new Map<string, OrgTreeNode>();
  for (const employee of visibleEmployees) {
    const supervisorId =
      employee.supervisorId && byId.has(employee.supervisorId)
        ? employee.supervisorId
        : null;

    nodeMap.set(employee.id, {
      id: employee.id,
      employee,
      level: 0,
      supervisorId,
      children: [],
      subtreeWidth: 1,
      position: { x: 0, y: 0 },
    });
  }

  // 4. Liga filhos aos pais e identifica raízes.
  const roots: OrgTreeNode[] = [];
  for (const node of nodeMap.values()) {
    if (node.supervisorId) {
      const parent = nodeMap.get(node.supervisorId);
      if (parent) {
        parent.children.push(node);
        continue;
      }
    }
    roots.push(node);
  }

  // 5. Ordena filhos alfabeticamente para layout estável.
  const sortChildrenAlphabetically = (nodes: OrgTreeNode[]): void => {
    nodes.sort((a, b) =>
      a.employee.fullName.localeCompare(b.employee.fullName, 'pt-BR')
    );
    for (const node of nodes) {
      sortChildrenAlphabetically(node.children);
    }
  };
  sortChildrenAlphabetically(roots);

  // 6. Atribui níveis (BFS).
  const assignLevels = (nodes: OrgTreeNode[], level: number): number => {
    let observedMaxLevel = level;
    for (const node of nodes) {
      node.level = level;
      if (maxDepth !== undefined && level >= maxDepth) {
        node.children = [];
        continue;
      }
      if (node.children.length > 0) {
        const childMaxLevel = assignLevels(node.children, level + 1);
        if (childMaxLevel > observedMaxLevel) observedMaxLevel = childMaxLevel;
      }
    }
    return observedMaxLevel;
  };
  const maxLevel = assignLevels(roots, 0);

  // 7. Calcula largura de cada subárvore (pós-ordem).
  const computeSubtreeWidth = (node: OrgTreeNode): number => {
    if (node.children.length === 0) {
      node.subtreeWidth = 1;
      return 1;
    }
    let total = 0;
    for (const child of node.children) {
      total += computeSubtreeWidth(child);
    }
    node.subtreeWidth = Math.max(1, total);
    return node.subtreeWidth;
  };
  for (const root of roots) {
    computeSubtreeWidth(root);
  }

  // 8. Posiciona em coordenadas absolutas.
  const slotWidth = ORG_NODE_WIDTH + ORG_HORIZONTAL_SPACING;
  const rowHeight = ORG_NODE_HEIGHT + ORG_VERTICAL_SPACING;

  const placeSubtree = (
    node: OrgTreeNode,
    leftSlot: number,
    depth: number
  ): void => {
    const centerSlot = leftSlot + node.subtreeWidth / 2 - 0.5;
    node.position = {
      x: centerSlot * slotWidth,
      y: depth * rowHeight,
    };

    let cursorSlot = leftSlot;
    for (const child of node.children) {
      placeSubtree(child, cursorSlot, depth + 1);
      cursorSlot += child.subtreeWidth;
    }
  };

  let rootCursorSlot = 0;
  for (const root of roots) {
    placeSubtree(root, rootCursorSlot, 0);
    rootCursorSlot += root.subtreeWidth;
  }

  // 9. Achata para React Flow.
  const flowNodes: OrgTreeFlowResult['flowNodes'] = [];
  const flowEdges: OrgTreeFlowResult['flowEdges'] = [];

  const collect = (node: OrgTreeNode): void => {
    flowNodes.push({
      id: node.id,
      type: 'employee',
      position: node.position,
      data: {
        employee: node.employee,
        level: node.level,
        childCount: node.children.length,
      },
    });

    for (const child of node.children) {
      flowEdges.push({
        id: `${node.id}->${child.id}`,
        source: node.id,
        target: child.id,
        type: 'smoothstep',
      });
      collect(child);
    }
  };

  for (const root of roots) {
    collect(root);
  }

  return { flowNodes, flowEdges, roots, maxLevel };
}

// ============================================================================
// HELPERS — STATUS COLOR MAPPING
// ============================================================================

export type OrgEmployeeStatusKind =
  | 'active'
  | 'on-leave'
  | 'on-vacation'
  | 'onboarding'
  | 'terminated'
  | 'unknown';

/**
 * Resolve o tipo de status visual de um funcionário a partir dos campos
 * disponíveis (status string + terminationDate + pendingIssues).
 */
export function resolveEmployeeStatusKind(
  employee: Employee
): OrgEmployeeStatusKind {
  if (employee.terminationDate) return 'terminated';

  const normalizedStatus = employee.status?.toUpperCase();
  if (!normalizedStatus) return 'active';

  if (normalizedStatus === 'TERMINATED' || normalizedStatus === 'INACTIVE') {
    return 'terminated';
  }
  if (normalizedStatus === 'VACATION' || normalizedStatus === 'ON_VACATION') {
    return 'on-vacation';
  }
  if (
    normalizedStatus === 'LEAVE' ||
    normalizedStatus === 'ON_LEAVE' ||
    normalizedStatus === 'AWAY'
  ) {
    return 'on-leave';
  }
  if (normalizedStatus === 'ONBOARDING') return 'onboarding';
  if (normalizedStatus === 'ACTIVE') return 'active';

  return 'unknown';
}

// ============================================================================
// HELPERS — INITIALS / AVATAR
// ============================================================================

/**
 * Gera as iniciais (até 2 letras) de um nome completo.
 */
export function getEmployeeInitials(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Hash determinístico simples para mapear nome → tonalidade visual.
 */
export function getEmployeeHueIndex(fullName: string, total: number): number {
  let hash = 0;
  for (let charIndex = 0; charIndex < fullName.length; charIndex += 1) {
    hash = (hash * 31 + fullName.charCodeAt(charIndex)) | 0;
  }
  return Math.abs(hash) % total;
}
