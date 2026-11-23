/* ==========================================================================
   MY DISCIPLINE — Migration Engine
   Migrates legacy 'my_discipline_v2' localStorage safely without data loss
   ========================================================================== */

import { getTodayISO } from './dates.js';

export const LEGACY_STORAGE_KEY = 'my_discipline_v2';
export const MIGRATION_FLAG_KEY = 'my_discipline_v2_migrated';

/**
 * Detects whether legacy data exists and needs migration
 */
export function hasLegacyData() {
  return Boolean(localStorage.getItem(LEGACY_STORAGE_KEY));
}

/**
 * Migrates data from legacy 'my_discipline_v2' to modern V3 schema.
 * Leaves old key intact as a safe backup.
 */
export function migrateLegacyData() {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;

    const legacy = JSON.parse(raw);
    if (!legacy || typeof legacy !== 'object') return null;

    const today = getTodayISO();

    // 1. Settings
    const settings = {
      theme: legacy.settings?.theme === 'light' ? 'light' : 'dark',
      threshold: [70, 80, 90, 100].includes(Number(legacy.settings?.threshold))
        ? Number(legacy.settings.threshold)
        : 80
    };

    // 2. Tasks
    const tasks = Array.isArray(legacy.tasks) ? legacy.tasks.map((t, idx) => ({
      id: String(t.id || `t_${idx}`),
      title: String(t.title || 'Vazifa').trim(),
      type: t.type === 'today' ? 'today' : 'daily',
      date: t.date || (t.type === 'today' ? today : undefined),
      createdAt: t.createdAt || today,
      isActive: true
    })) : [];

    // 3. Goals
    const goals = Array.isArray(legacy.goals) ? legacy.goals.map((g, idx) => ({
      id: String(g.id || `g_${idx}`),
      title: String(g.title || 'Maqsad').trim(),
      current: Math.max(0, Number(g.current) || 0),
      target: Math.max(1, Number(g.target) || 30),
      unit: String(g.unit || 'kun').trim(),
      type: g.type === 'long' ? 'long' : '30d'
    })) : [];

    // 4. Logs (Historical task completion lists)
    const logs = (legacy.logs && typeof legacy.logs === 'object') ? legacy.logs : {};

    // 5. Journals
    const journals = (legacy.journals && typeof legacy.journals === 'object') ? legacy.journals : {};

    // 6. Build initial historical snapshots from legacy logs to guarantee immutability
    const snapshots = {};
    const taskMap = new Map(tasks.map(t => [t.id, t]));

    Object.keys(logs).forEach(dateISO => {
      const completedIds = Array.isArray(logs[dateISO]) ? logs[dateISO] : [];
      // Determine which tasks existed at that date
      const dayTasks = tasks.filter(t => {
        if (t.type === 'daily') {
          return !t.createdAt || t.createdAt <= dateISO;
        }
        return t.date === dateISO;
      });

      const total = dayTasks.length;
      const completedCount = completedIds.filter(id => taskMap.has(id)).length;
      const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;
      const isPerfect = total > 0 && pct === 100;
      const isSuccess = total > 0 && pct >= settings.threshold;
      const points = (completedCount * 10) + (isPerfect ? 25 : 0);

      snapshots[dateISO] = {
        date: dateISO,
        taskSnapshots: dayTasks.map(t => ({
          id: t.id,
          title: t.title,
          type: t.type
        })),
        completedTaskIds: [...completedIds],
        total,
        completed: completedCount,
        pct,
        points,
        isPerfect,
        isSuccess,
        finalized: dateISO < today
      };
    });

    localStorage.setItem(MIGRATION_FLAG_KEY, 'true');

    return {
      version: 3,
      settings,
      tasks,
      goals,
      logs,
      snapshots,
      journals,
      migratedAt: Date.now()
    };
  } catch (err) {
    console.error('Migration failed:', err);
    return null;
  }
}
