export const getLocalDateKey = (value?: string): string => {
  if (!value) return '';
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return text.slice(0, 10);
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
};

export const getTodayDateKey = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export const formatLocalDate = (value?: string): string => {
  const key = getLocalDateKey(value);
  const [year, month, day] = key.split('-').map(Number);
  if (!year || !month || !day) return value || '';
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

export const getWeekday = (value?: string): string => {
  const key = getLocalDateKey(value);
  const [year, month, day] = key.split('-').map(Number);
  if (!year || !month || !day) return '';
  return new Date(year, month - 1, day).toLocaleDateString(undefined, { weekday: 'short' });
};
