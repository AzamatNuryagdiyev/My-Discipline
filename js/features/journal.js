/* ==========================================================================
   MY DISCIPLINE — Journal Feature Module
   Handles 3-Question Daily Reflection (Win, Blocker, Next #1)
   Supports viewing and editing both today's and past entries
   ========================================================================== */

import { getTodayISO } from '../core/dates.js';
import { getState, updateState } from '../core/state.js';
import { showToast } from '../ui/notifications.js';
import { checkNewAchievements } from './achievements.js';

/**
 * Returns journal entry for a given date
 */
export function getJournalEntry(dateISO) {
  const state = getState();
  return (state.journals && state.journals[dateISO]) || { win: '', blocker: '', next: '' };
}

/**
 * Returns all past journal entries sorted descending by date
 */
export function getAllJournalEntries() {
  const state = getState();
  const journals = state.journals || {};

  return Object.entries(journals)
    .filter(([_, entry]) => entry && (entry.win?.trim() || entry.blocker?.trim() || entry.next?.trim()))
    .sort((a, b) => b[0].localeCompare(a[0]));
}

/**
 * Saves or updates a journal entry for any date
 */
export async function saveJournalEntry(dateISO, { win = '', blocker = '', next = '' }) {
  const targetDate = dateISO || getTodayISO();

  await updateState(state => {
    if (!state.journals) state.journals = {};
    state.journals[targetDate] = {
      win: String(win || '').trim(),
      blocker: String(blocker || '').trim(),
      next: String(next || '').trim(),
      updatedAt: Date.now()
    };
  });

  showToast('Jurnal saqlandi ✓');
  checkNewAchievements(getState());
}

/**
 * Deletes a journal entry
 */
export async function deleteJournalEntry(dateISO) {
  if (!dateISO) return;

  await updateState(state => {
    if (state.journals && state.journals[dateISO]) {
      delete state.journals[dateISO];
    }
  });

  showToast('Jurnal o‘chirildi');
}
