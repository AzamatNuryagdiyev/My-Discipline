/* ==========================================================================
   MY DISCIPLINE — Dashboard & Views Renderer
   Pixel-Perfect Match with Modern Dark SaaS Discipline UI
   ========================================================================== */

import { esc, getTodayISO, fromISO, shiftISO, formatUzDateFull, formatUzDateShort, UZ_MONTHS, UZ_WEEKDAYS_SHORT } from '../core/dates.js';
import { getState } from '../core/state.js';
import { getDayStatsWithSnapshot, POINTS_PER_TASK, BONUS_100_POINTS } from '../core/history.js';
import { addTask, toggleTask, deleteTask } from '../features/tasks.js';
import { addGoal, stepGoal, deleteGoal } from '../features/goals.js';
import { saveJournalEntry, getAllJournalEntries, deleteJournalEntry, getJournalEntry } from '../features/journal.js';
import { getCalendarMonthData, getLast7DaysChartData } from '../features/calendar.js';
import { getStreakInfo, getTotalPoints } from '../features/statistics.js';
import { getBadgesStatus } from '../features/achievements.js';
import { openEditTaskModal, openEditGoalModal, openEditJournalModal, ICONS } from './components.js';

// Motivation & Cautionary Quotes with Discipline Level Categorization
export const DISCIPLINE_QUOTES = {
  zero: [
    'Kun o‘tib boryapti! <span class="highlight-amber">Dangasalikni yeng, darhol birinchi vazifani boshla!</span>',
    'Rejalar qog‘ozda qolib ketmasin! <span class="highlight-amber">Hali 0%. Harakatni hozirdan boshla.</span>',
    'Hali birorta vazifa bajarilmadi! <span class="highlight-amber">Bahonalarni to‘xtatib, ishga kirish.</span>',
    'Vaqt kutmaydi! <span class="highlight-amber">Bugun o‘zingga bergan va’dangni bajarmaysanmi?</span>'
  ],
  low: [
    'Boshlanishi bor, lekin bu yetarli emas! <span class="highlight-mint">Chalg‘ishni bas qil, tezlikni oshir.</span>',
    'Hali yarim yo‘lga ham yetmading. <span class="highlight-mint">Qo‘l siltama, vazifalarni birma-bir yop.</span>',
    'Intizom — xohlamasang ham qilish! <span class="highlight-mint">Keyingi vazifaga o‘t.</span>'
  ],
  mid: [
    'Yarim yo‘l bosib o‘tildi. <span class="highlight-mint">Lekin g‘alaba faqat 100% da! To‘xtama.</span>',
    'Yaxshi ketmoqdasan. <span class="highlight-mint">Tempi pasaytirma, asosiy marra yaqin.</span>',
    'Dangasalik vasvasasiga berilma! <span class="highlight-mint">Kechgacha qolganlarini ham tugat.</span>'
  ],
  high: [
    'Barakalla, ozgina qoldi! <span class="highlight-mint">Bugungi kunni 100% g‘alaba bilan yop.</span>',
    'Zo‘r natija! <span class="highlight-mint">Oxirgi vazifalarni ham yengib, marraga yet.</span>',
    'Marra ko‘rindi! <span class="highlight-mint">Bugungi seriyangni mukammal darajaga yetkaz.</span>'
  ],
  perfect: [
    'Haqiqiy intizom egasi! <span class="highlight-mint">Bugungi barcha vazifalar 100% bajarildi!</span>',
    'Qoyilmaqom kun! <span class="highlight-mint">O‘zingni yengding, so‘zingni amalda isbotlading.</span>',
    'Mukammal kun! <span class="highlight-mint">Bugun vijdoning toza, dam olishga haqlisan.</span>'
  ]
};

export function getDisciplineTier(pct, totalTasks = 1) {
  if (totalTasks === 0 || pct === 0) return 'zero';
  if (pct < 50) return 'low';
  if (pct < 80) return 'mid';
  if (pct < 100) return 'high';
  return 'perfect';
}

export function getDisciplineQuote(pct, totalTasks = 1, rotateOffset = 0) {
  const tier = getDisciplineTier(pct, totalTasks);
  const quotes = DISCIPLINE_QUOTES[tier];
  const idx = Math.abs(rotateOffset) % quotes.length;
  return quotes[idx];
}

let activeQuoteIndex = 0;

const uiState = {
  activeGoalTab: '30d',
  showGoalForm: false,
  newTaskType: 'daily',
  calYear: null,
  calMonth: null,
  selectedCalDate: null
};

/**
 * Formats date as shown in screenshot: "Monday, November 23"
 */
function formatHeroDate(todayISO) {
  const d = fromISO(todayISO);
  const enDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const enMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${enDays[d.getDay()]}, ${enMonths[d.getMonth()]} ${d.getDate()}`;
}

/**
 * Renders Circular Progress Ring SVG
 */
function renderCircularProgressRing(pct, size = 80, stroke = 5.5) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  return `
    <div class="circular-progress-wrap" data-pct="${pct}" style="width: ${size}px; height: ${size}px;">
      <svg class="circular-progress-svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle class="circular-progress-bg" cx="${size / 2}" cy="${size / 2}" r="${radius}" stroke-width="${stroke}" />
        <circle class="circular-progress-bar" cx="${size / 2}" cy="${size / 2}" r="${radius}" stroke-width="${stroke}"
          stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" />
      </svg>
      <span class="circular-progress-text">${pct}%</span>
    </div>
  `;
}

/**
 * Smoothly updates the circular progress arc, rotation spin, and rolling percentage counter
 */
function updateCircularProgress(container, newPct, size = 80, stroke = 5.5) {
  const wrap = container.querySelector('.circular-progress-wrap');
  if (!wrap) return;

  const bar = wrap.querySelector('.circular-progress-bar');
  const text = wrap.querySelector('.circular-progress-text');
  const svg = wrap.querySelector('.circular-progress-svg');
  if (!bar || !text) return;

  const rawOld = wrap.getAttribute('data-pct');
  const oldPct = rawOld !== null ? parseInt(rawOld, 10) : parseInt(text.textContent || '0', 10);
  wrap.setAttribute('data-pct', String(newPct));

  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference - (newPct / 100) * circumference;

  // 1. Smoothly sweep the mint circular progress stroke
  bar.style.strokeDashoffset = `${targetOffset}px`;

  // 2. Add subtle rotation spin pulse
  if (svg) {
    svg.classList.remove('is-updating');
    void svg.offsetWidth;
    svg.classList.add('is-updating');
    setTimeout(() => svg.classList.remove('is-updating'), 700);
  }

  // 3. Smooth rolling number counter with ease-out cubic
  if (oldPct !== newPct) {
    text.classList.add('is-counting');
    const startTime = performance.now();
    const duration = 650;

    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(oldPct + (newPct - oldPct) * ease);
      text.textContent = `${current}%`;

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        text.textContent = `${newPct}%`;
        text.classList.remove('is-counting');
      }
    }
    requestAnimationFrame(step);
  } else {
    text.textContent = `${newPct}%`;
  }
}

/**
 * Renders HTML for task list items
 */
function renderTaskListHtml(tasks, doneSet) {
  if (tasks.length === 0) {
    return `
      <p style="font-size: 13.5px; color: var(--text-muted); text-align: center; padding: 20px 0;">
        Bugun uchun vazifalar yo‘q. Quyidan qo‘shing.
      </p>
    `;
  }
  return tasks.map(task => {
    const checked = doneSet.has(task.id);
    return `
      <div class="task-item ${checked ? 'is-completed' : ''}" data-task-id="${task.id}">
        <button class="task-checkbox ${checked ? 'checked' : ''}" aria-label="${checked ? 'Bajarildi' : 'Bajarilmadi'}">
          ${checked ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>` : ''}
        </button>

        <div class="task-body">
          <span class="task-title">${esc(task.title)}</span>
        </div>

        <div class="task-actions">
          <button class="task-action-btn edit-btn" title="Tahrirlash">${ICONS.edit}</button>
          <button class="task-action-btn delete-btn" title="O‘chirish">${ICONS.trash}</button>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Binds task event listeners to a task-list container
 */
function bindTaskListEvents(taskListEl, stats) {
  taskListEl.querySelectorAll('.task-item').forEach(itemEl => {
    const taskId = itemEl.getAttribute('data-task-id');
    const taskObj = stats.tasks.find(t => t.id === taskId);

    itemEl.querySelector('.task-checkbox')?.addEventListener('click', () => toggleTask(taskId));
    itemEl.querySelector('.task-body')?.addEventListener('click', () => toggleTask(taskId));

    itemEl.querySelector('.edit-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (taskObj) openEditTaskModal(taskObj);
    });

    itemEl.querySelector('.delete-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteTask(taskId);
    });
  });
}

/**
 * Renders 7x5 Heatmap Matrix for "Intizom xaritasi"
 */
function renderHeatmapMatrix(state) {
  const today = getTodayISO();
  const cells = [];
  const threshold = state.settings?.threshold || 75;

  // 35 cells (5 weeks x 7 days)
  for (let i = 27; i >= -7; i--) {
    const d = shiftISO(today, -i);
    const stats = getDayStatsWithSnapshot(d, state);
    const isActive = stats.isPerfect || stats.pct >= threshold;
    cells.push(`
      <div class="heatmap-matrix-cell ${isActive ? 'active' : ''}" title="${d}: ${stats.pct}%"></div>
    `);
  }
  return cells.join('');
}

/**
 * Renders badges for "Yutuqlar" widget
 */
function renderAchievementsWidget(state) {
  const badges = getBadgesStatus(state);
  const unlocked = badges.filter(b => b.unlocked);
  if (unlocked.length === 0) {
    return `<div class="badge-pill-item">3 - kun 💪</div>`;
  }
  return unlocked.slice(0, 3).map(b => `
    <div class="badge-pill-item">${b.title}</div>
  `).join('');
}

/* ==========================================================================
   1. BUGUN (Exact Replica of Uploaded Screenshot)
   ========================================================================== */

export function renderTodayView(container) {
  const state = getState();
  const today = getTodayISO();
  const stats = getDayStatsWithSnapshot(today, state);
  const streak = getStreakInfo(state);
  const totalPoints = getTotalPoints(state);

  const existingGrid = container.querySelector('.today-grid-layout');

  // If view is already rendered, perform a smooth in-place update without reloading the page or flashing
  if (existingGrid) {
    // 1. Smoothly animate circular progress ring and rolling counter
    updateCircularProgress(existingGrid, stats.pct, 80, 5.5);

    // 2. Update streak and points badges
    const streakEl = existingGrid.querySelector('#hero-pill-streak span:last-child');
    if (streakEl) streakEl.textContent = `${streak.current} kun`;

    const pointsEl = existingGrid.querySelector('#hero-pill-points span:last-child');
    if (pointsEl) pointsEl.textContent = `${totalPoints} ball`;

    // 3. Update motivation card with dynamic tier and quote
    const quoteCard = existingGrid.querySelector('.today-motivation-card');
    const quoteTextEl = existingGrid.querySelector('.today-motivation-quote');
    const currentTier = getDisciplineTier(stats.pct, stats.tasks.length);
    if (quoteCard && quoteTextEl) {
      quoteCard.className = `today-motivation-card tier-${currentTier}`;
      quoteTextEl.innerHTML = getDisciplineQuote(stats.pct, stats.tasks.length, activeQuoteIndex);
    }

    // 4. Update task list without touching the rest of the layout
    const taskListEl = existingGrid.querySelector('.task-list');
    if (taskListEl) {
      taskListEl.innerHTML = renderTaskListHtml(stats.tasks, stats.doneSet);
      bindTaskListEvents(taskListEl, stats);
    }

    // 5. Update heatmap matrix
    const matrixEl = existingGrid.querySelector('.heatmap-matrix-grid');
    if (matrixEl) {
      matrixEl.innerHTML = renderHeatmapMatrix(state);
    }

    // 6. Update achievements widget
    const achEl = existingGrid.querySelector('.unlocked-pills-wrap');
    if (achEl) {
      achEl.innerHTML = renderAchievementsWidget(state);
    }

    return;
  }

  // Initial Full Render (on first page load or tab switch)
  const heroDateText = formatHeroDate(today);
  const currentTier = getDisciplineTier(stats.pct, stats.tasks.length);
  const quoteHtml = getDisciplineQuote(stats.pct, stats.tasks.length, activeQuoteIndex);

  container.innerHTML = `
    <div class="today-grid-layout view-fade">

      <!-- LEFT / MAIN COLUMN -->
      <div class="today-main-col space-y-4">

        <!-- Top Hero Header -->
        <div class="today-hero-header">
          <div class="today-title-block">
            <h1 class="today-main-title">Bugun</h1>
            <p class="today-main-date">${heroDateText}</p>
          </div>

          <div class="today-ring-block">
            ${renderCircularProgressRing(stats.pct, 80, 5.5)}
          </div>

          <div class="today-badges-block">
            <div id="hero-pill-streak" class="hero-stat-pill" title="Joriy seriya">
              <span>🔥</span>
              <span>${streak.current} kun</span>
            </div>
            <div id="hero-pill-points" class="hero-stat-pill" title="Jami ball">
              <span>⚡</span>
              <span>${totalPoints} ball</span>
            </div>
          </div>
        </div>

        <!-- Motivational Banner Card with Dynamic Glow (Green or Amber) -->
        <div class="today-motivation-card tier-${currentTier}">
          <p class="today-motivation-quote">${quoteHtml}</p>
          <button id="btn-rotate-msg" class="motivation-refresh-btn" title="Boshqa gapni ko‘rish">↻</button>
        </div>

        <!-- Kunlik vazifalar Card -->
        <div class="card tasks-card">
          <div class="tasks-card-header">
            <h2 class="tasks-card-title">Kunlik vazifalar</h2>
          </div>

          <div class="task-list">
            ${renderTaskListHtml(stats.tasks, stats.doneSet)}
          </div>

          <!-- Quick-Add Inline Bar -->
          <form id="form-quick-add-task" class="quick-add-card">
            <div class="quick-add-input-row">
              <span style="font-size: 16px; color: var(--text-muted); font-weight: 600;">+</span>
              <input id="input-task-title" class="quick-add-input" type="text" placeholder="Yangi vazifa yozing..." autocomplete="off" />
            </div>

            <div class="quick-add-bottom-row">
              <div class="type-toggle-group">
                <button type="button" id="btn-type-daily" class="type-toggle-btn ${uiState.newTaskType === 'daily' ? 'active' : ''}">Har kunlik</button>
                <button type="button" id="btn-type-today" class="type-toggle-btn ${uiState.newTaskType === 'today' ? 'active' : ''}">Faqat bugun</button>
              </div>

              <button type="submit" class="btn-primary">Qo‘shish</button>
            </div>
          </form>
        </div>

      </div>

      <!-- RIGHT COLUMN (Intizom xaritasi & Yutuqlar Widgets) -->
      <div class="today-side-col space-y-4">

        <!-- Intizom xaritasi -->
        <div class="card heatmap-widget-card">
          <h2 class="widget-card-title">Intizom xaritasi</h2>
          <div class="heatmap-matrix-grid">
            ${renderHeatmapMatrix(state)}
          </div>
        </div>

        <!-- Yutuqlar Widget -->
        <div class="card achievements-widget-card">
          <h2 class="widget-card-title">Yutuqlar</h2>
          <div class="unlocked-pills-wrap">
            ${renderAchievementsWidget(state)}
          </div>
        </div>

      </div>

    </div>
  `;

  // Bind Events for Initial Render
  container.querySelector('#btn-rotate-msg')?.addEventListener('click', () => {
    activeQuoteIndex++;
    const quoteEl = container.querySelector('.today-motivation-quote');
    if (quoteEl) {
      quoteEl.innerHTML = getDisciplineQuote(stats.pct, stats.tasks.length, activeQuoteIndex);
    }
  });

  // Bind Task List events
  const taskListEl = container.querySelector('.task-list');
  if (taskListEl) bindTaskListEvents(taskListEl, stats);

  // Task type toggle
  container.querySelector('#btn-type-daily')?.addEventListener('click', () => {
    uiState.newTaskType = 'daily';
    container.querySelector('#btn-type-daily')?.classList.add('active');
    container.querySelector('#btn-type-today')?.classList.remove('active');
  });
  container.querySelector('#btn-type-today')?.addEventListener('click', () => {
    uiState.newTaskType = 'today';
    container.querySelector('#btn-type-today')?.classList.add('active');
    container.querySelector('#btn-type-daily')?.classList.remove('active');
  });

  // Add task form
  container.querySelector('#form-quick-add-task')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = container.querySelector('#input-task-title');
    const title = input?.value.trim();
    if (title) {
      await addTask(title, uiState.newTaskType);
      input.value = '';
      input.focus();
    }
  });
}

/* ==========================================================================
   2. MAQSADLAR (Goals View)
   ========================================================================== */

export function renderGoalsView(container) {
  const state = getState();
  const goals = (state.goals || []).filter(g => g.type === uiState.activeGoalTab);

  container.innerHTML = `
    <div class="space-y-5 view-fade">

      <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
        <div class="type-toggle-group">
          <button id="btn-goal-tab-30d" class="type-toggle-btn ${uiState.activeGoalTab === '30d' ? 'active' : ''}">30 kunlik</button>
          <button id="btn-goal-tab-long" class="type-toggle-btn ${uiState.activeGoalTab === 'long' ? 'active' : ''}">Uzoq muddatli</button>
        </div>

        <button id="btn-toggle-goal-form" class="btn-primary">
          ${uiState.showGoalForm ? 'Yopish' : '+ Yangi maqsad'}
        </button>
      </div>

      ${uiState.showGoalForm ? `
        <form id="form-create-goal" class="card" style="border-color: var(--mint-border); display: flex; flex-direction: column; gap: 14px;">
          <div class="form-group">
            <label class="form-label" for="new-goal-title">Maqsad nomi</label>
            <input id="new-goal-title" class="form-input" type="text" required placeholder="Masalan: 300 bet kitob o‘qish" autofocus />
          </div>

          <div class="grid-3" style="gap: 10px;">
            <div class="form-group">
              <label class="form-label" for="new-goal-target">Mo‘ljal (soni)</label>
              <input id="new-goal-target" class="form-input" type="number" min="1" required value="30" />
            </div>
            <div class="form-group">
              <label class="form-label" for="new-goal-unit">O‘lchov birligi</label>
              <input id="new-goal-unit" class="form-input" type="text" required value="kun" placeholder="kun, bet, %" />
            </div>
            <div class="form-group">
              <label class="form-label" for="new-goal-type">Turi</label>
              <select id="new-goal-type" class="form-select">
                <option value="30d" ${uiState.activeGoalTab === '30d' ? 'selected' : ''}>30 kunlik</option>
                <option value="long" ${uiState.activeGoalTab === 'long' ? 'selected' : ''}>Uzoq muddatli</option>
              </select>
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end;">
            <button type="submit" class="btn-primary">Saqlash</button>
          </div>
        </form>
      ` : ''}

      <div style="display: flex; flex-direction: column; gap: 12px;">
        ${goals.length === 0 ? `
          <div class="card" style="text-align: center; border-style: dashed; padding: 36px 16px;">
            <p style="font-size: 14px; color: var(--text-muted);">Bu bo‘limda hali maqsadlar yo‘q.</p>
          </div>
        ` : goals.map(g => {
          const pct = g.target > 0 ? Math.min(100, Math.round((g.current / g.target) * 100)) : 0;
          const isDone = pct >= 100;

          return `
            <div class="card" style="${isDone ? 'border-color: var(--mint-border);' : ''}" data-goal-id="${g.id}">
              <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;">
                <div>
                  <h3 style="font-size: 15.5px; font-weight: 700; line-height: 1.3;">${esc(g.title)}</h3>
                  <p style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">${g.current} / ${g.target} ${esc(g.unit)}</p>
                </div>

                <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
                  <span style="font-size: 15px; font-weight: 800; ${isDone ? 'color: var(--mint-primary);' : ''}">${pct}%</span>
                  <button class="task-action-btn edit-goal-btn" title="Tahrirlash">${ICONS.edit}</button>
                  <button class="task-action-btn delete-goal-btn" title="O‘chirish">${ICONS.trash}</button>
                </div>
              </div>

              <div class="progress-track" style="margin-top: 14px;">
                <div class="progress-fill emerald" style="width: ${pct}%;"></div>
              </div>

              <div style="display: flex; align-items: center; gap: 8px; margin-top: 14px;">
                <button class="btn-secondary step-minus" style="padding: 5px 14px; font-size: 13px; font-weight: 700;">-1</button>
                <button class="btn-secondary step-plus" style="padding: 5px 14px; font-size: 13px; font-weight: 700; color: var(--mint-primary); border-color: var(--mint-border);">+1</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>

    </div>
  `;

  // Bind Events
  container.querySelector('#btn-goal-tab-30d')?.addEventListener('click', () => {
    uiState.activeGoalTab = '30d';
    renderGoalsView(container);
  });
  container.querySelector('#btn-goal-tab-long')?.addEventListener('click', () => {
    uiState.activeGoalTab = 'long';
    renderGoalsView(container);
  });

  container.querySelector('#btn-toggle-goal-form')?.addEventListener('click', () => {
    uiState.showGoalForm = !uiState.showGoalForm;
    renderGoalsView(container);
  });

  container.querySelector('#form-create-goal')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = container.querySelector('#new-goal-title')?.value;
    const target = container.querySelector('#new-goal-target')?.value;
    const unit = container.querySelector('#new-goal-unit')?.value;
    const type = container.querySelector('#new-goal-type')?.value;

    await addGoal(title, target, unit, type);
    uiState.activeGoalTab = type;
    uiState.showGoalForm = false;
    renderGoalsView(container);
  });

  container.querySelectorAll('[data-goal-id]').forEach(cardEl => {
    const goalId = cardEl.getAttribute('data-goal-id');
    const goalObj = goals.find(g => g.id === goalId);

    cardEl.querySelector('.step-minus')?.addEventListener('click', () => stepGoal(goalId, -1));
    cardEl.querySelector('.step-plus')?.addEventListener('click', () => stepGoal(goalId, 1));

    cardEl.querySelector('.edit-goal-btn')?.addEventListener('click', () => {
      if (goalObj) openEditGoalModal(goalObj);
    });

    cardEl.querySelector('.delete-goal-btn')?.addEventListener('click', () => {
      deleteGoal(goalId);
    });
  });
}

/* ==========================================================================
   3. KALENDAR (Heatmap & Inspection)
   ========================================================================== */

export function renderCalendarView(container) {
  const state = getState();
  const today = getTodayISO();
  const todayDate = fromISO(today);

  if (uiState.calYear === null) {
    uiState.calYear = todayDate.getFullYear();
    uiState.calMonth = todayDate.getMonth();
  }
  if (!uiState.selectedCalDate) {
    uiState.selectedCalDate = today;
  }

  const calData = getCalendarMonthData(uiState.calYear, uiState.calMonth, state);
  const chartData = getLast7DaysChartData(state);
  const selStats = getDayStatsWithSnapshot(uiState.selectedCalDate, state);
  const selJournal = getJournalEntry(uiState.selectedCalDate);

  const emptyCells = Array.from({ length: calData.startOffset }, () => `<div></div>`).join('');
  const dayCells = calData.days.map(d => {
    let lvlClass = '';
    if (!d.isFuture) {
      if (d.stats.pct === 100) lvlClass = 'lvl-perfect';
      else if (d.stats.pct >= 70) lvlClass = 'lvl-good';
      else if (d.stats.pct > 0) lvlClass = 'lvl-low';
    }

    const isSelected = d.iso === uiState.selectedCalDate;
    return `
      <button ${d.isFuture ? 'disabled' : `data-date="${d.iso}"`} class="cal-day-cell ${lvlClass} ${d.isFuture ? 'future' : ''} ${isSelected ? 'selected' : ''}">
        ${d.dayNum}
      </button>
    `;
  }).join('');

  container.innerHTML = `
    <div class="space-y-5 view-fade">

      <!-- 3 Key Metric Cards -->
      <section class="grid-3">
        <div class="card" style="padding: 16px;">
          <p style="font-size: 11.5px; font-weight: 600; color: var(--text-secondary);">Oylik o‘rtacha</p>
          <p style="font-size: 24px; font-weight: 800; margin-top: 4px;">${calData.monthAvg}%</p>
        </div>
        <div class="card" style="padding: 16px;">
          <p style="font-size: 11.5px; font-weight: 600; color: var(--text-secondary);">100% kunlar</p>
          <p style="font-size: 24px; font-weight: 800; color: var(--mint-primary); margin-top: 4px;">${calData.perfectDaysMonth}</p>
        </div>
        <div class="card" style="padding: 16px;">
          <p style="font-size: 11.5px; font-weight: 600; color: var(--text-secondary);">Jami ball</p>
          <p style="font-size: 24px; font-weight: 800; color: var(--amber-primary); margin-top: 4px;">${calData.totalPoints}</p>
        </div>
      </section>

      <!-- Monthly Heatmap Calendar -->
      <section class="card space-y-4">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <button id="btn-cal-prev" class="icon-btn" aria-label="Oldingi oy">◀</button>
          <h2 style="font-size: 15px; font-weight: 700;">${UZ_MONTHS[calData.monthIndex]} ${calData.year}</h2>
          <button id="btn-cal-next" class="icon-btn" aria-label="Keyingi oy">▶</button>
        </div>

        <div class="calendar-grid-header">
          ${UZ_WEEKDAYS_SHORT.map(w => `<div>${w}</div>`).join('')}
        </div>

        <div class="calendar-grid">
          ${emptyCells}
          ${dayCells}
        </div>

        <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 14px; padding-top: 8px; font-size: 11px; color: var(--text-secondary);">
          <span style="display: flex; align-items: center; gap: 5px;"><span style="width: 10px; height: 10px; border-radius: 3px; background-color: var(--bg-surface-subtle); border: 1px solid var(--border-line);"></span> 0%</span>
          <span style="display: flex; align-items: center; gap: 5px;"><span style="width: 10px; height: 10px; border-radius: 3px; background-color: rgba(244, 63, 94, 0.35);"></span> 1–69%</span>
          <span style="display: flex; align-items: center; gap: 5px;"><span style="width: 10px; height: 10px; border-radius: 3px; background-color: rgba(245, 158, 11, 0.35);"></span> 70–99%</span>
          <span style="display: flex; align-items: center; gap: 5px;"><span style="width: 10px; height: 10px; border-radius: 3px; background-color: var(--mint-primary);"></span> 100%</span>
        </div>
      </section>

      <!-- Selected Day Details Card -->
      <section class="card space-y-4">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div>
            <p style="font-size: 12px; font-weight: 600; color: var(--text-secondary);">${formatUzDateShort(uiState.selectedCalDate)}</p>
            <p style="font-size: 13.5px; font-weight: 600; margin-top: 2px;">${selStats.completed} / ${selStats.total} vazifa • +${selStats.points} ball</p>
          </div>
          <span style="font-size: 26px; font-weight: 800; ${selStats.isPerfect ? 'color: var(--mint-primary);' : ''}">${selStats.pct}%</span>
        </div>

        ${selStats.tasks.length > 0 ? `
          <div style="border-top: 1px solid var(--border-line); padding-top: 10px; display: flex; flex-direction: column; gap: 6px;">
            ${selStats.tasks.map(t => {
              const done = selStats.doneSet.has(t.id);
              return `
                <div style="display: flex; align-items: center; gap: 8px; font-size: 13px;">
                  <span style="color: ${done ? 'var(--mint-primary)' : 'var(--text-muted)'}; font-weight: 700;">${done ? '✓' : '○'}</span>
                  <span style="color: ${done ? 'var(--text-primary)' : 'var(--text-muted)'}; ${done ? 'text-decoration: line-through;' : ''}">${esc(t.title)}</span>
                </div>
              `;
            }).join('')}
          </div>
        ` : ''}

        ${(selJournal.win || selJournal.blocker || selJournal.next) ? `
          <div style="border-top: 1px solid var(--border-line); padding-top: 10px; display: flex; flex-direction: column; gap: 4px; font-size: 12px;">
            <span style="font-weight: 700; color: var(--text-secondary);">Shu kundagi jurnal:</span>
            ${selJournal.win ? `<p><span style="color: var(--mint-primary); font-weight: 600;">Yutuq:</span> ${esc(selJournal.win)}</p>` : ''}
            ${selJournal.blocker ? `<p><span style="color: var(--rose-primary); font-weight: 600;">Xalaqit:</span> ${esc(selJournal.blocker)}</p>` : ''}
            ${selJournal.next ? `<p><span style="color: var(--text-secondary); font-weight: 600;">#1 Vazifa:</span> ${esc(selJournal.next)}</p>` : ''}
          </div>
        ` : ''}
      </section>

      <!-- 7-Day Performance Chart -->
      <section class="card space-y-4">
        <span style="font-size: 13px; font-weight: 700; color: var(--text-secondary);">Oxirgi 7 kun</span>
        <div class="chart-container">
          ${chartData.map(item => {
            const h = Math.max(item.pct, 4);
            let barBg = 'var(--border-line)';
            if (item.pct === 100) barBg = 'var(--mint-primary)';
            else if (item.pct >= 70) barBg = 'var(--cyan-primary)';
            else if (item.pct > 0) barBg = 'var(--amber-primary)';

            return `
              <div class="chart-col">
                <span class="chart-pct">${item.pct}%</span>
                <div class="chart-bar-slot">
                  <div class="chart-bar" style="height: ${h}%; background-color: ${barBg};"></div>
                </div>
                <span class="chart-label ${item.isToday ? 'is-today' : ''}">${UZ_WEEKDAYS_SHORT[item.wdIndex]}</span>
              </div>
            `;
          }).join('')}
        </div>
      </section>

    </div>
  `;

  // Bind Events
  container.querySelector('#btn-cal-prev')?.addEventListener('click', () => {
    uiState.calMonth--;
    if (uiState.calMonth < 0) {
      uiState.calMonth = 11;
      uiState.calYear--;
    }
    renderCalendarView(container);
  });

  container.querySelector('#btn-cal-next')?.addEventListener('click', () => {
    uiState.calMonth++;
    if (uiState.calMonth > 11) {
      uiState.calMonth = 0;
      uiState.calYear++;
    }
    renderCalendarView(container);
  });

  container.querySelectorAll('[data-date]').forEach(btn => {
    btn.addEventListener('click', () => {
      uiState.selectedCalDate = btn.getAttribute('data-date');
      renderCalendarView(container);
    });
  });
}

/* ==========================================================================
   4. JURNAL (Daily Reflection & History)
   ========================================================================== */

export function renderJournalView(container) {
  const today = getTodayISO();
  const entry = getJournalEntry(today);
  const pastEntries = getAllJournalEntries().filter(([date]) => date !== today);

  container.innerHTML = `
    <div class="space-y-5 view-fade">

      <form id="form-today-journal" class="card space-y-4">
        <h2 style="font-size: 15px; font-weight: 700;">Kun yakuni — ${formatUzDateFull(today)}</h2>

        <div class="form-group">
          <label class="form-label" for="journal-win">Bugungi asosiy yutug‘im nima?</label>
          <textarea id="journal-win" class="form-textarea" rows="2" placeholder="Bugun nimalarni uddaladingiz?">${esc(entry.win || '')}</textarea>
        </div>

        <div class="form-group">
          <label class="form-label" for="journal-blocker">Nima menga xalaqit berdi?</label>
          <textarea id="journal-blocker" class="form-textarea" rows="2" placeholder="Qaysi chalg‘ish yoki qiyinchilik bo‘ldi?">${esc(entry.blocker || '')}</textarea>
        </div>

        <div class="form-group">
          <label class="form-label" for="journal-next">Ertaga birinchi bo‘lib bajaradigan vazifam nima?</label>
          <input id="journal-next" class="form-input" type="text" value="${esc(entry.next || '')}" placeholder="Eng muhim vazifa..." />
        </div>

        <div style="display: flex; justify-content: flex-end;">
          <button type="submit" class="btn-primary">Saqlash</button>
        </div>
      </form>

      <section class="space-y-3">
        <h3 style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary);">
          Oldingi yozuvlar (${pastEntries.length})
        </h3>

        ${pastEntries.length === 0 ? `
          <div class="card" style="text-align: center; border-style: dashed; padding: 24px 16px;">
            <p style="font-size: 13px; color: var(--text-muted);">Hali oldingi yozuvlar mavjud emas.</p>
          </div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${pastEntries.map(([date, j]) => `
              <div class="card" style="padding: 16px; display: flex; flex-direction: column; gap: 8px;" data-journal-date="${date}">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <span style="font-size: 13px; font-weight: 700; color: var(--text-secondary);">${formatUzDateShort(date)}</span>
                  <div style="display: flex; gap: 4px;">
                    <button class="task-action-btn edit-journal-btn" title="Tahrirlash">${ICONS.edit}</button>
                    <button class="task-action-btn delete-journal-btn" title="O‘chirish">${ICONS.trash}</button>
                  </div>
                </div>

                ${j.win ? `<p style="font-size: 13px;"><span style="color: var(--mint-primary); font-weight: 600;">Yutuq:</span> ${esc(j.win)}</p>` : ''}
                ${j.blocker ? `<p style="font-size: 13px; color: var(--text-secondary);"><span style="color: var(--rose-primary); font-weight: 600;">Xalaqit:</span> ${esc(j.blocker)}</p>` : ''}
                ${j.next ? `<p style="font-size: 13px; color: var(--text-secondary);"><span style="font-weight: 600; color: var(--text-primary);">Ertaga #1:</span> ${esc(j.next)}</p>` : ''}
              </div>
            `).join('')}
          </div>
        `}
      </section>

    </div>
  `;

  // Bind Events
  container.querySelector('#form-today-journal')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const win = container.querySelector('#journal-win')?.value;
    const blocker = container.querySelector('#journal-blocker')?.value;
    const next = container.querySelector('#journal-next')?.value;
    await saveJournalEntry(today, { win, blocker, next });
  });

  container.querySelectorAll('[data-journal-date]').forEach(cardEl => {
    const d = cardEl.getAttribute('data-journal-date');
    const entryObj = pastEntries.find(([date]) => date === d)?.[1] || {};

    cardEl.querySelector('.edit-journal-btn')?.addEventListener('click', () => {
      openEditJournalModal(d, entryObj);
    });

    cardEl.querySelector('.delete-journal-btn')?.addEventListener('click', () => {
      deleteJournalEntry(d);
    });
  });
}

/* ==========================================================================
   5. YUTUQLAR (Achievements & Badges View)
   ========================================================================== */

export function renderAchievementsView(container) {
  const state = getState();
  const streak = getStreakInfo(state);
  const totalPoints = getTotalPoints(state);
  const badges = getBadgesStatus(state);

  container.innerHTML = `
    <div class="space-y-5 view-fade">

      <section class="grid-3">
        <div class="card" style="padding: 18px 16px;">
          <p style="font-size: 11.5px; font-weight: 600; color: var(--text-secondary);">Joriy seriya</p>
          <p style="font-size: 26px; font-weight: 800; color: var(--amber-primary); margin-top: 6px;">🔥 ${streak.current} kun</p>
        </div>
        <div class="card" style="padding: 18px 16px;">
          <p style="font-size: 11.5px; font-weight: 600; color: var(--text-secondary);">Eng yaxshi</p>
          <p style="font-size: 26px; font-weight: 800; color: var(--mint-primary); margin-top: 6px;">${streak.best} kun</p>
        </div>
        <div class="card" style="padding: 18px 16px;">
          <p style="font-size: 11.5px; font-weight: 600; color: var(--text-secondary);">Jami ball</p>
          <p style="font-size: 26px; font-weight: 800; margin-top: 6px;">⚡ ${totalPoints}</p>
        </div>
      </section>

      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px;">
        ${badges.map(b => `
          <div class="card" style="display: flex; flex-direction: column; justify-content: space-between; gap: 12px; ${b.unlocked ? 'border-color: var(--mint-border);' : 'opacity: 0.5;'}">
            <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 10px;">
              <div>
                <h3 style="font-size: 15px; font-weight: 700;">${b.title}</h3>
                <p style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">${b.desc}</p>
              </div>
              <span style="font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: var(--radius-full); ${b.unlocked ? 'background-color: var(--mint-subtle); color: var(--mint-primary); border: 1px solid var(--mint-border);' : 'background-color: var(--bg-surface-subtle); color: var(--text-muted);'}">
                ${b.unlocked ? 'Ochildi ✓' : 'Yopiq'}
              </span>
            </div>
          </div>
        `).join('')}
      </div>

    </div>
  `;
}
