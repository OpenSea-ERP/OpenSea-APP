/**
 * Utilitário centralizado de impressão de listagens
 * Design profissional padronizado para todas as tabelas de impressão
 */

// =============================================================================
// TYPES
// =============================================================================

export interface PrintColumn {
  /** Chave única da coluna */
  key: string;
  /** Label do cabeçalho */
  label: string;
  /** Alinhamento */
  align?: 'left' | 'center' | 'right';
  /** Largura fixa (CSS) */
  width?: string;
  /** Usar fonte monospace */
  mono?: boolean;
  /** Mostrar como negrito */
  bold?: boolean;
}

export interface PrintSummaryCard {
  label: string;
  value: string;
  unit?: string;
}

export interface PrintChip {
  label: string;
  mono?: boolean;
  /** CSS color for optional color dot */
  colorDot?: string;
}

export interface PrintListingOptions {
  /** Título principal (ex: "Listagem de Estoque") */
  title: string;
  /** Subtítulo opcional (ex: nome do produto/variante) */
  subtitle?: string;
  /** Texto superior do brand (ex: "Listagem de Itens em Estoque") */
  brandText?: string;
  /** Colunas da tabela */
  columns: PrintColumn[];
  /** Linhas da tabela — cada linha é um Record<key, valor> */
  rows: Record<string, string>[];
  /** Cards de resumo no topo (até 4) */
  summary?: PrintSummaryCard[];
  /** Chips de metadata abaixo do título */
  chips?: PrintChip[];
  /** Texto do footer (ex: total) */
  footerLabel?: string;
  /** Valor do footer alinhado à direita (ex: "150 un") */
  footerValue?: string;
  /** Coluna do footerValue (key). Se não informado, usa a última coluna */
  footerValueColumn?: string;
  /** Texto do rodapé direito (ex: "Estoque Geral — Consulta") */
  footerRight?: string;
}

// =============================================================================
// CSS
// =============================================================================

const PRINT_CSS = `
  @page { margin: 20mm 15mm; size: A4 }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #1a1a1a; font-size: 12px; line-height: 1.5; }

  /* Header */
  .header { border-bottom: 2px solid #1a1a1a; padding-bottom: 16px; margin-bottom: 20px; }
  .header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
  .brand { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #666; font-weight: 600; }
  .timestamp { font-size: 10px; color: #888; text-align: right; }
  .title { font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px; }
  .subtitle { font-size: 16px; font-weight: 600; color: #334155; margin-top: 2px; }

  /* Meta chips */
  .meta { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
  .chip { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 10px; color: #475569; font-weight: 500; }
  .chip.mono { font-family: 'Cascadia Code', 'Fira Code', monospace; }
  .color-dot { width: 10px; height: 10px; border-radius: 50%; border: 1px solid rgba(0,0,0,0.15); display: inline-block; }

  /* Summary cards */
  .summary { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
  .summary-card { flex: 1; min-width: 120px; padding: 12px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; display: flex; flex-direction: column; justify-content: space-between; }
  .summary-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: 600; }
  .summary-value { font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 2px; text-align: right; }
  .summary-value .unit { font-size: 12px; font-weight: 400; color: #64748b; margin-left: 2px; }

  /* Table */
  table { width: 100%; border-collapse: collapse; }
  thead th { background: #0f172a; color: #fff; font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600; padding: 8px 12px; text-align: left; }
  thead th.right { text-align: right; }
  thead th.center { text-align: center; }
  tbody td { padding: 7px 12px; border-bottom: 1px solid #f1f5f9; font-size: 11px; }
  tbody tr.odd { background: #fafbfc; }
  tbody tr:hover { background: #f1f5f9; }
  td.mono { font-family: 'Cascadia Code', 'Fira Code', monospace; font-size: 10px; }
  td.right { text-align: right; font-variant-numeric: tabular-nums; }
  td.center { text-align: center; }
  td.bold { font-weight: 600; }

  /* Footer total */
  tfoot td { padding: 10px 12px; font-weight: 700; font-size: 12px; border-top: 2px solid #0f172a; background: #f8fafc; }

  /* Print footer */
  .print-footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 9px; color: #94a3b8; }

  @media print {
    .no-print { display: none; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
`;

// =============================================================================
// BUILDER
// =============================================================================

export function printListing(options: PrintListingOptions): void {
  const {
    title,
    subtitle,
    brandText,
    columns,
    rows,
    summary,
    chips,
    footerLabel,
    footerValue,
    footerValueColumn,
    footerRight,
  } = options;

  const now = new Date().toLocaleString('pt-BR');

  // Header
  const headerHtml = `
    <div class="header">
      <div class="header-top">
        <div>
          ${brandText ? `<div class="brand">${brandText}</div>` : ''}
          <div class="title">${title}</div>
          ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
        </div>
        <div class="timestamp">
          Impresso em<br><strong>${now}</strong>
        </div>
      </div>
      ${chips && chips.length > 0 ? `<div class="meta">${chips.map((c) => `<span class="chip${c.mono ? ' mono' : ''}">${c.colorDot ? `<span class="color-dot" style="background:${c.colorDot}"></span>` : ''}${c.label}</span>`).join('')}</div>` : ''}
    </div>
  `;

  // Summary cards
  const summaryHtml =
    summary && summary.length > 0
      ? `<div class="summary">${summary.map((s) => `<div class="summary-card"><div class="summary-label">${s.label}</div><div class="summary-value">${s.value}${s.unit ? `<span class="unit">${s.unit}</span>` : ''}</div></div>`).join('')}</div>`
      : '';

  // Table headers
  const theadHtml = columns
    .map(
      (col) =>
        `<th class="${col.align ?? 'left'}"${col.width ? ` style="width:${col.width}"` : ''}>${col.label}</th>`
    )
    .join('');

  // Table rows
  const tbodyHtml = rows
    .map((row, idx) => {
      const cells = columns
        .map((col) => {
          const classes: string[] = [];
          if (col.mono) classes.push('mono');
          if (col.align === 'right') classes.push('right');
          if (col.align === 'center') classes.push('center');
          if (col.bold) classes.push('bold');
          return `<td${classes.length > 0 ? ` class="${classes.join(' ')}"` : ''}>${row[col.key] ?? ''}</td>`;
        })
        .join('');
      return `<tr class="${idx % 2 !== 0 ? 'odd' : ''}">${cells}</tr>`;
    })
    .join('');

  // Table footer
  let tfootHtml = '';
  if (footerLabel || footerValue) {
    const valueColKey = footerValueColumn ?? columns[columns.length - 1]?.key;
    const valueColIdx = columns.findIndex((c) => c.key === valueColKey);
    const spanBefore = valueColIdx > 0 ? valueColIdx : columns.length - 1;
    const spanAfter = columns.length - spanBefore - 1;

    tfootHtml = `<tfoot><tr>
      <td colspan="${spanBefore}">${footerLabel || ''}</td>
      <td class="right">${footerValue || ''}</td>
      ${spanAfter > 0 ? `<td colspan="${spanAfter}"></td>` : ''}
    </tr></tfoot>`;
  }

  // Print footer
  const printFooterHtml = `
    <div class="print-footer">
      <span>OpenSea — Sistema de Gestão</span>
      <span>${footerRight || title}</span>
    </div>
  `;

  // Full HTML
  const html = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"><title>${title}</title>
<style>${PRINT_CSS}</style>
</head><body>
${headerHtml}
${summaryHtml}
<table>
  <thead><tr>${theadHtml}</tr></thead>
  <tbody>${tbodyHtml}</tbody>
  ${tfootHtml}
</table>
${printFooterHtml}
<script>window.onload=function(){window.print()}<\/script>
</body></html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}
