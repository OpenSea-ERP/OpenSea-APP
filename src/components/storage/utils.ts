/**
 * Formata bytes para uma representação legível (KB, MB, GB).
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = bytes / Math.pow(k, i);

  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/**
 * Retorna a extensão de um nome de arquivo.
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  if (parts.length < 2) return '';
  return parts[parts.length - 1].toLowerCase();
}

/**
 * Trunca um nome de arquivo mantendo a extensão.
 */
export function truncateFileName(name: string, maxLength = 28): string {
  if (name.length <= maxLength) return name;

  const ext = getFileExtension(name);
  const nameWithoutExt = ext ? name.slice(0, -(ext.length + 1)) : name;
  const truncatedName = nameWithoutExt.slice(0, maxLength - ext.length - 4);

  return ext ? `${truncatedName}...${ext}` : `${truncatedName}...`;
}
