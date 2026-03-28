/**
 * HR Teams CRUD Operations
 * Funcoes isoladas para operacoes de CRUD reutilizando o servico core
 */

import { teamsService } from '@/services/core/teams.service';
import type { Team } from '@/types/core';

/**
 * Listar equipes para uso com useEntityCrud
 */
export async function listTeams(): Promise<Team[]> {
  const response = await teamsService.listTeams({ limit: 100 });
  return response.data;
}

/**
 * Obter equipe por ID
 */
export async function getTeam(id: string): Promise<Team> {
  const response = await teamsService.getTeam(id);
  return response.team;
}

/**
 * Criar nova equipe
 */
export async function createTeam(data: {
  name: string;
  description?: string | null;
  color?: string | null;
}): Promise<Team> {
  const response = await teamsService.createTeam({
    name: data.name,
    description: data.description,
    color: data.color,
  });
  return response.team;
}

/**
 * Atualizar equipe
 */
export async function updateTeam(
  id: string,
  data: Record<string, unknown>
): Promise<Team> {
  const response = await teamsService.updateTeam(id, {
    name: data.name as string | undefined,
    description: data.description as string | null | undefined,
    color: data.color as string | null | undefined,
  });
  return response.team;
}

/**
 * Deletar equipe (soft delete)
 */
export async function deleteTeam(id: string): Promise<void> {
  await teamsService.deleteTeam(id);
}
