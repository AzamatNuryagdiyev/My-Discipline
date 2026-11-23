/* ==========================================================================
   MY DISCIPLINE — History & Snapshot Engine
   Guarantees that past days remain strictly immutable when tasks change
   ========================================================================== */

import { getTodayISO } from './dates.js';

export const POINTS_PER_TASK = 10;
export const BONUS_100_POINTS = 25;

/**
 * Calculates live stats for a given day from current tasks & logs
 */
export function calculateLiveDayStats(dateISO, tasks, logs, threshold = 80) {
  const activeTasks = tasks.filter(t => {
    if (t.isActive === false) return false;
    if (t.type === 'daily') {
      return !t.createdAt || t.createdAt <= dateISO;
    }
    return t.date === dateISO;
  });

  const doneList = logs[dateISO] || [];
  const doneSet = new Set(doneList);

  const completed = activeTasks.filter(t => doneSet.has(t.id)).length;
  const total = activeTasks.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const isPerfect = total > 0 && pct === 100;
  const isSuccess = total > 0 && pct >= threshold;
  const basePoints = completed * POINTS_PER_TASK;
  const bonusPoints = isPerfect ? BONUS_100_POINTS : 0;
  const points = basePoints + bonusPoints;

  return {
    date: dateISO,
    tasks: activeTasks,
    doneSet,
    completed,
    total,
    pct,
    isPerfect,
    isSuccess,
    basePoints,
    bonusPoints,
    points,
    hasActivity: doneList.length > 0 || completed > 0
  };
}

/**
 * Retrieves stats for a day.
 * If date is in the past (< today) and a snapshot exists, returns the snapshot.
 * Otherwise computes live stats and creates/updates snapshot.
 */
export function getDayStatsWithSnapshot(dateISO, state) {
  const today = getTodayISO();
  const threshold = state.settings?.threshold || 80;

  // Past date with finalized snapshot -> IMMUTABLE
  if (dateISO < today && state.snapshots && state.snapshots[dateISO]) {
    const snap = state.snapshots[dateISO];
    const doneSet = new Set(snap.completedTaskIds || []);
    const tasks = snap.taskSnapshots || [];

    return {
      date: dateISO,
      tasks,
      doneSet,
      completed: snap.completed ?? 0,
      total: snap.total ?? tasks.length,
      pct: snap.pct ?? 0,
      isPerfect: Boolean(snap.isPerfect),
      isSuccess: Boolean(snap.isSuccess),
      basePoints: (snap.completed ?? 0) * POINTS_PER_TASK,
      bonusPoints: snap.isPerfect ? BONUS_100_POINTS : 0,
      points: snap.points ?? 0,
      hasActivity: (snap.completedTaskIds?.length > 0) || (snap.completed > 0),
      isSnapshot: true
    };
  }

  // Today or missing snapshot -> Compute live
  const live = calculateLiveDayStats(dateISO, state.tasks || [], state.logs || {}, threshold);

  return live;
}

/**
 * Freezes and updates a day snapshot
 */
export function recordDaySnapshot(dateISO, state) {
  const live = calculateLiveDayStats(dateISO, state.tasks || [], state.logs || {}, state.settings?.threshold || 80);
  const today = getTodayISO();

  if (!state.snapshots) state.snapshots = {};

  state.snapshots[dateISO] = {
    date: dateISO,
    taskSnapshots: live.tasks.map(t => ({
      id: t.id,
      title: t.title,
      type: t.type
    })),
    completedTaskIds: Array.from(live.doneSet),
    completed: live.completed,
    total: live.total,
    pct: live.pct,
    points: live.points,
    isPerfect: live.isPerfect,
    isSuccess: live.isSuccess,
    finalized: dateISO < today,
    updatedAt: Date.now()
  };
}
