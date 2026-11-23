/* ==========================================================================
   MY DISCIPLINE — Goals Feature Module
   Handles 30-Day and Long-Term Goals CRUD, Increments, Progress
   ========================================================================== */

import { uid } from '../core/dates.js';
import { getState, updateState } from '../core/state.js';
import { showToast } from '../ui/notifications.js';

/**
 * Returns goals by type: '30d' or 'long'
 */
export function getGoalsByType(type = '30d') {
  const state = getState();
  return (state.goals || []).filter(g => g.type === type);
}

/**
 * Adds a new goal
 */
export async function addGoal(title, target, unit, type = '30d') {
  const cleanTitle = String(title || '').trim();
  if (!cleanTitle) return null;

  const numTarget = Math.max(1, Number(target) || 30);
  const cleanUnit = String(unit || 'kun').trim();

  const newGoal = {
    id: uid('g'),
    title: cleanTitle,
    current: 0,
    target: numTarget,
    unit: cleanUnit,
    type: type === 'long' ? 'long' : '30d',
    createdAt: Date.now()
  };

  await updateState(state => {
    if (!state.goals) state.goals = [];
    state.goals.unshift(newGoal);
  });

  showToast('Maqsad yaratildi ✓');
  return newGoal;
}

/**
 * Increments or decrements goal progress
 */
export async function stepGoal(goalId, delta) {
  let finishedNow = false;

  await updateState(state => {
    const g = (state.goals || []).find(item => item.id === goalId);
    if (g) {
      const prev = Number(g.current || 0);
      const next = Math.max(0, prev + delta);
      g.current = next;
      if (prev < g.target && next >= g.target) {
        finishedNow = true;
      }
    }
  });

  if (finishedNow) {
    showToast('Tabriklaymiz! Maqsad 100% bajarildi 🏆');
  }
}

/**
 * Edits an existing goal
 */
export async function editGoal(goalId, { title, current, target, unit, type }) {
  let updated = false;

  await updateState(state => {
    const g = (state.goals || []).find(item => item.id === goalId);
    if (g) {
      if (title !== undefined) g.title = String(title).trim();
      if (current !== undefined) g.current = Math.max(0, Number(current) || 0);
      if (target !== undefined) g.target = Math.max(1, Number(target) || 1);
      if (unit !== undefined) g.unit = String(unit).trim();
      if (type !== undefined) g.type = type === 'long' ? 'long' : '30d';
      updated = true;
    }
  });

  if (updated) showToast('Maqsad yangilandi ✓');
  return updated;
}

/**
 * Deletes a goal
 */
export async function deleteGoal(goalId) {
  await updateState(state => {
    state.goals = (state.goals || []).filter(g => g.id !== goalId);
  });

  showToast('Maqsad o‘chirildi');
}
