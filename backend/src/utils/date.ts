/**
 * Date utility helpers for reliable date-only (calendar date) handling
 * avoiding UTC conversion shifts across timezones.
 */

/**
 * Format Date to YYYY-MM-DD using local calendar date values
 */
export const formatDateOnly = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  const d = typeof date === 'string' ? parseDateOnly(date) : new Date(date);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parse YYYY-MM-DD string into local Date at 00:00:00
 */
export const parseDateOnly = (dateStr: string | Date): Date => {
  if (dateStr instanceof Date) {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const [year, month, day] = dateStr.slice(0, 10).split('-').map(Number);
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Parse end of date (23:59:59.999)
 */
export const parseDateOnlyEnd = (dateStr: string | Date): Date => {
  if (dateStr instanceof Date) {
    const d = new Date(dateStr);
    d.setHours(23, 59, 59, 999);
    return d;
  }
  if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const [year, month, day] = dateStr.slice(0, 10).split('-').map(Number);
    return new Date(year, month - 1, day, 23, 59, 59, 999);
  }
  const d = new Date(dateStr);
  d.setHours(23, 59, 59, 999);
  return d;
};

export interface WeekRangeResult {
  weekStart: Date;
  weekEnd: Date;
  weekStartStr: string;
  weekEndStr: string;
}

/**
 * Calculate Monday to Friday week range for reporting
 */
export const getWeekRange = (
  startDateParam?: string,
  endDateParam?: string,
  targetDateParam?: string
): WeekRangeResult => {
  if (startDateParam && endDateParam) {
    const start = parseDateOnly(startDateParam);
    const end = parseDateOnlyEnd(endDateParam);
    return {
      weekStart: start,
      weekEnd: end,
      weekStartStr: formatDateOnly(start),
      weekEndStr: formatDateOnly(end),
    };
  }

  const baseDate = targetDateParam
    ? parseDateOnly(targetDateParam)
    : startDateParam
    ? parseDateOnly(startDateParam)
    : new Date();

  const day = baseDate.getDay();
  // Monday is 1, Sunday is 0 -> diff: if 0 then -6 else 1 - day
  const diffToMonday = (day === 0 ? -6 : 1) - day;

  const monday = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + diffToMonday, 0, 0, 0, 0);
  const friday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 4, 23, 59, 59, 999);

  return {
    weekStart: monday,
    weekEnd: friday,
    weekStartStr: formatDateOnly(monday),
    weekEndStr: formatDateOnly(friday),
  };
};
