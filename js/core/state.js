/* ==========================================================================
   MY DISCIPLINE — Central State Store
   Reactive state container with listener subscriptions
   ========================================================================== */

import { getTodayISO, shiftISO } from './dates.js';
import { retrieveState, persistState } from './storage.js';
import { hasLegacyData, migrateLegacyData } from './migration.js';
import { recordDaySnapshot } from './history.js';

let appState = null;
const listeners = new Set();

export function createBlankState() {
  return {
    version: 3,
    settings: {
      theme: 'dark',
      threshold: 80,
      userName: 'Azamat'
    },
    tasks: [],
    goals: [],
    logs: {},        // { 'YYYY-MM-DD': ['taskId1', ...] }
    snapshots: {},   // { 'YYYY-MM-DD': { date, taskSnapshots, completedTaskIds, pct, ... } }
    journals: {}     // { 'YYYY-MM-DD': { win: '', blocker: '', next: '' } }
  };
}

export function createDemoState() {
  const today = getTodayISO();
  const start7 = shiftISO(today, -7);

  const t1 = 't_book';
  const t2 = 't_plan';
  const t3 = 't_code';
  const t4 = 't_sport';

  const tasks = [
    { id: t1, title: 'Kitob o‘qish (30 daqiqa)',           type: 'daily', createdAt: start7, isActive: true },
    { id: t2, title: 'Kundalik reja tuzish',              type: 'daily', createdAt: start7, isActive: true },
    { id: t3, title: 'Kod yozish / Loyiha ustida ishlash', type: 'daily', createdAt: start7, isActive: true },
    { id: t4, title: 'Jismoniy mashqlar (30 daqiqa)',      type: 'daily', createdAt: start7, isActive: true }
  ];

  const goals = [
    { id: 'g_1', title: '300 bet kitob o‘qish',         current: 180, target: 300, unit: 'bet', type: '30d' },
    { id: 'g_2', title: '30 kun uzluksiz intizom',      current: 7,   target: 30,  unit: 'kun', type: '30d' },
    { id: 'g_3', title: 'Shaxsiy portfolioni yakunlash', current: 75,  target: 100, unit: '%',   type: 'long' }
  ];

  // Past 7 days realistic history (7-day streak!)
  // Today has 3 out of 4 tasks checked
  const logs = {
    [shiftISO(today, -7)]: [t1, t2, t3, t4],
    [shiftISO(today, -6)]: [t1, t2, t3, t4],
    [shiftISO(today, -5)]: [t1, t2, t3, t4],
    [shiftISO(today, -4)]: [t1, t2, t3, t4],
    [shiftISO(today, -3)]: [t1, t2, t3, t4],
    [shiftISO(today, -2)]: [t1, t2, t3, t4],
    [shiftISO(today, -1)]: [t1, t2, t3, t4],
    [today]: [t1, t2, t4] // 3 tasks done -> 75% - 85% range
  };

  const journals = {
    [shiftISO(today, -1)]: {
      win: 'Barcha 4 ta vazifani 100% bajardim, kechqurun chalg‘imadim.',
      blocker: 'Tushlikdan keyin biroz telefon chalg‘itdi.',
      next: 'Ertalab birinchi bo‘lib eng qiyin vazifani yopish'
    },
    [shiftISO(today, -2)]: {
      win: 'Sport va kitob o‘qishni o‘z vaqtida tugatdim.',
      blocker: 'Uyquga biroz kech yotdim.',
      next: '23:00 dan oldin telefonni qo‘yish'
    }
  };

  const demoState = {
    version: 3,
    settings: {
      theme: 'dark',
      threshold: 75,
      userName: 'Azamat'
    },
    tasks,
    goals,
    logs,
    snapshots: {},
    journals
  };

  // Pre-seed past snapshots for demo data
  for (let i = 7; i >= 1; i--) {
    const d = shiftISO(today, -i);
    recordDaySnapshot(d, demoState);
  }
  recordDaySnapshot(today, demoState);

  return demoState;
}

/**
 * Initializes state: checks IndexedDB/localStorage, then legacy migration, then demo
 */
export async function initState() {
  const existing = await retrieveState();
  if (existing && Array.isArray(existing.tasks)) {
    appState = {
      ...createBlankState(),
      ...existing,
      settings: {
        theme: 'dark',
        threshold: 75,
        userName: 'Azamat',
        ...(existing.settings || {})
      }
    };
    return appState;
  }

  // Check if legacy 'my_discipline_v2' exists
  if (hasLegacyData()) {
    const migrated = migrateLegacyData();
    if (migrated) {
      appState = migrated;
      await persistState(appState);
      return appState;
    }
  }

  // Fallback to fresh demo state matching screenshot
  appState = createDemoState();
  await persistState(appState);
  return appState;
}

export function getState() {
  if (!appState) appState = createDemoState();
  return appState;
}

export async function updateState(mutator) {
  if (typeof mutator === 'function') {
    mutator(appState);
  }
  await persistState(appState);
  notifyListeners();
}

export function subscribeState(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notifyListeners() {
  for (const cb of listeners) {
    try {
      cb(appState);
    } catch (e) {
      console.error('State subscriber error:', e);
    }
  }
}
