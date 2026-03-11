/**
 * Mapeador de dados da BrasilAPI para o formato da nossa API
 */

import type { BrasilAPICompanyData } from '@/types/brasilapi';
import type {
  CreateCompanyAddressData,
  CreateCompanyCnaeData,
  CreateCompanyData,
  CreateCompanyFiscalSettingsData,
  CreateCompanyStakeholderData,
  TaxRegime,
} from '@/types/hr';

export interface ImportedCompanyData {
  company: CreateCompanyData;
  addresses: CreateCompanyAddressData[];
  cnaes: CreateCompanyCnaeData[];
  stakeholders: CreateCompanyStakeholderData[];
  fiscalSettings?: CreateCompanyFiscalSettingsData;
}

/**
 * Mapeia dados da BrasilAPI para o formato da nossa API
 */
export function mapBrasilAPIToCompanyData(
  brasilData: BrasilAPICompanyData
): ImportedCompanyData {
  // Dados da empresa
  const company: CreateCompanyData = {
    legalName: brasilData.razao_social,
    tradeName: brasilData.nome_fantasia || undefined,
    cnpj: brasilData.cnpj,
    email: brasilData.email || undefined,
    phoneMain: brasilData.ddd_telefone_1 || undefined,
    phoneAlt: brasilData.ddd_telefone_2 || undefined,
    stateRegistration: undefined,
    municipalRegistration: undefined,
    taxRegime: getTaxRegimeFromBrasilData(brasilData),
    taxRegimeDetail: undefined,
    legalNature: brasilData.natureza_juridica || undefined,
    activityStartDate: brasilData.data_inicio_atividade || undefined,
    status:
      brasilData.descricao_situacao_cadastral === 'ATIVA'
        ? 'ACTIVE'
        : 'INACTIVE',
  };

  // Endereço fiscal
  const addresses: CreateCompanyAddressData[] = [
    {
      type: 'FISCAL',
      street: brasilData.logradouro || undefined,
      number: brasilData.numero || undefined,
      complement: brasilData.complemento || undefined,
      district: brasilData.bairro || undefined,
      city: brasilData.municipio || undefined,
      state: brasilData.uf || undefined,
      zip: brasilData.cep || '',
      countryCode: 'BR',
      ibgeCityCode: String(brasilData.codigo_municipio_ibge || ''),
      isPrimary: true,
    },
  ];

  // CNAEs (fiscal + secundários)
  const cnaes: CreateCompanyCnaeData[] = [];

  // CNAE fiscal
  if (brasilData.cnae_fiscal) {
    cnaes.push({
      code: String(brasilData.cnae_fiscal),
      description: brasilData.cnae_fiscal_descricao || '',
      isPrimary: true,
      status: 'ACTIVE',
    });
  }

  // CNAEs secundários
  if (brasilData.cnaes_secundarios && brasilData.cnaes_secundarios.length > 0) {
    brasilData.cnaes_secundarios.forEach(cnae => {
      cnaes.push({
        code: String(cnae.codigo),
        description: cnae.descricao || '',
        isPrimary: false,
        status: 'ACTIVE',
      });
    });
  }

  // Sócios/Stakeholders
  const stakeholders: CreateCompanyStakeholderData[] = [];

  if (brasilData.qsa && brasilData.qsa.length > 0) {
    brasilData.qsa.forEach(socio => {
      stakeholders.push({
        name: socio.nome_socio,
        role: mapQsaQualificacao(socio.qualificacao_socio),
        personDocumentMasked: socio.cnpj_cpf_do_socio,
        entryDate: socio.data_entrada_sociedade || undefined,
        status: 'ACTIVE',
      });
    });
  }

  return {
    company,
    addresses,
    cnaes,
    stakeholders,
    fiscalSettings: undefined,
  };
}

/**
 * Mapeia regime tributário da BrasilAPI para o formato da nossa API
 * Valores válidos: "SIMPLES" | "LUCRO_PRESUMIDO" | "LUCRO_REAL" | "IMUNE_ISENTA" | "OUTROS"
 */
function getTaxRegimeFromBrasilData(data: BrasilAPICompanyData): TaxRegime {
  if (!data.regime_tributario || data.regime_tributario.length === 0) {
    return 'OUTROS';
  }

  const latestRegime =
    data.regime_tributario[data.regime_tributario.length - 1];
  const forma = latestRegime.forma_de_tributacao.toUpperCase().trim();

  // Mapear os valores da BrasilAPI para os valores esperados
  if (forma.includes('ISENTA') || forma.includes('IMUNE')) {
    return 'IMUNE_ISENTA';
  }
  if (forma.includes('SIMPLES')) {
    return 'SIMPLES';
  }
  if (forma.includes('PRESUMIDO')) {
    return 'LUCRO_PRESUMIDO';
  }
  if (forma.includes('LUCRO_REAL') || forma.includes('REAL')) {
    return 'LUCRO_REAL';
  }

  // Padrão para valores não reconhecidos
  return 'OUTROS';
}

/**
 * Mapeia qualificação de sócio da BrasilAPI para o nosso sistema
 * Valores válidos: "SOCIO" | "ADMINISTRADOR" | "PROCURADOR" | "REPRESENTANTE_LEGAL" | "GERENTE" | "DIRETOR" | "OUTRO"
 */
function mapQsaQualificacao(brasilQualificacao: string): string {
  const qualificacao = (brasilQualificacao || '').toUpperCase().trim();

  // Mapeamento direto de qualificações conhecidas
  const map: Record<string, string> = {
    SÓCIO: 'SOCIO',
    SOCIO: 'SOCIO',
    PRESIDENTE: 'SOCIO', // Presidente geralmente é sócio
    'VICE-PRESIDENTE': 'SOCIO',
    DIRETOR: 'DIRETOR',
    GERENTE: 'GERENTE',
    ADMINISTRADOR: 'ADMINISTRADOR',
    PROCURADOR: 'PROCURADOR',
    'REPRESENTANTE LEGAL': 'REPRESENTANTE_LEGAL',
    REPRESENTANTE_LEGAL: 'REPRESENTANTE_LEGAL',
  };

  // Tenta encontrar um match exato primeiro
  if (map[qualificacao]) {
    return map[qualificacao];
  }

  // Tenta encontrar match parcial
  for (const [key, value] of Object.entries(map)) {
    if (qualificacao.includes(key) || key.includes(qualificacao)) {
      return value;
    }
  }

  // Padrão para valores não reconhecidos
  return 'OUTRO';
}
