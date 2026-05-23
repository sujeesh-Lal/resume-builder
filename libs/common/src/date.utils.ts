export function toISOString(date?: Date): string {
  return (date ?? new Date()).toISOString();
}

export function formatDate(dateStr: string, format: 'short' | 'long' = 'short'): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  if (format === 'long') {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  }
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}
