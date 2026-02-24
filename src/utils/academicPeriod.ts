/**
 * Academic Period Utilities
 * Handles academic year ranges dynamically (terms removed)
 */

export interface AcademicYearDateRange {
  startDate: Date;
  endDate: Date;
}

const MIN_YEAR = 2020;
const MAX_YEAR = 2040;

/**
 * Format academic year range: 2025 -> "2025-26"
 */
export function formatAcademicYearRange(yearStart: number): string {
  const yearEnd = (yearStart + 1) % 100;
  return `${yearStart}-${yearEnd.toString().padStart(2, '0')}`;
}

/**
 * Generate list of academic year ranges
 */
export function generateAcademicYearRanges(): string[] {
  const ranges: string[] = [];
  for (let year = MIN_YEAR; year <= MAX_YEAR; year++) {
    ranges.push(formatAcademicYearRange(year));
  }
  return ranges;
}

/**
 * Parse academic year range: "2025-26" -> 2025
 */
export function parseAcademicYearRange(range: string): number {
  return parseInt(range.split('-')[0], 10);
}

/**
 * Normalize academic year range input to "YYYY-YY".
 * Accepts "25-26", "2025-26", or "2025-2026".
 */
export function normalizeAcademicYearRange(input: string): string | null {
  const trimmed = input.trim();
  const match = trimmed.match(/^(\d{2}|\d{4})\s*-\s*(\d{2}|\d{4})$/);
  if (!match) return null;

  const startRaw = match[1];
  const endRaw = match[2];
  const startYear = startRaw.length === 2 ? 2000 + Number(startRaw) : Number(startRaw);
  if (Number.isNaN(startYear)) return null;

  const expectedEnd = (startYear + 1) % 100;
  const endTwoDigits = endRaw.length === 2 ? Number(endRaw) : Number(endRaw.slice(-2));
  if (Number.isNaN(endTwoDigits) || endTwoDigits !== expectedEnd) return null;

  return formatAcademicYearRange(startYear);
}

/**
 * Get academic year date range (Sep 1 - Aug 31)
 */
export function getAcademicYearDateRange(yearStart: number): AcademicYearDateRange {
  return {
    startDate: new Date(yearStart, 8, 1), // Sep 1
    endDate: new Date(yearStart + 1, 7, 31), // Aug 31
  };
}

/**
 * Get current academic year start based on today's date
 */
export function getCurrentAcademicYearStart(): number {
  const today = new Date();
  const month = today.getMonth();
  const year = today.getFullYear();
  return month >= 8 ? year : year - 1;
}

/**
 * Format date to YYYY-MM-DD
 */
export function formatDateString(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}
