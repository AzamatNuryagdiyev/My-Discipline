/* ==========================================================================
   MY DISCIPLINE — Automated Test Suite
   Node.js & ES Modules Automated Quality Assurance
   ========================================================================== */

import { toISO, fromISO, shiftISO, diffDays, getWeekdayMon0, formatUzDateFull, formatUzDateShort, esc, uid } from '../js/core/dates.js';
import { calculateLiveDayStats, recordDaySnapshot, getDayStatsWithSnapshot, POINTS_PER_TASK, BONUS_100_POINTS } from '../js/core/history.js';
import { getStreakInfo, getTotalPoints } from '../js/features/statistics.js';
import { BADGE_DEFINITIONS, getBadgesStatus } from '../js/features/achievements.js';
import { migrateLegacyData, LEGACY_STORAGE_KEY } from '../js/core/migration.js';

let passedCount = 0;
let failedCount = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedCount++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failedCount++;
  }
}

function assertEquals(actual, expected, testName) {
  if (actual === expected) {
    console.log(`  ✓ PASS: ${testName} (${actual})`);
    passedCount++;
  } else {
    console.error(`  ✗ FAIL: ${testName} -> Expected: ${expected}, Got: ${actual}`);
    failedCount++;
  }
}

console.log('\n==================================================');
console.log('🧪 MY DISCIPLINE — AUTOMATED TEST SUITE RUNNER');
console.log('==================================================\n');

// 1. DATE HELPERS & ESCAPING TESTS
console.log('--- 1. Dates & Security Escaping Tests ---');
const testDate = new Date(2026, 10, 23); // 23 Nov 2026
assertEquals(toISO(testDate), '2026-11-23', 'toISO converts Date correctly');

const parsed = fromISO('2026-11-23');
assertEquals(parsed.getFullYear(), 2026, 'fromISO parses year');
assertEquals(parsed.getMonth(), 10, 'fromISO parses month index');
assertEquals(parsed.getDate(), 23, 'fromISO parses day');

assertEquals(shiftISO('2026-11-23', 5), '2026-11-28', 'shiftISO shifts forward');
assertEquals(shiftISO('2026-11-23', -5), '2026-11-18', 'shiftISO shifts backward');
assertEquals(diffDays('2026-11-10', '2026-11-20'), 10, 'diffDays calculates difference');

// 23 Nov 2026 is Monday -> Mon0 is 0
assertEquals(getWeekdayMon0('2026-11-23'), 0, 'getWeekdayMon0 identifies Monday as 0');

// XSS Escaping
const dangerous = `<script>alert("xss & 'test'")</script>`;
const escaped = esc(dangerous);
assert(!escaped.includes('<script>') && escaped.includes('&lt;script&gt;') && escaped.includes('&quot;'), 'esc escapes HTML entities securely');

// 2. SCORING & DAY STATS LOGIC
console.log('\n--- 2. Scoring & Bonus Logic Tests ---');
const sampleTasks = [
  { id: 't1', title: 'Task 1', type: 'daily', createdAt: '2026-11-01', isActive: true },
  { id: 't2', title: 'Task 2', type: 'daily', createdAt: '2026-11-01', isActive: true },
  { id: 't3', title: 'Task 3', type: 'daily', createdAt: '2026-11-01', isActive: true },
  { id: 't4', title: 'Task 4', type: 'daily', createdAt: '2026-11-01', isActive: true }
];

const halfLogs = { '2026-11-15': ['t1', 't2'] };
const halfStats = calculateLiveDayStats('2026-11-15', sampleTasks, halfLogs, 80);
assertEquals(halfStats.completed, 2, 'Completed count is 2');
assertEquals(halfStats.total, 4, 'Total tasks count is 4');
assertEquals(halfStats.pct, 50, 'Percentage is 50%');
assertEquals(halfStats.points, 20, 'Points is 20 (2 * 10, no bonus)');
assertEquals(halfStats.isPerfect, false, 'isPerfect is false');
assertEquals(halfStats.isSuccess, false, 'isSuccess is false (below 80% threshold)');

const fullLogs = { '2026-11-15': ['t1', 't2', 't3', 't4'] };
const fullStats = calculateLiveDayStats('2026-11-15', sampleTasks, fullLogs, 80);
assertEquals(fullStats.pct, 100, 'Percentage is 100%');
assertEquals(fullStats.points, 65, 'Points is 65 (4 * 10 + 25 bonus)');
assertEquals(fullStats.isPerfect, true, 'isPerfect is true');
assertEquals(fullStats.isSuccess, true, 'isSuccess is true');

// 3. CRITICAL TEST: HISTORY IMMUTABILITY & SNAPSHOTS
console.log('\n--- 3. History Snapshot Immutability (Core Requirement) ---');
// Scenario: On Day 1, user had 2 tasks and completed both (100%).
// On Day 10, user adds 3 more tasks and deletes task 1.
// Verify Day 1 stats DO NOT change!

const historicalState = {
  settings: { theme: 'dark', threshold: 80 },
  tasks: [
    { id: 't_hist1', title: 'Initial Daily 1', type: 'daily', createdAt: '2026-11-01', isActive: true },
    { id: 't_hist2', title: 'Initial Daily 2', type: 'daily', createdAt: '2026-11-01', isActive: true }
  ],
  logs: {
    '2026-11-01': ['t_hist1', 't_hist2']
  },
  snapshots: {}
};

// Record snapshot for 2026-11-01
recordDaySnapshot('2026-11-01', historicalState);

const day1StatsBefore = getDayStatsWithSnapshot('2026-11-01', historicalState);
assertEquals(day1StatsBefore.pct, 100, 'Day 1 initial percentage is 100%');
assertEquals(day1StatsBefore.total, 2, 'Day 1 initial total tasks is 2');
assertEquals(day1StatsBefore.points, 45, 'Day 1 initial points is 45 (20 + 25 bonus)');

// Fast forward to Day 10: user adds 3 new daily tasks and removes initial daily 1
historicalState.tasks.push(
  { id: 't_new1', title: 'New Task 1', type: 'daily', createdAt: '2026-11-10', isActive: true },
  { id: 't_new2', title: 'New Task 2', type: 'daily', createdAt: '2026-11-10', isActive: true },
  { id: 't_new3', title: 'New Task 3', type: 'daily', createdAt: '2026-11-10', isActive: true }
);
// Task 1 deleted:
historicalState.tasks = historicalState.tasks.filter(t => t.id !== 't_hist1');

// Now re-query Day 1
const day1StatsAfter = getDayStatsWithSnapshot('2026-11-01', historicalState);
assertEquals(day1StatsAfter.pct, 100, 'Day 1 percentage remains 100% (IMMUTABLE)');
assertEquals(day1StatsAfter.total, 2, 'Day 1 total remains 2 despite future task additions/deletions');
assertEquals(day1StatsAfter.points, 45, 'Day 1 points remain 45 despite future modifications');
assert(day1StatsAfter.isSnapshot === true, 'Day 1 was served from immutable snapshot');

// 4. STREAK ENGINE TESTS
console.log('\n--- 4. Streak & Threshold Logic Tests ---');
const streakState = {
  settings: { threshold: 80 },
  tasks: sampleTasks,
  logs: {
    '2026-11-20': ['t1', 't2', 't3', 't4'], // 100% -> Success
    '2026-11-21': ['t1', 't2', 't3', 't4'], // 100% -> Success
    '2026-11-22': ['t1', 't2', 't3', 't4'], // 100% -> Success
    '2026-11-23': []                        // Today: 0% yet
  },
  snapshots: {}
};
// Record snapshots for past days
recordDaySnapshot('2026-11-20', streakState);
recordDaySnapshot('2026-11-21', streakState);
recordDaySnapshot('2026-11-22', streakState);

const streakInfo = getStreakInfo(streakState);
// Since yesterday was success and today is in-progress, streak should be 3!
assertEquals(streakInfo.current, 3, 'Streak continues from yesterday while today is in progress (3 days)');
assertEquals(streakInfo.best, 3, 'Best streak is 3');
assertEquals(streakInfo.bestPerfectStreak, 3, 'Best 100% streak is 3');

// 5. MIGRATION LOGIC TESTS
console.log('\n--- 5. Legacy Data Migration Tests ---');
// Mock localStorage in Node
const mockLocalStorageData = {};
globalThis.localStorage = {
  getItem: (k) => mockLocalStorageData[k] || null,
  setItem: (k, v) => { mockLocalStorageData[k] = String(v); },
  removeItem: (k) => { delete mockLocalStorageData[k]; }
};

mockLocalStorageData[LEGACY_STORAGE_KEY] = JSON.stringify({
  settings: { theme: 'light', threshold: 90 },
  tasks: [
    { id: 'old_1', title: 'Old Daily Task', type: 'daily', createdAt: '2026-11-10' },
    { id: 'old_2', title: 'Old Today Task', type: 'today', date: '2026-11-20' }
  ],
  goals: [
    { id: 'g_old', title: 'Read Book', current: 5, target: 20, unit: 'bet', type: '30d' }
  ],
  logs: {
    '2026-11-15': ['old_1']
  },
  journals: {
    '2026-11-15': { win: 'Old win', blocker: 'Old blocker', next: 'Old next' }
  }
});

const migrated = migrateLegacyData();
assert(migrated !== null, 'Legacy data migrated successfully');
assertEquals(migrated.settings.theme, 'light', 'Theme preference preserved');
assertEquals(migrated.settings.threshold, 90, 'Threshold preserved');
assertEquals(migrated.tasks.length, 2, 'Tasks preserved');
assertEquals(migrated.goals.length, 1, 'Goals preserved');
assert(migrated.snapshots['2026-11-15'] !== undefined, 'Snapshots auto-generated from legacy logs');
assert(mockLocalStorageData[LEGACY_STORAGE_KEY] !== undefined, 'Original legacy storage untouched as safe backup');

// 6. ACHIEVEMENTS & BADGES
console.log('\n--- 6. Achievements & Badges Verification ---');
const achievementState = {
  settings: { threshold: 80 },
  tasks: sampleTasks,
  logs: {
    '2026-11-20': ['t1', 't2', 't3', 't4'],
    '2026-11-21': ['t1', 't2', 't3', 't4'],
    '2026-11-22': ['t1', 't2', 't3', 't4']
  },
  snapshots: {},
  journals: {
    '2026-11-20': { win: 'w', blocker: 'b', next: 'n' },
    '2026-11-21': { win: 'w', blocker: 'b', next: 'n' },
    '2026-11-22': { win: 'w', blocker: 'b', next: 'n' }
  }
};
recordDaySnapshot('2026-11-20', achievementState);
recordDaySnapshot('2026-11-21', achievementState);
recordDaySnapshot('2026-11-22', achievementState);

const badges = getBadgesStatus(achievementState);
const badge1Day = badges.find(b => b.id === 'badge_first_day');
const badge3Days = badges.find(b => b.id === 'badge_3_days');
const badgeJournalist = badges.find(b => b.id === 'badge_journalist');

assertEquals(badge1Day.unlocked, true, '1-kun badge is unlocked');
assertEquals(badge3Days.unlocked, true, '3-kun consecutive badge is unlocked');
assertEquals(badgeJournalist.unlocked, true, 'Journalist badge (3 entries) is unlocked');

console.log('\n==================================================');
console.log(`🎉 TEST SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED`);
console.log('==================================================\n');

if (failedCount > 0) {
  process.exit(1);
}
