/**
 * eSocial — Mapa de códigos de retorno do governo
 *
 * Catálogo dos códigos gov.br mais frequentes em respostas do eSocial,
 * com mensagem em português formal e dica de próximo passo recomendada
 * ao operador para destravar o evento.
 *
 * Referência oficial: leiautes do eSocial publicados em
 * https://www.gov.br/esocial — categoria "Códigos de retorno".
 */

export interface EsocialCodeInfo {
  /** Mensagem em português formal explicando o que o código significa */
  message: string;
  /** Sugestão de ação corretiva para o usuário */
  hint: string;
  /** Severidade aproximada do código (afeta cor/prioridade na UI) */
  severity: 'error' | 'warning' | 'info';
}

const ESOCIAL_CODE_CATALOG: Record<string, EsocialCodeInfo> = {
  // Sucesso
  '201': {
    message: 'Lote recebido com sucesso pelo ambiente nacional do eSocial.',
    hint: 'Aguarde o processamento e consulte o status para obter o protocolo.',
    severity: 'info',
  },
  '202': {
    message: 'Lote em processamento.',
    hint: 'Aguarde alguns minutos e atualize o status do lote.',
    severity: 'info',
  },

  // Erros de schema e estrutura
  '1010': {
    message: 'Erro de validação de schema XSD.',
    hint: 'Verifique se os dados obrigatórios do funcionário estão completos e no formato esperado.',
    severity: 'error',
  },
  '1020': {
    message: 'Versão do leiaute incorreta ou não suportada.',
    hint: 'Atualize a configuração do eSocial para a versão de leiaute vigente.',
    severity: 'error',
  },
  '1030': {
    message: 'Tipo de evento desconhecido ou inválido.',
    hint: 'Confirme se o tipo de evento (S-XXXX) está correto para a operação desejada.',
    severity: 'error',
  },

  // Erros de negócio — cadastro de trabalhador
  '1101': {
    message: 'Trabalhador já possui evento S-2200 ativo no período.',
    hint: 'Utilize um evento de alteração (S-2205/S-2206) ou de desligamento (S-2299).',
    severity: 'error',
  },
  '1102': {
    message: 'Trabalhador não localizado no cadastro do eSocial.',
    hint: 'Confirme se o cadastramento inicial (S-2200) já foi enviado e aceito.',
    severity: 'error',
  },
  '1103': {
    message: 'CPF do trabalhador inválido ou em situação irregular na Receita Federal.',
    hint: 'Verifique a situação cadastral do CPF e atualize os dados do funcionário.',
    severity: 'error',
  },
  '1104': {
    message: 'Data de admissão fora do período permitido.',
    hint: 'Confirme a data de admissão e o prazo de envio do evento ao eSocial.',
    severity: 'error',
  },

  // Erros de duplicidade e ordem
  '1201': {
    message: 'Evento duplicado: já existe registro idêntico processado.',
    hint: 'Consulte o evento original. Se for necessário corrigir, gere uma retificação.',
    severity: 'warning',
  },
  '1202': {
    message: 'Evento depende de outro ainda não processado pelo eSocial.',
    hint: 'Aguarde o processamento do evento antecedente antes de reenviar este.',
    severity: 'warning',
  },
  '1203': {
    message: 'Sequência de eventos inválida para o trabalhador.',
    hint: 'Revise o histórico do trabalhador e envie os eventos na ordem cronológica correta.',
    severity: 'error',
  },

  // Erros de certificado / autenticação
  '1301': {
    message: 'Certificado digital inválido, expirado ou revogado.',
    hint: 'Renove o certificado ICP-Brasil nas configurações do eSocial.',
    severity: 'error',
  },
  '1302': {
    message: 'Certificado não autorizado para o CNPJ do empregador.',
    hint: 'Utilize um certificado emitido para o CNPJ correto da empresa.',
    severity: 'error',
  },
  '1303': {
    message: 'Assinatura digital inválida.',
    hint: 'Reenvie o evento. Se persistir, verifique a integridade do certificado.',
    severity: 'error',
  },

  // Erros de conexão / ambiente
  '1401': {
    message: 'Serviço do eSocial temporariamente indisponível.',
    hint: 'Aguarde alguns minutos e tente reenviar o evento.',
    severity: 'warning',
  },
  '1402': {
    message: 'Tempo limite excedido na comunicação com o eSocial.',
    hint: 'Verifique sua conexão e reenvie o evento.',
    severity: 'warning',
  },

  // Erros de prazo
  '1501': {
    message: 'Evento enviado fora do prazo legal estabelecido pelo eSocial.',
    hint: 'O evento foi processado, mas pode gerar multa. Avalie envio de defesa, se aplicável.',
    severity: 'warning',
  },

  // Folha de pagamento e fechamento
  '1601': {
    message: 'Folha de pagamento já fechada para o período.',
    hint: 'Para corrigir, reabra o período com o evento S-1298 antes de retransmitir.',
    severity: 'error',
  },
  '1602': {
    message: 'Rubrica utilizada não consta na tabela do empregador.',
    hint: 'Cadastre a rubrica via S-1010 antes de transmitir a remuneração.',
    severity: 'error',
  },

  // Desligamento
  '1701': {
    message: 'Data de desligamento anterior à data de admissão.',
    hint: 'Verifique e corrija a data de desligamento do funcionário.',
    severity: 'error',
  },
  '1702': {
    message: 'Motivo de desligamento incompatível com o tipo de contrato.',
    hint: 'Revise o motivo de desligamento conforme tabela 19 do eSocial.',
    severity: 'error',
  },
};

/**
 * Retorna informações detalhadas sobre um código de retorno do eSocial.
 * Caso o código não esteja catalogado, devolve um fallback genérico.
 */
export function getEsocialCodeInfo(code: string | null | undefined): EsocialCodeInfo {
  if (!code) {
    return {
      message: 'Código não informado pelo eSocial.',
      hint: 'Verifique a mensagem de retorno completa para mais detalhes.',
      severity: 'info',
    };
  }

  const normalizedCode = code.trim();
  const cataloged = ESOCIAL_CODE_CATALOG[normalizedCode];

  if (cataloged) {
    return cataloged;
  }

  return {
    message: `Código ${normalizedCode} não catalogado.`,
    hint: 'Consulte a documentação oficial do eSocial ou o suporte técnico.',
    severity: 'error',
  };
}

/**
 * Atalho para obter apenas a dica de ação corretiva.
 */
export function getEsocialErrorHint(code: string | null | undefined): string {
  return getEsocialCodeInfo(code).hint;
}

/**
 * Atalho para obter apenas a mensagem traduzida do código.
 */
export function getEsocialErrorMessage(code: string | null | undefined): string {
  return getEsocialCodeInfo(code).message;
}

/**
 * Lista todos os códigos catalogados (útil para help/tooltip de referência).
 */
export function listKnownEsocialCodes(): Array<{ code: string } & EsocialCodeInfo> {
  return Object.entries(ESOCIAL_CODE_CATALOG).map(([code, info]) => ({
    code,
    ...info,
  }));
}
