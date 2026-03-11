// ============================================
// ENTITY IMPORT DEFINITIONS
// ============================================

import type { EntityImportDefinition, EntityFieldDefinition } from '../types';

// ============================================
// PRODUCTS FIELDS
// ============================================

const productFields: EntityFieldDefinition[] = [
  {
    key: 'name',
    label: 'Nome do Produto',
    type: 'text',
    required: true,
    description: 'Nome do produto (obrigatório)',
    validation: { minLength: 1, maxLength: 255 },
  },
  {
    key: 'description',
    label: 'Descrição',
    type: 'text',
    required: false,
    description: 'Descrição detalhada do produto',
  },
  {
    key: 'templateId',
    label: 'Template',
    type: 'reference',
    required: true,
    description: 'Template associado ao produto',
    referenceEntity: 'templates',
    referenceDisplayField: 'name',
  },
  {
    key: 'supplierId',
    label: 'Fornecedor',
    type: 'reference',
    required: false,
    description: 'Fornecedor do produto',
    referenceEntity: 'suppliers',
    referenceDisplayField: 'name',
  },
  {
    key: 'manufacturerId',
    label: 'Fabricante',
    type: 'reference',
    required: false,
    description: 'Fabricante do produto',
    referenceEntity: 'manufacturers',
    referenceDisplayField: 'name',
  },
  {
    key: 'categoryId',
    label: 'Categoria',
    type: 'reference',
    required: false,
    description: 'Categoria do produto',
    referenceEntity: 'categories',
    referenceDisplayField: 'name',
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    required: false,
    description: 'Status do produto',
    defaultValue: 'ACTIVE',
    options: [
      { value: 'ACTIVE', label: 'Ativo' },
      { value: 'INACTIVE', label: 'Inativo' },
      { value: 'DRAFT', label: 'Rascunho' },
      { value: 'OUT_OF_STOCK', label: 'Sem Estoque' },
      { value: 'DISCONTINUED', label: 'Descontinuado' },
    ],
  },
  {
    key: 'outOfLine',
    label: 'Fora de Linha',
    type: 'boolean',
    required: false,
    description: 'Se o produto está fora de linha (descontinuado)',
    defaultValue: false,
  },
  {
    key: 'careInstructionIds',
    label: 'Instruções de Cuidado',
    type: 'text',
    required: false,
    description:
      'Códigos de instruções de cuidado separados por vírgula (ex: WASH_30,IRON_150,DO_NOT_BLEACH)',
  },
];

// ============================================
// VARIANTS FIELDS
// ============================================

const variantFields: EntityFieldDefinition[] = [
  {
    key: 'productId',
    label: 'Produto',
    type: 'reference',
    required: true,
    description: 'Produto pai da variante',
    referenceEntity: 'products',
    referenceDisplayField: 'name',
  },
  {
    key: 'name',
    label: 'Nome da Variante',
    type: 'text',
    required: true,
    description: 'Nome da variante (ex: Azul P, Vermelho M)',
    validation: { minLength: 1, maxLength: 255 },
  },
  {
    key: 'sku',
    label: 'SKU',
    type: 'text',
    required: false,
    description: 'Código SKU único (auto-gerado se não fornecido)',
    validation: { maxLength: 100 },
  },
  {
    key: 'reference',
    label: 'Referência',
    type: 'text',
    required: false,
    description: 'Código de referência da variante',
    validation: { maxLength: 128 },
  },
  {
    key: 'price',
    label: 'Preço',
    type: 'number',
    required: false,
    description: 'Preço de venda',
    defaultValue: 0,
    validation: { min: 0 },
  },
  {
    key: 'costPrice',
    label: 'Preço de Custo',
    type: 'number',
    required: false,
    description: 'Preço de custo da variante',
    validation: { min: 0 },
  },
  {
    key: 'profitMargin',
    label: 'Margem de Lucro (%)',
    type: 'number',
    required: false,
    description: 'Margem de lucro percentual (0-100)',
    validation: { min: 0, max: 100 },
  },
  {
    key: 'barcode',
    label: 'Código de Barras',
    type: 'text',
    required: false,
    description: 'Código de barras genérico',
    validation: { maxLength: 100 },
  },
  {
    key: 'eanCode',
    label: 'Código EAN',
    type: 'text',
    required: false,
    description: 'Código de barras EAN (European Article Number)',
    validation: { maxLength: 100 },
  },
  {
    key: 'upcCode',
    label: 'Código UPC',
    type: 'text',
    required: false,
    description: 'Código de barras UPC (Universal Product Code)',
    validation: { maxLength: 100 },
  },
  {
    key: 'qrCode',
    label: 'Código QR',
    type: 'text',
    required: false,
    description: 'Dados do código QR',
    validation: { maxLength: 100 },
  },
  {
    key: 'colorHex',
    label: 'Cor (Hex)',
    type: 'text',
    required: false,
    description: 'Cor em formato hexadecimal (ex: #FF0000)',
    validation: {
      maxLength: 7,
      pattern: '^#[0-9A-Fa-f]{6}$',
      patternMessage: 'Formato inválido. Use #RRGGBB',
    },
  },
  {
    key: 'colorPantone',
    label: 'Cor Pantone',
    type: 'text',
    required: false,
    description: 'Código da cor Pantone (ex: 185 C)',
    validation: { maxLength: 50 },
  },
  {
    key: 'imageUrl',
    label: 'URL da Imagem',
    type: 'text',
    required: false,
    description: 'URL da imagem da variante',
  },
  {
    key: 'minStock',
    label: 'Estoque Mínimo',
    type: 'number',
    required: false,
    description: 'Quantidade mínima em estoque',
    validation: { min: 0 },
  },
  {
    key: 'maxStock',
    label: 'Estoque Máximo',
    type: 'number',
    required: false,
    description: 'Quantidade máxima em estoque',
    validation: { min: 0 },
  },
  {
    key: 'reorderPoint',
    label: 'Ponto de Reposição',
    type: 'number',
    required: false,
    description: 'Quantidade para disparo de reposição',
    validation: { min: 0 },
  },
  {
    key: 'reorderQuantity',
    label: 'Quantidade de Reposição',
    type: 'number',
    required: false,
    description: 'Quantidade sugerida para pedido de reposição',
    validation: { min: 0 },
  },
  {
    key: 'outOfLine',
    label: 'Fora de Linha',
    type: 'boolean',
    required: false,
    description: 'Se a variante está fora de linha (descontinuada)',
    defaultValue: false,
  },
  {
    key: 'isActive',
    label: 'Ativo',
    type: 'boolean',
    required: false,
    description: 'Se a variante está ativa',
    defaultValue: true,
  },
];

// ============================================
// ITEMS FIELDS
// ============================================

const itemFields: EntityFieldDefinition[] = [
  {
    key: 'variantId',
    label: 'Variante',
    type: 'reference',
    required: true,
    description: 'Variante do item',
    referenceEntity: 'variants',
    referenceDisplayField: 'name',
  },
  {
    key: 'binId',
    label: 'Local (Bin)',
    type: 'reference',
    required: false,
    description: 'Localização do item no estoque',
    referenceEntity: 'locations',
    referenceDisplayField: 'code',
  },
  {
    key: 'quantity',
    label: 'Quantidade',
    type: 'number',
    required: true,
    description: 'Quantidade de entrada',
    validation: { min: 1 },
  },
  {
    key: 'unitCost',
    label: 'Custo Unitário',
    type: 'number',
    required: false,
    description: 'Custo por unidade',
    validation: { min: 0 },
  },
  {
    key: 'batchNumber',
    label: 'Número do Lote',
    type: 'text',
    required: false,
    description: 'Identificador do lote',
    validation: { maxLength: 100 },
  },
  {
    key: 'manufacturingDate',
    label: 'Data de Fabricação',
    type: 'date',
    required: false,
    description: 'Data em que o item foi fabricado',
  },
  {
    key: 'expiryDate',
    label: 'Data de Validade',
    type: 'date',
    required: false,
    description: 'Data de expiração do item',
  },
  {
    key: 'notes',
    label: 'Observações',
    type: 'text',
    required: false,
    description: 'Notas adicionais sobre o item',
  },
];

// ============================================
// SUPPLIERS FIELDS
// ============================================

const supplierFields: EntityFieldDefinition[] = [
  {
    key: 'name',
    label: 'Nome do Fornecedor',
    type: 'text',
    required: true,
    description: 'Nome ou razão social do fornecedor',
    validation: { minLength: 1, maxLength: 255 },
  },
  {
    key: 'cnpj',
    label: 'CNPJ',
    type: 'text',
    required: false,
    description: 'CNPJ do fornecedor (apenas números)',
    validation: {
      pattern: '^[0-9]{14}$',
      patternMessage: 'CNPJ deve ter 14 dígitos',
    },
  },
  {
    key: 'taxId',
    label: 'Tax ID',
    type: 'text',
    required: false,
    description: 'Identificador fiscal internacional',
  },
  {
    key: 'email',
    label: 'Email',
    type: 'email',
    required: false,
    description: 'Email de contato',
  },
  {
    key: 'phone',
    label: 'Telefone',
    type: 'text',
    required: false,
    description: 'Telefone de contato',
    validation: { maxLength: 20 },
  },
  {
    key: 'website',
    label: 'Website',
    type: 'text',
    required: false,
    description: 'URL do site do fornecedor',
  },
  {
    key: 'addressLine1',
    label: 'Endereço',
    type: 'text',
    required: false,
    description: 'Endereço principal',
  },
  {
    key: 'addressLine2',
    label: 'Complemento',
    type: 'text',
    required: false,
    description: 'Complemento do endereço',
  },
  {
    key: 'city',
    label: 'Cidade',
    type: 'text',
    required: false,
    description: 'Cidade',
  },
  {
    key: 'state',
    label: 'Estado',
    type: 'text',
    required: false,
    description: 'Estado/Província',
  },
  {
    key: 'postalCode',
    label: 'CEP',
    type: 'text',
    required: false,
    description: 'Código postal',
  },
  {
    key: 'country',
    label: 'País',
    type: 'text',
    required: false,
    description: 'País',
    defaultValue: 'Brasil',
  },
  {
    key: 'isActive',
    label: 'Ativo',
    type: 'boolean',
    required: false,
    description: 'Se o fornecedor está ativo',
    defaultValue: true,
  },
  {
    key: 'rating',
    label: 'Avaliação',
    type: 'number',
    required: false,
    description: 'Avaliação de 1 a 5',
    validation: { min: 1, max: 5 },
  },
  {
    key: 'notes',
    label: 'Observações',
    type: 'text',
    required: false,
    description: 'Notas sobre o fornecedor',
  },
];

// ============================================
// CATEGORIES FIELDS
// ============================================

const categoryFields: EntityFieldDefinition[] = [
  {
    key: 'name',
    label: 'Nome da Categoria',
    type: 'text',
    required: true,
    description: 'Nome da categoria',
    validation: { minLength: 1, maxLength: 255 },
  },
  {
    key: 'slug',
    label: 'Slug',
    type: 'text',
    required: false,
    description: 'Identificador URL-friendly (auto-gerado se não fornecido)',
    validation: {
      pattern: '^[a-z0-9-]+$',
      patternMessage: 'Use apenas letras minúsculas, números e hífens',
    },
  },
  {
    key: 'description',
    label: 'Descrição',
    type: 'text',
    required: false,
    description: 'Descrição da categoria',
  },
  {
    key: 'parentId',
    label: 'Categoria Pai',
    type: 'reference',
    required: false,
    description: 'Categoria pai para subcategorias',
    referenceEntity: 'categories',
    referenceDisplayField: 'name',
  },
  {
    key: 'displayOrder',
    label: 'Ordem de Exibição',
    type: 'number',
    required: false,
    description: 'Ordem para ordenação',
    defaultValue: 0,
    validation: { min: 0 },
  },
  {
    key: 'isActive',
    label: 'Ativo',
    type: 'boolean',
    required: false,
    description: 'Se a categoria está ativa',
    defaultValue: true,
  },
];

// ============================================
// TEMPLATES FIELDS
// ============================================

const templateFields: EntityFieldDefinition[] = [
  {
    key: 'name',
    label: 'Nome do Template',
    type: 'text',
    required: true,
    description: 'Nome do template (obrigatório)',
    validation: { minLength: 1, maxLength: 100 },
  },
  {
    key: 'unitOfMeasure',
    label: 'Unidade de Medida',
    type: 'select',
    required: false,
    description: 'Unidade de medida padrão',
    defaultValue: 'UNITS',
    options: [
      { value: 'UNITS', label: 'Unidades' },
      { value: 'METERS', label: 'Metros' },
      { value: 'KILOGRAMS', label: 'Quilogramas' },
    ],
  },
  {
    key: 'iconUrl',
    label: 'URL do Ícone',
    type: 'text',
    required: false,
    description: 'URL da imagem do ícone do template',
  },
];

// ============================================
// USERS FIELDS
// ============================================

const userFields: EntityFieldDefinition[] = [
  {
    key: 'username',
    label: 'Username',
    type: 'text',
    required: true,
    description: 'Nome de usuário único',
    validation: {
      minLength: 3,
      maxLength: 50,
      pattern: '^[a-zA-Z0-9_]+$',
      patternMessage: 'Use apenas letras, números e underscore',
    },
  },
  {
    key: 'email',
    label: 'Email',
    type: 'email',
    required: true,
    description: 'Email do usuário (único)',
  },
  {
    key: 'password',
    label: 'Senha',
    type: 'text',
    required: true,
    description: 'Senha inicial do usuário',
    validation: { minLength: 8 },
  },
  {
    key: 'profile.name',
    label: 'Nome',
    type: 'text',
    required: false,
    description: 'Primeiro nome',
  },
  {
    key: 'profile.surname',
    label: 'Sobrenome',
    type: 'text',
    required: false,
    description: 'Sobrenome',
  },
  {
    key: 'profile.location',
    label: 'Localização',
    type: 'text',
    required: false,
    description: 'Cidade/Estado',
  },
  {
    key: 'profile.bio',
    label: 'Bio',
    type: 'text',
    required: false,
    description: 'Biografia do usuário',
  },
];

// ============================================
// MANUFACTURERS FIELDS (HR Module)
// ============================================

const manufacturerFields: EntityFieldDefinition[] = [
  {
    key: 'tradeName',
    label: 'Nome Fantasia',
    type: 'text',
    required: false,
    description: 'Nome fantasia do fabricante',
    validation: { minLength: 1, maxLength: 255 },
  },
  {
    key: 'cnpj',
    label: 'CNPJ',
    type: 'text',
    required: true,
    description: 'CNPJ do fabricante (apenas números)',
    validation: {
      pattern: '^[0-9]{14}$',
      patternMessage: 'CNPJ deve ter 14 dígitos',
    },
  },
];

// ============================================
// COMPANIES FIELDS (HR Module)
// ============================================

const companyFields: EntityFieldDefinition[] = [
  {
    key: 'tradeName',
    label: 'Nome Fantasia',
    type: 'text',
    required: false,
    description: 'Nome fantasia da empresa',
    validation: { minLength: 2, maxLength: 256 },
  },
  {
    key: 'cnpj',
    label: 'CNPJ',
    type: 'text',
    required: true,
    description: 'CNPJ da empresa (apenas números)',
    validation: {
      pattern: '^[0-9]{14}$',
      patternMessage: 'CNPJ deve ter 14 dígitos',
    },
  },
];

// ============================================
// DEPARTMENTS FIELDS (HR Module)
// ============================================

const departmentFields: EntityFieldDefinition[] = [
  {
    key: 'name',
    label: 'Nome do Departamento',
    type: 'text',
    required: true,
    description: 'Nome do departamento',
    validation: { minLength: 2, maxLength: 128 },
  },
  {
    key: 'code',
    label: 'Código',
    type: 'text',
    required: true,
    description: 'Código único do departamento',
    validation: { minLength: 1, maxLength: 32 },
  },
  {
    key: 'description',
    label: 'Descrição',
    type: 'text',
    required: false,
    description: 'Descrição do departamento',
    validation: { maxLength: 1000 },
  },
  {
    key: 'companyId',
    label: 'Empresa',
    type: 'reference',
    required: true,
    description: 'Empresa a qual o departamento pertence',
    referenceEntity: 'companies',
    referenceDisplayField: 'tradeName',
  },
  {
    key: 'parentId',
    label: 'Departamento Pai',
    type: 'reference',
    required: false,
    description: 'Departamento pai (para hierarquia)',
    referenceEntity: 'departments',
    referenceDisplayField: 'name',
  },
  {
    key: 'isActive',
    label: 'Ativo',
    type: 'boolean',
    required: false,
    description: 'Se o departamento está ativo',
    defaultValue: true,
  },
];

// ============================================
// POSITIONS FIELDS (HR Module)
// ============================================

const positionFields: EntityFieldDefinition[] = [
  {
    key: 'name',
    label: 'Nome do Cargo',
    type: 'text',
    required: true,
    description: 'Nome do cargo',
    validation: { minLength: 2, maxLength: 128 },
  },
  {
    key: 'code',
    label: 'Código',
    type: 'text',
    required: true,
    description: 'Código único do cargo',
    validation: { minLength: 1, maxLength: 32 },
  },
  {
    key: 'description',
    label: 'Descrição',
    type: 'text',
    required: false,
    description: 'Descrição do cargo',
    validation: { maxLength: 1000 },
  },
  {
    key: 'departmentId',
    label: 'Departamento',
    type: 'reference',
    required: false,
    description: 'Departamento do cargo',
    referenceEntity: 'departments',
    referenceDisplayField: 'name',
  },
  {
    key: 'level',
    label: 'Nível',
    type: 'number',
    required: false,
    description: 'Nível hierárquico do cargo',
    defaultValue: 1,
    validation: { min: 1 },
  },
  {
    key: 'baseSalary',
    label: 'Salário Base',
    type: 'number',
    required: false,
    description: 'Salário base do cargo',
    validation: { min: 0 },
  },
  {
    key: 'isActive',
    label: 'Ativo',
    type: 'boolean',
    required: false,
    description: 'Se o cargo está ativo',
    defaultValue: true,
  },
];

// ============================================
// EMPLOYEES FIELDS (HR Module)
// ============================================

const employeeFields: EntityFieldDefinition[] = [
  {
    key: 'fullName',
    label: 'Nome Completo',
    type: 'text',
    required: true,
    description: 'Nome completo do funcionário',
    validation: { minLength: 2, maxLength: 256 },
  },
  {
    key: 'cpf',
    label: 'CPF',
    type: 'text',
    required: true,
    description: 'CPF do funcionário (apenas números)',
    validation: {
      pattern: '^[0-9]{11}$',
      patternMessage: 'CPF deve ter 11 dígitos',
    },
  },
  {
    key: 'registrationNumber',
    label: 'Matrícula',
    type: 'text',
    required: false,
    description:
      'Número de matrícula do funcionário (auto-gerado se não fornecido)',
    validation: { minLength: 1, maxLength: 32 },
  },
  {
    key: 'email',
    label: 'Email',
    type: 'email',
    required: false,
    description: 'Email corporativo do funcionário',
  },
  {
    key: 'phone',
    label: 'Telefone',
    type: 'text',
    required: false,
    description: 'Telefone de contato',
    validation: { maxLength: 20 },
  },
  {
    key: 'mobilePhone',
    label: 'Celular',
    type: 'text',
    required: false,
    description: 'Celular de contato',
    validation: { maxLength: 20 },
  },
  {
    key: 'hireDate',
    label: 'Data de Admissão',
    type: 'date',
    required: false,
    description: 'Data de admissão do funcionário',
  },
  {
    key: 'baseSalary',
    label: 'Salário Base',
    type: 'number',
    required: false,
    description: 'Salário base do funcionário',
    validation: { min: 0 },
  },
  {
    key: 'contractType',
    label: 'Tipo de Contrato',
    type: 'select',
    required: false,
    description: 'Tipo de contrato de trabalho',
    defaultValue: 'CLT',
    options: [
      { value: 'CLT', label: 'CLT' },
      { value: 'PJ', label: 'PJ' },
      { value: 'INTERN', label: 'Estágio' },
      { value: 'TEMPORARY', label: 'Temporário' },
      { value: 'APPRENTICE', label: 'Aprendiz' },
    ],
  },
  {
    key: 'workRegime',
    label: 'Regime de Trabalho',
    type: 'select',
    required: false,
    description: 'Regime de trabalho',
    defaultValue: 'FULL_TIME',
    options: [
      { value: 'FULL_TIME', label: 'Tempo Integral' },
      { value: 'PART_TIME', label: 'Meio Período' },
      { value: 'HOURLY', label: 'Horista' },
      { value: 'SHIFT', label: 'Turnos' },
      { value: 'FLEXIBLE', label: 'Flexível' },
    ],
  },
  {
    key: 'weeklyHours',
    label: 'Horas Semanais',
    type: 'number',
    required: false,
    description: 'Carga horária semanal',
    defaultValue: 44,
    validation: { min: 1, max: 44 },
  },
  {
    key: 'companyId',
    label: 'Empresa',
    type: 'reference',
    required: false,
    description: 'Empresa do funcionário',
    referenceEntity: 'companies',
    referenceDisplayField: 'tradeName',
  },
  {
    key: 'departmentId',
    label: 'Departamento',
    type: 'reference',
    required: false,
    description: 'Departamento do funcionário',
    referenceEntity: 'departments',
    referenceDisplayField: 'name',
  },
  {
    key: 'positionId',
    label: 'Cargo',
    type: 'reference',
    required: false,
    description: 'Cargo do funcionário',
    referenceEntity: 'positions',
    referenceDisplayField: 'name',
  },
];

// ============================================
// ENTITY DEFINITIONS MAP
// ============================================

export const ENTITY_DEFINITIONS: Record<string, EntityImportDefinition> = {
  // ============================================
  // STOCK MODULE
  // ============================================
  products: {
    entityType: 'products',
    label: 'Produto',
    labelPlural: 'Produtos',
    description: 'Importar produtos com templates, fornecedores e categorias',
    icon: 'Package',
    color: 'blue',
    fields: productFields,
    apiEndpoint: '/v1/products',
    batchEndpoint: '/v1/products/batch',
    basePath: '/import/stock/products',
    module: 'stock',
  },
  variants: {
    entityType: 'variants',
    label: 'Variante',
    labelPlural: 'Variantes',
    description: 'Importar variantes de produtos (cores, tamanhos, etc.)',
    icon: 'Layers',
    color: 'purple',
    fields: variantFields,
    apiEndpoint: '/v1/variants',
    batchEndpoint: '/v1/variants/batch',
    basePath: '/import/stock/variants',
    module: 'stock',
  },
  items: {
    entityType: 'items',
    label: 'Item',
    labelPlural: 'Itens',
    description: 'Importar itens de estoque (entradas)',
    icon: 'Box',
    color: 'green',
    fields: itemFields,
    apiEndpoint: '/v1/items/entry',
    batchEndpoint: '/v1/items/entry/batch',
    basePath: '/import/stock/items',
    module: 'stock',
  },
  suppliers: {
    entityType: 'suppliers',
    label: 'Fornecedor',
    labelPlural: 'Fornecedores',
    description: 'Importar fornecedores e seus dados de contato',
    icon: 'Truck',
    color: 'orange',
    fields: supplierFields,
    apiEndpoint: '/v1/suppliers',
    batchEndpoint: '/v1/suppliers/batch',
    basePath: '/import/stock/suppliers',
    module: 'stock',
  },
  'product-categories': {
    entityType: 'product-categories',
    label: 'Categoria de Produto',
    labelPlural: 'Categorias de Produtos',
    description: 'Importar categorias de produtos',
    icon: 'FolderTree',
    color: 'yellow',
    fields: categoryFields,
    apiEndpoint: '/v1/categories',
    batchEndpoint: '/v1/categories/batch',
    basePath: '/import/stock/product-categories',
    module: 'stock',
  },
  // Keep old categories for backward compatibility
  categories: {
    entityType: 'categories',
    label: 'Categoria',
    labelPlural: 'Categorias',
    description: 'Importar categorias de produtos',
    icon: 'FolderTree',
    color: 'yellow',
    fields: categoryFields,
    apiEndpoint: '/v1/categories',
    batchEndpoint: '/v1/categories/batch',
    basePath: '/import/stock/product-categories',
    module: 'stock',
  },
  manufacturers: {
    entityType: 'manufacturers',
    label: 'Fabricante',
    labelPlural: 'Fabricantes',
    description: 'Importar fabricantes via CNPJ (consulta BrasilAPI)',
    icon: 'Factory',
    color: 'indigo',
    fields: manufacturerFields,
    apiEndpoint: '/v1/manufacturers',
    batchEndpoint: '/v1/manufacturers/batch',
    basePath: '/import/stock/manufacturers',
    module: 'stock',
  },
  templates: {
    entityType: 'templates',
    label: 'Template',
    labelPlural: 'Templates',
    description: 'Importar templates de produtos',
    icon: 'LayoutTemplate',
    color: 'violet',
    fields: templateFields,
    apiEndpoint: '/v1/templates',
    batchEndpoint: '/v1/templates/batch',
    basePath: '/import/stock/templates',
    module: 'stock',
  },

  // ============================================
  // ADMIN MODULE
  // ============================================
  users: {
    entityType: 'users',
    label: 'Usuário',
    labelPlural: 'Usuários',
    description: 'Importar usuários do sistema',
    icon: 'Users',
    color: 'pink',
    fields: userFields,
    apiEndpoint: '/v1/users',
    batchEndpoint: '/v1/users/batch',
    basePath: '/import/admin/users',
    module: 'admin',
  },

  // ============================================
  // HR MODULE
  // ============================================
  companies: {
    entityType: 'companies',
    label: 'Empresa',
    labelPlural: 'Empresas',
    description: 'Importar empresas via CNPJ (consulta BrasilAPI)',
    icon: 'Building2',
    color: 'emerald',
    fields: companyFields,
    apiEndpoint: '/v1/admin/companies',
    batchEndpoint: '/v1/admin/companies/batch',
    basePath: '/import/hr/companies',
    module: 'hr',
  },
  departments: {
    entityType: 'departments',
    label: 'Departamento',
    labelPlural: 'Departamentos',
    description: 'Importar departamentos organizacionais',
    icon: 'Network',
    color: 'cyan',
    fields: departmentFields,
    apiEndpoint: '/v1/hr/departments',
    batchEndpoint: '/v1/hr/departments/batch',
    basePath: '/import/hr/departments',
    module: 'hr',
  },
  positions: {
    entityType: 'positions',
    label: 'Cargo',
    labelPlural: 'Cargos',
    description: 'Importar cargos e funções',
    icon: 'BadgeCheck',
    color: 'amber',
    fields: positionFields,
    apiEndpoint: '/v1/hr/positions',
    batchEndpoint: '/v1/hr/positions/batch',
    basePath: '/import/hr/positions',
    module: 'hr',
  },
  employees: {
    entityType: 'employees',
    label: 'Funcionário',
    labelPlural: 'Funcionários',
    description: 'Importar funcionários e colaboradores',
    icon: 'UserCheck',
    color: 'teal',
    fields: employeeFields,
    apiEndpoint: '/v1/hr/employees',
    batchEndpoint: '/v1/hr/employees/batch',
    basePath: '/import/hr/employees',
    module: 'hr',
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getEntityDefinition(
  entityType: string
): EntityImportDefinition | undefined {
  return ENTITY_DEFINITIONS[entityType];
}

export function getEntityFields(entityType: string): EntityFieldDefinition[] {
  return ENTITY_DEFINITIONS[entityType]?.fields ?? [];
}

export function getRequiredFields(entityType: string): EntityFieldDefinition[] {
  return getEntityFields(entityType).filter(f => f.required);
}

export function getOptionalFields(entityType: string): EntityFieldDefinition[] {
  return getEntityFields(entityType).filter(f => !f.required);
}

export function getBasePath(entityType: string): string {
  const def = ENTITY_DEFINITIONS[entityType];
  return def?.basePath || `/import/${entityType}`;
}

export function getEntitiesByModule(
  module: 'stock' | 'admin' | 'hr'
): EntityImportDefinition[] {
  return Object.values(ENTITY_DEFINITIONS).filter(def => def.module === module);
}
