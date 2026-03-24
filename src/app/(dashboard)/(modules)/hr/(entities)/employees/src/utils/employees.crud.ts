/**
 * Employee CRUD Operations
 * Funções isoladas para operações de CRUD no módulo de funcionários
 */

import { logger } from '@/lib/logger';
import type {
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
} from '@/services/hr/employees.service';
import type { Employee } from '@/types/hr';
import { employeesApi } from '../api';

/**
 * Criar novo funcionário
 */
export async function createEmployee(
  data: Partial<Employee>
): Promise<Employee> {
  const createData = {
    registrationNumber: data.registrationNumber ?? '',
    fullName: data.fullName ?? '',
    cpf: data.cpf ?? '',
    hireDate: data.hireDate ?? new Date().toISOString(),
    baseSalary: data.baseSalary || undefined,
    contractType: data.contractType ?? 'CLT',
    workRegime: data.workRegime ?? 'FULL_TIME',
    weeklyHours: data.weeklyHours ?? 40,
    companyId: data.companyId,
    departmentId: data.departmentId,
    positionId: data.positionId,
    supervisorId: data.supervisorId,
    userId: data.userId,
    socialName: data.socialName,
    birthDate: data.birthDate,
    gender: data.gender,
    maritalStatus: data.maritalStatus,
    nationality: data.nationality,
    birthPlace: data.birthPlace,
    rg: data.rg,
    rgIssuer: data.rgIssuer,
    rgIssueDate: data.rgIssueDate,
    pis: data.pis,
    ctpsNumber: data.ctpsNumber,
    ctpsSeries: data.ctpsSeries,
    ctpsState: data.ctpsState,
    status: data.status,
    terminationDate: data.terminationDate,
  };
  return employeesApi.create(createData as CreateEmployeeRequest);
}

/**
 * Atualizar funcionário existente
 * Limpa campos null/undefined antes de enviar
 */
export async function updateEmployee(
  id: string,
  data: Partial<Employee>
): Promise<Employee> {
  const cleanData: Partial<Employee> = Object.fromEntries(
    Object.entries(data).filter(([, v]) => v !== null && v !== undefined)
  );
  return employeesApi.update(id, cleanData as UpdateEmployeeRequest);
}

/**
 * Deletar funcionário
 */
export async function deleteEmployee(id: string): Promise<void> {
  return employeesApi.delete(id);
}

/**
 * Duplicar funcionário existente
 * Busca o funcionário original e cria uma cópia com os dados
 */
export async function duplicateEmployee(
  id: string,
  data?: Partial<Employee>
): Promise<Employee> {
  // Buscar funcionário original
  const original = await employeesApi.get(id);

  // Construir objeto de duplicação
  const duplicateData = {
    registrationNumber:
      data?.registrationNumber || `${original.registrationNumber}_COPY`,
    fullName: data?.fullName || `${original.fullName} (cópia)`,
    cpf: data?.cpf || original.cpf,
    hireDate: new Date().toISOString(),
    baseSalary: original.baseSalary,
    contractType: original.contractType,
    workRegime: original.workRegime,
    weeklyHours: original.weeklyHours,
    companyId: original.companyId,
    departmentId: original.departmentId,
    positionId: original.positionId,
    supervisorId: original.supervisorId,
  };

  try {
    return employeesApi.create(duplicateData as CreateEmployeeRequest);
  } catch (error) {
    logger.error(
      '[Employees] Duplication failed',
      error instanceof Error ? error : undefined,
      { originalId: id }
    );
    throw error;
  }
}
