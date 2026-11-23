/* ==========================================================================
   MY DISCIPLINE — Tasks Feature Module
   Handles Task CRUD, Toggle, Scoring, and Snapshot sync
   ========================================================================== */

import { uid, getTodayISO } from '../core/dates.js';
import { getState, updateState } from '../core/state.js';
import { recordDaySnapshot, getDayStatsWithSnapshot, POINTS_PER_TASK, BONUS_100_POINTS } from '../core/history.js';
import { showToast } from '../ui/notifications.js';
import { checkNewAchievements } from './achievements.js';

/**
 * Returns tasks for a given date
 */
export function getTasksForDate(dateISO) {
  const state = getState();
  return (state.tasks || []).filter(t => {
    if (t.isActive === false) return false;
    if (t.type === 'daily') {
      return !t.createdAt || t.createdAt <= dateISO;
    }
    return t.date === dateISO;
  });
}

/**
 * Adds a new task
 */
export async function addTask(title, type = 'daily') {
  const cleanTitle = String(title || '').trim();
  if (!cleanTitle) return null;

  const today = getTodayISO();
  const newTask = {
    id: uid('t'),
    title: cleanTitle,
    type: type === 'today' ? 'today' : 'daily',
    date: type === 'today' ? today : undefined,
    createdAt: today,
    isActive: true
  };

  await updateState(state => {
    if (!state.tasks) state.tasks = [];
    state.tasks.push(newTask);
    recordDaySnapshot(today, state);
  });

  showToast('Vazifa qo‘shildi ✓');
  return newTask;
}

/**
 * Edits an existing task's title or type
 */
export async function editTask(taskId, newTitle, newType) {
  const cleanTitle = String(newTitle || '').trim();
  if (!cleanTitle) return false;

  const today = getTodayISO();
  let updated = false;

  await updateState(state => {
    const task = (state.tasks || []).find(t => t.id === taskId);
    if (task) {
      task.title = cleanTitle;
      if (newType) {
        task.type = newType;
        if (newType === 'today' && !task.date) {
          task.date = today;
        }
      }
      recordDaySnapshot(today, state);
      updated = true;
    }
  });

  if (updated) showToast('Vazifa yangilandi ✓');
  return updated;
}

/**
 * Toggles completion status of a task for today
 */
export async function toggleTask(taskId) {
  const today = getTodayISO();
  const stateBefore = getState();
  const beforeStats = getDayStatsWithSnapshot(today, stateBefore);

  let isChecking = false;
  let pointsAwarded = 0;

  await updateState(state => {
    if (!state.logs) state.logs = {};
    if (!state.logs[today]) state.logs[today] = [];

    const list = state.logs[today];
    const idx = list.indexOf(taskId);
    if (idx === -1) {
      list.push(taskId);
      isChecking = true;
    } else {
      list.splice(idx, 1);
      isChecking = false;
    }

    recordDaySnapshot(today, state);
  });

  const stateAfter = getState();
  const afterStats = getDayStatsWithSnapshot(today, stateAfter);

  if (isChecking) {
    if (afterStats.isPerfect && !beforeStats.isPerfect) {
      showToast(`100% Intizom! +${POINTS_PER_TASK + BONUS_100_POINTS} ball 💪⚡`);
    } else {
      showToast(`+${POINTS_PER_TASK} ball ⚡`);
    }
  }

  // Check for newly unlocked badges
  checkNewAchievements(stateAfter);
}

/**
 * Deletes a task
 */
export async function deleteTask(taskId) {
  const today = getTodayISO();

  await updateState(state => {
    const task = (state.tasks || []).find(t => t.id === taskId);
    if (task) {
      // Soft-deactivate to protect legacy snapshot references
      task.isActive = false;
    }
    // Remove from active tasks array
    state.tasks = (state.tasks || []).filter(t => t.id !== taskId);

    // Also remove from today's log if not completed
    if (state.logs && state.logs[today]) {
      state.logs[today] = state.logs[today].filter(id => id !== taskId);
    }

    recordDaySnapshot(today, state);
  });

  showToast('Vazifa o‘chirildi');
}
