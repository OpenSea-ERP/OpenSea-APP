import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { posService } from '@/services/sales';
import type {
  ClosePosSessionRequest,
  CreatePosCashMovementRequest,
  CreatePosTerminalRequest,
  CreatePosTransactionRequest,
  OpenPosSessionRequest,
  OpenTotemSessionRequest,
  PairDeviceRequest,
  PosTerminalsQuery,
  UpdatePosTerminalRequest,
} from '@/types/sales';
import { toast } from 'sonner';

const DEVICE_TOKEN_KEY = 'pos_device_token';

const POS_KEYS = {
  terminals: ['pos-terminals'] as const,
  terminalsList: (params?: PosTerminalsQuery) =>
    [...POS_KEYS.terminals, params] as const,
  session: (terminalId: string) => ['pos-session', terminalId] as const,
  deviceMe: ['pos-device-me'] as const,
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
      toast.success('Terminal excluído com sucesso.');
    },
    onError: () => {
      toast.error('Erro ao excluir terminal.');
    },
  });
}

export function usePairingCode(terminalId: string) {
  return useQuery({
    queryKey: ['pos-pairing-code', terminalId] as const,
    queryFn: async () => posService.getPairingCode(terminalId),
    enabled: !!terminalId,
    refetchInterval: 30_000,
    staleTime: 0,
  });
}

export function usePairThisDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      terminalId,
      deviceLabel,
    }: {
      terminalId: string;
      deviceLabel: string;
    }) => posService.pairThisDevice(terminalId, deviceLabel),
    onSuccess: response => {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(DEVICE_TOKEN_KEY, response.deviceToken);
      }
      queryClient.invalidateQueries({ queryKey: POS_KEYS.terminals });
      queryClient.invalidateQueries({ queryKey: POS_KEYS.deviceMe });
      toast.success('Dispositivo pareado com sucesso.');
    },
    onError: () => {
      toast.error('Erro ao parear este dispositivo.');
    },
  });
}

export function useUnpairDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      posService.unpairDevice(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POS_KEYS.terminals });
      toast.success('Pareamento revogado com sucesso.');
    },
    onError: () => {
      toast.error('Erro ao revogar pareamento.');
    },
  });
}

// Device hooks
export function usePairDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PairDeviceRequest) => posService.pairDevice(data),
    onSuccess: response => {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(DEVICE_TOKEN_KEY, response.deviceToken);
      }
      queryClient.invalidateQueries({ queryKey: POS_KEYS.deviceMe });
      toast.success('Terminal pareado com sucesso.');
    },
    onError: () => {
      toast.error('Erro ao parear terminal. Verifique o código.');
    },
  });
}

export function useMyDevice() {
  const hasToken =
    typeof window !== 'undefined' &&
    !!window.localStorage.getItem(DEVICE_TOKEN_KEY);

  return useQuery({
    queryKey: POS_KEYS.deviceMe,
    queryFn: async () => {
      const response = await posService.getMyDevice();
      return response;
    },
    enabled: hasToken,
    retry: false,
    staleTime: 60_000, // 1 min — device state is relatively stable
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

// Session hooks
export function usePosSessionSummary(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['pos-session-summary', sessionId] as const,
    queryFn: async () => {
      const response = await posService.getSessionSummary(sessionId!);
      return response.summary;
    },
    enabled: !!sessionId,
  });
}

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
      queryClient.invalidateQueries({ queryKey: POS_KEYS.deviceMe });
      toast.success('Sessão aberta com sucesso.');
    },
    onError: () => {
      toast.error('Erro ao abrir sessão.');
    },
  });
}

export function useOpenTotemSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: OpenTotemSessionRequest) =>
      posService.openTotemSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POS_KEYS.deviceMe });
      toast.success('Totem aberto com sucesso.');
    },
    onError: () => {
      toast.error('Erro ao abrir totem. Verifique o código.');
    },
  });
}

export function useClosePosSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sessionId,
      data,
    }: {
      sessionId: string;
      terminalId?: string;
      data: ClosePosSessionRequest;
    }) => posService.closeSession(sessionId, data),
    onSuccess: (_data, variables) => {
      if (variables.terminalId) {
        queryClient.invalidateQueries({
          queryKey: POS_KEYS.session(variables.terminalId),
        });
      }
      queryClient.invalidateQueries({ queryKey: POS_KEYS.deviceMe });
      toast.success('Sessão fechada com sucesso.');
    },
    onError: () => {
      toast.error('Erro ao fechar sessão.');
    },
  });
}

export function useCloseOrphanSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => posService.closeOrphanSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POS_KEYS.deviceMe });
      toast.success('Sessão anterior fechada.');
    },
    onError: () => {
      toast.error('Erro ao fechar sessão anterior.');
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
      toast.success('Movimentação registrada com sucesso.');
    },
    onError: () => {
      toast.error('Erro ao registrar movimentação.');
    },
  });
}
