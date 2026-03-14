import type { UnitOfMeasure } from '@/types/stock';

export type PresetCategory =
  | 'VESTUARIO'
  | 'CALCADOS'
  | 'ENXOVAL'
  | 'TEXTIL'
  | 'SERIGRAFIA'
  | 'ELETRONICOS'
  | 'FARMACIA'
  | 'MERCADO'
  | 'LIVRARIA'
  | 'HOSPITALAR';

export type SpecialModule = 'CARE_INSTRUCTIONS';

export const PRESET_CATEGORY_LABELS: Record<PresetCategory, string> = {
  VESTUARIO: 'Vestuário',
  CALCADOS: 'Calçado',
  ENXOVAL: 'Enxoval',
  TEXTIL: 'Têxtil',
  SERIGRAFIA: 'Serigrafia',
  ELETRONICOS: 'Eletrônicos',
  FARMACIA: 'Farmácia',
  MERCADO: 'Mercado',
  LIVRARIA: 'Livraria',
  HOSPITALAR: 'Hospitalar',
};

/** Categorias visíveis no modal de seleção de template */
export const VISIBLE_CATEGORIES: PresetCategory[] = [
  'VESTUARIO',
  'CALCADOS',
  'TEXTIL',
  'HOSPITALAR',
];

/** Subcategorias por categoria para exibição na sidebar */
export const CATEGORY_SUBCATEGORIES: Record<PresetCategory, string[]> = {
  VESTUARIO: ['Camiseta', 'Calças', 'Vestido'],
  CALCADOS: ['Tênis', 'Sapatos', 'Sandálias'],
  ENXOVAL: ['Lençol', 'Fronha', 'Toalha'],
  TEXTIL: ['Tecido', 'Malha', 'Linha', 'Aviamento'],
  SERIGRAFIA: ['Tinta', 'Tela', 'Rodo', 'Substrato'],
  ELETRONICOS: ['Computador', 'Celular', 'Placas'],
  FARMACIA: ['Medicamento', 'Perfumaria', 'Cosmético'],
  MERCADO: ['Alimento', 'Bebida', 'Limpeza', 'Higiene'],
  LIVRARIA: ['Livro', 'Catálogo'],
  HOSPITALAR: ['Scrub', 'Campo Fenestrado'],
};

export interface TemplateAttribute {
  name: string;
  type: 'text' | 'number' | 'select' | 'boolean' | 'date';
  required?: boolean;
  options?: string[];
  unit?: string;
}

export interface TemplatePreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: PresetCategory;
  unitOfMeasure: UnitOfMeasure;
  specialModules: SpecialModule[];
  productAttributes: Record<string, TemplateAttribute>;
  variantAttributes: Record<string, TemplateAttribute>;
  itemAttributes: Record<string, TemplateAttribute>;
}

// ──────────────────────────────────────────────
// Shared attribute fragments
// ──────────────────────────────────────────────

const composicao: TemplateAttribute = {
  name: 'Composição',
  type: 'text',
  required: true,
};
const gramatura: TemplateAttribute = {
  name: 'Gramatura',
  type: 'number',
  unit: 'g/m²',
};
const tipoTecido: TemplateAttribute = {
  name: 'Tipo de Tecido',
  type: 'select',
  options: [
    'Algodão',
    'Poliéster',
    'Viscose',
    'Linho',
    'Seda',
    'Nylon',
    'Elastano',
    'Misto',
  ],
};
const acabamento: TemplateAttribute = {
  name: 'Acabamento',
  type: 'select',
  options: ['Liso', 'Estampado', 'Bordado', 'Sublimado', 'Tingido'],
};
const antiOdor: TemplateAttribute = { name: 'Anti-odor', type: 'boolean' };
const passaFacil: TemplateAttribute = {
  name: 'Passa Fácil',
  type: 'boolean',
};
const naoAmarrota: TemplateAttribute = {
  name: 'Não Amarrota',
  type: 'boolean',
};
const naoDesbota: TemplateAttribute = {
  name: 'Não Desbota',
  type: 'boolean',
};
const lote: TemplateAttribute = { name: 'Lote', type: 'text', required: true };
const dataFabricacao: TemplateAttribute = {
  name: 'Data de Fabricação',
  type: 'date',
};
const dataValidade: TemplateAttribute = {
  name: 'Data de Validade',
  type: 'date',
  required: true,
};

// ──────────────────────────────────────────────
// TÊXTIL / VESTUÁRIO
// ──────────────────────────────────────────────

const camiseta: TemplatePreset = {
  id: 'camiseta',
  name: 'Camiseta',
  description: 'Camisetas, regatas e blusas de malha',
  icon: 'GiTShirt',
  category: 'VESTUARIO',
  unitOfMeasure: 'UNITS',
  specialModules: ['CARE_INSTRUCTIONS'],
  productAttributes: {
    composicao,
    gramatura,
    tipoTecido,
  },
  variantAttributes: {
    tamanho: {
      name: 'Tamanho',
      type: 'select',
      required: true,
      options: ['PP', 'P', 'M', 'G', 'GG', 'XG'],
    },
    acabamento,
    antiOdor,
    passaFacil,
    naoAmarrota,
    naoDesbota,
  },
  itemAttributes: {
    lote,
    dataFabricacao,
  },
};

const calca: TemplatePreset = {
  id: 'calca',
  name: 'Calça',
  description: 'Calças, bermudas e shorts',
  icon: 'GiArmoredPants',
  category: 'VESTUARIO',
  unitOfMeasure: 'UNITS',
  specialModules: ['CARE_INSTRUCTIONS'],
  productAttributes: {
    composicao,
    gramatura,
    tipoTecido,
  },
  variantAttributes: {
    tamanho: {
      name: 'Tamanho',
      type: 'select',
      required: true,
      options: [
        '34',
        '36',
        '38',
        '40',
        '42',
        '44',
        '46',
        '48',
        '50',
        '52',
        '54',
      ],
    },
    acabamento,
    antiOdor,
    passaFacil,
    naoAmarrota,
    naoDesbota,
  },
  itemAttributes: {
    lote,
    dataFabricacao,
  },
};

const vestido: TemplatePreset = {
  id: 'vestido',
  name: 'Vestido',
  description: 'Vestidos, saias e macacões',
  icon: 'GiLargeDress',
  category: 'VESTUARIO',
  unitOfMeasure: 'UNITS',
  specialModules: ['CARE_INSTRUCTIONS'],
  productAttributes: {
    composicao,
    gramatura,
    tipoTecido,
  },
  variantAttributes: {
    tamanho: {
      name: 'Tamanho',
      type: 'select',
      required: true,
      options: ['PP', 'P', 'M', 'G', 'GG', 'XG'],
    },
    acabamento,
    comprimento: {
      name: 'Comprimento',
      type: 'select',
      options: ['Curto', 'Midi', 'Longo'],
    },
    antiOdor,
    passaFacil,
    naoAmarrota,
    naoDesbota,
  },
  itemAttributes: {
    lote,
    dataFabricacao,
  },
};

const lencol: TemplatePreset = {
  id: 'lencol',
  name: 'Lençol',
  description: 'Lençóis, fronhas e jogos de cama',
  icon: 'GiPillow',
  category: 'ENXOVAL',
  unitOfMeasure: 'UNITS',
  specialModules: ['CARE_INSTRUCTIONS'],
  productAttributes: {
    composicao,
    gramatura,
    fio: { name: 'Fio', type: 'number' },
  },
  variantAttributes: {
    tamanho: {
      name: 'Tamanho',
      type: 'select',
      required: true,
      options: ['Solteiro', 'Casal', 'Queen', 'King'],
    },
    acabamento,
    antiOdor,
    passaFacil,
    naoAmarrota,
    naoDesbota,
  },
  itemAttributes: {
    lote,
    dataFabricacao,
  },
};

const toalha: TemplatePreset = {
  id: 'toalha',
  name: 'Toalha',
  description: 'Toalhas de banho, rosto, praia e piso',
  icon: 'GiTowel',
  category: 'ENXOVAL',
  unitOfMeasure: 'UNITS',
  specialModules: ['CARE_INSTRUCTIONS'],
  productAttributes: {
    composicao,
    gramatura,
  },
  variantAttributes: {
    tamanho: {
      name: 'Tamanho',
      type: 'select',
      required: true,
      options: ['Rosto', 'Banho', 'Praia', 'Piso'],
    },
    acabamento,
    antiOdor,
    passaFacil,
    naoAmarrota,
    naoDesbota,
  },
  itemAttributes: {
    lote,
    dataFabricacao,
  },
};

// ──────────────────────────────────────────────
// TECIDOS / MALHAS
// ──────────────────────────────────────────────

const tecidoVariantAttrs = {
  antiOdor,
  antiChamas: { name: 'Anti-chamas', type: 'boolean' as const },
  protecaoUV: { name: 'Proteção UV', type: 'boolean' as const },
  repelente: { name: 'Repelente', type: 'boolean' as const },
  passaFacil,
  naoAmarrota,
  naoDesbota,
};

const tecidoItemAttrs = {
  nuance: { name: 'Nuance', type: 'text' as const },
  qualidade: {
    name: 'Qualidade',
    type: 'select' as const,
    options: ['1ª Qualidade', '2ª Qualidade'],
  },
  pesoPeca: { name: 'Peso da Peça', type: 'number' as const, unit: 'kg' },
  larguraPeca: {
    name: 'Largura da Peça',
    type: 'number' as const,
    unit: 'm',
  },
};

const tecido: TemplatePreset = {
  id: 'tecido',
  name: 'Tecido',
  description: 'Tecidos planos (vendidos por metro)',
  icon: 'GiSewingMachine',
  category: 'TEXTIL',
  unitOfMeasure: 'METERS',
  specialModules: ['CARE_INSTRUCTIONS'],
  productAttributes: {
    stretch: { name: 'Stretch', type: 'number', unit: '%' },
    gramatura,
    composicao,
    construcao: {
      name: 'Construção',
      type: 'select',
      options: [
        'Tela',
        'Tela Rip-Stop',
        'Sarja 2/1',
        'Sarja 2/1 Rip-Stop',
        'Sarja 3/1',
        'Sarja 3/1 Rip-Stop',
        'Maquinetado',
        'Sarja 2/2',
      ],
    },
    larguraPadrao: {
      name: 'Largura Padrão',
      type: 'number',
      unit: 'm',
    },
    codigoFabricante: { name: 'Código do Fabricante', type: 'text' },
  },
  variantAttributes: tecidoVariantAttrs,
  itemAttributes: tecidoItemAttrs,
};

const malha: TemplatePreset = {
  id: 'malha',
  name: 'Malha',
  description: 'Malhas e tecidos de malharia (vendidos por quilo)',
  icon: 'GiRolledCloth',
  category: 'TEXTIL',
  unitOfMeasure: 'KILOGRAMS',
  specialModules: ['CARE_INSTRUCTIONS'],
  productAttributes: {
    stretch: { name: 'Stretch', type: 'number', unit: '%' },
    gramatura,
    composicao,
    construcao: {
      name: 'Construção',
      type: 'select',
      options: [
        'Tela',
        'Tela Rip-Stop',
        'Sarja 2/1',
        'Sarja 2/1 Rip-Stop',
        'Sarja 3/1',
        'Sarja 3/1 Rip-Stop',
        'Maquinetado',
        'Sarja 2/2',
      ],
    },
    larguraPadrao: {
      name: 'Largura Padrão',
      type: 'number',
      unit: 'm',
    },
    codigoFabricante: { name: 'Código do Fabricante', type: 'text' },
  },
  variantAttributes: tecidoVariantAttrs,
  itemAttributes: tecidoItemAttrs,
};

const linha: TemplatePreset = {
  id: 'linha',
  name: 'Linha',
  description: 'Linhas e fios para costura',
  icon: 'GiSewingString',
  category: 'TEXTIL',
  unitOfMeasure: 'UNITS',
  specialModules: ['CARE_INSTRUCTIONS'],
  productAttributes: {
    composicao,
    espessura: { name: 'Espessura', type: 'text' },
    material: { name: 'Material', type: 'text' },
  },
  variantAttributes: {},
  itemAttributes: {
    lote,
  },
};

const aviamento: TemplatePreset = {
  id: 'aviamento',
  name: 'Aviamento',
  description: 'Botões, zíperes, elásticos e aviamentos em geral',
  icon: 'GiShirtButton',
  category: 'TEXTIL',
  unitOfMeasure: 'UNITS',
  specialModules: [],
  productAttributes: {
    material: { name: 'Material', type: 'text' },
  },
  variantAttributes: {
    tamanho: { name: 'Tamanho', type: 'text' },
  },
  itemAttributes: {
    lote,
  },
};

// ──────────────────────────────────────────────
// CALÇADOS
// ──────────────────────────────────────────────

const numeracao34a46: TemplateAttribute = {
  name: 'Numeração',
  type: 'select',
  required: true,
  options: [
    '34',
    '35',
    '36',
    '37',
    '38',
    '39',
    '40',
    '41',
    '42',
    '43',
    '44',
    '45',
    '46',
  ],
};

const tenis: TemplatePreset = {
  id: 'tenis',
  name: 'Tênis',
  description: 'Tênis esportivos e casuais',
  icon: 'GiRunningShoe',
  category: 'CALCADOS',
  unitOfMeasure: 'PAIRS',
  specialModules: ['CARE_INSTRUCTIONS'],
  productAttributes: {
    materialSuperior: { name: 'Material Superior', type: 'text' },
    materialSola: { name: 'Material da Sola', type: 'text' },
    tipo: {
      name: 'Tipo',
      type: 'select',
      options: ['Corrida', 'Casual', 'Skate', 'Social'],
    },
  },
  variantAttributes: {
    numeracao: numeracao34a46,
  },
  itemAttributes: {
    lote,
    dataFabricacao,
  },
};

const sapato: TemplatePreset = {
  id: 'sapato',
  name: 'Sapato',
  description: 'Sapatos sociais e casuais',
  icon: 'GiConverseShoe',
  category: 'CALCADOS',
  unitOfMeasure: 'PAIRS',
  specialModules: ['CARE_INSTRUCTIONS'],
  productAttributes: {
    materialSuperior: { name: 'Material Superior', type: 'text' },
    materialSola: { name: 'Material da Sola', type: 'text' },
    tipo: {
      name: 'Tipo',
      type: 'select',
      options: ['Social', 'Casual', 'Mocassim'],
    },
  },
  variantAttributes: {
    numeracao: numeracao34a46,
  },
  itemAttributes: {
    lote,
    dataFabricacao,
  },
};

const sandalia: TemplatePreset = {
  id: 'sandalia',
  name: 'Sandália',
  description: 'Sandálias e chinelos',
  icon: 'GiSandal',
  category: 'CALCADOS',
  unitOfMeasure: 'PAIRS',
  specialModules: ['CARE_INSTRUCTIONS'],
  productAttributes: {
    materialSuperior: { name: 'Material Superior', type: 'text' },
    materialSola: { name: 'Material da Sola', type: 'text' },
  },
  variantAttributes: {
    numeracao: {
      name: 'Numeração',
      type: 'select',
      required: true,
      options: [
        '33',
        '34',
        '35',
        '36',
        '37',
        '38',
        '39',
        '40',
        '41',
        '42',
        '43',
        '44',
      ],
    },
  },
  itemAttributes: {
    lote,
    dataFabricacao,
  },
};

// ──────────────────────────────────────────────
// ALIMENTOS
// ──────────────────────────────────────────────

const alimento: TemplatePreset = {
  id: 'alimento',
  name: 'Alimento',
  description: 'Alimentos embalados e industrializados',
  icon: 'GiFruitBowl',
  category: 'MERCADO',
  unitOfMeasure: 'UNITS',
  specialModules: [],
  productAttributes: {
    pesoLiquido: { name: 'Peso Líquido', type: 'number', unit: 'g' },
    tipo: {
      name: 'Tipo',
      type: 'select',
      options: ['Perecível', 'Não-Perecível', 'Congelado'],
    },
    contemGluten: { name: 'Contém Glúten', type: 'boolean' },
    contemLactose: { name: 'Contém Lactose', type: 'boolean' },
    vegano: { name: 'Vegano', type: 'boolean' },
  },
  variantAttributes: {
    sabor: { name: 'Sabor', type: 'text' },
    embalagem: {
      name: 'Embalagem',
      type: 'select',
      options: ['Unidade', 'Pacote', 'Caixa'],
    },
  },
  itemAttributes: {
    lote,
    dataFabricacao,
    dataValidade,
  },
};

const bebida: TemplatePreset = {
  id: 'bebida',
  name: 'Bebida',
  description: 'Bebidas em geral',
  icon: 'GiSodaCan',
  category: 'MERCADO',
  unitOfMeasure: 'UNITS',
  specialModules: [],
  productAttributes: {
    volume: { name: 'Volume', type: 'number', unit: 'mL' },
    teorAlcoolico: { name: 'Teor Alcoólico', type: 'number', unit: '%' },
    tipo: {
      name: 'Tipo',
      type: 'select',
      options: [
        'Refrigerante',
        'Suco',
        'Água',
        'Cerveja',
        'Vinho',
        'Destilado',
      ],
    },
  },
  variantAttributes: {
    sabor: { name: 'Sabor', type: 'text' },
    embalagem: {
      name: 'Embalagem',
      type: 'select',
      options: ['Lata', 'Garrafa', 'Pet', 'Tetra Pak'],
    },
  },
  itemAttributes: {
    lote,
    dataFabricacao,
    dataValidade,
  },
};

// ──────────────────────────────────────────────
// FARMÁCIA
// ──────────────────────────────────────────────

const medicamento: TemplatePreset = {
  id: 'medicamento',
  name: 'Medicamento',
  description: 'Medicamentos e fármacos',
  icon: 'GiMedicines',
  category: 'FARMACIA',
  unitOfMeasure: 'UNITS',
  specialModules: [],
  productAttributes: {
    principioAtivo: { name: 'Princípio Ativo', type: 'text', required: true },
    concentracao: { name: 'Concentração', type: 'text' },
    via: {
      name: 'Via de Administração',
      type: 'select',
      options: ['Oral', 'Tópica', 'Injetável', 'Inalatória'],
    },
    receitaObrigatoria: { name: 'Receita Obrigatória', type: 'boolean' },
    registroAnvisa: { name: 'Registro ANVISA', type: 'text' },
  },
  variantAttributes: {
    apresentacao: {
      name: 'Apresentação',
      type: 'select',
      options: ['Comprimido', 'Cápsula', 'Líquido', 'Pomada', 'Spray'],
    },
    quantidade: { name: 'Quantidade', type: 'text' },
  },
  itemAttributes: {
    lote,
    dataFabricacao,
    dataValidade,
  },
};

const cosmetico: TemplatePreset = {
  id: 'cosmetico',
  name: 'Cosmético',
  description: 'Cosméticos e produtos de beleza',
  icon: 'GiLipstick',
  category: 'FARMACIA',
  unitOfMeasure: 'UNITS',
  specialModules: [],
  productAttributes: {
    tipo: {
      name: 'Tipo',
      type: 'select',
      options: ['Creme', 'Shampoo', 'Condicionador', 'Perfume', 'Maquiagem'],
    },
    volume: { name: 'Volume', type: 'number', unit: 'mL' },
  },
  variantAttributes: {
    fragrancia: { name: 'Fragrância', type: 'text' },
    variacao: { name: 'Variação', type: 'text' },
  },
  itemAttributes: {
    lote,
    dataFabricacao,
    dataValidade,
  },
};

const suplemento: TemplatePreset = {
  id: 'suplemento',
  name: 'Suplemento',
  description: 'Suplementos alimentares e vitaminas',
  icon: 'GiMuscleUp',
  category: 'FARMACIA',
  unitOfMeasure: 'UNITS',
  specialModules: [],
  productAttributes: {
    tipo: {
      name: 'Tipo',
      type: 'select',
      options: ['Vitamina', 'Proteína', 'Creatina', 'Aminoácido', 'Pré-Treino'],
    },
    pesoLiquido: { name: 'Peso Líquido', type: 'number', unit: 'g' },
  },
  variantAttributes: {
    sabor: { name: 'Sabor', type: 'text' },
    quantidade: { name: 'Quantidade', type: 'text' },
  },
  itemAttributes: {
    lote,
    dataFabricacao,
    dataValidade,
  },
};

// ──────────────────────────────────────────────
// ELETRÔNICOS
// ──────────────────────────────────────────────

const eletronico: TemplatePreset = {
  id: 'eletronico',
  name: 'Eletrônico Genérico',
  description: 'Eletrônicos e eletrodomésticos em geral',
  icon: 'GiProcessor',
  category: 'ELETRONICOS',
  unitOfMeasure: 'UNITS',
  specialModules: [],
  productAttributes: {
    marca: { name: 'Marca', type: 'text' },
    modelo: { name: 'Modelo', type: 'text' },
    voltagem: {
      name: 'Voltagem',
      type: 'select',
      options: ['110V', '220V', 'Bivolt', 'Bateria'],
    },
    garantia: { name: 'Garantia', type: 'number', unit: 'meses' },
  },
  variantAttributes: {
    capacidade: { name: 'Capacidade', type: 'text' },
  },
  itemAttributes: {
    numeroSerie: { name: 'Número de Série', type: 'text', required: true },
    dataFabricacao,
  },
};

const celular: TemplatePreset = {
  id: 'celular',
  name: 'Celular',
  description: 'Smartphones e celulares',
  icon: 'GiSmartphone',
  category: 'ELETRONICOS',
  unitOfMeasure: 'UNITS',
  specialModules: [],
  productAttributes: {
    marca: { name: 'Marca', type: 'text' },
    modelo: { name: 'Modelo', type: 'text' },
    sistema: {
      name: 'Sistema Operacional',
      type: 'select',
      options: ['Android', 'iOS'],
    },
    tela: { name: 'Tela', type: 'number', unit: 'pol' },
  },
  variantAttributes: {
    armazenamento: {
      name: 'Armazenamento',
      type: 'select',
      options: ['64GB', '128GB', '256GB', '512GB', '1TB'],
    },
    ram: {
      name: 'RAM',
      type: 'select',
      options: ['4GB', '6GB', '8GB', '12GB', '16GB'],
    },
    cor: { name: 'Cor', type: 'text' },
  },
  itemAttributes: {
    imei: { name: 'IMEI', type: 'text', required: true },
    dataFabricacao,
  },
};

const notebookPreset: TemplatePreset = {
  id: 'notebook',
  name: 'Notebook',
  description: 'Notebooks e laptops',
  icon: 'GiLaptop',
  category: 'ELETRONICOS',
  unitOfMeasure: 'UNITS',
  specialModules: [],
  productAttributes: {
    marca: { name: 'Marca', type: 'text' },
    modelo: { name: 'Modelo', type: 'text' },
    processador: { name: 'Processador', type: 'text' },
    tela: { name: 'Tela', type: 'number', unit: 'pol' },
  },
  variantAttributes: {
    armazenamento: {
      name: 'Armazenamento',
      type: 'select',
      options: ['64GB', '128GB', '256GB', '512GB', '1TB'],
    },
    ram: {
      name: 'RAM',
      type: 'select',
      options: ['4GB', '6GB', '8GB', '12GB', '16GB'],
    },
    cor: { name: 'Cor', type: 'text' },
  },
  itemAttributes: {
    numeroSerie: { name: 'Número de Série', type: 'text', required: true },
    dataFabricacao,
  },
};

// ──────────────────────────────────────────────
// SERIGRAFIA
// ──────────────────────────────────────────────

const tintaSerigrafia: TemplatePreset = {
  id: 'tinta-serigrafia',
  name: 'Tinta Serigrafia',
  description: 'Tintas para serigrafia e estamparia',
  icon: 'GiPaintBucket',
  category: 'SERIGRAFIA',
  unitOfMeasure: 'KILOGRAMS',
  specialModules: [],
  productAttributes: {
    tipo: {
      name: 'Tipo',
      type: 'select',
      options: ['Plastisol', 'Base Água', 'Sublimática', 'UV'],
    },
    cobertura: {
      name: 'Cobertura',
      type: 'select',
      options: ['Opaca', 'Translúcida', 'Transparente'],
    },
    secagem: {
      name: 'Secagem',
      type: 'select',
      options: ['Estufa', 'Ar', 'UV'],
    },
  },
  variantAttributes: {},
  itemAttributes: {
    lote,
    dataFabricacao,
    dataValidade,
  },
};

const telaSerigrafia: TemplatePreset = {
  id: 'tela-serigrafia',
  name: 'Tela Serigrafia',
  description: 'Telas e matrizes para serigrafia',
  icon: 'GiMeshBall',
  category: 'SERIGRAFIA',
  unitOfMeasure: 'UNITS',
  specialModules: [],
  productAttributes: {
    mesh: {
      name: 'Mesh',
      type: 'select',
      options: ['32', '43', '55', '77', '90', '120', '150', '180'],
    },
    material: {
      name: 'Material',
      type: 'select',
      options: ['Poliéster', 'Nylon'],
    },
    dimensao: { name: 'Dimensão', type: 'text' },
  },
  variantAttributes: {},
  itemAttributes: {
    lote,
  },
};

const substrato: TemplatePreset = {
  id: 'substrato',
  name: 'Substrato',
  description: 'Substratos e materiais para impressão',
  icon: 'GiCardboardBox',
  category: 'SERIGRAFIA',
  unitOfMeasure: 'UNITS',
  specialModules: [],
  productAttributes: {
    tipo: {
      name: 'Tipo',
      type: 'select',
      options: ['Algodão', 'Poliéster', 'Papel', 'Vinil', 'Acrílico', 'Metal'],
    },
    gramatura: { name: 'Gramatura', type: 'number', unit: 'g/m²' },
  },
  variantAttributes: {
    tamanho: { name: 'Tamanho', type: 'text' },
  },
  itemAttributes: {
    lote,
  },
};

// ──────────────────────────────────────────────
// MERCADO / VAREJO
// ──────────────────────────────────────────────

const produtoGenerico: TemplatePreset = {
  id: 'produto-generico',
  name: 'Produto Genérico',
  description: 'Produto genérico para varejo',
  icon: 'GiShoppingCart',
  category: 'MERCADO',
  unitOfMeasure: 'UNITS',
  specialModules: [],
  productAttributes: {
    marca: { name: 'Marca', type: 'text' },
    pesoLiquido: { name: 'Peso Líquido', type: 'number', unit: 'g' },
  },
  variantAttributes: {
    variacao: { name: 'Variação', type: 'text' },
    embalagem: { name: 'Embalagem', type: 'text' },
  },
  itemAttributes: {
    lote,
    dataValidade,
  },
};

const limpeza: TemplatePreset = {
  id: 'limpeza',
  name: 'Limpeza',
  description: 'Produtos de limpeza e higiene doméstica',
  icon: 'GiSpray',
  category: 'MERCADO',
  unitOfMeasure: 'UNITS',
  specialModules: [],
  productAttributes: {
    tipo: {
      name: 'Tipo',
      type: 'select',
      options: ['Detergente', 'Desinfetante', 'Amaciante', 'Sabão', 'Multiuso'],
    },
    volume: { name: 'Volume', type: 'number', unit: 'mL' },
    fragrancia: { name: 'Fragrância', type: 'text' },
  },
  variantAttributes: {
    variacao: { name: 'Variação', type: 'text' },
  },
  itemAttributes: {
    lote,
    dataValidade,
  },
};

const higiene: TemplatePreset = {
  id: 'higiene',
  name: 'Higiene',
  description: 'Produtos de higiene pessoal',
  icon: 'GiSoap',
  category: 'MERCADO',
  unitOfMeasure: 'UNITS',
  specialModules: [],
  productAttributes: {
    tipo: {
      name: 'Tipo',
      type: 'select',
      options: [
        'Sabonete',
        'Desodorante',
        'Pasta de Dente',
        'Papel Higiênico',
        'Absorvente',
      ],
    },
    pesoVolume: { name: 'Peso / Volume', type: 'text' },
  },
  variantAttributes: {
    fragrancia: { name: 'Fragrância', type: 'text' },
    variacao: { name: 'Variação', type: 'text' },
  },
  itemAttributes: {
    lote,
    dataValidade,
  },
};

// ──────────────────────────────────────────────
// HOSPITALAR
// ──────────────────────────────────────────────

const scrub: TemplatePreset = {
  id: 'scrub',
  name: 'Scrub',
  description: 'Uniformes cirúrgicos e pijamas hospitalares',
  icon: 'GiTShirt',
  category: 'HOSPITALAR',
  unitOfMeasure: 'UNITS',
  specialModules: ['CARE_INSTRUCTIONS'],
  productAttributes: {
    composicao,
    gramatura,
    tipoTecido,
  },
  variantAttributes: {
    tamanho: {
      name: 'Tamanho',
      type: 'select',
      required: true,
      options: ['PP', 'P', 'M', 'G', 'GG', 'XG'],
    },
    acabamento,
    antiOdor,
  },
  itemAttributes: {
    lote,
    dataFabricacao,
  },
};

const campoFenestrado: TemplatePreset = {
  id: 'campo-fenestrado',
  name: 'Campo Fenestrado',
  description: 'Campos cirúrgicos fenestrados e não fenestrados',
  icon: 'GiRolledCloth',
  category: 'HOSPITALAR',
  unitOfMeasure: 'UNITS',
  specialModules: [],
  productAttributes: {
    material: { name: 'Material', type: 'text', required: true },
    tipo: {
      name: 'Tipo',
      type: 'select',
      options: ['Fenestrado', 'Não Fenestrado', 'Adesivo'],
    },
    dimensao: { name: 'Dimensão', type: 'text' },
    esteril: { name: 'Estéril', type: 'boolean' },
  },
  variantAttributes: {
    tamanho: { name: 'Tamanho', type: 'text', required: true },
  },
  itemAttributes: {
    lote,
    dataFabricacao,
    dataValidade,
  },
};

// ──────────────────────────────────────────────
// Exports
// ──────────────────────────────────────────────

export const TEMPLATE_PRESETS: TemplatePreset[] = [
  // Vestuário
  camiseta,
  calca,
  vestido,
  // Calçado
  tenis,
  sapato,
  sandalia,
  // Enxoval
  lencol,
  toalha,
  // Têxtil
  tecido,
  malha,
  linha,
  aviamento,
  // Serigrafia
  tintaSerigrafia,
  telaSerigrafia,
  substrato,
  // Eletrônicos
  eletronico,
  celular,
  notebookPreset,
  // Farmácia
  medicamento,
  cosmetico,
  suplemento,
  // Mercado
  alimento,
  bebida,
  produtoGenerico,
  limpeza,
  higiene,
  // Hospitalar
  scrub,
  campoFenestrado,
];

export const PRESETS_BY_CATEGORY = TEMPLATE_PRESETS.reduce(
  (acc, preset) => {
    if (!acc[preset.category]) {
      acc[preset.category] = [];
    }
    acc[preset.category].push(preset);
    return acc;
  },
  {} as Record<PresetCategory, TemplatePreset[]>
);
