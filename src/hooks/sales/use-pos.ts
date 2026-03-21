import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { posService } from '@/services/sales';
import type {
  ClosePosSessionRequest,
  CreatePosCashMovementRequest,
  CreatePosTerminalRequest,
  CreatePosTransactionRequest,
  OpenPosSessionRequest,
  PosTerminalsQuery,
  UpdatePosTerminalRequest,
} from '@/types/sales';
import { toast } from 'sonner';

const POS_KEYS = {
  terminals: ['pos-terminals'] as const,
  terminalsList: (params?: PosTerminalsQuery) =>
    [...POS_KEYS.terminals, params] as const,
  session: (terminalId: string) => ['pos-session', terminalId] as const,
};

// Terminal hooks
export function usePosTerminals(params?: PosTerminalsQuery) {
  return useQuery({
    queryKey: POS_KEYS.terminalsList(params),
    queryFn: async () => {
      const response = await posService.listTerminals(params);
      return response;
    },
  });
}

export function useCreatePosTerminal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePosTerminalRequest) =>
      posService.createTerminal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POS_KEYS.terminals });
      toast.success('Terminal criado com sucesso.');
    },
    onError: () => {
      toast.error('Erro ao criar terminal.');
    },
  });
}

export function useUpdatePosTerminal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdatePosTerminalRequest;
    }) => posService.updateTerminal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POS_KEYS.terminals });
      toast.success('Terminal atualizado com sucesso.');
    },
    onError: () => {
      toast.error('Erro ao atualizar terminal.');
    },
  });
}

export function useDeletePosTerminal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => posService.deleteTerminal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POS_KEYS.terminals });
      toast.success('Terminal excluido com sucesso.');
    },
    onError: () => {
      toast.error('Erro ao excluir terminal.');
    },
  });
}

// Session hooks
export function useActiveSession(terminalId: string) {
  return useQuery({
    queryKey: POS_KEYS.session(terminalId),
    queryFn: async () => {
      const response = await posService.getActiveSession(terminalId);
      return response.session;
    },
    enabled: !!terminalId,
  });
}

export function useOpenPosSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: OpenPosSessionRequest) => posService.openSession(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: POS_KEYS.session(variables.terminalId),
      });
      toast.success('Sessao aberta com sucesso.');
    },
    onError: () => {
      toast.error('Erro ao abrir sessao.');
    },
  });
}

export function useClosePosSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      terminalId,
      data,
    }: {
      sessionId: string;
      terminalId: string;
      data: ClosePosSessionRequest;
    }) => posService.closeSession(sessionId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: POS_KEYS.session(variables.terminalId),
      });
      toast.success('Sessao fechada com sucesso.');
    },
    onError: () => {
      toast.error('Erro ao fechar sessao.');
    },
  });
}

// Transaction hooks
export function useCreatePosTransaction() {
  return useMutation({
    mutationFn: (data: CreatePosTransactionRequest) =>
      posService.createTransaction(data),
    onSuccess: () => {
      toast.success('Venda registrada com sucesso.');
    },
    onError: () => {
      toast.error('Erro ao registrar venda.');
    },
  });
}

export function useCancelPosTransaction() {
  return useMutation({
    mutationFn: (id: string) => posService.cancelTransaction(id),
    onSuccess: () => {
      toast.success('Venda cancelada com sucesso.');
    },
    onError: () => {
      toast.error('Erro ao cancelar venda.');
    },
  });
}

// Cash hooks
export function useCreatePosCashMovement() {
  return useMutation({
    mutationFn: (data: CreatePosCashMovementRequest) =>
      posService.createCashMovement(data),
    onSuccess: () => {
      toast.success('Movimentacao registrada com sucesso.');
    },
    onError: () => {
      toast.error('Erro ao registrar movimentacao.');
    },
  });
}
