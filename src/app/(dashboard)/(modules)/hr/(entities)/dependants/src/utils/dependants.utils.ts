/**
 * Dependant Utilities
 * Funcoes utilitarias para dependentes
 */

import type { DependantRelationship, EmployeeDependant } from '@/types/hr';

/**
 * Mapa de labels de parentesco
 */
const relationshipLabels: Record<DependantRelationship, string> = {
  SPOUSE: 'Cônjuge',
  CHILD: 'Filho(a)',
  STEPCHILD: 'Enteado(a)',
  PARENT: 'Pai/Mãe',
  OTHER: 'Outro',
};

/**
 * Retorna o label do tipo de parentesco
 */
export function getRelationshipLabel(
  relationship: DependantRelationship
): string {
  return relationshipLabels[relationship] ?? relationship;
}

/**
 * Retorna a cor do badge de parentesco
 */
export function getRelationshipColor(
  relationship: DependantRelationship
): 'default' | 'secondary' | 'outline' {
  switch (relationship) {
    case 'SPOUSE':
      return 'default';
    case 'CHILD':
    case 'STEPCHILD':
      return 'secondary';
    case 'PARENT':
      return 'outline';
    default:
      return 'outline';
  }
}

/**
 * Formata data para pt-BR
 */
export function formatDate(date: string | Date | undefined): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('pt-BR');
}

/**
 * Formata CPF com mascara (000.000.000-00)
 */
export function formatCpf(cpf: string | undefined): string {
  if (!cpf) return '-';
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return cpf;
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Calcula a idade a partir da data de nascimento
 */
export function calculateAge(birthDate: string | undefined): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Retorna badges descritivos para um dependente
 */
export function getDependantBadges(
  dependant: EmployeeDependant
): Array<{ label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> {
  const badges: Array<{
    label: string;
    variant: 'default' | 'secondary' | 'outline' | 'destructive';
  }> = [];

  badges.push({
    label: getRelationshipLabel(dependant.relationship),
    variant: getRelationshipColor(dependant.relationship),
  });

  if (dependant.isIrrfDependant) {
    badges.push({ label: 'IRRF', variant: 'outline' });
  }

  if (dependant.isSalarioFamilia) {
    badges.push({ label: 'Sal. Família', variant: 'outline' });
  }

  if (dependant.hasDisability) {
    badges.push({ label: 'PcD', variant: 'secondary' });
  }

  return badges;
}
