'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { publicAdmissionService } from '@/services/hr/admissions.service';
import type {
  PublicAdmissionInvite,
  CandidateData,
  CandidateDependant,
  AdmissionDocumentType,
  MaritalStatus,
  BankAccountType,
  DependantRelationship,
} from '@/types/hr';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle,
  CreditCard,
  FileText,
  Loader2,
  PenTool,
  Plus,
  ShieldAlert,
  Trash2,
  Upload,
  User,
  Users,
  XCircle,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';

// ============================================================================
// LABELS
// ============================================================================

const MARITAL_STATUS_OPTIONS: { value: MaritalStatus; label: string }[] = [
  { value: 'SINGLE', label: 'Solteiro(a)' },
  { value: 'MARRIED', label: 'Casado(a)' },
  { value: 'DIVORCED', label: 'Divorciado(a)' },
  { value: 'WIDOWED', label: 'Viúvo(a)' },
  { value: 'SEPARATED', label: 'Separado(a)' },
  { value: 'STABLE_UNION', label: 'União Estável' },
];

const BANK_ACCOUNT_TYPE_OPTIONS: { value: BankAccountType; label: string }[] = [
  { value: 'CHECKING', label: 'Corrente' },
  { value: 'SAVINGS', label: 'Poupança' },
];

const RELATIONSHIP_OPTIONS: { value: DependantRelationship; label: string }[] = [
  { value: 'SPOUSE', label: 'Cônjuge' },
  { value: 'CHILD', label: 'Filho(a)' },
  { value: 'STEPCHILD', label: 'Enteado(a)' },
  { value: 'PARENT', label: 'Pai/Mãe' },
  { value: 'OTHER', label: 'Outro' },
];

const REQUIRED_DOCUMENTS: { type: AdmissionDocumentType; label: string }[] = [
  { type: 'RG', label: 'RG (Identidade)' },
  { type: 'CPF', label: 'CPF' },
  { type: 'CTPS', label: 'CTPS (Carteira de Trabalho)' },
  { type: 'PROOF_ADDRESS', label: 'Comprovante de Residência' },
  { type: 'PHOTO', label: 'Foto 3x4' },
];

const STEP_TITLES = [
  'Dados Pessoais',
  'Documentos',
  'Dados Bancários',
  'Dependentes',
  'Revisão e Assinatura',
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AdmissionWizardPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [currentStep, setCurrentStep] = useState(0);

  // ============================================================================
  // FETCH INVITE DATA
  // ============================================================================

  const {
    data: inviteData,
    isLoading: isLoadingInvite,
    error: inviteError,
  } = useQuery({
    queryKey: ['public-admission', token],
    queryFn: async () => {
      const response = await publicAdmissionService.getByToken(token);
      return response.admission;
    },
  });

  // ============================================================================
  // STEP 1: PERSONAL DATA
  // ============================================================================

  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [rg, setRg] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [maritalStatus, setMaritalStatus] = useState<MaritalStatus | ''>('');
  const [nationality, setNationality] = useState('Brasileira');

  // Address
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');

  // ============================================================================
  // STEP 2: DOCUMENTS
  // ============================================================================

  const [uploadedDocs, setUploadedDocs] = useState<
    Record<string, { file: File; name: string }>
  >({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleFileSelect = (type: AdmissionDocumentType, file: File) => {
    setUploadedDocs(prev => ({
      ...prev,
      [type]: { file, name: file.name },
    }));
  };

  // ============================================================================
  // STEP 3: BANK DATA
  // ============================================================================

  const [bankCode, setBankCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [agency, setAgency] = useState('');
  const [account, setAccount] = useState('');
  const [accountType, setAccountType] = useState<BankAccountType | ''>('');
  const [pixKey, setPixKey] = useState('');

  // ============================================================================
  // STEP 4: DEPENDANTS
  // ============================================================================

  const [dependants, setDependants] = useState<CandidateDependant[]>([]);

  const addDependant = () => {
    setDependants(prev => [
      ...prev,
      {
        fullName: '',
        cpf: '',
        relationship: 'CHILD',
        birthDate: '',
      },
    ]);
  };

  const removeDependant = (idx: number) => {
    setDependants(prev => prev.filter((_, i) => i !== idx));
  };

  const updateDependant = (
    idx: number,
    field: keyof CandidateDependant,
    value: string
  ) => {
    setDependants(prev =>
      prev.map((dep, i) => (i === idx ? { ...dep, [field]: value } : dep))
    );
  };

  // ============================================================================
  // STEP 5: REVIEW + SIGNATURE
  // ============================================================================

  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [signerPin, setSignerPin] = useState('');

  // ============================================================================
  // INIT FROM EXISTING DATA
  // ============================================================================

  // Pre-fill from existing candidate data if available
  const initFromInvite = useCallback(
    (invite: PublicAdmissionInvite) => {
      if (invite.fullName && !fullName) setFullName(invite.fullName);
      if (invite.candidateData) {
        const cd = invite.candidateData;
        if (cd.fullName && !fullName) setFullName(cd.fullName);
        if (cd.cpf && !cpf) setCpf(cd.cpf);
        if (cd.rg && !rg) setRg(cd.rg);
        if (cd.birthDate && !birthDate) setBirthDate(cd.birthDate);
        if (cd.maritalStatus && !maritalStatus)
          setMaritalStatus(cd.maritalStatus);
        if (cd.nationality && !nationality) setNationality(cd.nationality);
        if (cd.address) {
          if (cd.address.street && !street) setStreet(cd.address.street);
          if (cd.address.number && !number) setNumber(cd.address.number);
          if (cd.address.complement) setComplement(cd.address.complement);
          if (cd.address.neighborhood && !neighborhood)
            setNeighborhood(cd.address.neighborhood);
          if (cd.address.city && !city) setCity(cd.address.city);
          if (cd.address.state && !state) setState(cd.address.state);
          if (cd.address.zipCode && !zipCode) setZipCode(cd.address.zipCode);
        }
        if (cd.bankData) {
          if (cd.bankData.bankCode && !bankCode)
            setBankCode(cd.bankData.bankCode);
          if (cd.bankData.bankName && !bankName)
            setBankName(cd.bankData.bankName);
          if (cd.bankData.agency && !agency) setAgency(cd.bankData.agency);
          if (cd.bankData.account && !account) setAccount(cd.bankData.account);
          if (cd.bankData.accountType && !accountType)
            setAccountType(cd.bankData.accountType);
          if (cd.bankData.pixKey) setPixKey(cd.bankData.pixKey);
        }
        if (cd.dependants && cd.dependants.length > 0 && dependants.length === 0) {
          setDependants(cd.dependants);
        }
      }
    },
    // Only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Init data when invite loads
  if (inviteData && !fullName && inviteData.fullName) {
    initFromInvite(inviteData);
  }

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const submitMutation = useMutation({
    mutationFn: async () => {
      const candidateData: CandidateData = {
        fullName: fullName.trim(),
        cpf: cpf.trim(),
        rg: rg.trim() || undefined,
        birthDate,
        maritalStatus: maritalStatus as MaritalStatus,
        nationality: nationality.trim(),
        address: {
          street: street.trim(),
          number: number.trim(),
          complement: complement.trim() || undefined,
          neighborhood: neighborhood.trim(),
          city: city.trim(),
          state: state.trim(),
          zipCode: zipCode.trim(),
        },
        bankData:
          bankCode && agency && account && accountType
            ? {
                bankCode: bankCode.trim(),
                bankName: bankName.trim(),
                agency: agency.trim(),
                account: account.trim(),
                accountType: accountType as BankAccountType,
                pixKey: pixKey.trim() || undefined,
              }
            : undefined,
        dependants: dependants.length > 0 ? dependants : undefined,
      };

      // 1. Submit candidate data
      await publicAdmissionService.submitCandidateData(token, {
        candidateData,
      });

      // 2. Upload documents
      for (const [docType, docInfo] of Object.entries(uploadedDocs)) {
        await publicAdmissionService.uploadDocument(
          token,
          docType as AdmissionDocumentType,
          docInfo.file
        );
      }

      // 3. Sign
      if (acceptedTerms && signerPin) {
        await publicAdmissionService.sign(token, {
          signerName: fullName.trim(),
          signerCpf: cpf.trim(),
          pin: signerPin,
          acceptedTerms: true,
        });
      }
    },
    onSuccess: () => {
      router.push(`/admission/${token}/success`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao enviar dados. Tente novamente.');
    },
  });

  // ============================================================================
  // VALIDATION
  // ============================================================================

  const isStep1Valid =
    !!fullName.trim() &&
    !!cpf.trim() &&
    !!birthDate &&
    !!maritalStatus &&
    !!nationality.trim() &&
    !!street.trim() &&
    !!number.trim() &&
    !!neighborhood.trim() &&
    !!city.trim() &&
    !!state.trim() &&
    !!zipCode.trim();

  const isStep2Valid = Object.keys(uploadedDocs).length >= 2; // At least RG + CPF

  const isStep3Valid = true; // Bank data is optional

  const isStep4Valid = dependants.every(
    d => !!d.fullName.trim() && !!d.cpf.trim() && !!d.birthDate
  );

  const isStep5Valid = acceptedTerms && !!signerPin.trim();

  const stepValidations = [
    isStep1Valid,
    isStep2Valid,
    isStep3Valid,
    isStep4Valid,
    isStep5Valid,
  ];

  // ============================================================================
  // LOADING / ERROR STATES
  // ============================================================================

  if (isLoadingInvite) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <p className="text-sm text-muted-foreground">Carregando convite...</p>
      </div>
    );
  }

  if (inviteError || !inviteData) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <XCircle className="h-12 w-12 text-rose-500" />
        <h2 className="text-lg font-semibold">Convite não encontrado</h2>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Este link de admissão não existe ou já expirou. Entre em contato com o
          departamento de RH da empresa.
        </p>
      </div>
    );
  }

  if (
    inviteData.status === 'EXPIRED' ||
    inviteData.status === 'CANCELLED'
  ) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <XCircle className="h-12 w-12 text-rose-500" />
        <h2 className="text-lg font-semibold">
          {inviteData.status === 'EXPIRED'
            ? 'Convite Expirado'
            : 'Convite Cancelado'}
        </h2>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Este convite de admissão não está mais ativo. Entre em contato com o
          departamento de RH para solicitar um novo convite.
        </p>
      </div>
    );
  }

  if (inviteData.status === 'COMPLETED' && inviteData.signature) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <CheckCircle className="h-12 w-12 text-emerald-500" />
        <h2 className="text-lg font-semibold">Formulário já enviado</h2>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Seus dados já foram enviados com sucesso. A equipe de RH irá analisar
          suas informações.
        </p>
      </div>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Header with company branding */}
      <div className="text-center space-y-3">
        {inviteData.tenant?.logoUrl && (
          <img
            src={inviteData.tenant.logoUrl}
            alt={inviteData.tenant?.name ?? 'Empresa'}
            className="h-12 mx-auto object-contain"
          />
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Admissão Digital
          </h1>
          {inviteData.tenant?.name && (
            <p className="text-sm text-muted-foreground mt-1">
              {inviteData.tenant.name}
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-0.5">
            Olá, {inviteData.fullName}! Preencha seus dados abaixo.
          </p>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2">
        {STEP_TITLES.map((title, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <button
              onClick={() => {
                // Allow going back to previous steps
                if (idx <= currentStep) setCurrentStep(idx);
              }}
              className={`flex items-center justify-center h-8 w-8 rounded-full text-xs font-bold transition-colors ${
                idx === currentStep
                  ? 'bg-blue-500 text-white'
                  : idx < currentStep
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-muted-foreground'
              }`}
            >
              {idx < currentStep ? <Check className="h-4 w-4" /> : idx + 1}
            </button>
            {idx < STEP_TITLES.length - 1 && (
              <div
                className={`w-8 h-0.5 ${
                  idx < currentStep
                    ? 'bg-emerald-500'
                    : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />
            )}
          </div>
        ))}
      </div>
      <p className="text-center text-sm font-medium">
        {STEP_TITLES[currentStep]}
      </p>

      {/* Step content */}
      <Card className="p-6">
        {/* Step 1: Dados Pessoais */}
        {currentStep === 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-blue-500" />
              <h2 className="text-base font-semibold">Dados Pessoais</h2>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">
                Nome Completo <span className="text-rose-500">*</span>
              </Label>
              <Input
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Seu nome completo"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">
                  CPF <span className="text-rose-500">*</span>
                </Label>
                <Input
                  value={cpf}
                  onChange={e => setCpf(e.target.value)}
                  placeholder="000.000.000-00"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">RG</Label>
                <Input
                  value={rg}
                  onChange={e => setRg(e.target.value)}
                  placeholder="Número do RG"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Data de Nascimento <span className="text-rose-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={birthDate}
                  onChange={e => setBirthDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Estado Civil <span className="text-rose-500">*</span>
                </Label>
                <Select
                  value={maritalStatus}
                  onValueChange={v => setMaritalStatus(v as MaritalStatus)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {MARITAL_STATUS_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Nacionalidade <span className="text-rose-500">*</span>
                </Label>
                <Input
                  value={nationality}
                  onChange={e => setNationality(e.target.value)}
                  placeholder="Brasileira"
                />
              </div>
            </div>

            {/* Address */}
            <div className="pt-4 border-t border-border/50">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="h-4 w-4 text-blue-500" />
                <h3 className="text-sm font-semibold">Endereço</h3>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-xs">
                      CEP <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      value={zipCode}
                      onChange={e => setZipCode(e.target.value)}
                      placeholder="00000-000"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-xs">
                      Bairro <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      value={neighborhood}
                      onChange={e => setNeighborhood(e.target.value)}
                      placeholder="Bairro"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label className="text-xs">
                      Rua <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      value={street}
                      onChange={e => setStreet(e.target.value)}
                      placeholder="Nome da rua"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">
                      Número <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      value={number}
                      onChange={e => setNumber(e.target.value)}
                      placeholder="Nº"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Complemento</Label>
                    <Input
                      value={complement}
                      onChange={e => setComplement(e.target.value)}
                      placeholder="Apto, sala..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">
                      Cidade <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      placeholder="Cidade"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">
                      Estado <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      value={state}
                      onChange={e => setState(e.target.value)}
                      placeholder="UF"
                      maxLength={2}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Documentos */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-blue-500" />
              <h2 className="text-base font-semibold">Documentos</h2>
            </div>

            <p className="text-sm text-muted-foreground">
              Envie fotos ou PDFs dos documentos solicitados. Pelo menos RG e CPF
              são obrigatórios.
            </p>

            <div className="space-y-3">
              {REQUIRED_DOCUMENTS.map(doc => (
                <div
                  key={doc.type}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-white dark:bg-slate-800/60"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{doc.label}</p>
                      {uploadedDocs[doc.type] && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400">
                          {uploadedDocs[doc.type].name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {uploadedDocs[doc.type] ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setUploadedDocs(prev => {
                              const next = { ...prev };
                              delete next[doc.type];
                              return next;
                            });
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-rose-500" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRefs.current[doc.type]?.click()}
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Enviar
                      </Button>
                    )}
                    <input
                      ref={el => {
                        fileInputRefs.current[doc.type] = el;
                      }}
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(doc.type, file);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {Object.keys(uploadedDocs).length < 2 && (
              <Card className="p-3 bg-amber-50/50 dark:bg-amber-500/5 border-amber-200 dark:border-amber-500/20">
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Envie pelo menos o RG e CPF para prosseguir.
                </p>
              </Card>
            )}
          </div>
        )}

        {/* Step 3: Dados Bancários */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-5 w-5 text-blue-500" />
              <h2 className="text-base font-semibold">Dados Bancários</h2>
            </div>

            <p className="text-sm text-muted-foreground">
              Informe os dados da sua conta para recebimento do salário.
              Este passo é opcional e pode ser preenchido depois.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Código do Banco</Label>
                <Input
                  value={bankCode}
                  onChange={e => setBankCode(e.target.value)}
                  placeholder="Ex: 001, 341, 237..."
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Nome do Banco</Label>
                <Input
                  value={bankName}
                  onChange={e => setBankName(e.target.value)}
                  placeholder="Ex: Banco do Brasil, Itaú..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Agência</Label>
                <Input
                  value={agency}
                  onChange={e => setAgency(e.target.value)}
                  placeholder="0000"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Conta</Label>
                <Input
                  value={account}
                  onChange={e => setAccount(e.target.value)}
                  placeholder="00000-0"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tipo de Conta</Label>
                <Select
                  value={accountType}
                  onValueChange={v => setAccountType(v as BankAccountType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {BANK_ACCOUNT_TYPE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Chave PIX (opcional)</Label>
              <Input
                value={pixKey}
                onChange={e => setPixKey(e.target.value)}
                placeholder="CPF, e-mail, telefone ou chave aleatória"
              />
            </div>
          </div>
        )}

        {/* Step 4: Dependentes */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <h2 className="text-base font-semibold">Dependentes</h2>
              </div>
              <Button variant="outline" size="sm" onClick={addDependant}>
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </Button>
            </div>

            {dependants.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum dependente cadastrado. Este passo é opcional.
              </p>
            )}

            <div className="space-y-4">
              {dependants.map((dep, idx) => (
                <Card key={idx} className="p-4 relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => removeDependant(idx)}
                  >
                    <Trash2 className="h-4 w-4 text-rose-500" />
                  </Button>

                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">
                          Nome Completo <span className="text-rose-500">*</span>
                        </Label>
                        <Input
                          value={dep.fullName}
                          onChange={e =>
                            updateDependant(idx, 'fullName', e.target.value)
                          }
                          placeholder="Nome do dependente"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">
                          CPF <span className="text-rose-500">*</span>
                        </Label>
                        <Input
                          value={dep.cpf}
                          onChange={e =>
                            updateDependant(idx, 'cpf', e.target.value)
                          }
                          placeholder="000.000.000-00"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">
                          Parentesco <span className="text-rose-500">*</span>
                        </Label>
                        <Select
                          value={dep.relationship}
                          onValueChange={v =>
                            updateDependant(idx, 'relationship', v)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {RELATIONSHIP_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">
                          Data de Nascimento{' '}
                          <span className="text-rose-500">*</span>
                        </Label>
                        <Input
                          type="date"
                          value={dep.birthDate}
                          onChange={e =>
                            updateDependant(idx, 'birthDate', e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Review + Signature */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <PenTool className="h-5 w-5 text-blue-500" />
              <h2 className="text-base font-semibold">Revisão e Assinatura</h2>
            </div>

            {/* Summary */}
            <Card className="p-4 bg-white/95 dark:bg-white/5 border-border">
              <h4 className="text-sm font-semibold mb-3 uppercase text-muted-foreground">
                Resumo dos Dados
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Nome:</span>
                  <p className="font-medium">{fullName || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">CPF:</span>
                  <p className="font-medium">{cpf || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Nascimento:</span>
                  <p className="font-medium">
                    {birthDate
                      ? new Date(birthDate).toLocaleDateString('pt-BR')
                      : '-'}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Estado Civil:</span>
                  <p className="font-medium">
                    {MARITAL_STATUS_OPTIONS.find(o => o.value === maritalStatus)
                      ?.label ?? '-'}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Endereço:</span>
                  <p className="font-medium">
                    {street
                      ? `${street}, ${number}${complement ? ` - ${complement}` : ''}, ${neighborhood}, ${city}/${state} - ${zipCode}`
                      : '-'}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Documentos:</span>
                  <p className="font-medium">
                    {Object.keys(uploadedDocs).length} enviado(s)
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Dependentes:</span>
                  <p className="font-medium">{dependants.length}</p>
                </div>
                {bankCode && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Banco:</span>
                    <p className="font-medium">
                      {bankCode} - {bankName}, Ag: {agency}, Cc: {account}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Terms */}
            <Card className="p-4 bg-slate-50 dark:bg-white/5 border-border">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-muted-foreground space-y-2">
                    <p>
                      Declaro que todas as informações fornecidas neste formulário
                      são verdadeiras e completas. Autorizo a empresa a verificar
                      os dados apresentados e estou ciente de que informações
                      falsas podem resultar em cancelamento do processo de
                      admissão.
                    </p>
                    <p>
                      Ao assinar eletronicamente, concordo com os termos do
                      contrato de trabalho e com a política de privacidade da
                      empresa. A assinatura digital tem validade jurídica conforme
                      a legislação vigente.
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={e => setAcceptedTerms(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium">
                    Li e aceito os termos acima
                  </span>
                </label>
              </div>
            </Card>

            {/* PIN */}
            <div className="space-y-1.5">
              <Label className="text-xs">
                PIN de Assinatura <span className="text-rose-500">*</span>
              </Label>
              <Input
                type="password"
                value={signerPin}
                onChange={e => setSignerPin(e.target.value)}
                placeholder="Digite um PIN de 4-6 dígitos"
                maxLength={6}
                className="max-w-xs"
              />
              <p className="text-xs text-muted-foreground">
                Este PIN será registrado como sua assinatura digital.
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(prev => prev - 1)}
          disabled={currentStep === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar
        </Button>

        {currentStep < STEP_TITLES.length - 1 ? (
          <Button
            onClick={() => setCurrentStep(prev => prev + 1)}
            disabled={!stepValidations[currentStep]}
          >
            Avançar
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={() => submitMutation.mutate()}
            disabled={!isStep5Valid || submitMutation.isPending}
          >
            {submitMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Enviar e Assinar
          </Button>
        )}
      </div>
    </div>
  );
}
