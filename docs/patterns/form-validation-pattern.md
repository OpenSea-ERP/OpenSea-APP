# Pattern: Form and Validation

## Problem

O projeto OpenSea-APP precisa lidar com formulários de complexidades variadas: desde telas de login simples até formulários multisseção com cálculos em tempo real (preços de variantes), integração com APIs externas (consulta de CNPJ via BrasilAPI), campos dinâmicos gerados por configuração de template, e validações de documentos brasileiros (CPF, CNPJ, telefone, CEP). A ausência de um padrão uniforme geraria inconsistências de UX, código duplicado e dificuldade de manutenção.

---

## Solution

O projeto adota **três abordagens** de formulário, escolhidas conforme a complexidade e o contexto:

| Abordagem                                  | Biblioteca principal                            | Quando usar                                                                                                                                                            |
| ------------------------------------------ | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TanStack Form** (`@tanstack/react-form`) | `useForm` + `form.Field`                        | Fluxos de autenticação (login, registro, recuperação de senha) e formulários de perfil — simples, sem schema Zod                                                       |
| **react-hook-form + Zod**                  | `useForm` + `zodResolver` + `<Form>` components | Formulários de domínio com validação rigorosa por schema — ex.: entrada rápida de estoque, schemas de empresa                                                          |
| **useState manual**                        | `useState` + `e.preventDefault()`               | Formulários com lógica de negócio complexa impossível de expressar em schema estático (ex.: cálculo bidirecional de preço/margem em `VariantForm`, lookup CNPJ inline) |
| **EntityForm genérico**                    | `react-hook-form` interno + configuração JSON   | CRUD rápido (modal "Edição Rápida") de entidades como Fabricantes e Empresas HR                                                                                        |

A validação de regras de negócio brasileiras (CNPJ, CPF, CEP) é feita com `z.refine()` em schemas Zod locais, nunca por bibliotecas de máscara externas.

---

## Implementation

### 1. Abordagem TanStack Form (autenticação)

Utilizada em todas as páginas do grupo de rotas `(auth)`: login, registro e recuperação de senha.

**Características:**

- Sem schema Zod — validações manuais no `onSubmit`
- Erros de API traduzidos por `translateError()` de `src/lib/error-messages.ts`
- Erros exibidos em um banner vermelho de nível de formulário (não por campo)
- Ícones decorativos com posicionamento absoluto dentro de campos com `pl-12`

```tsx
// src/app/(auth)/register/page.tsx
const form = useForm({
  defaultValues: {
    name: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  } as RegisterFormData,
  onSubmit: async ({ value }) => {
    // Validação manual no submit (sem Zod)
    if (value.password !== value.confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }
    if (value.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    try {
      await register({ ... });
    } catch (err) {
      setError(translateError(err)); // mapeia mensagem inglês → português
    }
  },
});

// Cada campo usa form.Field com render prop
<form.Field name="email">
  {field => (
    <div className="space-y-2">
      <Label htmlFor="email">Email</Label>
      <div className="relative">
        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 z-10 pointer-events-none" />
        <Input
          id="email"
          type="email"
          value={field.state.value}
          onChange={e => field.handleChange(e.target.value)}
          onBlur={field.handleBlur}
          className="pl-12"
        />
      </div>
    </div>
  )}
</form.Field>
```

**Exibição de erro de formulário (nível global — apenas em páginas auth):**

```tsx
{
  error && (
    <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 animate-in fade-in slide-in-from-top-2 duration-200">
      <p className="text-sm text-rose-600 dark:text-rose-400 text-center">
        {error}
      </p>
    </div>
  );
}
```

---

### 2. Abordagem react-hook-form + Zod (formulários de domínio)

Utilizada quando o formulário requer validação rigorosa por schema com mensagens de erro inline por campo. Exemplo real: entrada rápida de estoque (`QuickStockEntry`).

```tsx
// src/app/(dashboard)/(modules)/stock/(entities)/products/src/components/workspace/quick-stock-entry.tsx

// 1. Definir schema Zod local
const quickStockSchema = z.object({
  quantity: z.coerce.number().min(1, 'Quantidade mínima é 1'),
  locationId: z.string().min(1, 'Selecione uma localização'),
});

type QuickStockFormValues = z.infer<typeof quickStockSchema>;

// 2. Inicializar formulário com zodResolver
const form = useForm<QuickStockFormValues>({
  resolver: zodResolver(quickStockSchema) as never,
  defaultValues: {
    quantity: 1,
    locationId: '',
  },
});

// 3. Usar componentes de formulário do shadcn/ui
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="quantity"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs">Quantidade</FormLabel>
          <FormControl>
            <Input type="number" min="1" {...field} />
          </FormControl>
          <FormMessage /> {/* Exibe erro do campo automaticamente */}
        </FormItem>
      )}
    />
  </form>
</Form>;
```

**Quando o zodResolver apresenta incompatibilidade de tipos genéricos**, usa-se `as never`:

```tsx
resolver: zodResolver(quickStockSchema) as never,
```

---

### 3. Schemas Zod com validação de documentos brasileiros

O único schema Zod dedicado a formulário de domínio complexo está em:
`src/app/(dashboard)/(modules)/admin/(entities)/companies/src/schemas/company.schema.ts`

Este arquivo demonstra o padrão canônico para validação de documentos brasileiros.

**Validação de CNPJ com dígito verificador:**

```tsx
const cnpjValidator = z
  .string()
  .min(1, 'CNPJ é obrigatório')
  .refine(
    val => {
      const cleaned = val.replace(/\D/g, '');
      return cleaned.length === 14;
    },
    { message: 'CNPJ deve ter 14 dígitos' }
  )
  .refine(
    val => {
      const cleaned = val.replace(/\D/g, '');
      // CNPJs com todos dígitos iguais são inválidos
      if (/^(\d)\1{13}$/.test(cleaned)) return false;
      // ... cálculo de dígito verificador ...
      return true;
    },
    { message: 'CNPJ inválido' }
  );
```

**Padrão para campos opcionais com string vazia:**

```tsx
// Aceita: undefined, null, string vazia, ou email válido
const optionalEmailValidator = z
  .string()
  .email('E-mail inválido')
  .optional()
  .nullable()
  .or(z.literal(''));

// Schema de atualização como partial do schema de criação
export const updateCompanySchema = createCompanySchema.partial();

// Tipos inferidos diretamente do schema
export type CreateCompanyFormData = z.infer<typeof createCompanySchema>;
```

---

### 4. Formulários manuais com useState (lógica de negócio complexa)

Utilizados quando a lógica de negócio não pode ser encapsulada em schema estático. O exemplo principal é o `VariantForm`.

**Por que não usar EntityForm ou react-hook-form aqui:**

- Cálculos bidirecionais em tempo real (margem ↔ preço de venda)
- Múltiplos estados derivados que dependem uns dos outros
- Geração dinâmica de campos baseada nos `variantAttributes` do template
- Coerção de tipos numéricos que quebraria em formulários genéricos

```tsx
// src/components/stock/variants/variant-form.tsx

// Estado único para o objeto do formulário
const [formData, setFormData] = useState<CreateVariantRequest | UpdateVariantRequest>(
  () => variant ? { ...variantDefaults } : { ...createDefaults }
);

// Estados separados para campos com lógica derivada
const [informedCostPrice, setInformedCostPrice] = useState(variant?.costPrice || 0);
const [profitMarginPercent, setProfitMarginPercent] = useState(variant?.profitMargin || 0);
const [calculatedSalePrice, setCalculatedSalePrice] = useState(0);

// Cálculo derivado via useEffect
useEffect(() => {
  if (informedCostPrice > 0 && profitMarginPercent > 0) {
    const calculated = informedCostPrice * (1 + profitMarginPercent / 100);
    setCalculatedSalePrice(Number(calculated.toFixed(2)));
  }
}, [informedCostPrice, profitMarginPercent]);

// Handler genérico para campos de texto/número no formData
const handleInputChange = useCallback(
  (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const numFields = ['price', 'costPrice', 'profitMargin', 'minStock', ...];
    setFormData(prev => ({
      ...prev,
      [name]: numFields.includes(name) ? parseFloat(value) || 0 : value,
    }));
  },
  []
);

// Submit limpa campos vazios para undefined antes de enviar
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const cleanData = {
    ...formData,
    imageUrl: formData.imageUrl?.trim() || undefined,
    sku: formData.sku?.trim() || undefined,
  };
  await onSave(cleanData);
};
```

**Formulários inline (criação rápida dentro de dropdowns):**

O padrão `InlineSupplierForm` / `InlineBankAccountForm` usa `useState` puro para formulários pequenos que aparecem dentro de `Popover` ou `Dialog` como alternativa ao select:

```tsx
// src/components/finance/inline-supplier-form.tsx
export function InlineSupplierForm({ onCreated, onCancel }) {
  const [name, setName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const createMutation = useCreateFinanceSupplier();

  // Consulta BrasilAPI quando CNPJ atinge 14 dígitos
  const handleCnpjChange = async (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    setCnpj(digits);
    if (digits.length === 14) {
      setIsLookingUp(true);
      try {
        const res = await fetch(
          `https://brasilapi.com.br/api/cnpj/v1/${digits}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.razao_social) setName(data.razao_social); // Auto-preenchimento
        }
      } finally {
        setIsLookingUp(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const result = await createMutation.mutateAsync({
      name: name.trim(),
      cnpj: cnpj || undefined,
    });
    onCreated({ id: result.supplier.id, name: result.supplier.name });
    toast.success('Fornecedor criado com sucesso!');
  };
}
```

---

### 5. EntityForm genérico (CRUD orientado a configuração)

O componente `EntityForm` em `src/core/forms/components/entity-form.tsx` é o formulário genérico baseado em configuração JSON. Ele usa `react-hook-form` internamente e despacha para componentes de campo especializados via switch/case em `EntityFormField`.

**Tipos de campos suportados (FieldType):**

```
text | textarea | number | currency | email | phone | password | url
select | multi-select | combobox
checkbox | radio | switch
date | datetime | time | daterange
percent | color | slider | tags
file | image
rich-text | code | json | markdown
array | object | key-value
relation | custom
```

**Como configurar um formulário para uma entidade:**

```tsx
// Exemplo: configuração para Fabricante
// src/app/(dashboard)/(modules)/stock/(entities)/manufacturers/src/config/manufacturers.config.ts
const manufacturersConfig = defineEntityConfig<Manufacturer>()({
  // ...
  form: {
    sections: [
      {
        id: 'basic',
        title: 'Informações Básicas',
        columns: 2,
        fields: [
          {
            name: 'name',
            label: 'Nome',
            type: 'text',
            required: true,
            colSpan: 2,
          },
          {
            name: 'isActive',
            label: 'Ativo',
            type: 'switch',
            defaultValue: true,
          },
        ],
      },
    ],
  },
});
```

**Como usar EntityForm em um modal:**

```tsx
// src/app/(dashboard)/(modules)/stock/(entities)/manufacturers/src/modals/edit-modal.tsx
<EntityForm
  config={manufacturersConfig.form! as never}
  mode="edit"
  initialData={manufacturer as never}
  onSubmit={async data => {
    await onSubmit(manufacturer.id, data as Partial<Manufacturer>);
    onClose();
  }}
  onCancel={() => onClose()}
  isSubmitting={isSubmitting}
/>
```

**Nota sobre `as never`:** O EntityForm usa `as never` extensivamente porque `react-hook-form` exige tipos genéricos estritos que conflitam com o sistema de despacho dinâmico de campos. Este é um trade-off documentado e intencional — o arquivo tem `/* eslint-disable @typescript-eslint/no-explicit-any */` no topo.

**Validação no EntityForm:** A validação é feita em dois níveis:

1. `react-hook-form` gerencia o estado do formulário com `mode: 'onBlur'` (padrão)
2. `validateRequiredFields()` valida campos obrigatórios no submit e exibe toast via `showValidationErrors()`

```tsx
// src/core/forms/components/entity-form-validation.ts
export function showValidationErrors(errors: Record<string, string>): void {
  const errorMessages = Object.values(errors);
  if (errorMessages.length === 1) {
    toast.error(errorMessages[0]);
  } else {
    toast.error(
      `Há ${errorMessages.length} campos obrigatórios que precisam ser preenchidos`
    );
  }
}
```

---

### 6. EntityForm legado (src/components/shared/forms/)

Existe uma versão anterior de EntityForm em `src/components/shared/forms/entity-form.tsx` que não usa `react-hook-form` — gerencia estado com `useState` puro e expõe métodos via `useImperativeHandle` (`submit`, `getData`, `reset`, `setFieldValue`). Esta versão usa o tipo `EntityFormConfig` de `src/types/entity-config.ts` (interface mais simples com `tabs` e `sections`).

Esta versão legada não deve ser usada para novas implementações. Prefira sempre `src/core/forms/components/entity-form.tsx`.

---

### 7. Layout e Grid de Campos

Todos os formulários manuais seguem o padrão TailwindCSS de grid:

```tsx
{/* 2 colunas iguais */}
<div className="grid grid-cols-2 gap-4">
  <div className="space-y-2">
    <Label htmlFor="agency">Agência</Label>
    <Input id="agency" value={agency} onChange={e => setAgency(e.target.value)} />
  </div>
  <div className="space-y-2">
    <Label htmlFor="accountNumber">Número da Conta</Label>
    <Input id="accountNumber" value={accountNumber} onChange={...} />
  </div>
</div>

{/* 3 colunas — usado em VariantForm */}
<div className="grid grid-cols-3 gap-4">
  <div className="grid gap-2"> ... </div>
</div>
```

O padrão `space-y-2` dentro de cada campo garante espaçamento consistente entre label, input e mensagem de erro.

No EntityForm genérico, o número de colunas é controlado pela propriedade `columns` da seção (1–4), mapeada para classes Tailwind via `getColSpanClass()` em `EntityFormField`.

---

### 8. Combobox com dados da API

O padrão para dropdowns com busca que carregam dados remotamente usa o componente `Combobox` de `src/components/ui/combobox.tsx` (baseado em Radix `Command`):

```tsx
// src/app/(dashboard)/(modules)/stock/(entities)/products/src/components/edit-product-form.tsx

// 1. Buscar dados com React Query
const { data: manufacturersData } = useManufacturers();
const manufacturers = manufacturersData?.manufacturers ?? [];

// 2. Transformar em opções { value, label }
const manufacturerOptions = useMemo(
  () =>
    manufacturers
      .filter(m => m.isActive)
      .map(m => ({ value: m.id, label: m.name })),
  [manufacturers]
);

// 3. Renderizar Combobox
<Combobox
  options={manufacturerOptions}
  value={manufacturerId}
  onValueChange={setManufacturerId}
  placeholder="Selecione o fabricante..."
  searchPlaceholder="Buscar fabricante..."
  emptyText="Nenhum fabricante encontrado."
/>;
```

**Para combobox dentro de react-hook-form (FormField):**

```tsx
// src/app/(dashboard)/(modules)/stock/(entities)/products/src/components/workspace/quick-stock-entry.tsx
<FormField
  control={form.control}
  name="locationId"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Localização</FormLabel>
      <Popover open={locationOpen} onOpenChange={setLocationOpen}>
        <PopoverTrigger asChild>
          <FormControl>
            <Button variant="outline" role="combobox">
              {field.value
                ? locations.find(l => l.id === field.value)?.code
                : 'Selecione...'}
              <ChevronsUpDown className="ml-2 h-4 w-4" />
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent>
          <Command>
            <CommandInput placeholder="Buscar..." />
            <CommandList>
              {locations.map(loc => (
                <CommandItem
                  key={loc.id}
                  value={loc.code}
                  onSelect={() => {
                    field.onChange(loc.id);
                    setLocationOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      field.value === loc.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {loc.code}
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <FormMessage />
    </FormItem>
  )}
/>
```

---

### 9. Campos monetários (InputGroup + MoneyInput)

Para campos de valor monetário, o projeto usa os componentes de `src/components/ui/input-group.tsx`:

```tsx
// src/components/stock/variants/variant-form.tsx
<InputGroup>
  <InputGroupAddon>
    <InputGroupText>R$</InputGroupText>
  </InputGroupAddon>
  <MoneyInput
    id="informedCostPrice"
    value={informedCostPrice}
    onChange={value => setInformedCostPrice(value)}
    placeholder="0,00"
    disabled={isLoading}
  />
  <InputGroupAddon align="inline-end">
    <InputGroupText>BRL</InputGroupText>
  </InputGroupAddon>
</InputGroup>
```

`MoneyInput` usa `type="number"` com `step="0.01"` e `inputMode="decimal"`. Os controles de spinner do navegador são ocultados com:

```css
[&::-webkit-outer-spin-button]:appearance-none
[&::-webkit-inner-spin-button]:appearance-none
[&[type=number]]:appearance-textfield
```

O valor é gerenciado como `number` (não string), recebido via `onChange: (value: number) => void`.

---

### 10. Formatação e máscaras de documentos brasileiros

O projeto **não utiliza bibliotecas de máscara** (react-input-mask, imask, etc.). As máscaras são implementadas como funções puras em `src/helpers/formatters.ts` e aplicadas manualmente nos handlers de mudança.

**Funções disponíveis:**

```ts
// src/helpers/formatters.ts
formatCNPJ(cnpj); // "12.345.678/0001-90"
formatCPF(cpf); // "123.456.789-00"
formatPhone(phone); // "(11) 98765-4321" ou "(11) 4321-1234"
formatCEP(cep); // "01310-100"
formatCNAE(cnae); // "6201-5/01"
formatCurrency(val); // "R$ 1.234,56"  (Intl.NumberFormat pt-BR)
formatDate(date); // "31/12/2025"   (toLocaleDateString pt-BR)
formatDateTime(date); // "31/12/2025 23:59"
```

**Padrão de máscara na digitação (CNPJ lookup modal):**

```tsx
// src/app/(dashboard)/(modules)/finance/companies/src/modals/cnpj-lookup-modal.tsx
const formatCNPJ = (value: string) => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 14) {
    return cleaned
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return value;
};

const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setCnpj(formatCNPJ(e.target.value));
};
```

**Padrão de strip de dígitos (InlineSupplierForm) — quando a máscara visual não é necessária:**

```tsx
// Aceita entrada livre, extrai apenas dígitos
const handleCnpjChange = async (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  setCnpj(digits);
  if (digits.length === 14) {
    /* consulta BrasilAPI */
  }
};
```

---

### 11. Exibição de erros por campo (NOVO PADRAO — FormErrorIcon)

**Padrao atual (desde 2026-03-25) — FormErrorIcon com tooltip:**

```tsx
// Erro aparece como icone com tooltip — NUNCA empurra layout
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <div className="relative">
    <Input
      id="email"
      aria-invalid={!!form.formState.errors.email}
      {...form.register('email')}
    />
    {form.formState.errors.email && (
      <FormErrorIcon message={form.formState.errors.email.message ?? ''} />
    )}
  </div>
</div>
```

**Com EntityForm generico:**
O `FormFieldWrapper` ja foi atualizado para usar `FormErrorIcon` automaticamente. Campos com `error` prop recebem o icone com tooltip.

**Indicação visual de campo obrigatório:**

```tsx
// Asterisco rose após o label
<Label htmlFor="name">
  Nome da Variante{' '}
  <span className="text-[rgb(var(--color-destructive))]">*</span>
</Label>
```

**Erro de formulário (banner global — APENAS em páginas auth):**

```tsx
{
  error && (
    <div className="flex gap-3 p-4 rounded-lg bg-rose-50 border border-rose-200 dark:bg-rose-950/20 dark:border-rose-900">
      <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400" />
      <p className="text-sm text-rose-700 dark:text-rose-300">{error}</p>
    </div>
  );
}
```

---

### 12. Botões de submissão com estado de carregamento

```tsx
{
  /* Padrão com Loader2 animado */
}
<Button type="submit" disabled={isLoading}>
  {isLoading ? (
    <>
      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      Salvando...
    </>
  ) : (
    <>
      <Save className="h-4 w-4" />
      {variant ? 'Atualizar' : 'Criar'} Variante
    </>
  )}
</Button>;
```

Para botões de cancelar, usa-se `variant="outline"` e sempre `type="button"` (nunca omitir o type em formulários com múltiplos botões).

---

### 13. Formulários multistep

O padrão de formulário multistep (login de 2 etapas, recuperação de senha de 3 etapas) usa um `useState` de step como discriminante:

```tsx
type LoginStep = 'identifier' | 'password';
const [currentStep, setCurrentStep] = useState<LoginStep>('identifier');

// Indicador visual de progresso
<div className="flex items-center justify-center gap-2 mb-6">
  {steps.map(step => (
    <div
      key={step}
      className={`h-1.5 w-10 rounded-full transition-all duration-300 ${
        currentStep === step
          ? 'bg-blue-600 dark:bg-blue-400'
          : 'bg-gray-300 dark:bg-gray-700'
      }`}
    />
  ))}
</div>;

// Cada etapa é renderizada condicionalmente com animação
{
  currentStep === 'email' && (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
      ...
    </div>
  );
}
```

O formulário multistep compartilha um único `useForm` do TanStack Form entre todas as etapas. Cada etapa chama um `handleXxxSubmit` diferente que avança o step ou submete o formulário.

---

### 14. Tradução de erros da API

```ts
// src/lib/error-messages.ts
export const errorMessages: Record<string, string> = {
  'Invalid credentials': 'Credenciais inválidas',
  'User temporarily blocked due to failed login attempts':
    'Usuário temporariamente bloqueado devido a tentativas de login falhas',
  // ... ~60 mapeamentos
};

export function translateError(error: string | Error | unknown): string {
  if (error instanceof Error) {
    return (
      errorMessages[error.message] ||
      error.message ||
      'Ocorreu um erro desconhecido'
    );
  }
  if (typeof error === 'string') {
    return errorMessages[error] || error || 'Ocorreu um erro desconhecido';
  }
  // ...
}
```

Uso nos handlers de submit:

```tsx
try {
  await login({ email, password });
} catch (err) {
  setError(translateError(err)); // nunca expõe mensagem técnica inglesa ao usuário
}
```

---

## Files

| Arquivo                                                                                                  | Descrição                                                                                                   |
| -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `src/components/ui/form-error-icon.tsx`                                                                  | **ERROR HANDLING** — Icone ⚠ com tooltip rose no campo (zero layout impact)                                |
| `src/components/ui/section-error-badge.tsx`                                                              | **ERROR HANDLING** — Badge de contagem de erros na secao                                                    |
| `src/components/ui/form-error-report-modal.tsx`                                                          | **ERROR HANDLING** — Modal relatorio com lista clicavel de erros                                            |
| `src/components/ui/password-strength-checklist.tsx`                                                      | **ERROR HANDLING** — Checklist de criterios de senha em tempo real                                          |
| `src/hooks/use-form-error-handler.ts`                                                                    | **ERROR HANDLING** — Hook que mapeia erro API → campo do form (4 niveis de fallback)                        |
| `src/hooks/use-uniqueness-check.ts`                                                                      | **ERROR HANDLING** — Hook de validacao de unicidade on blur com debounce                                    |
| `src/hooks/use-go-to-field.ts`                                                                           | **ERROR HANDLING** — Hook de scroll + highlight ao clicar no relatorio                                      |
| `src/lib/i18n/index.ts`                                                                                  | **I18N** — Engine de traducao com `t()` function e interpolacao                                             |
| `src/lib/i18n/locales/pt-BR.ts`                                                                          | **I18N** — Todas as mensagens de erro em portugues formal                                                   |
| `src/app/(dashboard)/(modules)/admin/(entities)/users/src/modals/create-modal.tsx`                       | **REFERENCIA** — Implementacao canonica do novo error handling                                              |
| `src/core/forms/components/entity-form.tsx`                                                              | EntityForm genérico (principal — react-hook-form interno)                                                   |
| `src/core/forms/components/entity-form-field.tsx`                                                        | Despacho de tipo de campo → componente especializado                                                        |
| `src/core/forms/components/entity-form-validation.ts`                                                    | validateRequiredFields, showValidationErrors, buildDefaultValues                                            |
| `src/core/forms/components/entity-form.types.ts`                                                         | EntityFormProps, ValidationResult, GridColumns                                                              |
| `src/core/types/form.types.ts`                                                                           | EntityFormConfig, FieldConfig, FieldType (canônico)                                                         |
| `src/core/types/entity-config.types.ts`                                                                  | EntityConfig, defineEntityConfig()                                                                          |
| `src/components/shared/forms/entity-form.tsx`                                                            | EntityForm legado (useState puro — não usar para novos)                                                     |
| `src/components/shared/forms/dynamic-form-field.tsx`                                                     | Campo dinâmico do EntityForm legado                                                                         |
| `src/components/ui/form.tsx`                                                                             | Componentes shadcn/ui para react-hook-form (Form, FormField, FormItem, FormLabel, FormControl, FormMessage) |
| `src/components/ui/combobox.tsx`                                                                         | Combobox com busca (Radix Command)                                                                          |
| `src/components/ui/input-group.tsx`                                                                      | InputGroup, InputGroupAddon, InputGroupText, MoneyInput                                                     |
| `src/helpers/formatters.ts`                                                                              | Formatação de CNPJ, CPF, telefone, CEP, CNAE, moeda, data                                                   |
| `src/lib/error-messages.ts`                                                                              | Mapa de tradução de erros inglês → português                                                                |
| `src/app/(auth)/login/page.tsx`                                                                          | Exemplo de formulário multistep (TanStack Form)                                                             |
| `src/app/(auth)/register/page.tsx`                                                                       | Exemplo de formulário simples (TanStack Form)                                                               |
| `src/app/(auth)/forgot-password/page.tsx`                                                                | Exemplo de formulário multistep com 3 etapas                                                                |
| `src/components/profile-form.tsx`                                                                        | Formulário de perfil (TanStack Form)                                                                        |
| `src/components/stock/variants/variant-form.tsx`                                                         | Formulário manual complexo com cálculos bidirecionais                                                       |
| `src/components/finance/inline-supplier-form.tsx`                                                        | Formulário inline com lookup BrasilAPI                                                                      |
| `src/components/finance/inline-bank-account-form.tsx`                                                    | Formulário inline com grid 2 colunas                                                                        |
| `src/app/(dashboard)/(modules)/stock/(entities)/products/src/components/workspace/quick-stock-entry.tsx` | Formulário react-hook-form + Zod completo                                                                   |
| `src/app/(dashboard)/(modules)/admin/(entities)/companies/src/schemas/company.schema.ts`                 | Schema Zod canônico com validação de CNPJ/CPF/telefone/CEP                                                  |
| `src/app/(dashboard)/(modules)/finance/companies/src/modals/cnpj-lookup-modal.tsx`                       | Modal com máscara CNPJ na digitação                                                                         |
| `src/app/(dashboard)/(modules)/finance/payable/new/page.tsx`                                             | Página de formulário manual com useState para entidade financeira                                           |

---

## Rules

### OBRIGATORIO: Error Handling System (desde 2026-03-25)

Todo formulario novo DEVE seguir este sistema de error handling. Nao usar toast para erros de campo. Nao usar mensagens inline que empurram layout.

#### Arquitetura de 3 camadas

| Camada    | Componente           | O que mostra                                                                   | Quando                                                  |
| --------- | -------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------- |
| **Campo** | `FormErrorIcon`      | Borda rose (`aria-invalid`) + icone ⚠ no canto direito + tooltip com mensagem | Erros vinculados a um campo                             |
| **Secao** | `SectionErrorBadge`  | Badge rose com contagem de erros no header da secao                            | Quando ha erros em campos daquela secao                 |
| **Toast** | Sonner (redesenhado) | Notificacao solida com degrade                                                 | APENAS erros sem campo: rede, servidor, auth, permissao |

#### Quando validar

- **Submit** → validacao completa (primeira vez) via `mode: 'onSubmit'`
- **Revalidacao** → `reValidateMode: 'onChange'` (campo corrigido limpa erro em tempo real)
- **Campos unicos** → On blur com debounce (300ms) via `useUniquenessCheck`: CNPJ, CPF, nome, SKU, email, username
- **Senha** → `PasswordStrengthChecklist` em tempo real (on change)

#### Exemplo completo: formulario com react-hook-form + zod + error handling

```tsx
'use client';

import { Button } from '@/components/ui/button';
import { FormErrorIcon } from '@/components/ui/form-error-icon';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  PasswordStrengthChecklist,
  isPasswordStrong,
} from '@/components/ui/password-strength-checklist';
import { useFormErrorHandler } from '@/hooks/use-form-error-handler';
import { t } from '@/lib/i18n';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// 1. Schema Zod com mensagens i18n
const schema = z.object({
  name: z.string().min(2, t('validation.minLength', { field: 'Nome', min: 2 })),
  email: z.string().email(t('validation.email')),
  password: z
    .string()
    .min(8, t('validation.minLength', { field: 'Senha', min: 8 })),
});
type FormData = z.infer<typeof schema>;

// 2. useForm com onSubmit + reValidateMode onChange
const form = useForm<FormData>({
  resolver: zodResolver(schema),
  mode: 'onSubmit',
  reValidateMode: 'onChange',
  defaultValues: { name: '', email: '', password: '' },
});

// 3. useFormErrorHandler para mapear erros da API para campos
const { handleError } = useFormErrorHandler({
  form,
  fieldMap: {
    'Email already exists': 'email', // fallback se backend nao enviar field
    'Name already exists': 'name',
  },
});

// 4. Password watch para checklist em tempo real
const password = form.watch('password');

// 5. Submit handler
const onSubmit = async (data: FormData) => {
  if (!isPasswordStrong(data.password)) {
    form.setError('password', {
      type: 'manual',
      message: t('auth.passwordNotStrong'),
    });
    return;
  }
  try {
    await createEntity(data);
  } catch (error) {
    handleError(error); // mapeia para campos ou faz toast
  }
};

// 6. JSX — campo com FormErrorIcon (NUNCA mensagem inline)
<form onSubmit={form.handleSubmit(onSubmit)}>
  <div className="space-y-2">
    <Label htmlFor="email">Email</Label>
    <div className="relative">
      <Input
        id="email"
        type="email"
        placeholder="joao@exemplo.com"
        aria-invalid={!!form.formState.errors.email}
        {...form.register('email')}
      />
      {form.formState.errors.email && (
        <FormErrorIcon message={form.formState.errors.email.message ?? ''} />
      )}
    </div>
  </div>

  {/* Campo de senha com PasswordStrengthChecklist */}
  <div className="space-y-2">
    <Label htmlFor="password">Senha</Label>
    <div className="relative">
      <Input
        id="password"
        type="password"
        aria-invalid={!!form.formState.errors.password}
        {...form.register('password')}
      />
      {form.formState.errors.password && (
        <FormErrorIcon message={form.formState.errors.password.message ?? ''} />
      )}
    </div>
    <PasswordStrengthChecklist password={password} />
  </div>
</form>;
```

#### Exemplo: validacao de unicidade on blur

```tsx
import { useUniquenessCheck } from '@/hooks/use-uniqueness-check';

const { onBlur: checkEmail } = useUniquenessCheck({
  form,
  field: 'email',
  fieldLabel: 'E-mail',
  checkFn: async value => {
    const res = await usersService.checkEmail(value);
    return res.available; // true = disponivel, false = ja em uso
  },
});

<Input
  {...form.register('email')}
  onBlur={e => {
    form.register('email').onBlur(e); // react-hook-form onBlur
    checkEmail(); // uniqueness check
  }}
/>;
```

#### Regras de error handling

1. **NUNCA usar toast para erros de campo** — toast so para erros sem campo (rede, servidor, auth)
2. **NUNCA usar mensagem inline abaixo do campo** — usa `FormErrorIcon` (tooltip) para nao empurrar layout
3. **SEMPRE usar `aria-invalid`** no Input quando ha erro — ativa borda rose via CSS
4. **SEMPRE usar `useFormErrorHandler`** no `onError` de mutations — mapeia erros da API para campos
5. **SEMPRE usar `PasswordStrengthChecklist`** em campos de senha (criar usuario, registro, reset password)
6. **SEMPRE usar `t()` do i18n** para mensagens de erro — nunca hardcoded (prepara para internacionalizacao)
7. **Campos unicos** (CNPJ, CPF, email, username, nome) devem usar `useUniquenessCheck` on blur
8. **Error banners** em paginas auth usam `rose` (nao red): `bg-rose-500/10 border-rose-500/30 text-rose-600`

#### Componentes disponiveis

| Componente                  | Arquivo                                             | Funcao                                                                   |
| --------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------ |
| `FormErrorIcon`             | `src/components/ui/form-error-icon.tsx`             | Icone ⚠ com tooltip no campo                                            |
| `SectionErrorBadge`         | `src/components/ui/section-error-badge.tsx`         | Badge de contagem de erros na secao                                      |
| `FormErrorReportModal`      | `src/components/ui/form-error-report-modal.tsx`     | Modal com lista clicavel de todos os erros                               |
| `PasswordStrengthChecklist` | `src/components/ui/password-strength-checklist.tsx` | Checklist de criterios de senha em tempo real                            |
| `useFormErrorHandler`       | `src/hooks/use-form-error-handler.ts`               | Mapeia erro API → campo do form                                          |
| `useUniquenessCheck`        | `src/hooks/use-uniqueness-check.ts`                 | Validacao de unicidade on blur com debounce                              |
| `useGoToField`              | `src/hooks/use-go-to-field.ts`                      | Scroll + highlight ao clicar no relatorio                                |
| `t()`                       | `src/lib/i18n/index.ts`                             | Traducao com interpolacao: `t('validation.required', { field: 'Nome' })` |

#### Referencia de implementacao

O modal `CreateModal` de users e a referencia canonica:
`src/app/(dashboard)/(modules)/admin/(entities)/users/src/modals/create-modal.tsx`

---

### Quando usar cada abordagem

**Use TanStack Form** quando:

- O formulário é de autenticação (login, registro, recuperação de senha, perfil)
- Não há schema Zod e a validação é simples (verificações no submit)

**Use react-hook-form + Zod** quando:

- O formulário precisa de validação rigorosa por campo com mensagens inline
- O schema pode ser expresso staticamente em Zod
- Quer usar os componentes shadcn/ui `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`

**Use useState manual** quando:

- Há lógica de negócio complexa que não cabe em schema (cálculos derivados, estados interdependentes)
- O formulário tem campos condicionais com lógica imperativa
- O formulário é pequeno e inline (cria entidade rápido dentro de Popover/Dialog)

**Use EntityForm genérico** quando:

- O módulo já tem uma `EntityConfig` com `form` configurado
- O formulário é CRUD padrão sem lógica especial
- O modal de "Edição Rápida" precisa ser implementado com mínimo de código

### Armadilhas comuns

1. **Não omitir `type="button"` em botões dentro de formulários.** Todo botão que não seja submit deve ter `type="button"`, ou o navegador tratará como submit.

2. **Não usar `e.preventDefault()` no TanStack Form.** O TanStack Form usa `form.handleSubmit()` — o formulário HTML deve chamar `e.preventDefault(); form.handleSubmit();` ou `e.stopPropagation()` para evitar comportamento padrão.

3. **Não armazenar CNPJ formatado no banco.** Ao enviar para a API, sempre strip de dígitos não numéricos: `cnpj.replace(/\D/g, '')`. O backend valida e armazena sem máscara.

4. **`MoneyInput` recebe `number`, não `string`.** Não converter para string antes de passar ao componente — o `onChange` retorna `number`.

5. **`updateSchema = createSchema.partial()` é o padrão.** Nunca duplicar campos de schema entre criar e atualizar — use `.partial()`.

6. **Erros da API devem passar por `translateError()`.** Nunca exibir mensagens técnicas em inglês diretamente ao usuário.

7. **Campos de data retornam `string` (ISO), não `Date`.** JSON serialization transforma datas em strings. Use `string` nos tipos de formulário, não `Date`.

8. **Não usar EntityForm legado (`src/components/shared/forms/`)** para novas implementações. Ele não tem integração com react-hook-form e usa tipo `EntityFormConfig` diferente do canônico em `src/core/types/form.types.ts`.

## Audit History

| Date | Dimension | Score | Report           |
| ---- | --------- | ----- | ---------------- |
| —    | —         | —     | Nenhum registro. |
