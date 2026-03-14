# Label Studio - Sistema de Criação de Etiquetas

## Visão Geral

O **Label Studio** é um editor WYSIWYG especializado para criação de etiquetas de produtos, inventário, vestuário e uso geral. O sistema permite posicionamento livre de elementos com snap inteligente, campos dinâmicos com lógica condicional, e tabelas com mesclagem de células.

---

## Histórico de Revisões

| Data | Versão | Alterações |
|------|--------|------------|
| 2026-02-05 | 1.1 | **Correções de consistência com o projeto:** |
| | | - DataPaths atualizados para inglês (ex: `product.name`, `variant.sku`, `item.batchNumber`) |
| | | - Removidos campos inexistentes (`item.serialNumber`, `item.trackingCode`, `item.authCode`) |
| | | - Corrigidos paths de localização (`item.bin.zone.name` em vez de `item.zone.name`) |
| | | - Adicionados campos existentes (`item.fullCode`, `item.barcode`, `item.eanCode`) |
| | | - Estrutura de pastas alinhada com `src/core/print-queue/` existente |
| | | - Dependências atualizadas: `react-to-print` (já instalado) em vez de `print-js` |
| | | - Zustand marcado como única dependência a instalar |
| 2026-02-05 | 1.0 | Versão inicial do documento |

---

## Índice

1. [Conceitos Fundamentais](#1-conceitos-fundamentais)
2. [Interface do Editor](#2-interface-do-editor)
3. [Sistema de Canvas](#3-sistema-de-canvas)
4. [Elementos Disponíveis](#4-elementos-disponíveis)
5. [Campos Dinâmicos](#5-campos-dinâmicos)
6. [Sistema de Tabelas](#6-sistema-de-tabelas)
7. [Códigos de Barras e QR Codes](#7-códigos-de-barras-e-qr-codes)
8. [Sistema de Snap e Alinhamento](#8-sistema-de-snap-e-alinhamento)
9. [Propriedades e Estilos](#9-propriedades-e-estilos)
10. [Templates e Presets](#10-templates-e-presets)
11. [Exportação e Impressão](#11-exportação-e-impressão)
12. [Arquitetura Técnica](#12-arquitetura-técnica)
13. [Plano de Implementação](#13-plano-de-implementação)

---

## 1. Conceitos Fundamentais

### 1.1 Filosofia de Design

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   "Liberdade com Inteligência"                                 │
│                                                                 │
│   • Posicionamento LIVRE - arraste para qualquer lugar         │
│   • Snap INTELIGENTE - alinha automaticamente quando próximo   │
│   • Campos DINÂMICOS - lógica sem código                       │
│   • Tabelas INTUITIVAS - arraste e solte, mesclagem fácil     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Tipos de Etiquetas Suportadas

| Tipo | Tamanho Típico | Uso Principal |
|------|----------------|---------------|
| Vestuário | 30×50mm, 40×60mm | Roupas, têxteis, composição |
| Produto | 50×30mm, 60×40mm | SKU, preço, código de barras |
| Inventário | 60×40mm, 100×60mm | Localização, QR code, lote |
| Prateleira | 80×30mm, 100×50mm | Preço, descrição curta |
| Joalheria | 22×10mm, 30×15mm | Código pequeno, preço |
| Envio | 100×70mm, 150×100mm | Destinatário, código rastreio |
| Personalizada | Qualquer | Definido pelo usuário |

### 1.3 Unidades de Medida

- **Canvas**: Milímetros (mm) - padrão da indústria de etiquetas
- **Fontes**: Pontos (pt) - padrão tipográfico
- **Conversão interna**: 1mm ≈ 3.78px (96 DPI)

---

## 2. Interface do Editor

### 2.1 Layout Geral

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [← Voltar]  Nome do Template: [Etiqueta Vestuário____]  [Salvar] [Imprimir]│
├────────────────┬────────────────────────────────────────┬───────────────────┤
│                │                                        │                   │
│   ELEMENTOS    │            CANVAS                      │   PROPRIEDADES    │
│                │                                        │                   │
│  ┌──────────┐  │    ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐        │  ┌─────────────┐  │
│  │ Campos   │  │    ╎                        ╎        │  │ Elemento:   │  │
│  │ ▸ Produto│  │    ╎    [Logo]              ╎        │  │ Campo Texto │  │
│  │ ▸ Variante│ │    ╎                        ╎        │  ├─────────────┤  │
│  │ ▸ Item   │  │    ╎  ┌─────────────────┐  ╎        │  │ Dado:       │  │
│  │ ▸ Local  │  │    ╎  │ Nome do Produto │  ╎        │  │ [Produto ▾] │  │
│  └──────────┘  │    ╎  └─────────────────┘  ╎        │  │             │  │
│                │    ╎                        ╎        │  │ ☑ Label     │  │
│  ┌──────────┐  │    ╎  Composição: 100%     ╎        │  │ [Produto:]  │  │
│  │ Layout   │  │    ╎  Algodão              ╎        │  │             │  │
│  │ • Tabela │  │    ╎                        ╎        │  │ Tamanho:    │  │
│  │ • Linha  │  │    ╎  |||||||||||||||||||  ╎        │  │ ○S ●M ○G ○XG│  │
│  │ • Caixa  │  │    ╎  7891234567890        ╎        │  │             │  │
│  └──────────┘  │    ╎                        ╎        │  │ Estilo:     │  │
│                │    └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘        │  │ B I U [Cor] │  │
│  ┌──────────┐  │                                      │  │             │  │
│  │ Códigos  │  │    [Zoom: 150%▾] [Grade ☐]          │  │ Alinhamento:│  │
│  │ • Barcode│  │    Tamanho: 30mm × 50mm              │  │ [◀][▬][▶]  │  │
│  │ • QR Code│  │                                      │  └─────────────┘  │
│  └──────────┘  │                                      │                   │
│                │                                      │                   │
│  ┌──────────┐  │                                      │  ┌─────────────┐  │
│  │ Elementos│  │                                      │  │ CAMADAS     │  │
│  │ • Texto  │  │                                      │  │             │  │
│  │ • Imagem │  │                                      │  │ ▪ Logo      │  │
│  │ • Ícone  │  │                                      │  │ ▪ Nome      │  │
│  │ • Seta   │  │                                      │  │ ▪ Composição│  │
│  │ • Forma  │  │                                      │  │ ▪ Barcode   │  │
│  └──────────┘  │                                      │  └─────────────┘  │
│                │                                      │                   │
├────────────────┴────────────────────────────────────────┴───────────────────┤
│  [Desfazer] [Refazer] │ Elemento: Campo "Nome" │ X: 5mm Y: 10mm W: 40mm    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Barra de Ferramentas Superior

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [←] [Nome do Template_______] │ Tamanho: [30]×[50]mm │ [Salvar▾] [Visualizar]│
└─────────────────────────────────────────────────────────────────────────────┘

Opções do botão Salvar:
┌──────────────────┐
│ Salvar           │
│ Salvar como...   │
│ Exportar PNG     │
│ Exportar PDF     │
└──────────────────┘
```

### 2.3 Painel de Elementos (Esquerda)

```
┌─ ELEMENTOS ─────────────────┐
│                             │
│ 🔍 Buscar elemento...       │
│                             │
│ ▼ CAMPOS DE DADOS           │
│   ├─ ▸ Produto              │
│   │    • Nome               │
│   │    • Código             │
│   │    • Fabricante         │
│   │    • Categoria          │
│   ├─ ▸ Variante             │
│   │    • Nome               │
│   │    • SKU                │
│   │    • Referência         │
│   │    • Código de Barras   │
│   │    • Preço              │
│   ├─ ▸ Item                 │
│   │    • Código Único       │
│   │    • Quantidade         │
│   │    • Lote               │
│   │    • Data Entrada       │
│   │    • Data Validade      │
│   ├─ ▸ Localização          │
│   │    • Endereço           │
│   │    • Armazém            │
│   │    • Zona               │
│   └─ ▸ Atributos            │
│        • Composição         │
│        • Cor                │
│        • Tamanho            │
│        • (dinâmico...)      │
│                             │
│ ▼ LAYOUT                    │
│   • Tabela                  │
│   • Linha Horizontal        │
│   • Linha Vertical          │
│   • Caixa/Retângulo         │
│   • Espaçador               │
│                             │
│ ▼ CÓDIGOS                   │
│   • Código de Barras        │
│   • QR Code                 │
│                             │
│ ▼ ELEMENTOS                 │
│   • Texto Livre             │
│   • Imagem/Logo             │
│   • Ícone                   │
│   • Seta                    │
│   • Forma (círculo, etc)    │
│                             │
│ ▼ CAMPO ESPECIAL            │
│   • Campo Composto          │
│   • Campo Condicional       │
│   • Campo Calculado         │
│                             │
└─────────────────────────────┘
```

### 2.4 Painel de Propriedades (Direita)

O painel muda dinamicamente baseado no elemento selecionado.

#### Para Campo de Dados:
```
┌─ PROPRIEDADES ──────────────┐
│                             │
│ Tipo: Campo de Dados        │
│ ─────────────────────────── │
│                             │
│ DADO                        │
│ ┌─────────────────────────┐ │
│ │ Produto > Nome        ▾ │ │
│ └─────────────────────────┘ │
│                             │
│ ─────────────────────────── │
│                             │
│ LABEL                       │
│ ☑ Mostrar label             │
│ ┌─────────────────────────┐ │
│ │ Produto:                │ │
│ └─────────────────────────┘ │
│ Posição: ○ Acima ○ Esquerda │
│                             │
│ ─────────────────────────── │
│                             │
│ TIPOGRAFIA                  │
│                             │
│ Fonte: [Arial          ▾]   │
│                             │
│ Tamanho do Valor:           │
│ [○ 8] [○ 10] [● 12] [○ 14]  │
│ [○ 16] [○ 18] [○ 24] [___]  │
│                             │
│ Tamanho da Label:           │
│ [● 8] [○ 10] [○ 12]         │
│                             │
│ Estilo: [B] [I] [U] [S]     │
│                             │
│ Cor texto: [■ #000000]      │
│ Cor label: [■ #666666]      │
│                             │
│ ─────────────────────────── │
│                             │
│ ALINHAMENTO                 │
│ [◀ Esq] [▬ Centro] [▶ Dir]  │
│                             │
│ ─────────────────────────── │
│                             │
│ POSIÇÃO E TAMANHO           │
│ X: [5___] mm  Y: [10__] mm  │
│ W: [40__] mm  H: [auto_]    │
│                             │
│ ─────────────────────────── │
│                             │
│ AVANÇADO                    │
│ ▸ Rotação: [0°]             │
│ ▸ Opacidade: [100%]         │
│ ▸ Borda: [Nenhuma ▾]        │
│                             │
└─────────────────────────────┘
```

#### Para Tabela:
```
┌─ PROPRIEDADES ──────────────┐
│                             │
│ Tipo: Tabela                │
│ ─────────────────────────── │
│                             │
│ ESTRUTURA                   │
│ Colunas: [2] [+] [-]        │
│ Linhas:  [3] [+] [-]        │
│                             │
│ ─────────────────────────── │
│                             │
│ BORDAS                      │
│ Estilo: [Sólida ▾]          │
│ Espessura: [1px ▾]          │
│ Cor: [■ #000000]            │
│                             │
│ Aplicar em:                 │
│ ☑ Externa                   │
│ ☑ Interna horizontal        │
│ ☑ Interna vertical          │
│                             │
│ ─────────────────────────── │
│                             │
│ CÉLULAS                     │
│ Padding: [2] mm             │
│                             │
│ Célula selecionada:         │
│ [Mesclar →] [Mesclar ↓]     │
│ [Dividir]                   │
│                             │
│ ─────────────────────────── │
│                             │
│ POSIÇÃO E TAMANHO           │
│ X: [5___] mm  Y: [20__] mm  │
│ W: [50__] mm  H: [auto_]    │
│                             │
└─────────────────────────────┘
```

---

## 3. Sistema de Canvas

### 3.1 Configuração do Canvas

```
┌─ CONFIGURAR ETIQUETA ───────────────────────────────────────┐
│                                                             │
│  TAMANHO                                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Largura: [30___] mm    Altura: [50___] mm          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  PRESETS COMUNS                                             │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐         │
│  │30×50│ │40×60│ │50×30│ │60×40│ │80×50│ │100× │         │
│  │Vest.│ │Vest.│ │Prod.│ │Prod.│ │Prat.│ │100  │         │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘         │
│                                                             │
│  ORIENTAÇÃO                                                 │
│  [▯ Retrato]  [▭ Paisagem]                                 │
│                                                             │
│  MARGENS (opcional)                                         │
│  ☐ Usar margens de segurança                               │
│  Superior: [2] mm   Inferior: [2] mm                       │
│  Esquerda: [2] mm   Direita:  [2] mm                       │
│                                                             │
│  COR DE FUNDO                                               │
│  ○ Branco (padrão)                                         │
│  ○ Transparente                                            │
│  ○ Personalizado: [■ ______]                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Visualização do Canvas

```
      ↓ Régua horizontal (mm)
    0    5    10   15   20   25   30
    |····|····|····|····|····|····|
   ┌──────────────────────────────────┐
 0-│░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
   │░┌────────────────────────────┐░░░│
 5-│░│                            │░░░│ ← Área da etiqueta (branco)
   │░│      [Elemento 1]          │░░░│
10-│░│                            │░░░│
   │░│   ┌──────────────────┐     │░░░│
15-│░│   │   [Elemento 2]   │     │░░░│
   │░│   └──────────────────┘     │░░░│
20-│░│                            │░░░│
   │░│      |||||||||||||||       │░░░│
25-│░│      7891234567890         │░░░│
   │░│                            │░░░│
30-│░└────────────────────────────┘░░░│
   │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│ ← Área de trabalho (cinza)
   └──────────────────────────────────┘
   ↑
   Régua vertical (mm)

░ = Área fora da etiqueta (cinza)
□ = Área da etiqueta (branco)
```

### 3.3 Controles de Zoom

```
Níveis de zoom disponíveis:
[50%] [75%] [100%] [150%] [200%] [300%] [Ajustar]

Atalhos:
• Ctrl + Scroll = Zoom in/out
• Ctrl + 0 = Ajustar à tela
• Ctrl + 1 = 100%
```

### 3.4 Guias e Réguas

```
Opções de visualização:
☑ Mostrar réguas
☑ Mostrar guias de snap
☐ Mostrar grid (espaçamento: [5] mm)
☑ Snap para elementos
☑ Snap para bordas
☑ Snap para centro
```

---

## 4. Elementos Disponíveis

### 4.1 Campos de Dados

Campos vinculados a dados do sistema (produto, variante, item, etc.)

```
┌─ Campo de Dados ────────────────────────────────────────────┐
│                                                             │
│  Estrutura visual:                                          │
│                                                             │
│  SEM LABEL:              COM LABEL (acima):                 │
│  ┌─────────────────┐     ┌─────────────────┐               │
│  │ Camiseta Básica │     │ Produto:        │  ← label      │
│  └─────────────────┘     │ Camiseta Básica │  ← valor      │
│                          └─────────────────┘               │
│                                                             │
│  COM LABEL (esquerda):                                      │
│  ┌─────────────────────────────┐                           │
│  │ Produto: Camiseta Básica    │                           │
│  └─────────────────────────────┘                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Categorias de Campos:

**Produto:**
| Campo | Data Path | Exemplo |
|-------|-----------|---------|
| Nome | `product.name` | Camiseta Básica |
| Código | `product.code` | PROD-001 |
| Fabricante | `product.manufacturer.name` | Hering |
| Categoria | `product.category.name` | Vestuário |
| Descrição | `product.description` | Camiseta 100% algodão... |

**Variante:**
| Campo | Data Path | Exemplo |
|-------|-----------|---------|
| Nome | `variant.name` | Azul - M |
| SKU | `variant.sku` | CAM-AZU-M |
| Referência | `variant.reference` | REF-2024-001 |
| Código de Barras | `variant.barcode` | 7891234567890 |
| Preço | `variant.price` | 49.90 |
| Preço Formatado | `variant.priceFormatted` | R$ 49,90 |

**Item:**
| Campo | Data Path | Exemplo |
|-------|-----------|---------|
| Código Único | `item.uniqueCode` | ITM-2024-00001 |
| Código Completo | `item.fullCode` | 001.001.0001.001-00001 |
| Quantidade | `item.currentQuantity` | 10 |
| Lote | `item.batchNumber` | LOTE-2024-01 |
| Data Entrada | `item.entryDate` | 14/01/2024 |
| Data Validade | `item.expiryDate` | 14/01/2025 |
| Barcode (Code128) | `item.barcode` | 001001000100100001 |
| EAN-13 | `item.eanCode` | 0010010001001 |

**Localização:**
| Campo | Data Path | Exemplo |
|-------|-----------|---------|
| Endereço Completo | `item.resolvedAddress` | A-01-02-03 |
| Último Endereço | `item.lastKnownAddress` | A-01-02-03 |
| Armazém | `item.bin.zone.warehouse.name` | Armazém Principal |
| Zona | `item.bin.zone.name` | Zona A |
| Corredor | `item.bin.aisle` | 01 |
| Prateleira | `item.bin.shelf` | 02 |
| Posição | `item.bin.position` | 03 |

**Atributos (Dinâmicos):**
| Campo | Data Path | Exemplo |
|-------|-----------|---------|
| Composição | `variant.attributes.composicao` | 100% Algodão |
| Cor | `variant.attributes.cor` | Azul Marinho |
| Tamanho | `variant.attributes.tamanho` | M |
| Gramatura | `variant.attributes.gramatura` | 180g/m² |
| (Qualquer atributo) | `variant.attributes.{nome}` | (valor) |

### 4.2 Texto Livre

Texto estático que não muda com os dados.

```
┌─ Texto Livre ───────────────────────────────────────────────┐
│                                                             │
│  Uso: Títulos, avisos, informações fixas                    │
│                                                             │
│  Exemplos:                                                  │
│  • "INDÚSTRIA BRASILEIRA"                                   │
│  • "Lavar à mão"                                            │
│  • "Produto importado"                                      │
│  • "www.minhaloja.com.br"                                   │
│                                                             │
│  Propriedades:                                              │
│  • Texto multi-linha                                        │
│  • Formatação rica (negrito, itálico, cores)               │
│  • Alinhamento                                              │
│  • Rotação                                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 Imagem/Logo

```
┌─ Imagem ────────────────────────────────────────────────────┐
│                                                             │
│  Fontes de imagem:                                          │
│                                                             │
│  ○ Upload de arquivo (PNG, JPG, SVG)                       │
│  ○ URL externa                                              │
│  ○ Logo do tenant (configurado no sistema)                 │
│  ○ Logo do fabricante                                       │
│                                                             │
│  ┌─────────────────────────────────────┐                   │
│  │                                     │                   │
│  │         [Arraste uma imagem         │                   │
│  │          ou clique para             │                   │
│  │          selecionar]                │                   │
│  │                                     │                   │
│  └─────────────────────────────────────┘                   │
│                                                             │
│  Propriedades:                                              │
│  • Tamanho (W × H) com proporção travada                   │
│  • Opacidade                                                │
│  • Borda/moldura                                            │
│  • Rotação                                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.4 Ícones

Biblioteca de ícones vetoriais para uso em etiquetas.

```
┌─ Ícones ────────────────────────────────────────────────────┐
│                                                             │
│  CATEGORIAS:                                                │
│                                                             │
│  ▼ Conservação/Lavagem                                      │
│    🌡️  Temperatura      🧺 Lavar máquina    ✋ Lavar mão    │
│    🚫 Não lavar        ⬜ Alvejante ok     ⬛ Não alvejar  │
│    🔥 Passar quente    ❄️ Passar frio      🚫 Não passar   │
│    ⭕ Secar normal     🚫 Não secar        💨 Ventilar     │
│                                                             │
│  ▼ Avisos/Alertas                                           │
│    ⚠️ Atenção          ⛔ Proibido         ✓ Permitido     │
│    ♻️ Reciclável       🌱 Orgânico         🔒 Seguro       │
│                                                             │
│  ▼ Setas/Direção                                            │
│    ↑ ↓ ← → ↗ ↘ ↙ ↖                                        │
│    ⬆ ⬇ ⬅ ➡                                                │
│                                                             │
│  ▼ Símbolos Gerais                                          │
│    ★ Estrela           ● Círculo           ■ Quadrado      │
│    ◆ Losango           ▲ Triângulo         ♦ Diamante      │
│                                                             │
│  ▼ Certificações                                            │
│    🏭 Fabricado em BR   📦 Importado        🌍 Global       │
│                                                             │
│  Propriedades:                                              │
│  • Tamanho                                                  │
│  • Cor                                                      │
│  • Rotação                                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.5 Setas

```
┌─ Setas ─────────────────────────────────────────────────────┐
│                                                             │
│  Tipos de seta:                                             │
│                                                             │
│  Simples:    →  ←  ↑  ↓                                    │
│  Dupla:      ↔  ↕                                          │
│  Curva:      ↩  ↪  ⤴  ⤵                                    │
│  Grossa:     ➔  ➜  ➡  ⬅                                    │
│                                                             │
│  Propriedades:                                              │
│  • Comprimento                                              │
│  • Espessura da linha                                       │
│  • Cor                                                      │
│  • Estilo da ponta (preenchida, vazia, sem ponta)          │
│  • Rotação livre (0-360°)                                   │
│                                                             │
│  Uso comum:                                                 │
│  • Indicar direção de leitura                              │
│  • Apontar para códigos                                     │
│  • Fluxos e processos                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.6 Formas Básicas

```
┌─ Formas ────────────────────────────────────────────────────┐
│                                                             │
│  Formas disponíveis:                                        │
│                                                             │
│  ┌───┐   ╭───╮   ○      ◇      △                          │
│  │   │   │   │                                             │
│  └───┘   ╰───╯                                             │
│  Retângulo  Arredondado  Círculo  Losango  Triângulo       │
│                                                             │
│  ───────  - - - -  ═══════                                 │
│  Linha    Tracejada  Dupla                                  │
│                                                             │
│  Propriedades:                                              │
│  • Tamanho (W × H)                                          │
│  • Cor de preenchimento (ou transparente)                  │
│  • Cor da borda                                             │
│  • Espessura da borda                                       │
│  • Estilo da borda (sólida, tracejada, pontilhada)         │
│  • Raio do canto (para retângulos)                         │
│  • Rotação                                                  │
│                                                             │
│  Uso comum:                                                 │
│  • Criar bordas ao redor de conteúdo                       │
│  • Destacar informações importantes                        │
│  • Separadores visuais                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.7 Linhas e Separadores

```
┌─ Linhas ────────────────────────────────────────────────────┐
│                                                             │
│  Tipos:                                                     │
│                                                             │
│  Horizontal:  ────────────────────                         │
│  Vertical:    │                                            │
│               │                                            │
│               │                                            │
│                                                             │
│  Estilos:                                                   │
│  ──────────  Sólida                                        │
│  - - - - -   Tracejada                                     │
│  · · · · ·   Pontilhada                                    │
│  ══════════  Dupla                                         │
│                                                             │
│  Propriedades:                                              │
│  • Comprimento                                              │
│  • Espessura                                                │
│  • Cor                                                      │
│  • Estilo                                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Campos Dinâmicos

### 5.1 Campo Composto (Concatenação)

Permite juntar múltiplos campos em um único elemento.

```
┌─ Campo Composto ────────────────────────────────────────────┐
│                                                             │
│  Configuração:                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Template: [{product.name}] - [{variant.name}]       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Campos disponíveis:     Inserir:                          │
│  ┌──────────────────┐    ┌────────────────┐                │
│  │ product.name     │    │ [+ Adicionar]  │                │
│  │ product.code     │    └────────────────┘                │
│  │ variant.sku      │                                      │
│  │ variant.name     │    Separadores rápidos:              │
│  │ ...              │    [ - ] [ / ] [ | ] [ , ]           │
│  └──────────────────┘                                      │
│                                                             │
│  Preview:                                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Camiseta Básica - Azul M                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Exemplos de uso:                                           │
│  • "{product.name} - {variant.name}"                       │
│    → "Camiseta Básica - Azul M"                            │
│                                                             │
│  • "{variant.sku}/{item.batchNumber}"                      │
│    → "CAM-AZU-M/LOTE-2024-01"                              │
│                                                             │
│  • "Ref: {variant.reference}"                              │
│    → "Ref: REF-2024-001"                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Campo Condicional (Fallback)

Se o primeiro campo estiver vazio, usa o segundo.

```
┌─ Campo Condicional ─────────────────────────────────────────┐
│                                                             │
│  Configuração:                                              │
│                                                             │
│  Mostrar:  [variant.barcode           ▾]                   │
│                                                             │
│  Se vazio, mostrar:                                         │
│  ☑ [product.code                 ▾]                        │
│  ☑ [item.uniqueCode              ▾]                        │
│  ☐ Texto fixo: [________________]                          │
│                                                             │
│  Lógica: Tenta na ordem, usa o primeiro com valor          │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Exemplo prático:                                           │
│                                                             │
│  "Código para exibir"                                       │
│  1º variant.barcode     → "7891234567890" ✓ (tem valor)    │
│  2º product.code        → (não chega aqui)                 │
│  3º item.uniqueCode     → (não chega aqui)                 │
│                                                             │
│  Se barcode fosse vazio:                                    │
│  1º variant.barcode     → "" (vazio)                       │
│  2º product.code        → "PROD-001" ✓ (tem valor)        │
│  3º item.uniqueCode     → (não chega aqui)                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 Campo Calculado

Permite operações matemáticas com campos numéricos.

```
┌─ Campo Calculado ───────────────────────────────────────────┐
│                                                             │
│  Tipo de cálculo:                                           │
│  ○ Multiplicação                                           │
│  ○ Divisão                                                 │
│  ○ Soma                                                    │
│  ○ Subtração                                               │
│  ○ Porcentagem                                             │
│  ○ Fórmula personalizada                                   │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  MULTIPLICAÇÃO:                                             │
│  [item.currentQuantity ▾]  ×  [variant.price     ▾]        │
│                                                             │
│  Formato do resultado:                                      │
│  ○ Número inteiro (ex: 150)                                │
│  ○ Decimal 2 casas (ex: 149.90)                            │
│  ● Moeda (ex: R$ 149,90)                                   │
│                                                             │
│  Preview:                                                   │
│  Quantidade: 3 × Preço: R$ 49,90 = R$ 149,70               │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  FÓRMULA PERSONALIZADA:                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ({item.currentQuantity} * {variant.price}) * 0.9    │   │
│  └─────────────────────────────────────────────────────┘   │
│  (Aplica 10% de desconto)                                   │
│                                                             │
│  Operadores suportados: + - * / ( ) %                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 5.4 Formatação Condicional

Muda a aparência baseado no valor.

```
┌─ Formatação Condicional ────────────────────────────────────┐
│                                                             │
│  Campo: [item.currentQuantity ▾]                            │
│                                                             │
│  Regras:                                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Se valor < 10                                       │   │
│  │ Então: Cor = Vermelho, Negrito = Sim                │   │
│  └─────────────────────────────────────────────────────┘   │
│  [+ Adicionar regra]                                        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Se valor >= 10 E valor < 50                         │   │
│  │ Então: Cor = Amarelo                                │   │
│  └─────────────────────────────────────────────────────┘   │
│  [+ Adicionar regra]                                        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Se valor >= 50                                      │   │
│  │ Então: Cor = Verde                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Uso: Destacar estoque baixo, validade próxima, etc.       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Sistema de Tabelas

### 6.1 Criação de Tabela

```
┌─ Nova Tabela ───────────────────────────────────────────────┐
│                                                             │
│  Estrutura inicial:                                         │
│                                                             │
│  Colunas: [2]  [▲▼]      Linhas: [3]  [▲▼]                │
│                                                             │
│  Preview:                                                   │
│  ┌─────────────┬─────────────┐                             │
│  │             │             │                             │
│  ├─────────────┼─────────────┤                             │
│  │             │             │                             │
│  ├─────────────┼─────────────┤                             │
│  │             │             │                             │
│  └─────────────┴─────────────┘                             │
│                                                             │
│  Largura das colunas:                                       │
│  ○ Igual para todas                                        │
│  ○ Personalizado: Col1 [50%] Col2 [50%]                    │
│                                                             │
│  [Criar Tabela]                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Interação com Tabela

```
ARRASTAR ELEMENTO PARA CÉLULA:

  Arrastando "Nome do Produto"
           ↓
  ┌─────────────┬─────────────┐
  │ ┌─────────┐ │             │  ← Célula destaca quando
  │ │ SOLTAR  │ │             │    elemento está sobre ela
  │ │  AQUI   │ │             │
  │ └─────────┘ │             │
  ├─────────────┼─────────────┤
  │             │             │
  └─────────────┴─────────────┘

RESULTADO:
  ┌─────────────┬─────────────┐
  │ Produto:    │             │
  │ Camiseta    │             │
  │ Básica      │             │
  ├─────────────┼─────────────┤
  │             │             │
  └─────────────┴─────────────┘
```

### 6.3 Mesclagem de Células

```
┌─ Mesclar Células ───────────────────────────────────────────┐
│                                                             │
│  1. Selecione múltiplas células (Ctrl+Click ou arrastar)   │
│                                                             │
│     ┌─────────────┬─────────────┐                          │
│     │ ▓▓▓▓▓▓▓▓▓▓▓ │ ▓▓▓▓▓▓▓▓▓▓▓ │  ← Células selecionadas  │
│     ├─────────────┼─────────────┤                          │
│     │             │             │                          │
│     └─────────────┴─────────────┘                          │
│                                                             │
│  2. Clique em "Mesclar" ou Ctrl+M                          │
│                                                             │
│     ┌───────────────────────────┐                          │
│     │                           │  ← Células mescladas     │
│     ├─────────────┬─────────────┤                          │
│     │             │             │                          │
│     └─────────────┴─────────────┘                          │
│                                                             │
│  Opções de mesclagem:                                       │
│  [Mesclar horizontal →]                                     │
│  [Mesclar vertical ↓]                                       │
│  [Mesclar todas]                                            │
│  [Dividir células]                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.4 Configuração de Bordas

```
┌─ Bordas da Tabela ──────────────────────────────────────────┐
│                                                             │
│  Estilo rápido:                                             │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐                            │
│  │▓▓▓│ │ ▓ │ │▓ ▓│ │───│ │   │                            │
│  │▓▓▓│ │ ▓ │ │   │ │───│ │   │                            │
│  │▓▓▓│ │ ▓ │ │▓ ▓│ │───│ │   │                            │
│  └───┘ └───┘ └───┘ └───┘ └───┘                            │
│  Todas  Ext.  Cols  Linhas Nenhuma                         │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Configuração detalhada:                                    │
│                                                             │
│  Borda externa:                                             │
│  Espessura: [1px ▾]  Estilo: [Sólida ▾]  Cor: [■ #000]    │
│                                                             │
│  Bordas internas horizontais:                               │
│  Espessura: [1px ▾]  Estilo: [Sólida ▾]  Cor: [■ #000]    │
│                                                             │
│  Bordas internas verticais:                                 │
│  Espessura: [1px ▾]  Estilo: [Sólida ▾]  Cor: [■ #000]    │
│                                                             │
│  Aplicar apenas à célula selecionada:                      │
│  [Superior] [Inferior] [Esquerda] [Direita]                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.5 Redimensionamento

```
┌─ Redimensionar Colunas/Linhas ──────────────────────────────┐
│                                                             │
│  Arrastar bordas para redimensionar:                        │
│                                                             │
│       ← Arrastar →                                          │
│            ↓                                                │
│  ┌─────────────╫─────────────┐                             │
│  │             ║             │                             │
│  │             ║             │                             │
│  ╠═════════════╬═════════════╡ ← Arrastar                  │
│  │             ║             │      ↑                      │
│  │             ║             │      ↓                      │
│  └─────────────╨─────────────┘                             │
│                                                             │
│  Ou definir tamanhos específicos:                          │
│                                                             │
│  Coluna 1: [50__] %  ou  [25__] mm                         │
│  Coluna 2: [50__] %  ou  [25__] mm                         │
│                                                             │
│  Linha 1:  [auto_]      ou  [10__] mm                      │
│  Linha 2:  [auto_]      ou  [10__] mm                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Códigos de Barras e QR Codes

### 7.1 Código de Barras

```
┌─ Código de Barras ──────────────────────────────────────────┐
│                                                             │
│  FONTE DO DADO                                              │
│  ○ Campo do sistema                                        │
│     [variant.barcode                     ▾]                │
│                                                             │
│  ○ Valor personalizado                                     │
│     [_________________________________]                     │
│                                                             │
│  ○ Campo composto                                          │
│     [{variant.sku}/{item.batchNumber}____]                 │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  FORMATO                                                    │
│  Tipo: [Code 128        ▾]                                 │
│                                                             │
│  Tipos disponíveis:                                         │
│  • Code 128 (recomendado - alfanumérico)                   │
│  • Code 39 (alfanumérico, mais largo)                      │
│  • EAN-13 (13 dígitos numéricos)                           │
│  • EAN-8 (8 dígitos numéricos)                             │
│  • UPC-A (12 dígitos numéricos)                            │
│  • ITF/Interleaved 2 of 5 (numérico, pares)               │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  APARÊNCIA                                                  │
│                                                             │
│  Largura: [____] mm   Altura: [____] mm                    │
│  ☑ Ajustar automaticamente ao conteúdo                     │
│                                                             │
│  ☑ Mostrar número abaixo                                   │
│     Fonte: [Arial ▾]  Tamanho: [8pt ▾]                     │
│                                                             │
│  Cor das barras: [■ #000000]                               │
│  Cor do fundo:   [□ Transparente]                          │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  PREVIEW                                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │    ║│║ ║║│ │║║│║ ║│║║ │║│║ ║║│ │║║│ ║│║║           │   │
│  │    ║│║ ║║│ │║║│║ ║│║║ │║│║ ║║│ │║║│ ║│║║           │   │
│  │                                                     │   │
│  │              7891234567890                          │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 QR Code

```
┌─ QR Code ───────────────────────────────────────────────────┐
│                                                             │
│  TIPO DE CONTEÚDO                                           │
│                                                             │
│  ○ Campo simples                                           │
│     [item.uniqueCode                     ▾]                │
│                                                             │
│  ○ Campo composto                                          │
│     [{variant.sku}-{item.batchNumber}____]                 │
│                                                             │
│  ○ URL do produto                                          │
│     Base: [https://minhaloja.com/produto/]                 │
│     Parâmetro: [{product.id}]                              │
│     Preview: https://minhaloja.com/produto/abc123          │
│                                                             │
│  ○ URL de rastreamento                                     │
│     Base: [https://rastreio.minhaloja.com/]                │
│     Parâmetro: [{item.uniqueCode}]                         │
│                                                             │
│  ○ vCard (contato)                                         │
│     Nome: [{tenant.name}]                                  │
│     Telefone: [{tenant.phone}]                             │
│     Email: [{tenant.email}]                                │
│                                                             │
│  ○ Texto/JSON personalizado                                │
│     ┌─────────────────────────────────────────────────┐   │
│     │ {"sku":"{variant.sku}","batch":"{item.batchNumber}"}│
│     └─────────────────────────────────────────────────┘   │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  APARÊNCIA                                                  │
│                                                             │
│  Tamanho: [15__] mm × [15__] mm                            │
│  ☑ Manter proporção (1:1)                                  │
│                                                             │
│  Nível de correção de erro:                                │
│  ○ L (7%) - Menor, menos redundância                       │
│  ● M (15%) - Balanceado (recomendado)                      │
│  ○ Q (25%) - Maior redundância                             │
│  ○ H (30%) - Máxima redundância                            │
│                                                             │
│  Cor dos módulos: [■ #000000]                              │
│  Cor do fundo:    [□ #FFFFFF]                              │
│                                                             │
│  ☐ Incluir logo no centro                                  │
│     [Selecionar imagem...]                                  │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  PREVIEW                                                    │
│  ┌───────────────────┐                                     │
│  │ ▓▓▓▓▓▓▓ ▓ ▓▓▓▓▓▓▓│                                     │
│  │ ▓     ▓ ▓ ▓     ▓│                                     │
│  │ ▓ ▓▓▓ ▓   ▓ ▓▓▓ ▓│                                     │
│  │ ▓ ▓▓▓ ▓ ▓ ▓ ▓▓▓ ▓│                                     │
│  │ ▓ ▓▓▓ ▓   ▓ ▓▓▓ ▓│                                     │
│  │ ▓     ▓   ▓     ▓│                                     │
│  │ ▓▓▓▓▓▓▓ ▓ ▓▓▓▓▓▓▓│                                     │
│  │     ▓   ▓   ▓    │                                     │
│  │ ▓▓ ▓▓▓▓▓▓▓▓▓ ▓▓  │                                     │
│  │ ▓     ▓ ▓   ▓   ▓│                                     │
│  │ ▓▓▓▓▓▓▓ ▓▓▓ ▓▓▓▓▓│                                     │
│  └───────────────────┘                                     │
│  Conteúdo: ITM-2024-00001                                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 7.3 Casos de Uso para QR Code em ERP

```
┌─ Casos de Uso - QR Code ────────────────────────────────────┐
│                                                             │
│  1. IDENTIFICAÇÃO DE ITEM                                   │
│     Conteúdo: {item.uniqueCode}                            │
│     Uso: Escanear para abrir ficha do item no sistema      │
│                                                             │
│  2. PÁGINA DO PRODUTO (E-commerce)                          │
│     Conteúdo: https://loja.com/p/{product.id}              │
│     Uso: Cliente escaneia e vai para página do produto     │
│                                                             │
│  3. CÓDIGO DE BARRAS DO ITEM                                │
│     Conteúdo: {item.barcode}                               │
│     Uso: Identificação rápida via scanner                  │
│                                                             │
│  4. EAN-13 DO ITEM                                          │
│     Conteúdo: {item.eanCode}                               │
│     Uso: Compatibilidade com sistemas de varejo            │
│                                                             │
│  5. FICHA TÉCNICA                                           │
│     Conteúdo: https://docs.com/ft/{product.id}             │
│     Uso: Acesso rápido a especificações                    │
│                                                             │
│  6. REPOSIÇÃO AUTOMÁTICA                                    │
│     Conteúdo: {"action":"reorder","sku":"{variant.sku}"}   │
│     Uso: App lê e já preenche pedido de compra             │
│                                                             │
│  7. LOCALIZAÇÃO NO ARMAZÉM                                  │
│     Conteúdo: {item.resolvedAddress}                       │
│     Uso: Operador escaneia e sistema mostra rota           │
│                                                             │
│  8. DADOS COMPLETOS DO ITEM (JSON)                          │
│     Conteúdo: {                                            │
│       "sku": "{variant.sku}",                              │
│       "batch": "{item.batchNumber}",                       │
│       "expiry": "{item.expiryDate}",                       │
│       "location": "{item.resolvedAddress}"                 │
│     }                                                       │
│     Uso: Integração com outros sistemas                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Sistema de Snap e Alinhamento

### 8.1 Tipos de Snap

```
┌─ Sistema de Snap ───────────────────────────────────────────┐
│                                                             │
│  SNAP PARA BORDAS DA ETIQUETA                               │
│  ┌─────────────────────────────────────┐                   │
│  │ ↓                                   │                   │
│  │ ══════════════════════════════════ │ ← Borda superior  │
│  │                                     │                   │
│  │ ←║                             ║→   │ ← Bordas laterais │
│  │                                     │                   │
│  │ ══════════════════════════════════ │ ← Borda inferior  │
│  └─────────────────────────────────────┘                   │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  SNAP PARA CENTRO                                           │
│  ┌─────────────────────────────────────┐                   │
│  │              ╎                      │                   │
│  │              ╎ ← Centro vertical    │                   │
│  │ ─────────────┼───────────────────── │ ← Centro horiz.  │
│  │              ╎                      │                   │
│  │              ╎                      │                   │
│  └─────────────────────────────────────┘                   │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  SNAP PARA OUTROS ELEMENTOS                                 │
│  ┌─────────────────────────────────────┐                   │
│  │  ┌──────────┐                       │                   │
│  │  │ Elem A   │                       │                   │
│  │  └──────────┘                       │                   │
│  │  ╎          ╎                       │                   │
│  │  ╎ ┌────────┴─┐ ← Alinha com A     │                   │
│  │  ╎ │ Elem B   │                     │                   │
│  │    └──────────┘                     │                   │
│  └─────────────────────────────────────┘                   │
│                                                             │
│  Tipos de alinhamento entre elementos:                     │
│  • Bordas esquerdas alinhadas                              │
│  • Bordas direitas alinhadas                               │
│  • Bordas superiores alinhadas                             │
│  • Bordas inferiores alinhadas                             │
│  • Centros alinhados (horizontal)                          │
│  • Centros alinhados (vertical)                            │
│  • Espaçamento igual entre elementos                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 Guias Visuais

```
┌─ Guias de Alinhamento ──────────────────────────────────────┐
│                                                             │
│  Quando elemento está sendo arrastado:                      │
│                                                             │
│  ┌─────────────────────────────────────┐                   │
│  │         ╎                           │                   │
│  │  ┌──────┼──────┐                    │                   │
│  │  │      ╎      │ ← Linha tracejada  │                   │
│  │  │  [Elem A]   │   aparece quando   │                   │
│  │  │      ╎      │   alinhado         │                   │
│  │  └──────┼──────┘                    │                   │
│  │         ╎                           │                   │
│  │ ════════╪═══════════════════════════│ ← Guia horizontal│
│  │         ╎                           │                   │
│  │     ┌───┴───┐                       │                   │
│  │     │Elem B │ ← Sendo arrastado     │                   │
│  │     └───────┘                       │                   │
│  │                                     │                   │
│  └─────────────────────────────────────┘                   │
│                                                             │
│  Cores das guias:                                           │
│  ─── Rosa/Magenta: Alinhamento com centro                  │
│  ─── Azul: Alinhamento com bordas                          │
│  ─── Verde: Espaçamento igual                              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 8.3 Distribuição Automática

```
┌─ Distribuir Elementos ──────────────────────────────────────┐
│                                                             │
│  Selecione 3+ elementos e use:                              │
│                                                             │
│  [Distribuir Horizontalmente]                               │
│                                                             │
│  Antes:                     Depois:                         │
│  ┌─────────────────────┐    ┌─────────────────────┐        │
│  │ [A]   [B]      [C]  │    │ [A]    [B]    [C]   │        │
│  └─────────────────────┘    └─────────────────────┘        │
│                                                             │
│  [Distribuir Verticalmente]                                 │
│                                                             │
│  Antes:         Depois:                                     │
│  ┌───────┐      ┌───────┐                                  │
│  │ [A]   │      │ [A]   │                                  │
│  │       │      │       │                                  │
│  │ [B]   │      │ [B]   │                                  │
│  │ [C]   │      │       │                                  │
│  └───────┘      │ [C]   │                                  │
│                 └───────┘                                  │
│                                                             │
│  [Alinhar à Esquerda] [Centro] [Direita]                   │
│  [Alinhar ao Topo] [Meio] [Base]                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 8.4 Configurações de Snap

```
┌─ Configurações de Snap ─────────────────────────────────────┐
│                                                             │
│  ☑ Snap ativado                                            │
│                                                             │
│  Distância de snap: [5] px                                  │
│  (Quão perto o elemento precisa estar para "grudar")       │
│                                                             │
│  Snap para:                                                 │
│  ☑ Bordas da etiqueta                                      │
│  ☑ Centro da etiqueta                                      │
│  ☑ Outros elementos                                        │
│  ☑ Grid (quando visível)                                   │
│                                                             │
│  Grid:                                                       │
│  ☐ Mostrar grid                                            │
│  Espaçamento: [5] mm                                        │
│  Cor: [■ #E0E0E0]                                          │
│                                                             │
│  Atalhos:                                                   │
│  • Segurar Shift: Desativa snap temporariamente            │
│  • Segurar Ctrl: Snap apenas para grid                     │
│  • Segurar Alt: Snap apenas para elementos                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. Propriedades e Estilos

### 9.1 Propriedades Comuns

Todas os elementos compartilham estas propriedades:

```
┌─ Propriedades Comuns ───────────────────────────────────────┐
│                                                             │
│  POSIÇÃO                                                    │
│  X: [___] mm   Y: [___] mm                                 │
│                                                             │
│  TAMANHO                                                    │
│  Largura: [___] mm   Altura: [___] mm                      │
│  ☐ Travar proporção                                        │
│                                                             │
│  ROTAÇÃO                                                    │
│  Ângulo: [0°]  [↺] [↻]                                     │
│  Presets: [0°] [90°] [180°] [270°]                         │
│                                                             │
│  OPACIDADE                                                  │
│  [████████░░] 80%                                           │
│                                                             │
│  BLOQUEIO                                                   │
│  ☐ Bloquear posição                                        │
│  ☐ Bloquear tamanho                                        │
│                                                             │
│  CAMADA                                                     │
│  [Trazer para frente] [Enviar para trás]                   │
│  [Avançar] [Recuar]                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 9.2 Propriedades de Texto

```
┌─ Propriedades de Texto ─────────────────────────────────────┐
│                                                             │
│  FONTE                                                      │
│  Família: [Arial              ▾]                           │
│                                                             │
│  Fontes disponíveis:                                        │
│  • Arial (sans-serif)                                      │
│  • Helvetica (sans-serif)                                  │
│  • Verdana (sans-serif)                                    │
│  • Roboto (sans-serif)                                     │
│  • Times New Roman (serif)                                 │
│  • Georgia (serif)                                         │
│  • Courier New (monospace)                                 │
│  • Monaco (monospace)                                      │
│                                                             │
│  TAMANHO                                                    │
│  [6] [7] [8] [9] [10] [11] [12] [14] [16] [18]            │
│  [20] [24] [28] [32] [36] [48] [72] [___]                  │
│                                                             │
│  ESTILO                                                     │
│  [B] Negrito    [I] Itálico                                │
│  [U] Sublinhado [S] Tachado                                │
│                                                             │
│  COR                                                        │
│  Texto: [■ #000000]                                        │
│  Fundo: [□ Transparente]                                   │
│                                                             │
│  ALINHAMENTO                                                │
│  Horizontal: [◀ Esq] [▬ Centro] [▶ Dir] [▤ Justif.]       │
│  Vertical:   [▲ Topo] [▬ Meio] [▼ Base]                   │
│                                                             │
│  ESPAÇAMENTO                                                │
│  Entre linhas: [1.2] (line-height)                         │
│  Entre letras: [0] px (letter-spacing)                     │
│                                                             │
│  TRANSFORMAÇÃO                                              │
│  ○ Normal                                                  │
│  ○ MAIÚSCULAS                                              │
│  ○ minúsculas                                              │
│  ○ Capitalizar                                             │
│                                                             │
│  OVERFLOW                                                   │
│  ○ Visível (expande)                                       │
│  ○ Cortar                                                  │
│  ○ Reticências (...)                                       │
│  ○ Quebrar linha                                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 9.3 Propriedades de Borda

```
┌─ Propriedades de Borda ─────────────────────────────────────┐
│                                                             │
│  ESTILO RÁPIDO                                              │
│  ○ Nenhuma                                                 │
│  ○ Fina (1px sólida)                                       │
│  ○ Média (2px sólida)                                      │
│  ○ Grossa (3px sólida)                                     │
│  ○ Personalizada                                           │
│                                                             │
│  CONFIGURAÇÃO DETALHADA                                     │
│                                                             │
│  Aplicar em todos os lados: ☑                              │
│                                                             │
│  Espessura: [1] px                                          │
│                                                             │
│  Estilo: [Sólida ▾]                                        │
│  • Sólida   ─────────                                      │
│  • Tracejada - - - - -                                     │
│  • Pontilhada · · · · ·                                    │
│  • Dupla    ═════════                                      │
│                                                             │
│  Cor: [■ #000000]                                          │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  Ou configurar cada lado:                                   │
│  ☐ Aplicar em todos os lados                               │
│                                                             │
│       [Superior: 1px sólida #000]                          │
│  [Esq: 0]                    [Dir: 0]                      │
│       [Inferior: 1px sólida #000]                          │
│                                                             │
│  RAIO DOS CANTOS                                            │
│  [0] px  (0 = cantos retos)                                │
│  ☐ Cantos diferentes:                                      │
│     ╭[__] ╮[__]                                            │
│     ╰[__] ╯[__]                                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 10. Templates e Presets

### 10.1 Galeria de Templates

```
┌─ Galeria de Templates ──────────────────────────────────────┐
│                                                             │
│  [Todos ▾]  [🔍 Buscar template...]                        │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  VESTUÁRIO                                                  │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │ ┌─────┐ │ │ ┌─────┐ │ │ ┌─────┐ │ │ ┌─────┐ │          │
│  │ │Logo │ │ │ │     │ │ │ │     │ │ │ │     │ │          │
│  │ │─────│ │ │ │─────│ │ │ │     │ │ │ │═════│ │          │
│  │ │Comp.│ │ │ │     │ │ │ │ QR  │ │ │ │     │ │          │
│  │ │Ícon.│ │ │ │|||  │ │ │ │     │ │ │ │|||  │ │          │
│  │ └─────┘ │ │ └─────┘ │ │ └─────┘ │ │ └─────┘ │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
│   Básica      Completa    Com QR     Tabela               │
│   30×50mm     40×60mm     35×55mm    40×60mm              │
│                                                             │
│  PRODUTO                                                    │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │ ┌─────┐ │ │ ┌─────┐ │ │ ┌─────┐ │ │ ┌─────┐ │          │
│  │ │Nome │ │ │ │Nome │ │ │ │     │ │ │ │Nome │ │          │
│  │ │SKU  │ │ │ │SKU  │ │ │ │     │ │ │ │───  │ │          │
│  │ │|||  │ │ │ │R$   │ │ │ │ ||| │ │ │ │QR|||│ │          │
│  │ └─────┘ │ │ └─────┘ │ │ └─────┘ │ │ └─────┘ │          │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘          │
│   Simples     Com Preço   Só Barcode  Completa            │
│   50×30mm     60×35mm     50×20mm     60×40mm             │
│                                                             │
│  INVENTÁRIO                                                 │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                      │
│  │ ┌─────┐ │ │ ┌─────┐ │ │ ┌─────┐ │                      │
│  │ │ID QR│ │ │ │Tabela│ │ │ │BIG │ │                      │
│  │ │Local│ │ │ │Info │ │ │ │ A-1 │ │                      │
│  │ │     │ │ │ │QR|||│ │ │ │     │ │                      │
│  │ └─────┘ │ │ └─────┘ │ │ └─────┘ │                      │
│  └─────────┘ └─────────┘ └─────────┘                      │
│   Item        Completo    Localização                      │
│   60×40mm     100×60mm    80×30mm                         │
│                                                             │
│  [+ Criar do Zero]                      [Importar Template]│
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 10.2 Salvar como Template

```
┌─ Salvar como Template ──────────────────────────────────────┐
│                                                             │
│  Nome: [Meu Template Personalizado______]                   │
│                                                             │
│  Descrição:                                                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Etiqueta para produtos têxteis com logo e           │   │
│  │ informações de composição                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Categoria: [Vestuário ▾]                                  │
│                                                             │
│  Visibilidade:                                              │
│  ○ Privado (apenas eu)                                     │
│  ○ Compartilhado (toda empresa)                            │
│                                                             │
│  Thumbnail:                                                 │
│  ○ Gerar automaticamente                                   │
│  ○ Upload personalizado                                    │
│                                                             │
│  [Cancelar]                              [Salvar Template] │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 11. Exportação e Impressão

### 11.1 Preview de Impressão

```
┌─ Preview de Impressão ──────────────────────────────────────┐
│                                                             │
│  DADOS PARA PREVIEW                                         │
│  ○ Dados de exemplo                                        │
│  ● Selecionar item real: [ITM-2024-00123 ▾]               │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │    ┌───────────────────────────────────┐           │   │
│  │    │         [LOGO EMPRESA]            │           │   │
│  │    │                                   │           │   │
│  │    │  Produto: Camiseta Polo Azul      │           │   │
│  │    │  Composição: 100% Algodão         │           │   │
│  │    │                                   │           │   │
│  │    │  🌡️30° 🚫🧺 🔥● ⭕                  │           │   │
│  │    │                                   │           │   │
│  │    │  |||||||||||||||||||||||||||      │           │   │
│  │    │  7891234567890                    │           │   │
│  │    │                                   │           │   │
│  │    │  INDÚSTRIA BRASILEIRA             │           │   │
│  │    └───────────────────────────────────┘           │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Zoom: [100% ▾]                                             │
│                                                             │
│  [Anterior] Item 1 de 5 [Próximo]                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 11.2 Configurações de Impressão

```
┌─ Configurações de Impressão ────────────────────────────────┐
│                                                             │
│  LAYOUT DA PÁGINA                                           │
│                                                             │
│  Tamanho do papel: [A4 ▾]                                  │
│  Orientação: [Retrato ▾]                                   │
│                                                             │
│  Margens do papel:                                          │
│  Superior: [10] mm   Inferior: [10] mm                     │
│  Esquerda: [10] mm   Direita:  [10] mm                     │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  DISPOSIÇÃO DAS ETIQUETAS                                   │
│                                                             │
│  Etiquetas por linha: [3] (calculado: 3)                   │
│  Etiquetas por coluna: [7] (calculado: 7)                  │
│  Total por página: 21 etiquetas                            │
│                                                             │
│  Espaço entre etiquetas:                                    │
│  Horizontal: [2] mm   Vertical: [2] mm                     │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  PREVIEW DA PÁGINA                                          │
│  ┌─────────────────────────────────────┐                   │
│  │ ┌───┐ ┌───┐ ┌───┐                  │                   │
│  │ │ 1 │ │ 2 │ │ 3 │                  │                   │
│  │ └───┘ └───┘ └───┘                  │                   │
│  │ ┌───┐ ┌───┐ ┌───┐                  │                   │
│  │ │ 4 │ │ 5 │ │ 6 │                  │                   │
│  │ └───┘ └───┘ └───┘                  │                   │
│  │ ┌───┐ ┌───┐ ┌───┐                  │                   │
│  │ │ 7 │ │ 8 │ │ 9 │                  │                   │
│  │ └───┘ └───┘ └───┘                  │                   │
│  │       ...                           │                   │
│  └─────────────────────────────────────┘                   │
│                                                             │
│  [Cancelar]              [Exportar PDF]  [Imprimir]        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 11.3 Formatos de Exportação

```
┌─ Exportar ──────────────────────────────────────────────────┐
│                                                             │
│  FORMATO                                                    │
│                                                             │
│  ○ PDF - Pronto para impressão                             │
│     Qualidade: [Alta (300 DPI) ▾]                          │
│                                                             │
│  ○ PNG - Imagem única                                      │
│     Escala: [2x (alta resolução) ▾]                        │
│     Fundo: ○ Branco ○ Transparente                         │
│                                                             │
│  ○ SVG - Vetorial editável                                 │
│                                                             │
│  ○ ZPL - Para impressoras Zebra                            │
│     Modelo: [ZD420 ▾]                                      │
│                                                             │
│  ○ HTML - Template web                                     │
│     ☐ Incluir CSS inline                                   │
│     ☐ Minificar código                                     │
│                                                             │
│  [Cancelar]                                    [Exportar]  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 12. Arquitetura Técnica

### 12.1 Stack Tecnológico

```
┌─ Stack do Label Studio ─────────────────────────────────────┐
│                                                             │
│  FRONTEND (já instalado)                                    │
│  ├── React 19                                              │
│  ├── TypeScript                                            │
│  ├── Tailwind CSS 4                                        │
│  ├── @dnd-kit/core (drag and drop) ✓                      │
│  ├── @dnd-kit/sortable (reordenação) ✓                    │
│  ├── Zustand (estado do editor) ← INSTALAR                │
│  ├── JsBarcode (geração de barcode) ✓                     │
│  ├── qrcode (geração de QR code) ✓                        │
│  └── html2canvas (exportação) ✓                           │
│                                                             │
│  BACKEND (existente)                                        │
│  ├── Fastify                                               │
│  ├── Prisma                                                │
│  └── PostgreSQL                                            │
│                                                             │
│  IMPRESSÃO (já instalado)                                   │
│  ├── @react-pdf/renderer (geração PDF) ✓                  │
│  ├── react-to-print (impressão direta) ✓                  │
│  └── jspdf (exportação PDF) ✓                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 12.2 Estrutura de Dados

```typescript
// Modelo do Template de Etiqueta
interface LabelTemplate {
  id: string;
  tenantId: string;
  name: string;
  description?: string;

  // Dimensões em mm
  width: number;
  height: number;

  // Configurações do canvas
  canvas: {
    backgroundColor: string;
    margins?: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
  };

  // Elementos da etiqueta
  elements: LabelElement[];

  // Metadados
  isSystem: boolean;
  category: 'vestuario' | 'produto' | 'inventario' | 'prateleira' | 'envio' | 'personalizado';
  thumbnailUrl?: string;

  // Audit
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

// Elemento base
interface LabelElementBase {
  id: string;
  type: ElementType;

  // Posição (mm)
  x: number;
  y: number;
  width: number;
  height: number;

  // Transformação
  rotation: number;
  opacity: number;

  // Camada
  zIndex: number;
  locked: boolean;
}

// Tipos de elementos
type ElementType =
  | 'field'           // Campo de dados
  | 'text'            // Texto livre
  | 'image'           // Imagem/logo
  | 'icon'            // Ícone
  | 'arrow'           // Seta
  | 'shape'           // Forma (retângulo, círculo, etc)
  | 'line'            // Linha
  | 'barcode'         // Código de barras
  | 'qrcode'          // QR Code
  | 'table';          // Tabela

// Campo de dados
interface FieldElement extends LabelElementBase {
  type: 'field';

  // Configuração do dado
  fieldConfig: {
    type: 'simple' | 'composite' | 'conditional' | 'calculated';

    // Para campo simples
    dataPath?: string;

    // Para campo composto
    template?: string; // "{product.name} - {variant.name}"

    // Para campo condicional
    conditions?: {
      field: string;
      fallbacks: string[];
    };

    // Para campo calculado
    formula?: string;
    format?: 'number' | 'currency' | 'percentage';
  };

  // Label
  label?: {
    enabled: boolean;
    text: string;
    position: 'above' | 'left';
    style: TextStyle;
  };

  // Estilo do valor
  valueStyle: TextStyle;
}

// Estilo de texto
interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline' | 'line-through';
  color: string;
  backgroundColor?: string;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  verticalAlign: 'top' | 'middle' | 'bottom';
  lineHeight: number;
  letterSpacing: number;
  textTransform: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
}

// Código de barras
interface BarcodeElement extends LabelElementBase {
  type: 'barcode';

  barcodeConfig: {
    // Fonte do dado
    source: 'field' | 'custom' | 'composite';
    dataPath?: string;
    customValue?: string;
    template?: string;

    // Formato
    format: 'CODE128' | 'CODE39' | 'EAN13' | 'EAN8' | 'UPC' | 'ITF';

    // Aparência
    showText: boolean;
    textStyle?: TextStyle;
    barColor: string;
    backgroundColor: string;
  };
}

// QR Code
interface QRCodeElement extends LabelElementBase {
  type: 'qrcode';

  qrConfig: {
    // Tipo de conteúdo
    contentType: 'field' | 'url' | 'vcard' | 'custom';

    // Para campo
    dataPath?: string;

    // Para URL
    urlBase?: string;
    urlParam?: string;

    // Para vCard
    vcard?: {
      name: string;
      phone?: string;
      email?: string;
    };

    // Para custom
    customValue?: string;
    template?: string;

    // Aparência
    errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
    moduleColor: string;
    backgroundColor: string;
    logoUrl?: string;
  };
}

// Tabela
interface TableElement extends LabelElementBase {
  type: 'table';

  tableConfig: {
    rows: number;
    columns: number;

    // Tamanho das colunas (porcentagem ou mm)
    columnWidths: (number | 'auto')[];
    rowHeights: (number | 'auto')[];

    // Células mescladas
    mergedCells: {
      startRow: number;
      startCol: number;
      rowSpan: number;
      colSpan: number;
    }[];

    // Bordas
    borders: {
      external: BorderStyle;
      internalHorizontal: BorderStyle;
      internalVertical: BorderStyle;
    };

    // Padding das células
    cellPadding: number;
  };

  // Conteúdo das células
  cells: {
    row: number;
    col: number;
    content: LabelElement | null;
  }[];
}

// Estilo de borda
interface BorderStyle {
  width: number;
  style: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
  color: string;
}
```

### 12.3 Estado do Editor (Zustand)

```typescript
interface EditorState {
  // Template atual
  template: LabelTemplate | null;

  // Elementos
  elements: LabelElement[];

  // Seleção
  selectedIds: string[];
  hoveredId: string | null;

  // Histórico (undo/redo)
  history: LabelElement[][];
  historyIndex: number;

  // Canvas
  zoom: number;
  panOffset: { x: number; y: number };
  showGrid: boolean;
  showRulers: boolean;
  snapEnabled: boolean;

  // Clipboard
  clipboard: LabelElement[];

  // Actions
  addElement: (element: LabelElement) => void;
  updateElement: (id: string, updates: Partial<LabelElement>) => void;
  deleteElements: (ids: string[]) => void;
  selectElements: (ids: string[]) => void;
  moveElements: (ids: string[], deltaX: number, deltaY: number) => void;
  resizeElement: (id: string, width: number, height: number) => void;

  // History
  undo: () => void;
  redo: () => void;

  // Clipboard
  copy: () => void;
  paste: () => void;
  cut: () => void;

  // Alignment
  alignElements: (alignment: AlignmentType) => void;
  distributeElements: (direction: 'horizontal' | 'vertical') => void;

  // Layer
  bringToFront: (id: string) => void;
  sendToBack: (id: string) => void;
  moveForward: (id: string) => void;
  moveBackward: (id: string) => void;
}
```

### 12.4 Estrutura de Pastas

> **Nota**: Utilizamos a estrutura existente em `src/core/print-queue/` para manter
> consistência com o código já implementado. O Label Studio será uma evolução do
> editor atual, substituindo o GrapesJS.

```
src/
├── core/
│   └── print-queue/
│       ├── components/                       # (existente)
│       │   ├── print-queue-modal.tsx
│       │   ├── print-queue-panel.tsx
│       │   └── ...
│       │
│       ├── editor/                           # LABEL STUDIO (novo)
│       │   ├── components/
│       │   │   ├── LabelStudioEditor.tsx     # Componente principal (substitui GrapesJS)
│       │   │   ├── Canvas.tsx                # Área de edição
│       │   │   ├── Rulers.tsx                # Réguas
│       │   │   ├── SnapGuides.tsx            # Guias de alinhamento
│       │   │   └── SelectionBox.tsx          # Caixa de seleção
│       │   │
│       │   ├── panels/
│       │   │   ├── ElementsPanel.tsx         # Painel de elementos
│       │   │   ├── PropertiesPanel.tsx       # Painel de propriedades
│       │   │   ├── LayersPanel.tsx           # Painel de camadas
│       │   │   └── FieldSelector.tsx         # Seletor de campos
│       │   │
│       │   ├── elements/
│       │   │   ├── BaseElement.tsx           # Elemento base
│       │   │   ├── FieldElement.tsx          # Campo de dados
│       │   │   ├── TextElement.tsx           # Texto livre
│       │   │   ├── ImageElement.tsx          # Imagem
│       │   │   ├── IconElement.tsx           # Ícone
│       │   │   ├── ArrowElement.tsx          # Seta
│       │   │   ├── ShapeElement.tsx          # Forma
│       │   │   ├── LineElement.tsx           # Linha
│       │   │   ├── BarcodeElement.tsx        # Código de barras
│       │   │   ├── QRCodeElement.tsx         # QR Code
│       │   │   └── TableElement.tsx          # Tabela
│       │   │
│       │   ├── properties/
│       │   │   ├── FieldProperties.tsx       # Props de campo
│       │   │   ├── TextProperties.tsx        # Props de texto
│       │   │   ├── TableProperties.tsx       # Props de tabela
│       │   │   ├── BarcodeProperties.tsx     # Props de barcode
│       │   │   ├── QRCodeProperties.tsx      # Props de QR
│       │   │   └── CommonProperties.tsx      # Props comuns
│       │   │
│       │   ├── toolbar/
│       │   │   ├── MainToolbar.tsx           # Barra superior
│       │   │   ├── AlignmentTools.tsx        # Ferramentas de alinhamento
│       │   │   └── ZoomControls.tsx          # Controles de zoom
│       │   │
│       │   ├── modals/
│       │   │   ├── TemplateGallery.tsx       # Galeria de templates
│       │   │   ├── PrintPreview.tsx          # Preview de impressão
│       │   │   ├── ExportModal.tsx           # Modal de exportação
│       │   │   └── FieldComposer.tsx         # Compositor de campos
│       │   │
│       │   ├── hooks/
│       │   │   ├── useEditorStore.ts         # Hook para Zustand store
│       │   │   ├── useSelection.ts           # Lógica de seleção
│       │   │   ├── useDragAndDrop.ts         # Drag and drop
│       │   │   ├── useSnap.ts                # Lógica de snap
│       │   │   ├── useHistory.ts             # Undo/redo
│       │   │   ├── useKeyboardShortcuts.ts   # Atalhos
│       │   │   └── useExport.ts              # Exportação
│       │   │
│       │   ├── stores/
│       │   │   └── editorStore.ts            # Zustand store
│       │   │
│       │   ├── utils/
│       │   │   ├── snapCalculator.ts         # Cálculos de snap
│       │   │   ├── alignmentUtils.ts         # Utilitários de alinhamento
│       │   │   ├── exportUtils.ts            # Exportação PDF/PNG
│       │   │   ├── barcodeGenerator.ts       # Geração de barcode
│       │   │   ├── qrcodeGenerator.ts        # Geração de QR
│       │   │   └── unitConverter.ts          # Conversão mm/px
│       │   │
│       │   ├── constants.ts                  # (existente - campos, presets)
│       │   ├── types.ts                      # (existente - tipos)
│       │   └── index.ts                      # Exports
│       │
│       ├── utils/
│       │   ├── label-data-resolver.ts        # (existente - reutilizar)
│       │   ├── page-layout-calculator.ts     # (existente)
│       │   └── storage.ts                    # (existente)
│       │
│       ├── hooks/                            # (existente)
│       ├── context/                          # (existente)
│       └── types.ts                          # (existente)
│
└── app/
    └── (dashboard)/
        └── stock/
            └── label-templates/              # (existente ou criar)
                ├── page.tsx                  # Lista de templates
                ├── new/
                │   └── page.tsx              # Novo template
                └── [id]/
                    ├── page.tsx              # Detalhes
                    └── edit/
                        └── page.tsx          # Editar template
```

---

## 13. Plano de Implementação

### Fase 1: Fundação (2-3 semanas)

```
┌─ Fase 1: Fundação ──────────────────────────────────────────┐
│                                                             │
│  Semana 1-2:                                                │
│  □ Setup do projeto e estrutura de pastas                  │
│  □ Implementar store Zustand com tipos                     │
│  □ Canvas básico com zoom e pan                            │
│  □ Sistema de réguas (rulers)                              │
│  □ Conversão mm ↔ px                                       │
│                                                             │
│  Semana 2-3:                                                │
│  □ Drag and drop básico com @dnd-kit                       │
│  □ Seleção de elementos (single e multi)                   │
│  □ Redimensionamento de elementos                          │
│  □ Rotação de elementos                                    │
│  □ Sistema de camadas (z-index)                            │
│                                                             │
│  Entregável: Canvas funcional com elementos arrastáveis    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Fase 2: Sistema de Snap (1-2 semanas)

```
┌─ Fase 2: Sistema de Snap ───────────────────────────────────┐
│                                                             │
│  □ Snap para bordas do canvas                              │
│  □ Snap para centro do canvas                              │
│  □ Snap para outros elementos                              │
│  □ Guias visuais (linhas de alinhamento)                   │
│  □ Distribuição automática                                  │
│  □ Alinhamento múltiplo (esquerda, centro, direita, etc)   │
│  □ Grid opcional                                            │
│  □ Configurações de snap (ativar/desativar, distância)     │
│                                                             │
│  Entregável: Sistema de snap completo e intuitivo          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Fase 3: Elementos Básicos (2-3 semanas)

```
┌─ Fase 3: Elementos Básicos ─────────────────────────────────┐
│                                                             │
│  Semana 1:                                                  │
│  □ Elemento de texto livre                                 │
│  □ Elemento de imagem/logo                                 │
│  □ Elemento de forma (retângulo, círculo)                  │
│  □ Elemento de linha                                       │
│                                                             │
│  Semana 2:                                                  │
│  □ Elemento de seta                                        │
│  □ Elemento de ícone (biblioteca de ícones)                │
│  □ Painel de propriedades para cada tipo                   │
│                                                             │
│  Semana 3:                                                  │
│  □ Estilos de texto (fonte, tamanho, cor, etc)            │
│  □ Estilos de borda                                        │
│  □ Preenchimento e background                              │
│                                                             │
│  Entregável: Todos os elementos básicos funcionais         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Fase 4: Campos Dinâmicos (2-3 semanas)

```
┌─ Fase 4: Campos Dinâmicos ──────────────────────────────────┐
│                                                             │
│  Semana 1:                                                  │
│  □ Campo simples (vínculo com data path)                   │
│  □ Sistema de label (acima/esquerda)                       │
│  □ Resolução de campos com dados de exemplo                │
│  □ Lista de campos disponíveis por categoria               │
│                                                             │
│  Semana 2:                                                  │
│  □ Campo composto (concatenação com template)              │
│  □ Campo condicional (fallback)                            │
│  □ Interface de composição de campos                       │
│                                                             │
│  Semana 3:                                                  │
│  □ Campo calculado (fórmulas matemáticas)                  │
│  □ Formatação condicional (cores por valor)                │
│  □ Preview com dados reais (buscar item do banco)          │
│                                                             │
│  Entregável: Sistema completo de campos dinâmicos          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Fase 5: Códigos (1-2 semanas)

```
┌─ Fase 5: Códigos de Barras e QR ────────────────────────────┐
│                                                             │
│  □ Integração JsBarcode                                    │
│  □ Suporte a múltiplos formatos (Code128, EAN, etc)       │
│  □ Configurações de aparência do barcode                   │
│  □ Integração qrcode library                               │
│  □ QR com conteúdo dinâmico (campo, URL, vCard)           │
│  □ QR com logo central                                     │
│  □ Preview em tempo real                                   │
│                                                             │
│  Entregável: Barcode e QR code totalmente funcionais       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Fase 6: Tabelas (2-3 semanas)

```
┌─ Fase 6: Sistema de Tabelas ────────────────────────────────┐
│                                                             │
│  Semana 1:                                                  │
│  □ Criação de tabela (definir linhas/colunas)              │
│  □ Renderização de tabela no canvas                        │
│  □ Drop de elementos em células                            │
│  □ Seleção de células                                      │
│                                                             │
│  Semana 2:                                                  │
│  □ Mesclagem de células (merge)                            │
│  □ Divisão de células (split)                              │
│  □ Redimensionamento de colunas/linhas                     │
│                                                             │
│  Semana 3:                                                  │
│  □ Configuração de bordas (por lado, estilo, cor)          │
│  □ Padding de células                                      │
│  □ Alinhamento dentro de células                           │
│                                                             │
│  Entregável: Sistema de tabelas com mesclagem              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Fase 7: Persistência e Templates (1-2 semanas)

```
┌─ Fase 7: Persistência ──────────────────────────────────────┐
│                                                             │
│  □ Serialização do template para JSON                      │
│  □ API de save/load (usar estrutura existente)             │
│  □ Migração de templates antigos (GrapesJS → novo formato) │
│  □ Galeria de templates                                    │
│  □ Templates pré-definidos (5-10 templates)                │
│  □ Salvar como novo template                               │
│  □ Duplicar template                                       │
│                                                             │
│  Entregável: Persistência completa e galeria               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Fase 8: Exportação e Impressão (1-2 semanas)

```
┌─ Fase 8: Exportação ────────────────────────────────────────┐
│                                                             │
│  □ Preview de impressão                                    │
│  □ Configuração de página (A4, etc)                        │
│  □ Layout de múltiplas etiquetas por página                │
│  □ Exportação PDF (alta qualidade)                         │
│  □ Exportação PNG                                          │
│  □ Impressão direta                                        │
│  □ Resolução de campos com dados reais                     │
│                                                             │
│  Entregável: Sistema de exportação e impressão             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Fase 9: Polish e UX (1-2 semanas)

```
┌─ Fase 9: Polish ────────────────────────────────────────────┐
│                                                             │
│  □ Undo/Redo (histórico)                                   │
│  □ Copy/Paste                                              │
│  □ Atalhos de teclado                                      │
│  □ Tooltips e ajuda contextual                             │
│  □ Feedback visual (loading, success, error)               │
│  □ Responsividade do editor                                │
│  □ Testes de usabilidade                                   │
│  □ Correções de bugs                                       │
│                                                             │
│  Entregável: Editor polido e pronto para produção          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Resumo do Cronograma

| Fase | Descrição | Duração | Acumulado |
|------|-----------|---------|-----------|
| 1 | Fundação | 2-3 sem | 2-3 sem |
| 2 | Sistema de Snap | 1-2 sem | 3-5 sem |
| 3 | Elementos Básicos | 2-3 sem | 5-8 sem |
| 4 | Campos Dinâmicos | 2-3 sem | 7-11 sem |
| 5 | Códigos (Barcode/QR) | 1-2 sem | 8-13 sem |
| 6 | Tabelas | 2-3 sem | 10-16 sem |
| 7 | Persistência | 1-2 sem | 11-18 sem |
| 8 | Exportação | 1-2 sem | 12-20 sem |
| 9 | Polish | 1-2 sem | 13-22 sem |

**Estimativa total: 13-22 semanas (3-5 meses)**

---

## Apêndice A: Atalhos de Teclado

| Atalho | Ação |
|--------|------|
| Ctrl+S | Salvar |
| Ctrl+Z | Desfazer |
| Ctrl+Y | Refazer |
| Ctrl+C | Copiar |
| Ctrl+V | Colar |
| Ctrl+X | Recortar |
| Ctrl+D | Duplicar |
| Delete | Excluir selecionado |
| Ctrl+A | Selecionar todos |
| Escape | Desselecionar |
| Setas | Mover elemento 1px |
| Shift+Setas | Mover elemento 10px |
| Ctrl+G | Agrupar |
| Ctrl+Shift+G | Desagrupar |
| Ctrl+] | Trazer para frente |
| Ctrl+[ | Enviar para trás |
| Ctrl+0 | Zoom ajustar |
| Ctrl+1 | Zoom 100% |
| Ctrl++ | Zoom in |
| Ctrl+- | Zoom out |
| Shift (durante drag) | Desativa snap |
| Alt (durante resize) | Redimensiona do centro |

---

## Apêndice B: Migração de Templates Existentes

Para templates criados no sistema antigo (GrapesJS):

1. Detectar formato antigo pelo campo `grapesJsData`
2. Parser para extrair elementos
3. Converter para novo formato
4. Manter compatibilidade de leitura
5. Salvar em novo formato após primeira edição

---

*Documento criado em: Fevereiro 2026*
*Versão: 1.0*
