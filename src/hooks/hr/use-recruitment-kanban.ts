/**
 * Recruitment Kanban Hooks
 *
 * Hooks de leitura e mutação para o pipeline visual de recrutamento.
 * Encapsulam: definição de colunas, listagem por vaga, mudança de status
 * com optimistic update e máquina de estados de transição (Gupy-style).
 */

'use client';

import { useCallback, useMemo } from 'react';
import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query';
import { toast } from 'sonner';
import { recruitmentService } from '@/services/hr/recruitment.service';
import type {
  Application,
  ApplicationStatus,
  Candidate,
  KanbanCandidateCard,
  KanbanColumnDefinition,
  KanbanColumnId,
  KanbanTransitionContext,
  KanbanTransitionVerdict,
} from '@/types/hr';

// =============================================================================
// Column definitions (Gupy-style: Triagem → Entrevista → Oferta → Contratado)
// =============================================================================

/**
 * Colunas canônicas do board.
 * - Triagem agrupa APPLIED + SCREENING (entrada do funil)
 * - Entrevista agrupa INTERVIEW + ASSESSMENT
 * - Oferta = OFFER
 * - Contratado = HIRED (terminal)
 *
 * REJECTED e WITHDRAWN são propositalmente excluídos do board principal
 * (visíveis em filtros/listagens à parte para reduzir ruído visual).
 */
export const KANBAN_COLUMNS: readonly KanbanColumnDefinition[] = [
  {
    id: 'TRIAGE',
    targetStatus: 'SCREENING',
    matchingStatuses: ['APPLIED', 'SCREENING'],
    title: 'Triagem',
    subtitle: 'Análise de currículo e perfil',
    accentColor: 'sky',
    pipelineOrder: 1,
  },
  {
    id: 'INTERVIEW',
    targetStatus: 'INTERVIEW',
    matchingStatuses: ['INTERVIEW', 'ASSESSMENT'],
    title: 'Entrevista',
    subtitle: 'Entrevistas e avaliações técnicas',
    accentColor: 'violet',
    pipelineOrder: 2,
  },
  {
    id: 'OFFER',
    targetStatus: 'OFFER',
    matchingStatuses: ['OFFER'],
    title: 'Oferta',
    subtitle: 'Proposta enviada ao candidato',
    accentColor: 'amber',
    pipelineOrder: 3,
  },
  {
    id: 'HIRED',
    targetStatus: 'HIRED',
    matchingStatuses: ['HIRED'],
    title: 'Contratado',
    subtitle: 'Candidato aceitou e foi contratado',
    accentColor: 'emerald',
    pipelineOrder: 4,
    isTerminal: true,
  },
] as const;

/**
 * Indexador rápido para encontrar a coluna que contém um determinado status.
 */
export function findColumnForStatus(
  status: ApplicationStatus
): KanbanColumnDefinition | null {
  return (
    KANBAN_COLUMNS.find(column => column.matchingStatuses.includes(status)) ??
    null
  );
}

// =============================================================================
// State machine — validação de transições
// =============================================================================

const MIN_RATING_TO_OFFER = 3;

/**
 * Avalia se uma transição entre colunas é permitida, requer confirmação,
 * requer PIN ou está bloqueada. Aplica regras Gupy-style:
 *
 * - Mover para "Oferta" sem rating >= 3 → confirma com aviso
 * - Mover para "Contratado" → exige PIN (operação sensível)
 * - Movimento para trás (desfazer etapa) → requer confirmação
 * - Pular etapas (ex.: Triagem → Oferta) → requer confirmação
 */
export function evaluateKanbanTransition(
  context: KanbanTransitionContext
): KanbanTransitionVerdict {
  const { fromColumn, toColumn, rating } = context;

  if (fromColumn.id === toColumn.id) {
    return { kind: 'allowed' };
  }

  if (toColumn.id === 'HIRED') {
    return {
      kind: 'pin',
      reason:
        'Contratar um candidato é uma operação sensível e exige confirmação por PIN.',
    };
  }

  if (toColumn.id === 'OFFER') {
    if (rating === null) {
      return {
        kind: 'confirm',
        reason:
          'Este candidato ainda não possui avaliação. Tem certeza de que deseja avançar para Oferta?',
      };
    }
    if (rating < MIN_RATING_TO_OFFER) {
      return {
        kind: 'confirm',
        reason: `A avaliação atual (${rating}/5) está abaixo do recomendado (${MIN_RATING_TO_OFFER}/5). Deseja realmente avançar para Oferta?`,
      };
    }
  }

  const isBackwardMove = toColumn.pipelineOrder < fromColumn.pipelineOrder;
  if (isBackwardMove) {
    return {
      kind: 'confirm',
      reason: `Você está movendo o candidato de "${fromColumn.title}" de volta para "${toColumn.title}". Deseja continuar?`,
    };
  }

  const skippedSteps = toColumn.pipelineOrder - fromColumn.pipelineOrder;
  if (skippedSteps > 1) {
    return {
      kind: 'confirm',
      reason: `Você está pulando ${skippedSteps - 1} etapa(s) do pipeline. Deseja continuar?`,
    };
  }

  return { kind: 'allowed' };
}

// =============================================================================
// Card view-model assembly
// =============================================================================

const SOURCE_LABELS: Record<string, string> = {
  WEBSITE: 'Site',
  LINKEDIN: 'LinkedIn',
  REFERRAL: 'Indicação',
  AGENCY: 'Agência',
  OTHER: 'Outro',
};

function getSourceLabel(source: string | undefined | null): string {
  if (!source) return 'Outro';
  return SOURCE_LABELS[source] ?? source;
}

/**
 * Constrói o view-model do card a partir de Application + Candidate.
 * Centralizado aqui para evitar duplicação entre componentes.
 */
export function buildKanbanCard(
  application: Application,
  candidate: Candidate | null | undefined,
  jobPostingTitle?: string
): KanbanCandidateCard {
  return {
    applicationId: application.id,
    candidateId: application.candidateId,
    candidateName: candidate?.fullName ?? 'Candidato sem nome',
    candidateEmail: candidate?.email ?? '',
    status: application.status,
    source: getSourceLabel(candidate?.source),
    rating: application.rating ?? null,
    tags: candidate?.tags ?? [],
    appliedAt: application.appliedAt,
    jobPostingTitle,
  };
}

// =============================================================================
// Query hooks
// =============================================================================

const APPLICATIONS_QUERY_KEY = (jobPostingId: string): QueryKey => [
  'hr',
  'recruitment',
  'kanban',
  'applications',
  { jobPostingId },
];

const CANDIDATES_QUERY_KEY: QueryKey = ['hr', 'recruitment', 'candidates', 'all'];

const JOB_POSTING_QUERY_KEY = (jobPostingId: string): QueryKey => [
  'hr',
  'recruitment',
  'job-postings',
  jobPostingId,
];

const OPEN_JOB_POSTINGS_QUERY_KEY: QueryKey = [
  'hr',
  'recruitment',
  'job-postings',
  'open',
];

/**
 * Lista todas as Applications de uma vaga, paginando até buscar todas
 * (necessário para o Kanban exibir todos os candidatos sem scroll lateral).
 */
function useApplicationsByJob(jobPostingId: string | null) {
  return useQuery({
    queryKey: APPLICATIONS_QUERY_KEY(jobPostingId ?? '__none__'),
    enabled: Boolean(jobPostingId),
    queryFn: async () => {
      if (!jobPostingId) return [] as Application[];
      const allApplications: Application[] = [];
      let page = 1;
      const perPage = 100;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const response = await recruitmentService.listApplications({
          jobPostingId,
          page,
          perPage,
        });
        allApplications.push(...response.applications);
        const totalPages = response.meta?.totalPages ?? response.totalPages ?? 1;
        if (page >= totalPages) break;
        page += 1;
      }
      return allApplications;
    },
  });
}

/**
 * Carrega todos os candidatos referenciados pelas applications.
 * Otimização: busca em lote (até 100) e cacheia globalmente.
 */
function useCandidatesByIds(candidateIds: string[]) {
  return useQuery({
    queryKey: [...CANDIDATES_QUERY_KEY, { candidateIds }],
    enabled: candidateIds.length > 0,
    queryFn: async () => {
      // Em vez de buscar 1 por 1, fazemos um listAll e filtramos
      // (back-end não tem endpoint /candidates?ids=...).
      const allCandidates: Candidate[] = [];
      let page = 1;
      const perPage = 100;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const response = await recruitmentService.listCandidates({
          page,
          perPage,
        });
        allCandidates.push(...response.candidates);
        const totalPages = response.meta?.totalPages ?? response.totalPages ?? 1;
        if (page >= totalPages) break;
        page += 1;
      }
      const idSet = new Set(candidateIds);
      return allCandidates.filter(candidate => idSet.has(candidate.id));
    },
  });
}

/**
 * Hook principal: carrega o board completo (applications + candidates)
 * e devolve cards prontos agrupados por coluna.
 */
export function useKanbanBoard(jobPostingId: string | null) {
  const applicationsQuery = useApplicationsByJob(jobPostingId);
  const candidateIds = useMemo(() => {
    return Array.from(
      new Set((applicationsQuery.data ?? []).map(app => app.candidateId))
    );
  }, [applicationsQuery.data]);
  const candidatesQuery = useCandidatesByIds(candidateIds);

  const cards = useMemo<KanbanCandidateCard[]>(() => {
    const applications = applicationsQuery.data ?? [];
    const candidates = candidatesQuery.data ?? [];
    const candidatesById = new Map(candidates.map(c => [c.id, c]));
    return applications.map(application =>
      buildKanbanCard(
        application,
        candidatesById.get(application.candidateId) ?? null
      )
    );
  }, [applicationsQuery.data, candidatesQuery.data]);

  const cardsByColumn = useMemo(() => {
    const grouped = new Map<KanbanColumnId, KanbanCandidateCard[]>();
    for (const column of KANBAN_COLUMNS) {
      grouped.set(column.id, []);
    }
    for (const card of cards) {
      const column = findColumnForStatus(card.status);
      if (!column) continue;
      const bucket = grouped.get(column.id);
      if (bucket) bucket.push(card);
    }
    return grouped;
  }, [cards]);

  return {
    cards,
    cardsByColumn,
    isLoading: applicationsQuery.isLoading || candidatesQuery.isLoading,
    isFetching: applicationsQuery.isFetching || candidatesQuery.isFetching,
    error: applicationsQuery.error ?? candidatesQuery.error,
  };
}

/**
 * Lista vagas em aberto para o seletor de vaga ativa do hub.
 */
export function useOpenJobPostings() {
  return useQuery({
    queryKey: OPEN_JOB_POSTINGS_QUERY_KEY,
    queryFn: async () => {
      const response = await recruitmentService.listJobPostings({
        status: 'OPEN',
        perPage: 100,
      });
      return response.jobPostings;
    },
  });
}

/**
 * Detalhe da vaga atual (header do board).
 */
export function useJobPostingDetail(jobPostingId: string | null) {
  return useQuery({
    queryKey: JOB_POSTING_QUERY_KEY(jobPostingId ?? '__none__'),
    enabled: Boolean(jobPostingId),
    queryFn: async () => {
      if (!jobPostingId) return null;
      const response = await recruitmentService.getJobPosting(jobPostingId);
      return response.jobPosting;
    },
  });
}

// =============================================================================
// Mutations — change status with optimistic update + rollback
// =============================================================================

interface ChangeApplicationStatusInput {
  applicationId: string;
  newStatus: ApplicationStatus;
  jobPostingId: string;
}

/**
 * Hook de mutação otimista: atualiza o cache imediatamente, faz rollback
 * em caso de falha. Toast de sucesso/erro.
 */
export function useChangeApplicationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      applicationId,
      newStatus,
    }: ChangeApplicationStatusInput) => {
      const response = await recruitmentService.updateApplicationStatus(
        applicationId,
        { status: newStatus }
      );
      return response.application;
    },
    onMutate: async ({ applicationId, newStatus, jobPostingId }) => {
      const queryKey = APPLICATIONS_QUERY_KEY(jobPostingId);
      await queryClient.cancelQueries({ queryKey });
      const previousApplications =
        queryClient.getQueryData<Application[]>(queryKey);
      if (previousApplications) {
        queryClient.setQueryData<Application[]>(
          queryKey,
          previousApplications.map(application =>
            application.id === applicationId
              ? { ...application, status: newStatus }
              : application
          )
        );
      }
      return { previousApplications, queryKey };
    },
    onError: (_error, _variables, rollbackContext) => {
      if (rollbackContext?.previousApplications && rollbackContext.queryKey) {
        queryClient.setQueryData(
          rollbackContext.queryKey,
          rollbackContext.previousApplications
        );
      }
      toast.error('Não foi possível mover o candidato. Tente novamente.');
    },
    onSuccess: () => {
      toast.success('Candidato movido com sucesso.');
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: APPLICATIONS_QUERY_KEY(variables.jobPostingId),
      });
    },
  });
}

/**
 * Hook utilitário: dispara a mutação após confirmação do PIN no caso de
 * contratação (atalho usado pelo board quando o veredito é "pin").
 */
export function useHireApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (applicationId: string) => {
      const response = await recruitmentService.hireApplication(applicationId);
      return response.application;
    },
    onSuccess: () => {
      toast.success('Candidato contratado com sucesso.');
    },
    onError: () => {
      toast.error('Não foi possível concluir a contratação.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['hr', 'recruitment', 'kanban'],
      });
    },
  });
}

// =============================================================================
// Source-based color helpers (badges no card)
// =============================================================================

export function getSourceBadgeStyle(sourceLabel: string): {
  light: string;
  dark: string;
} {
  switch (sourceLabel) {
    case 'LinkedIn':
      return {
        light: 'bg-sky-50 text-sky-700 border-sky-200',
        dark: 'dark:bg-sky-500/8 dark:text-sky-300 dark:border-sky-500/20',
      };
    case 'Indicação':
      return {
        light: 'bg-violet-50 text-violet-700 border-violet-200',
        dark: 'dark:bg-violet-500/8 dark:text-violet-300 dark:border-violet-500/20',
      };
    case 'Site':
      return {
        light: 'bg-teal-50 text-teal-700 border-teal-200',
        dark: 'dark:bg-teal-500/8 dark:text-teal-300 dark:border-teal-500/20',
      };
    case 'Agência':
      return {
        light: 'bg-amber-50 text-amber-700 border-amber-200',
        dark: 'dark:bg-amber-500/8 dark:text-amber-300 dark:border-amber-500/20',
      };
    default:
      return {
        light: 'bg-slate-50 text-slate-700 border-slate-200',
        dark: 'dark:bg-slate-500/8 dark:text-slate-300 dark:border-slate-500/20',
      };
  }
}

/**
 * Helper para gerar cor estável a partir do nome (avatar fallback).
 */
export function getAvatarColorFromName(fullName: string): string {
  const palettes = [
    'bg-violet-500',
    'bg-sky-500',
    'bg-teal-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-rose-500',
    'bg-indigo-500',
    'bg-fuchsia-500',
  ];
  let hash = 0;
  for (let charIndex = 0; charIndex < fullName.length; charIndex += 1) {
    hash = (hash * 31 + fullName.charCodeAt(charIndex)) | 0;
  }
  const paletteIndex = Math.abs(hash) % palettes.length;
  return palettes[paletteIndex];
}

/**
 * Iniciais a partir do nome completo (até 2 letras).
 */
export function getInitialsFromName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (
    parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
  ).toUpperCase();
}

/**
 * Hook de conveniência: aplica filtros locais aos cards.
 */
export function useFilteredKanbanCards(
  cards: KanbanCandidateCard[],
  filters: { search: string; source: string; minRating: number | null }
): KanbanCandidateCard[] {
  return useMemo(() => {
    const normalizedSearch = filters.search.trim().toLowerCase();
    return cards.filter(card => {
      if (normalizedSearch) {
        const haystack =
          `${card.candidateName} ${card.candidateEmail}`.toLowerCase();
        if (!haystack.includes(normalizedSearch)) return false;
      }
      if (filters.source && card.source !== filters.source) return false;
      if (filters.minRating !== null) {
        if (card.rating === null || card.rating < filters.minRating) {
          return false;
        }
      }
      return true;
    });
  }, [cards, filters]);
}

/**
 * Hook agrupando os cards filtrados por coluna.
 */
export function useGroupedFilteredCards(
  filteredCards: KanbanCandidateCard[]
): Map<KanbanColumnId, KanbanCandidateCard[]> {
  return useMemo(() => {
    const grouped = new Map<KanbanColumnId, KanbanCandidateCard[]>();
    for (const column of KANBAN_COLUMNS) {
      grouped.set(column.id, []);
    }
    for (const card of filteredCards) {
      const column = findColumnForStatus(card.status);
      if (!column) continue;
      const bucket = grouped.get(column.id);
      if (bucket) bucket.push(card);
    }
    return grouped;
  }, [filteredCards]);
}

/**
 * Helper de safety: evita erros quando jobPostingId vem vazio.
 */
export function useSafeJobPostingId(rawId: string | null | undefined): string | null {
  return useCallback(() => {
    if (!rawId || typeof rawId !== 'string' || rawId.trim() === '') return null;
    return rawId.trim();
  }, [rawId])();
}
