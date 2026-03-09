/**
 * CSV Export Utility
 * Exports data arrays to CSV files with UTF-8 BOM for Excel compatibility
 */

interface CsvColumn<T> {
  /** Header label */
  header: string;
  /** Accessor function to get the value from each row */
  accessor: (item: T) => string | number | boolean | null | undefined;
}

/**
 * Exports an array of items to a CSV file and triggers a browser download.
 *
 * @param items - Array of data objects
 * @param columns - Column definitions with header labels and accessor functions
 * @param filename - Filename without extension (e.g., "bonificacoes")
 */
export function exportToCSV<T>(
  items: T[],
  columns: CsvColumn<T>[],
  filename: string
): void {
  // UTF-8 BOM for Excel compatibility
  const BOM = '\uFEFF';

  const headers = columns.map(col => escapeCsvField(col.header));
  const rows = items.map(item =>
    columns.map(col => {
      const value = col.accessor(item);
      if (value === null || value === undefined) return '';
      return escapeCsvField(String(value));
    })
  );

  const csvContent =
    BOM + [headers.join(';'), ...rows.map(row => row.join(';'))].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();

  URL.revokeObjectURL(url);
}

function escapeCsvField(value: string): string {
  if (
    value.includes(';') ||
    value.includes('"') ||
    value.includes('\n') ||
    value.includes('\r')
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
