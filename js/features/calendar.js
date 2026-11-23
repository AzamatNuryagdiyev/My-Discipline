/* ==========================================================================
   MY DISCIPLINE — Calendar Feature Module
   Renders monthly heatmap, selected day inspect, and 7-day bar chart
   ========================================================================== */

import { getTodayISO, fromISO, shiftISO, getWeekdayMon0 } from '../core/dates.js';
import { getDayStatsWithSnapshot } from '../core/history.js';
import { getTotalPoints } from './statistics.js';

/**
 * Computes calendar month data
 */
export function getCalendarMonthData(year, monthIndex, state) {
  const today = getTodayISO();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const startOffset = (new Date(year, monthIndex, 1).getDay() + 6) % 7; // Mon=0 .. Sun=6

  let monthSum = 0;
  let monthActiveDaysCount = 0;
  let perfectDaysMonth = 0;

  const days = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const iso = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isFuture = iso > today;
    const stats = getDayStatsWithSnapshot(iso, state);

    if (!isFuture && (stats.hasActivity || iso === today)) {
      monthSum += stats.pct;
      monthActiveDaysCount++;
      if (stats.isPerfect) perfectDaysMonth++;
    }

    days.push({
      dayNum: d,
      iso,
      isFuture,
      isToday: iso === today,
      stats
    });
  }

  const monthAvg = monthActiveDaysCount > 0 ? Math.round(monthSum / monthActiveDaysCount) : 0;
  const totalPoints = getTotalPoints(state);

  return {
    year,
    monthIndex,
    startOffset,
    days,
    monthAvg,
    perfectDaysMonth,
    totalPoints
  };
}

/**
 * Computes past 7 days bar chart data
 */
export function getLast7DaysChartData(state) {
  const today = getTodayISO();
  const list = [];

  for (let i = 6; i >= 0; i--) {
    const iso = shiftISO(today, -i);
    const stats = getDayStatsWithSnapshot(iso, state);
    const wdIndex = getWeekdayMon0(iso);

    list.push({
      iso,
      wdIndex,
      pct: stats.pct,
      isToday: iso === today,
      isPerfect: stats.isPerfect
    });
  }

  return list;
}
