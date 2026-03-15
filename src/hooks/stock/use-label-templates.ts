/**
 * Label Templates Hooks
 * React Query hooks para gerenciar templates de etiquetas
 * @see docs/label-templates.md para documentação da API
 */

import {
  labelTemplatesService,
  type ListLabelTemplatesParams,
} from '@/services/stock/label-templates.service';
import type {
  CreateLabelTemplateInput,
  LabelTemplate,
  UpdateLabelTemplateInput,
} from '@/core/print-queue/editor';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const QUERY_KEY = 'label-templates';

/**
 * Hook para listar todos os templates (paginado)
 */
export function useLabelTemplates(params?: ListLabelTemplatesParams) {
  return useQuery({
    queryKey: [QUERY_KEY, 'list', params],
    queryFn: () => labelTemplatesService.listTemplates(params),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para buscar um template específico
 */
export function useLabelTemplate(id: string | null | undefined) {
  return useQuery({
    queryKey: [QUERY_KEY, 'detail', id],
    queryFn: () => labelTemplatesService.getTemplate(id!),
    enabled: !!id,
  });
}

/**
 * Hook para listar templates do sistema
 */
export function useSystemLabelTemplates() {
  return useQuery({
    queryKey: [QUERY_KEY, 'system'],
    queryFn: () => labelTemplatesService.listSystemTemplates(),
    staleTime: 30 * 60 * 1000, // 30 minutos (templates do sistema mudam raramente)
  });
}

/**
 * Hook para criar um template
 */
export function useCreateLabelTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLabelTemplateInput) =>
      labelTemplatesService.createTemplate(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Template criado com sucesso!');
    },
    onError: (error: Error & { response?: { data?: { error?: string } } }) => {
      const message = error.response?.data?.error || error.message;
      toast.error(`Erro ao criar template: ${message}`);
    },
  });
}

/**
 * Hook para atualizar um template
 */
export function useUpdateLabelTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateLabelTemplateInput;
    }) => labelTemplatesService.updateTemplate(id, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, 'detail', variables.id],
      });
      toast.success('Template atualizado com sucesso!');
    },
    onError: (error: Error & { response?: { data?: { error?: string } } }) => {
      const message = error.response?.data?.error || error.message;
      // Verificar erros específicos
      if (message === 'CANNOT_EDIT_SYSTEM_TEMPLATE') {
        toast.error('Templates de sistema não podem ser editados');
      } else {
        toast.error(`Erro ao atualizar template: ${message}`);
      }
    },
  });
}

/**
 * Hook para deletar um template
 */
export function useDeleteLabelTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => labelTemplatesService.deleteTemplate(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Template excluído com sucesso!');
    },
    onError: (error: Error & { response?: { data?: { error?: string } } }) => {
      const message = error.response?.data?.error || error.message;
      // Verificar erros específicos
      if (message === 'CANNOT_DELETE_SYSTEM_TEMPLATE') {
        toast.error('Templates de sistema não podem ser excluídos');
      } else {
        toast.error(`Erro ao excluir template: ${message}`);
      }
    },
  });
}

/**
 * Hook para duplicar um template
 */
export function useDuplicateLabelTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, newName }: { id: string; newName: string }) =>
      labelTemplatesService.duplicateTemplate(id, newName),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      toast.success('Template duplicado com sucesso!');
    },
    onError: (error: Error & { response?: { data?: { error?: string } } }) => {
      const message = error.response?.data?.error || error.message;
      if (message === 'TEMPLATE_NAME_EXISTS') {
        toast.error('Já existe um template com esse nome');
      } else {
        toast.error(`Erro ao duplicar template: ${message}`);
      }
    },
  });
}

/**
 * Hook para atualizar thumbnail de um template
 */
export function useUpdateThumbnail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      file,
      filename,
    }: {
      id: string;
      file: Blob;
      filename?: string;
    }) => labelTemplatesService.updateThumbnail(id, file, filename),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: [QUERY_KEY, 'detail', variables.id],
      });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar thumbnail: ${error.message}`);
    },
  });
}

/**
 * Hook combinado para operações CRUD completas
 */
export function useLabelTemplateCrud(params?: ListLabelTemplatesParams) {
  const templates = useLabelTemplates(params);
  const create = useCreateLabelTemplate();
  const update = useUpdateLabelTemplate();
  const remove = useDeleteLabelTemplate();
  const duplicate = useDuplicateLabelTemplate();

  return {
    // Queries
    templates: templates.data?.templates ?? [],
    total: templates.data?.total ?? 0,
    isLoading: templates.isLoading,
    error: templates.error,
    refetch: templates.refetch,

    // Mutations
    create: create.mutateAsync,
    update: (id: string, data: UpdateLabelTemplateInput) =>
      update.mutateAsync({ id, data }),
    remove: remove.mutateAsync,
    duplicate: (id: string, newName: string) =>
      duplicate.mutateAsync({ id, newName }),

    // States
    isCreating: create.isPending,
    isUpdating: update.isPending,
    isDeleting: remove.isPending,
    isDuplicating: duplicate.isPending,
  };
}
