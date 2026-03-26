/**
 * Traduções de mensagens de erro da API
 * Mapeia mensagens em inglês para português
 */
export const errorMessages: Record<string, string> = {
  // ============= AUTENTICAÇÃO =============
  'Invalid credentials': 'Credenciais inválidas',
  'User not found': 'Usuário não encontrado',
  'User not found.': 'Usuário não encontrado',
  'Invalid password': 'Senha incorreta',
  'Email already exists': 'Este e-mail já está cadastrado',
  'Username already exists': 'Este nome de usuário já está em uso',
  'Invalid email': 'E-mail inválido',
  'Invalid username': 'Nome de usuário inválido',
  'User not authorized': 'Usuário não autorizado',
  'Unauthorized error': 'Erro de autorização',

  // ============= BLOQUEIO DE CONTA =============
  'User is temporarily blocked due to failed login attempts':
    'Usuário temporariamente bloqueado devido a tentativas de login falhas',

  // ============= RESET DE SENHA =============
  'Invalid reset code': 'Código de recuperação inválido',
  'Reset code expired': 'Código de recuperação expirado',
  'Email not found': 'E-mail não encontrado',
  'Failed to send email': 'Falha ao enviar e-mail',
  'Password reset is required before you can access the system':
    'Redefinição de senha obrigatória. Use o link enviado ou fale com o administrador.',

  // ============= REFRESH TOKEN =============
  'Invalid refresh token.': 'Token de atualização inválido',
  'Invalid refresh token': 'Token de atualização inválido',
  'Refresh token has been revoked.': 'Token de atualização foi revogado',
  'Refresh token has been revoked': 'Token de atualização foi revogado',
  'Refresh token has expired.': 'Token de atualização expirado',
  'Refresh token has expired': 'Token de atualização expirado',
  'Refresh token is required in Authorization header.':
    'Token de atualização é obrigatório no header de autorização',
  'Invalid refresh token format.': 'Formato de token de atualização inválido',
  'No refresh token available': 'Nenhum token de atualização disponível',
  'Failed to refresh token': 'Falha ao atualizar token',
  'Refresh token not found.': 'Token de atualização não encontrado',

  // ============= SESSÕES =============
  'Session not found.': 'Sessão não encontrada',
  'Session not found': 'Sessão não encontrada',
  'Session has expired.': 'Sessão expirada',
  'Session has expired': 'Sessão expirada',
  'Session has been revoked.': 'Sessão foi revogada',
  'Session has been revoked': 'Sessão foi revogada',
  'Session is already expired.': 'Sessão já está expirada',
  'Session is already revoked.': 'Sessão já está revogada',
  'Sessions not found.': 'Nenhuma sessão encontrada',
  'You can only revoke your own sessions.':
    'Você só pode revogar suas próprias sessões',
  'Unable to create session. Please verify the provided user ID and IP address.':
    'Não foi possível criar a sessão. Verifique o ID do usuário e o endereço IP fornecidos.',
  'Unable to create refresh token.':
    'Não foi possível criar o token de atualização',
  'Unable to update session.': 'Não foi possível atualizar a sessão',

  // ============= VALIDAÇÃO =============
  'Password too short': 'Senha muito curta',
  'Password too weak': 'Senha muito fraca',
  'Password is required': 'Senha é obrigatória',
  'Passwords do not match': 'As senhas não coincidem',
  'Password is not strong enough.':
    'A senha não atende aos requisitos de segurança.',
  'A senha deve ter pelo menos 6 caracteres.':
    'A senha deve ter pelo menos 6 caracteres.',
  'A senha deve ter pelo menos 8 caracteres.':
    'A senha deve ter pelo menos 8 caracteres.',
  'A senha deve conter pelo menos uma letra maiúscula.':
    'A senha deve conter pelo menos uma letra maiúscula.',
  'A senha deve conter pelo menos uma letra minúscula.':
    'A senha deve conter pelo menos uma letra minúscula.',
  'A senha deve conter pelo menos um número.':
    'A senha deve conter pelo menos um número.',
  'A senha deve conter pelo menos um caractere especial.':
    'A senha deve conter pelo menos um caractere especial.',
  'A senha não atende aos requisitos de segurança.':
    'A senha não atende aos requisitos de segurança.',
  'Field is required': 'Campo obrigatório',
  'Invalid format': 'Formato inválido',
  "Response doesn't match the schema":
    'Erro de validação no servidor. Verifique se o usuário existe e tem permissões configuradas.',
  'Validation error': 'Erro de validação dos dados',
  'Old password is required': 'Senha atual é obrigatória',
  'Token is required': 'Token é obrigatório',
  'Start date must be before end date':
    'Data inicial deve ser anterior à data final',

  // ============= RATE LIMIT =============
  'Too many requests, please try again later.':
    'Muitas requisições. Tente novamente mais tarde.',
  'Too many requests': 'Muitas requisições. Aguarde um momento.',
  'Rate limit exceeded': 'Limite de requisições excedido',

  // ============= ERROS GENÉRICOS =============
  'Something went wrong': 'Algo deu errado',
  'Network error': 'Erro de conexão',
  'Server error': 'Erro no servidor',
  'Internal server error': 'Erro interno do servidor',
  Unauthorized: 'Não autorizado',
  Forbidden: 'Acesso negado',
  'Not found': 'Não encontrado',
  'Request timeout': 'Tempo de requisição esgotado',

  // ============= ERROS HTTP =============
  'Bad Request': 'Requisição inválida',
  'Bad request error': 'Erro de requisição inválida',
  'Internal Server Error': 'Erro interno do servidor',
  'Service Unavailable': 'Serviço indisponível',

  // ============= FINANCE =============
  'Bank account not found': 'Conta bancária não encontrada',
  'Bank account already exists': 'Esta conta bancária já está cadastrada',
  'Bank account name already exists':
    'Já existe uma conta bancária com este nome',
  'Category not found': 'Categoria não encontrada',
  'Category already exists': 'Esta categoria já está cadastrada',
  'Category name already exists': 'Já existe uma categoria com este nome',
  'Cost center not found': 'Centro de custo não encontrado',
  'Cost center already exists': 'Este centro de custo já está cadastrado',
  'Cost center name already exists':
    'Já existe um centro de custo com este nome',
  'Cost center code already exists':
    'Já existe um centro de custo com este código',
  'Consortium not found': 'Consórcio não encontrado',
  'Contract not found': 'Contrato não encontrado',
  'Loan not found': 'Empréstimo não encontrado',
  'Finance entry not found': 'Lançamento financeiro não encontrado',
  'Recurring config not found': 'Configuração recorrente não encontrada',
  'Cannot delete bank account with transactions':
    'Não é possível excluir conta bancária com transações vinculadas',
  'Cannot delete category with entries':
    'Não é possível excluir categoria com lançamentos vinculados',
  'Cannot delete cost center with entries':
    'Não é possível excluir centro de custo com lançamentos vinculados',
  'Invalid amount': 'Valor inválido',
  'Amount must be greater than zero': 'O valor deve ser maior que zero',
  'Due date must be in the future': 'A data de vencimento deve ser futura',
  'Invalid PIX key': 'Chave PIX inválida',
  'Invalid bank code': 'Código do banco inválido',
  'Allocation percentages must total 100':
    'Os percentuais de rateio devem totalizar 100%',

  // ============= SALES =============
  'Customer not found': 'Cliente não encontrado',
  'Customer already exists': 'Este cliente já está cadastrado',
  'Customer name already exists': 'Já existe um cliente com este nome',
  'Document already exists': 'Este documento já está cadastrado',
  'CPF already exists': 'Este CPF já está cadastrado',
  'CNPJ already exists': 'Este CNPJ já está cadastrado',
  'Email already in use': 'Este e-mail já está em uso',
  'Contact not found': 'Contato não encontrado',
  'Contact email already exists': 'Já existe um contato com este e-mail',
  'Deal not found': 'Negócio não encontrado',
  'Pipeline not found': 'Pipeline não encontrado',
  'Pipeline name already exists': 'Já existe um pipeline com este nome',
  'Stage not found': 'Etapa não encontrada',
  'Order not found': 'Pedido não encontrado',
  'Order number already exists': 'Este número de pedido já existe',
  'Coupon not found': 'Cupom não encontrado',
  'Coupon code already exists': 'Este código de cupom já está em uso',
  'Coupon expired': 'Este cupom está expirado',
  'Coupon usage limit reached': 'Limite de uso do cupom atingido',
  'Campaign not found': 'Campanha não encontrada',
  'Campaign name already exists': 'Já existe uma campanha com este nome',
  'Combo not found': 'Combo não encontrado',
  'Combo name already exists': 'Já existe um combo com este nome',
  'Price table not found': 'Tabela de preço não encontrada',
  'Price table name already exists': 'Já existe uma tabela com este nome',
  'Payment condition not found': 'Condição de pagamento não encontrada',
  'Payment condition name already exists':
    'Já existe uma condição de pagamento com este nome',
  'Customer price already exists':
    'Já existe um preço negociado para este cliente e variante',
  'Bid not found': 'Licitação não encontrada',
  'Edital number already exists': 'Este número de edital já está cadastrado',
  'Return not found': 'Devolução não encontrada',
  'Item reservation not found': 'Reserva não encontrada',
  'Insufficient stock for reservation':
    'Estoque insuficiente para esta reserva',
  'Store credit not found': 'Crédito de loja não encontrado',
  'Catalog not found': 'Catálogo não encontrado',
  'Catalog name already exists': 'Já existe um catálogo com este nome',
  'Dashboard not found': 'Dashboard não encontrado',
  'Dashboard name already exists': 'Já existe um dashboard com este nome',
  'Goal not found': 'Meta não encontrada',
  'Goal name already exists': 'Já existe uma meta com este nome',
  'Invalid date range': 'Intervalo de datas inválido',
  'Quantity must be greater than zero': 'A quantidade deve ser maior que zero',
};

/**
 * Traduz uma mensagem de erro do inglês para português
 * @param error - Mensagem de erro ou objeto de erro
 * @returns Mensagem traduzida ou mensagem original se não houver tradução
 */
export function translateError(error: string | Error | unknown): string {
  if (!error) {
    return 'Ocorreu um erro desconhecido';
  }

  // Se for um objeto Error
  if (error instanceof Error) {
    const message = error.message;
    return errorMessages[message] || message || 'Ocorreu um erro desconhecido';
  }

  // Se for uma string
  if (typeof error === 'string') {
    return errorMessages[error] || error || 'Ocorreu um erro desconhecido';
  }

  // Se for um objeto com propriedade message
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message: string }).message;
    return errorMessages[message] || message || 'Ocorreu um erro desconhecido';
  }

  return 'Ocorreu um erro desconhecido';
}

/**
 * Adiciona uma nova tradução de erro
 * @param key - Chave da mensagem em inglês
 * @param value - Tradução em português
 */
export function addErrorTranslation(key: string, value: string): void {
  errorMessages[key] = value;
}
