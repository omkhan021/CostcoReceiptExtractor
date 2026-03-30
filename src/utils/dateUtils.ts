import dayjs from 'dayjs';

export function toISODate(date: Date | string): string {
  return dayjs(date).format('YYYY-MM-DD');
}

export function toISODateTime(date: Date | string = new Date()): string {
  return dayjs(date).toISOString();
}

export function formatDisplayDate(isoDate: string): string {
  return dayjs(isoDate).format('MMM D, YYYY');
}

export function subtractMonths(date: Date, months: number): Date {
  return dayjs(date).subtract(months, 'month').toDate();
}

/** Formats a date as M/DD/YYYY — the format required by the Costco receiptsWithCounts API */
export function toCostcoDate(date: Date | string): string {
  return dayjs(date).format('M/DD/YYYY');
}

/** Returns an array of [startDate, endDate] pairs covering the given range in 6-month chunks */
export function buildSyncWindows(
  fromDate: Date,
  toDate: Date,
  windowMonths: number,
): Array<{start: string; end: string}> {
  const windows: Array<{start: string; end: string}> = [];
  let cursor = dayjs(fromDate);
  const end = dayjs(toDate);

  while (cursor.isBefore(end)) {
    const windowEnd = cursor.add(windowMonths, 'month');
    windows.push({
      start: cursor.format('YYYY-MM-DD'),
      end: (windowEnd.isAfter(end) ? end : windowEnd).format('YYYY-MM-DD'),
    });
    cursor = windowEnd;
  }

  return windows;
}
