/* ==========================================================================
   MY DISCIPLINE — Date Helpers & Utilities
   Pure ES Modules, zero external dependencies
   ========================================================================== */

export const UZ_MONTHS = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
];

export const UZ_WEEKDAYS_SHORT = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];
export const UZ_WEEKDAYS_FULL = [
  'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba'
];

/**
 * Converts a Date object to YYYY-MM-DD
 */
export function toISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parses YYYY-MM-DD into a local Date object
 */
export function fromISO(iso) {
  if (!iso || typeof iso !== 'string') return new Date();
  const parts = iso.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return new Date();
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

/**
 * Returns today's ISO date string
 */
export function getTodayISO() {
  return toISO(new Date());
}

/**
 * Shifts an ISO date string by deltaDays (+ or -)
 */
export function shiftISO(iso, deltaDays) {
  const d = fromISO(iso);
  d.setDate(d.getDate() + deltaDays);
  return toISO(d);
}

/**
 * Returns difference in days between two ISO dates (end - start)
 */
export function diffDays(startISO, endISO) {
  const start = fromISO(startISO);
  const end = fromISO(endISO);
  return Math.round((end - start) / 86400000);
}

/**
 * Returns weekday index where Monday is 0 and Sunday is 6
 */
export function getWeekdayMon0(iso) {
  const d = fromISO(iso);
  return (d.getDay() + 6) % 7;
}

/**
 * Full formatted date in Uzbek, e.g. "Dushanba, 23-Noyabr"
 */
export function formatUzDateFull(iso) {
  const d = fromISO(iso);
  const wd = UZ_WEEKDAYS_FULL[(d.getDay() + 6) % 7];
  return `${wd}, ${d.getDate()}-${UZ_MONTHS[d.getMonth()]}`;
}

/**
 * Short formatted date in Uzbek, e.g. "23-Noyabr 2026"
 */
export function formatUzDateShort(iso) {
  const d = fromISO(iso);
  return `${d.getDate()}-${UZ_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Month and year in Uzbek, e.g. "Noyabr 2026"
 */
export function formatUzMonthYear(year, monthIndex) {
  return `${UZ_MONTHS[monthIndex]} ${year}`;
}

/**
 * Generates collision-resistant unique ID
 */
export function uid(prefix = 'id') {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Safe HTML string escaping to prevent XSS
 */
export function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
