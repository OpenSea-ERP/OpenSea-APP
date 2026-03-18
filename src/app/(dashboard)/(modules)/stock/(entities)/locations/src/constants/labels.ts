// ============================================
// TRANSLATED LABELS
// ============================================

/**
 * Labels para tipos de anotação no editor de layout
 */
export const ANNOTATION_TYPE_LABELS: Record<string, string> = {
  door: 'Porta',
  pillar: 'Pilar',
  wall: 'Parede',
  label: 'Texto',
  area: 'Área',
  stairs: 'Escada',
  elevator: 'Elevador',
};

/**
 * Labels para ferramentas do editor
 */
export const EDITOR_TOOL_LABELS: Record<string, string> = {
  select: 'Selecionar',
  move: 'Mover',
  rotate: 'Rotacionar',
  'add-annotation': 'Adicionar Anotação',
};

/**
 * Labels para tamanhos de etiqueta
 */
export const LABEL_SIZE_LABELS: Record<string, string> = {
  small: 'Pequena (30×20mm)',
  medium: 'Média (50×30mm)',
  large: 'Grande (70×40mm)',
};

/**
 * Labels para formatos de etiqueta
 */
export const LABEL_FORMAT_LABELS: Record<string, string> = {
  qr: 'QR Code',
  barcode: 'Código de Barras',
};

/**
 * Labels para separadores de código
 */
export const SEPARATOR_LABELS: Record<string, string> = {
  '-': 'Hífen (-)',
  '.': 'Ponto (.)',
  '': 'Nenhum',
};

/**
 * Labels para direção dos nichos
 */
export const BIN_DIRECTION_LABELS: Record<string, string> = {
  BOTTOM_UP: 'Baixo → Cima (A=inferior)',
  TOP_DOWN: 'Cima → Baixo (A=superior)',
};

/**
 * Labels para tipo de identificação dos nichos
 */
export const BIN_LABELING_LABELS: Record<string, string> = {
  LETTERS: 'Letras (A, B, C...)',
  NUMBERS: 'Números (1, 2, 3...)',
};

/**
 * Labels para steps do wizard
 */
export const WIZARD_STEP_LABELS: Record<string, string> = {
  dimensions: 'Dimensões',
  'code-pattern': 'Padrão de Código',
  preview: 'Preview',
  confirm: 'Confirmar',
};

/**
 * Descrições para steps do wizard
 */
export const WIZARD_STEP_DESCRIPTIONS: Record<string, string> = {
  dimensions: 'Configure a quantidade de corredores, prateleiras e nichos',
  'code-pattern': 'Defina o padrão de endereçamento das localizações',
  preview: 'Visualize como ficará a estrutura antes de criar',
  confirm: 'Revise e confirme a criação das localizações',
};

/**
 * Limites de estrutura
 */
export const STRUCTURE_LIMITS = {
  minAisles: 1,
  maxAisles: 99,
  minShelvesPerAisle: 1,
  maxShelvesPerAisle: 999,
  minBinsPerShelf: 1,
  maxBinsPerShelf: 26, // A-Z
};

/**
 * Mensagens de erro
 */
export const ERROR_MESSAGES = {
  WAREHOUSE_CODE_REQUIRED: 'O código do armazém é obrigatório',
  WAREHOUSE_CODE_TOO_SHORT: 'O código deve ter no mínimo 2 caracteres',
  WAREHOUSE_CODE_TOO_LONG: 'O código deve ter no máximo 5 caracteres',
  WAREHOUSE_CODE_INVALID: 'O código deve conter apenas letras maiúsculas',
  WAREHOUSE_NAME_REQUIRED: 'O nome do armazém é obrigatório',
  WAREHOUSE_CODE_EXISTS: 'Já existe um armazém com este código',

  ZONE_CODE_REQUIRED: 'O código da zona é obrigatório',
  ZONE_CODE_TOO_SHORT: 'O código deve ter no mínimo 2 caracteres',
  ZONE_CODE_TOO_LONG: 'O código deve ter no máximo 5 caracteres',
  ZONE_CODE_INVALID: 'O código deve conter apenas letras maiúsculas',
  ZONE_NAME_REQUIRED: 'O nome da zona é obrigatório',
  ZONE_CODE_EXISTS: 'Já existe uma zona com este código neste armazém',

  STRUCTURE_AISLES_MIN: 'Deve ter no mínimo 1 corredor',
  STRUCTURE_AISLES_MAX: 'Deve ter no máximo 99 corredores',
  STRUCTURE_SHELVES_MIN: 'Deve ter no mínimo 1 prateleira por corredor',
  STRUCTURE_SHELVES_MAX: 'Deve ter no máximo 999 prateleiras por corredor',
  STRUCTURE_BINS_MIN: 'Deve ter no mínimo 1 nicho por prateleira',
  STRUCTURE_BINS_MAX: 'Deve ter no máximo 26 nichos por prateleira (A-Z)',

  GENERIC_ERROR: 'Ocorreu um erro. Tente novamente.',
  NETWORK_ERROR: 'Erro de conexão. Verifique sua internet.',
};

/**
 * Mensagens de sucesso
 */
export const SUCCESS_MESSAGES = {
  WAREHOUSE_CREATED: 'Armazém criado com sucesso!',
  WAREHOUSE_UPDATED: 'Armazém atualizado com sucesso!',
  WAREHOUSE_DELETED: 'Armazém excluído com sucesso!',

  ZONE_CREATED: 'Zona criada com sucesso!',
  ZONE_UPDATED: 'Zona atualizada com sucesso!',
  ZONE_DELETED: 'Zona excluída com sucesso!',
  ZONE_STRUCTURE_CONFIGURED: 'Estrutura configurada com sucesso!',

  LAYOUT_SAVED: 'Layout salvo com sucesso!',
  LAYOUT_RESET: 'Layout resetado para o padrão!',

  LABELS_GENERATED: 'Etiquetas geradas com sucesso!',
};

/**
 * Placeholders para inputs
 */
export const PLACEHOLDERS = {
  WAREHOUSE_CODE: 'Ex: FAB, CD01',
  WAREHOUSE_NAME: 'Ex: Fábrica Principal, Centro de Distribuição SP',
  WAREHOUSE_DESCRIPTION: 'Descrição opcional do armazém...',
  WAREHOUSE_ADDRESS: 'Endereço físico do armazém...',

  ZONE_CODE: 'Ex: EST, PRD, EXP',
  ZONE_NAME: 'Ex: Estoque, Produção, Expedição',
  ZONE_DESCRIPTION: 'Descrição opcional da zona...',

  BIN_SEARCH: 'Buscar por endereço (ex: FAB-EST-1)',
};
