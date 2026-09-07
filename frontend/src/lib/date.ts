/**
 * Frontend date utility helpers for date-only calendar strings
 */

export const formatDateOnly = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  if (typeof date === 'string') {
    if (/^\d{4}-\d{2}-\d{2}/.test(date)) {
      return date.slice(0, 10);
    }
    const d = new Date(date);
    if (isNaN(d.getTime())) return date;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDisplayDate = (date: Date | string | null | undefined): string => {
  if (!date) return '—';
  const isoStr = formatDateOnly(date);
  if (!isoStr) return '—';
  const [year, month, day] = isoStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const getCurrentWeekRange = () => {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
  const friday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 4);

  return {
    weekStart: formatDateOnly(monday),
    weekEnd: formatDateOnly(friday),
  };
};
