/* ==========================================================================
   MY DISCIPLINE — Statistics & Streak Engine
   Computes exact streaks, total points, and historical performance
   ========================================================================== */

import { getTodayISO, shiftISO, diffDays } from '../core/dates.js';
import { getDayStatsWithSnapshot } from '../core/history.js';

/**
 * Computes total lifetime points earned
 */
export function getTotalPoints(state) {
  const recordedDates = new Set();

  if (state.snapshots) {
    Object.keys(state.snapshots).forEach(d => recordedDates.add(d));
  }
  if (state.logs) {
    Object.keys(state.logs).forEach(d => recordedDates.add(d));
  }
  recordedDates.add(getTodayISO());

  let total = 0;
  recordedDates.forEach(dateISO => {
    const stats = getDayStatsWithSnapshot(dateISO, state);
    total += (stats.points || 0);
  });

  return total;
}

/**
 * Computes current and best streak based on configurable threshold
 */
export function getStreakInfo(state) {
  const today = getTodayISO();
  const threshold = state.settings?.threshold || 80;
  const todayStats = getDayStatsWithSnapshot(today, state);

  // Find earliest recorded date
  let earliest = today;
  if (state.logs) {
    Object.keys(state.logs).forEach(d => { if (d < earliest) earliest = d; });
  }
  if (state.snapshots) {
    Object.keys(state.snapshots).forEach(d => { if (d < earliest) earliest = d; });
  }
  if (state.tasks) {
    state.tasks.forEach(t => { if (t.createdAt && t.createdAt < earliest) earliest = t.createdAt; });
  }

  // 1. Current streak calculation
  let current = 0;
  let cursor = todayStats.isSuccess ? today : shiftISO(today, -1);

  for (let i = 0; i < 730; i++) {
    if (cursor < earliest) break;
    const s = getDayStatsWithSnapshot(cursor, state);
    if (s.isSuccess) {
      current++;
      cursor = shiftISO(cursor, -1);
    } else {
      break;
    }
  }

  // 2. Best streak & Perfect streak calculation
  let best = 0;
  let run = 0;
  let bestPerfectStreak = 0;
  let runPerfect = 0;
  let totalPerfectDays = 0;

  const totalDaysSpan = Math.min(Math.max(diffDays(earliest, today), 0), 730);

  for (let i = 0; i <= totalDaysSpan; i++) {
    const d = shiftISO(earliest, i);
    const s = getDayStatsWithSnapshot(d, state);

    if (s.isSuccess) {
      run++;
      if (run > best) best = run;
    } else {
      run = 0;
    }

    if (s.isPerfect) {
      totalPerfectDays++;
      runPerfect++;
      if (runPerfect > bestPerfectStreak) bestPerfectStreak = runPerfect;
    } else {
      runPerfect = 0;
    }
  }

  if (current > best) best = current;

  return {
    current,
    best,
    bestPerfectStreak,
    totalPerfectDays,
    threshold
  };
}
