/**
 * Gerenciador de contas salvas para Fast Login
 * Armazena informações básicas das contas no localStorage
 */

import { logger } from '@/lib/logger';

const SAVED_ACCOUNTS_KEY = 'opensea_saved_accounts';

export interface SavedAccount {
  id: string;
  identifier: string; // email ou username
  displayName: string; // nome do usuário para exibição
  avatarUrl?: string | null;
  lastLoginAt: string; // ISO date string
}

/**
 * Obtém todas as contas salvas
 */
export function getSavedAccounts(): SavedAccount[] {
  if (typeof window === 'undefined') return [];

  try {
    const saved = localStorage.getItem(SAVED_ACCOUNTS_KEY);
    if (!saved) return [];

    const accounts = JSON.parse(saved) as SavedAccount[];
    // Ordena por último login (mais recente primeiro)
    return accounts.sort(
      (a, b) =>
        new Date(b.lastLoginAt).getTime() - new Date(a.lastLoginAt).getTime()
    );
  } catch (error) {
    logger.error(
      'Erro ao carregar contas salvas',
      error instanceof Error ? error : undefined
    );
    return [];
  }
}

/**
 * Salva ou atualiza uma conta
 */
export function saveAccount(account: Omit<SavedAccount, 'lastLoginAt'>): void {
  if (typeof window === 'undefined') return;

  try {
    const accounts = getSavedAccounts();
    const existingIndex = accounts.findIndex(
      a => a.id === account.id
    );

    const updatedAccount: SavedAccount = {
      ...account,
      lastLoginAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      // Atualiza conta existente
      accounts[existingIndex] = updatedAccount;
    } else {
      // Adiciona nova conta (máximo de 5 contas salvas)
      accounts.unshift(updatedAccount);
      if (accounts.length > 5) {
        accounts.pop();
      }
    }

    localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (error) {
    logger.error(
      'Erro ao salvar conta',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Remove uma conta salva
 */
export function removeAccount(id: string): void {
  if (typeof window === 'undefined') return;

  try {
    const accounts = getSavedAccounts();
    const filtered = accounts.filter(a => a.id !== id);
    localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(filtered));
  } catch (error) {
    logger.error(
      'Erro ao remover conta',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Limpa todas as contas salvas
 */
export function clearAllAccounts(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SAVED_ACCOUNTS_KEY);
}

/**
 * Verifica se há contas salvas
 */
export function hasSavedAccounts(): boolean {
  return getSavedAccounts().length > 0;
}
