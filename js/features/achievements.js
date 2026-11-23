/* ==========================================================================
   MY DISCIPLINE — Achievements & Badges Module
   Tracks unlock criteria, badges, and emits live notification on unlock
   ========================================================================== */

import { getStreakInfo, getTotalPoints } from './statistics.js';
import { showToast } from '../ui/notifications.js';

export const BADGE_DEFINITIONS = [
  {
    id: 'badge_first_day',
    title: '1 - kun 🌱',
    desc: 'Ilk bor kunni 100% yakunlash',
    condition: (streak, points, journalCount) => streak.totalPerfectDays >= 1
  },
  {
    id: 'badge_3_days',
    title: '3 - kun 💪',
    desc: 'Ketma-ket 3 kun 100% intizom',
    condition: (streak, points, journalCount) => streak.bestPerfectStreak >= 3
  },
  {
    id: 'badge_7_days',
    title: '7 - kun 🔥',
    desc: '7 kun ketma-ket intizom seriyasi',
    condition: (streak, points, journalCount) => streak.best >= 7
  },
  {
    id: 'badge_14_days',
    title: '14 - kun 👑',
    desc: '14 kun ketma-ket intizom seriyasi',
    condition: (streak, points, journalCount) => streak.best >= 14
  },
  {
    id: 'badge_30_days',
    title: '30 - kun 🏆',
    desc: '30 kun ketma-ket mustahkam seriya',
    condition: (streak, points, journalCount) => streak.best >= 30
  },
  {
    id: 'badge_100_points',
    title: '100 ball ⚡',
    desc: 'Jami 100 ball to‘plash',
    condition: (streak, points, journalCount) => points >= 100
  },
  {
    id: 'badge_500_points',
    title: '500 ball 🌟',
    desc: 'Jami 500 ball to‘plash',
    condition: (streak, points, journalCount) => points >= 500
  },
  {
    id: 'badge_journalist',
    title: 'Jurnalist ✍️',
    desc: '3 ta kun yakuni jurnalini yozish',
    condition: (streak, points, journalCount) => journalCount >= 3
  },
  {
    id: 'badge_master_journalist',
    title: 'Katta Jurnalist 📚',
    desc: '10 ta kun yakuni jurnalini yozish',
    condition: (streak, points, journalCount) => journalCount >= 10
  }
];

let knownUnlockedBadgeIds = new Set();
let initialized = false;

/**
 * Returns list of badges with unlock state
 */
export function getBadgesStatus(state) {
  const streak = getStreakInfo(state);
  const totalPoints = getTotalPoints(state);
  const journalCount = Object.values(state.journals || {}).filter(
    j => j && (j.win?.trim() || j.blocker?.trim() || j.next?.trim())
  ).length;

  return BADGE_DEFINITIONS.map(badge => {
    const isUnlocked = badge.condition(streak, totalPoints, journalCount);
    return {
      ...badge,
      unlocked: isUnlocked
    };
  });
}

/**
 * Checks for new achievements and shows notification if unlocked in current turn
 */
export function checkNewAchievements(state) {
  const badges = getBadgesStatus(state);

  if (!initialized) {
    badges.forEach(b => {
      if (b.unlocked) knownUnlockedBadgeIds.add(b.id);
    });
    initialized = true;
    return;
  }

  badges.forEach(b => {
    if (b.unlocked && !knownUnlockedBadgeIds.has(b.id)) {
      knownUnlockedBadgeIds.add(b.id);
      showToast(`Yangi yutuq ochildi: ${b.title}! 🏆`);
    }
  });
}
