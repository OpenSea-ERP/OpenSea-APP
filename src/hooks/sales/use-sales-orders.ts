import { commentsService, salesOrdersService } from '@/services/sales';
import type {
  CreateCommentRequest,
  CreateSalesOrderRequest,
  UpdateCommentRequest,
  UpdateSalesOrderStatusRequest,
} from '@/types/sales';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const QUERY_KEYS = {
  SALES_ORDERS: ['sales-orders'],
  SALES_ORDER: (id: string) => ['sales-orders', id],
  COMMENTS: (salesOrderId: string) => ['comments', salesOrderId],
  COMMENT: (commentId: string) => ['comments', 'single', commentId],
} as const;

// ==================== SALES ORDERS ====================

// GET /v1/sales-orders - Lista todos os pedidos
export function useSalesOrders() {
  return useQuery({
    queryKey: QUERY_KEYS.SALES_ORDERS,
    queryFn: () => salesOrdersService.listSalesOrders(),
  });
}

// GET /v1/sales-orders/:id - Busca um pedido específico
export function useSalesOrder(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.SALES_ORDER(id),
    queryFn: () => salesOrdersService.getSalesOrder(id),
    enabled: !!id,
  });
}

// POST /v1/sales-orders - Cria um novo pedido
export function useCreateSalesOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSalesOrderRequest) =>
      salesOrdersService.createSalesOrder(data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.SALES_ORDERS,
      });
    },
  });
}

// PATCH /v1/sales-orders/:id/status - Atualiza o status de um pedido
export function useUpdateSalesOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateSalesOrderStatusRequest;
    }) => salesOrdersService.updateSalesOrderStatus(id, data),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.SALES_ORDERS,
      });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.SALES_ORDER(variables.id),
      });
    },
  });
}

// DELETE /v1/sales-orders/:id - Deleta um pedido
export function useDeleteSalesOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => salesOrdersService.deleteSalesOrder(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.SALES_ORDERS,
      });
    },
  });
}

// ==================== COMMENTS ====================

// GET /v1/comments/:salesOrderId - Lista comentários de um pedido
export function useComments(salesOrderId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.COMMENTS(salesOrderId),
    queryFn: () => commentsService.listComments(salesOrderId),
    enabled: !!salesOrderId,
  });
}

// GET /v1/comments/comment/:commentId - Busca um comentário específico
export function useComment(commentId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.COMMENT(commentId),
    queryFn: () => commentsService.getComment(commentId),
    enabled: !!commentId,
  });
}

// POST /v1/comments - Cria um novo comentário
export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCommentRequest) =>
      commentsService.createComment(data),
    onSuccess: async response => {
      // Invalida os comentários do pedido específico
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.COMMENTS(response.comment.entityId),
      });
    },
  });
}

// PATCH /v1/comments/:commentId - Atualiza um comentário
export function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      commentId,
      data,
    }: {
      commentId: string;
      data: UpdateCommentRequest;
    }) => commentsService.updateComment(commentId, data),
    onSuccess: async (response, variables) => {
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.COMMENTS(response.comment.entityId),
      });
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.COMMENT(variables.commentId),
      });
    },
  });
}

// DELETE /v1/comments/:commentId - Deleta um comentário
export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => commentsService.deleteComment(commentId),
    onSuccess: async () => {
      // Invalida todas as listas de comentários
      await queryClient.invalidateQueries({ queryKey: ['comments'] });
    },
  });
}
