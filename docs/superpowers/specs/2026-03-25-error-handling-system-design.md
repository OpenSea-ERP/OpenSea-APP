# Error Handling System — Design Spec

**Data:** 2026-03-25
**Status:** Aprovado
**Escopo:** Infraestrutura + Migração Admin (piloto)

---

## 1. Visao Geral

Sistema de error handling com tres camadas de feedback visual, preparado para internacionalizacao (i18n), sem quebrar formularios existentes.

### Camadas de Feedback

| Camada    | Componente              | O que mostra                                           | Quando                                           |
| --------- | ----------------------- | ------------------------------------------------------ | ------------------------------------------------ |
| Campo     | `FormErrorIcon`         | Borda rose + icone ⚠ a direita + tooltip com mensagem | Erros de validacao vinculados a um campo         |
| Secao     | `SectionErrorBadge`     | Badge de contagem no header da `CollapsibleSection`    | Quando ha erros em campos daquela secao          |
| Relatorio | `FormErrorReportModal`  | Lista completa de erros, clicavel → scroll + highlight | Ao clicar no badge da secao                      |
| Toast     | `Toaster` (redesenhado) | Notificacao solida com degrade                         | Erros sem campo: rede, servidor, auth, permissao |

### Estrategia de Validacao

- **Submit** → validacao completa (primeira vez) via `mode: 'onSubmit'`
- **Revalidacao** → `reValidateMode: 'onChange'` (campo corrigido limpa erro em tempo real)
- **Campos unicos** → On blur com debounce (300ms): CNPJ, CPF, nome, SKU, email, username
- **Senha** → Checklist em tempo real (on change) com criterios visiveis

### Mapeamento API → Campo

- Backend inclui `field` na resposta de erro (rollout gradual via `BadRequestError`)
- Frontend tem `useFormErrorHandler` hook com fallback de mapeamento local
- Erros sem `field` vao para toast

---

## 2. Componentes

### 2.1 FormErrorIcon

Icone de exclamacao (AlertCircle) posicionado absolutamente a direita do input.
Ao hover (desktop) ou tap (mobile), abre tooltip/popover com a mensagem de erro.

**Comportamento:**

- Aparece apenas quando o campo tem erro
- Nao ocupa espaco no layout (position absolute dentro do wrapper)
- Input recebe `aria-invalid` (borda rose ja existe via CSS)
- Tooltip usa Radix Tooltip (ja no projeto) com `onClick` fallback para mobile
- Cor: rose-500

**Mudanca no FormFieldWrapper:**

- Remover o bloco de erro inline (texto abaixo do campo)
- Adicionar `FormErrorIcon` dentro do `div.relative` que ja envolve o campo
- Input recebe `pr-10` quando tem erro (espaco para o icone)

### 2.2 SectionErrorBadge

Badge numerico exibido no header da `CollapsibleSection`.

**Comportamento:**

- Mostra contagem de erros nos campos daquela secao
- Cor: bg-rose-500 text-white, pill shape (rounded-full)
- Clicavel → abre `FormErrorReportModal` filtrado para aquela secao
- Animacao: scale-in suave ao aparecer
- Some quando contagem chega a zero

### 2.3 FormErrorReportModal

Modal com lista de todos os erros do formulario.

**Comportamento:**

- Agrupado por secao (com icone da secao)
- Cada erro mostra: nome do campo + mensagem de erro
- Cada erro e clicavel → fecha modal, faz scroll ate o campo, pulsa borda rose por 2s
- Header mostra contagem total
- Acessivel via badge da secao ou botao global (quando houver erros)

### 2.4 PasswordStrengthChecklist

Checklist de criterios de senha exibido abaixo de campos de senha.

**Criterios:**

- Minimo 8 caracteres
- Pelo menos 1 letra maiuscula
- Pelo menos 1 letra minuscula
- Pelo menos 1 numero
- Pelo menos 1 caractere especial

**Visual:**

- Cada criterio: icone check (verde) ou X (cinza) + texto
- Atualiza em tempo real (on change)
- Sempre visivel quando o campo de senha esta presente (nao empurra layout porque e previsto)

### 2.5 Toaster (Redesenhado)

Refatoracao visual do componente Sonner.

**Visual:**

- Fundo solido (nao translucido)
- Degrade suave e maduro (nao bootstrap)
- Error: degrade rose-600 → rose-700 com borda rose-500
- Success: degrade emerald-600 → emerald-700 com borda emerald-500
- Warning: degrade amber-600 → amber-700 com borda amber-500
- Info: degrade sky-600 → sky-700 com borda sky-500
- Texto branco, icone branco
- Sombra suave (`shadow-lg`)
- Border-radius consistente com design system
- Dual theme (light + dark)

---

## 3. Hooks

### 3.1 useFormErrorHandler

Hook que processa erros de API e aplica nos campos do formulario.

```typescript
function useFormErrorHandler(
  form: UseFormReturn,
  options?: {
    fieldMap?: Record<string, string>; // fallback: mensagem API → campo
    onUnmappedError?: (error: ApiError) => void; // default: toast
  }
);
```

**Comportamento:**

1. Recebe erro de mutation `onError`
2. Se `ApiError` com `fieldErrors` → aplica `form.setError()` em cada campo
3. Se `ApiError` com `field` no response → aplica `form.setError()` no campo
4. Se tem `fieldMap` e a mensagem bate → aplica no campo mapeado
5. Caso contrario → chama `onUnmappedError` (default: toast com `translateError`)

### 3.2 useUniquenessCheck

Hook para validacao de unicidade on blur com debounce.

```typescript
function useUniquenessCheck(options: {
  field: string;
  checkFn: (value: string) => Promise<boolean>; // true = disponivel
  debounceMs?: number; // default: 300
  form: UseFormReturn;
});
```

**Comportamento:**

1. Registra listener on blur no campo
2. Debounce de 300ms apos blur
3. Chama `checkFn` com valor atual
4. Se indisponivel → `form.setError(field, { message: '...' })`
5. Se disponivel → `form.clearErrors(field)`
6. Mostra loading indicator no icone enquanto verifica

---

## 4. Sistema de i18n

### 4.1 Arquitetura

Mensagens de erro centralizadas em arquivos de traducao, nao hardcoded nos componentes.

**Estrutura:**

```
src/lib/i18n/
  index.ts              # t() function + locale management
  locales/
    pt-BR.ts            # Portugues (default)
    en.ts               # Ingles (futuro)
```

### 4.2 Formato das Chaves

```typescript
// Categorias de mensagens de erro
const messages = {
  validation: {
    required: '{field} e obrigatorio',
    minLength: '{field} deve ter no minimo {min} caracteres',
    maxLength: '{field} deve ter no maximo {max} caracteres',
    email: 'Formato de e-mail invalido',
    cpf: 'CPF invalido',
    cnpj: 'CNPJ invalido',
    phone: 'Formato de telefone invalido',
    cep: 'CEP invalido',
    url: 'URL invalida',
    unique: '{field} ja esta em uso',
    passwordStrength: 'A senha nao atende aos requisitos',
  },
  password: {
    minLength: 'Minimo 8 caracteres',
    uppercase: 'Pelo menos 1 letra maiuscula',
    lowercase: 'Pelo menos 1 letra minuscula',
    number: 'Pelo menos 1 numero',
    special: 'Pelo menos 1 caractere especial',
  },
  api: {
    network: 'Falha na conexao com o servidor',
    timeout: 'A requisicao demorou muito para responder',
    server: 'Erro interno do servidor',
    unauthorized: 'Sessao expirada. Faca login novamente.',
    forbidden: 'Voce nao tem permissao para esta acao',
    conflict: '{field} ja existe',
    rateLimit: 'Muitas requisicoes. Aguarde um momento.',
    unknown: 'Ocorreu um erro inesperado',
  },
  form: {
    errorsFound: '{count} erro(s) encontrado(s)',
    errorsInSection: '{count} erro(s) nesta secao',
    fixErrors: 'Corrija os erros antes de continuar',
  },
};
```

### 4.3 Funcao t()

```typescript
function t(key: string, params?: Record<string, string | number>): string;
// Exemplo: t('validation.required', { field: 'Nome' }) → 'Nome e obrigatorio'
```

---

## 5. Migração — Compatibilidade

### Principio: Zero Breaking Changes

1. `FormFieldWrapper` atualizado mostra erro via tooltip (novo) em vez de inline (antigo)
2. Campos que usam `aria-invalid` ja recebem borda rose automaticamente (CSS existente)
3. Formularios que nao passam `error` continuam funcionando identicamente
4. `EntityForm` + `EntityFormField` propagam erros como antes, apenas o VISUAL muda
5. Formularios manuais (sem EntityForm) ganham o sistema via `useFormErrorHandler`

### Ordem de Migracao

1. **Admin** (piloto) — Companies, Users, Permission Groups, Teams
2. **HR** — Employees, Departments, Positions, Work Schedules, etc.
3. **Finance** — Payable, Receivable, Bank Accounts, Categories, etc.
4. **Sales** — Customers, Orders, Contacts, Coupons, etc.
5. **Stock** — Products, Variants, Templates, Locations, etc.

---

## 6. Backend — Campo `field` no Erro

### Mudanca no BadRequestError

```typescript
class BadRequestError extends Error {
  code?: ErrorCode;
  field?: string; // NOVO: campo que causou o erro
}
```

### Resposta de Erro Atualizada

```json
{
  "code": "CONFLICT",
  "message": "CNPJ already exists",
  "field": "cnpj",
  "requestId": "..."
}
```

### Rollout Gradual

- Fase 1 (Admin): Adicionar `field` nos erros de unique constraint (CNPJ, email, username)
- Fase 2+: Propagar para demais modulos conforme migrados

---

## 7. Arquivos a Criar/Modificar

### Novos Arquivos

| Arquivo                                             | Tipo                           |
| --------------------------------------------------- | ------------------------------ |
| `src/lib/i18n/index.ts`                             | i18n engine                    |
| `src/lib/i18n/locales/pt-BR.ts`                     | Traducoes PT-BR                |
| `src/components/ui/form-error-icon.tsx`             | Icone de erro com tooltip      |
| `src/components/ui/section-error-badge.tsx`         | Badge de erros na secao        |
| `src/components/ui/form-error-report-modal.tsx`     | Modal de relatorio de erros    |
| `src/components/ui/password-strength-checklist.tsx` | Checklist de senha             |
| `src/hooks/use-form-error-handler.ts`               | Hook de mapeamento API→campo   |
| `src/hooks/use-uniqueness-check.ts`                 | Hook de validacao de unicidade |

### Arquivos Modificados

| Arquivo                                               | Mudanca                          |
| ----------------------------------------------------- | -------------------------------- |
| `src/components/ui/sonner.tsx`                        | Redesign visual (degrade solido) |
| `src/core/forms/components/form-field-wrapper.tsx`    | Erro via tooltip, nao inline     |
| `src/core/forms/components/entity-form.tsx`           | Integrar error handler           |
| `src/core/forms/components/entity-form-validation.ts` | Usar i18n                        |
| `src/lib/error-messages.ts`                           | Migrar para i18n                 |
| Admin module forms                                    | Aplicar novo sistema             |
