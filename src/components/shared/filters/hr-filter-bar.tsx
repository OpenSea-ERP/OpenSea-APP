'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { logger } from '@/lib/logger';
import { companiesService } from '@/services/admin/companies.service';
import { departmentsService } from '@/services/hr/departments.service';
import { positionsService } from '@/services/hr/positions.service';
import type { Company, Department, Position } from '@/types/hr';
import { useQuery } from '@tanstack/react-query';
import { Briefcase, Building2, Factory, X } from 'lucide-react';
import { useEffect, useMemo } from 'react';

export interface HRFilters {
  companyId?: string;
  departmentId?: string;
  positionId?: string;
}

interface HRFilterBarProps {
  filters: HRFilters;
  onFiltersChange: (filters: HRFilters) => void;
  showCompany?: boolean;
  showDepartment?: boolean;
  showPosition?: boolean;
  className?: string;
}

export function HRFilterBar({
  filters,
  onFiltersChange,
  showCompany = true,
  showDepartment = true,
  showPosition = true,
  className,
}: HRFilterBarProps) {
  const normalizeList = <T,>(data: unknown, key: string): T[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data as T[];

    const keyed = (data as Record<string, unknown>)[key];
    if (Array.isArray(keyed)) return keyed as T[];

    const maybeData = (data as { data?: unknown }).data;
    if (Array.isArray(maybeData)) return maybeData as T[];

    return [];
  };

  // Buscar empresas
  const { data: companiesData } = useQuery({
    queryKey: ['companies-filter'],
    queryFn: async () => {
      try {
        const response = await companiesService.listCompanies({ perPage: 100 });
        return response ?? [];
      } catch (error) {
        logger.error(
          'Erro ao buscar empresas',
          error instanceof Error ? error : undefined
        );
        return [];
      }
    },
    enabled: showCompany,
  });

  // Buscar departamentos (filtrados por empresa se selecionada)
  const { data: departmentsData } = useQuery({
    queryKey: ['departments-filter', filters.companyId],
    queryFn: async () => {
      try {
        const response = await departmentsService.listDepartments({
          companyId: filters.companyId,
          perPage: 100,
        });
        return response ?? [];
      } catch (error) {
        logger.error(
          'Erro ao buscar departamentos',
          error instanceof Error ? error : undefined
        );
        return [];
      }
    },
    enabled: showDepartment,
  });

  // Buscar cargos (filtrados por departamento e/ou empresa se selecionados)
  const { data: positionsData } = useQuery({
    queryKey: ['positions-filter', filters.departmentId, filters.companyId],
    queryFn: async () => {
      try {
        const response = await positionsService.listPositions({
          departmentId: filters.departmentId,
          companyId: filters.companyId,
          perPage: 100,
        });
        return response ?? [];
      } catch (error) {
        logger.error(
          'Erro ao buscar cargos',
          error instanceof Error ? error : undefined
        );
        return [];
      }
    },
    enabled: showPosition,
  });

  const companies = useMemo(
    () => normalizeList<Company>(companiesData, 'companies'),
    [companiesData]
  );
  const departments = useMemo(
    () => normalizeList<Department>(departmentsData, 'departments'),
    [departmentsData]
  );
  const positions = useMemo(
    () => normalizeList<Position>(positionsData, 'positions'),
    [positionsData]
  );

  // Quando a empresa muda, limpar departamento e cargo se não pertencem à empresa
  useEffect(() => {
    if (filters.companyId && filters.departmentId) {
      const dept = departments.find(d => d.id === filters.departmentId);
      if (dept && dept.companyId !== filters.companyId) {
        onFiltersChange({
          ...filters,
          departmentId: undefined,
          positionId: undefined,
        });
      }
    }
  }, [filters.companyId, departments]);

  // Quando o departamento muda, limpar cargo se não pertence ao departamento
  useEffect(() => {
    if (filters.departmentId && filters.positionId) {
      const pos = positions.find(p => p.id === filters.positionId);
      if (pos && pos.departmentId !== filters.departmentId) {
        onFiltersChange({
          ...filters,
          positionId: undefined,
        });
      }
    }
  }, [filters.departmentId, positions]);

  const handleCompanyChange = (value: string) => {
    if (value === 'all') {
      onFiltersChange({
        ...filters,
        companyId: undefined,
        departmentId: undefined,
        positionId: undefined,
      });
    } else {
      onFiltersChange({
        ...filters,
        companyId: value,
        departmentId: undefined,
        positionId: undefined,
      });
    }
  };

  const handleDepartmentChange = (value: string) => {
    if (value === 'all') {
      onFiltersChange({
        ...filters,
        departmentId: undefined,
        positionId: undefined,
      });
    } else {
      onFiltersChange({
        ...filters,
        departmentId: value,
        positionId: undefined,
      });
    }
  };

  const handlePositionChange = (value: string) => {
    if (value === 'all') {
      onFiltersChange({
        ...filters,
        positionId: undefined,
      });
    } else {
      onFiltersChange({
        ...filters,
        positionId: value,
      });
    }
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters =
    filters.companyId || filters.departmentId || filters.positionId;

  // Filtrar departamentos pela empresa selecionada
  const filteredDepartments = useMemo(() => {
    if (!filters.companyId) return departments;
    return departments.filter(d => d.companyId === filters.companyId);
  }, [departments, filters.companyId]);

  // Filtrar posições pelo departamento ou empresa selecionados
  const filteredPositions = useMemo(() => {
    let result = positions;
    if (filters.departmentId) {
      result = result.filter(p => p.departmentId === filters.departmentId);
    } else if (filters.companyId) {
      result = result.filter(
        p => p.department?.companyId === filters.companyId
      );
    }
    return result;
  }, [positions, filters.departmentId, filters.companyId]);

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className || ''}`}>
      {showCompany && (
        <div className="flex items-center gap-2">
          <Factory className="h-4 w-4 text-muted-foreground" />
          <Select
            value={filters.companyId || 'all'}
            onValueChange={handleCompanyChange}
          >
            <SelectTrigger className="w-[220px] h-10 whitespace-nowrap overflow-hidden text-ellipsis">
              <SelectValue placeholder="Todas as empresas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as empresas</SelectItem>
              {companies.map((company: Company) => (
                <SelectItem key={company.id} value={company.id}>
                  {company.tradeName || company.legalName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {showDepartment && (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <Select
            value={filters.departmentId || 'all'}
            onValueChange={handleDepartmentChange}
          >
            <SelectTrigger className="w-[220px] h-10 whitespace-nowrap overflow-hidden text-ellipsis">
              <SelectValue placeholder="Todos os departamentos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os departamentos</SelectItem>
              {filteredDepartments.map((department: Department) => (
                <SelectItem key={department.id} value={department.id}>
                  {department.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {showPosition && (
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-muted-foreground" />
          <Select
            value={filters.positionId || 'all'}
            onValueChange={handlePositionChange}
          >
            <SelectTrigger className="w-[220px] h-10 whitespace-nowrap overflow-hidden text-ellipsis">
              <SelectValue placeholder="Todos os cargos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os cargos</SelectItem>
              {filteredPositions.map((position: Position) => (
                <SelectItem key={position.id} value={position.id}>
                  {position.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-10 px-3 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Limpar filtros
        </Button>
      )}
    </div>
  );
}
