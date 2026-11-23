/* ==========================================================================
   MY DISCIPLINE — UI Components & Modals
   Icons Registry, Settings Modal, Task/Goal/Journal Edit Modals
   ========================================================================== */

import { esc, getTodayISO } from '../core/dates.js';
import { getState, updateState } from '../core/state.js';
import { clearAllStorage } from '../core/storage.js';
import { editTask } from '../features/tasks.js';
import { editGoal } from '../features/goals.js';
import { saveJournalEntry } from '../features/journal.js';
import { showToast } from './notifications.js';

export const ICONS = {
  check: `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`,
  today: `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="3"></rect><polyline points="9 12 11 14 15 10"></polyline></svg>`,
  goals: `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"></circle><circle cx="12" cy="12" r="5"></circle><circle cx="12" cy="12" r="1.5" fill="currentColor"></circle></svg>`,
  calendar: `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2.5"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>`,
  journal: `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>`,
  achievements: `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"></path></svg>`,
  settings: `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`,
  trash: `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
  edit: `<svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`
};

let resetConfirmationStep = false;
let deferredInstallPrompt = null;

export function registerInstallPrompt(e) {
  deferredInstallPrompt = e;
}

/**
 * Opens a modal with custom HTML content
 */
export function openModal(contentHtml) {
  const modalEl = document.getElementById('modal-root');
  if (!modalEl) return;

  modalEl.innerHTML = contentHtml;
  modalEl.classList.add('open');

  modalEl.onclick = (e) => {
    if (e.target === modalEl) closeModal();
  };

  const closeBtns = modalEl.querySelectorAll('[data-close-modal]');
  closeBtns.forEach(btn => btn.addEventListener('click', closeModal));
}

export function closeModal() {
  const modalEl = document.getElementById('modal-root');
  if (modalEl) {
    modalEl.classList.remove('open');
    modalEl.innerHTML = '';
  }
  resetConfirmationStep = false;
}

/**
 * Settings Modal
 */
export function openSettingsModal(options = {}) {
  renderSettingsModal(options);
}

function renderSettingsModal(options = {}) {
  const state = getState();
  const isDark = state.settings?.theme !== 'light';
  const threshold = state.settings?.threshold || 80;

  const html = `
    <div class="modal-card">
      <div class="modal-header">
        <h2 class="modal-title">Sozlamalar</h2>
        <button data-close-modal class="icon-btn" aria-label="Yopish">${ICONS.trash}</button>
      </div>

      <div class="modal-body">
        <!-- User Profile Name Setting -->
        <div class="form-group" style="padding-bottom: 12px; border-bottom: 1px solid var(--border-line);">
          <label class="form-label" for="input-setting-username">Ismingiz (Profil)</label>
          <div style="display: flex; gap: 8px;">
            <input id="input-setting-username" class="form-input" type="text" maxlength="30" value="${esc(state.settings?.userName || 'Azamat')}" placeholder="Ismingizni kiriting..." style="flex: 1;" />
            <button id="btn-save-username" class="btn-primary" style="font-size: 13px; white-space: nowrap; padding: 0 16px;">Saqlash</button>
          </div>
        </div>

        <!-- Theme Setting -->
        <div class="form-group" style="flex-direction: row; justify-content: space-between; align-items: center;">
          <span class="form-label" style="font-size: 14px;">Ko‘rinish (Mavzu)</span>
          <div class="type-toggle-group">
            <button id="btn-theme-dark" class="type-toggle-btn ${isDark ? 'active' : ''}">Qorong‘i</button>
            <button id="btn-theme-light" class="type-toggle-btn ${!isDark ? 'active' : ''}">Yorug‘</button>
          </div>
        </div>

        <!-- Threshold Setting -->
        <div class="form-group">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span class="form-label">Intizom chegarasi</span>
            <span style="font-size: 11px; color: var(--text-muted);">Seriya uchun minimal %</span>
          </div>
          <div class="grid-3" style="grid-template-columns: repeat(4, 1fr); gap: 6px;">
            ${[70, 80, 90, 100].map(val => `
              <button class="btn-secondary btn-threshold ${threshold === val ? 'active-threshold' : ''}" data-val="${val}" style="${threshold === val ? 'background-color: var(--emerald-subtle); border-color: var(--emerald-primary); color: var(--emerald-primary); font-weight: 700;' : ''}">${val}%</button>
            `).join('')}
          </div>
        </div>

        <!-- PWA Install Guide -->
        <div class="form-group" style="padding-top: 10px; border-top: 1px solid var(--border-line);">
          <span class="form-label">PWA O‘rnatish</span>
          <div style="display: flex; gap: 8px;">
            <button id="btn-pwa-install" class="btn-primary" style="flex: 1; font-size: 12px;">
              Qurilmaga o‘rnatish
            </button>
          </div>
          <p style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">
            iOS: Safari orqali ochib, "Bosh ekranga qo‘shish" (Add to Home Screen) tugmasini bosing.
          </p>
        </div>

        <!-- JSON Backup & Restore -->
        <div class="form-group" style="padding-top: 10px; border-top: 1px solid var(--border-line);">
          <span class="form-label">Ma’lumotlarni saqlash va tiklash</span>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <button id="btn-export-json" class="btn-secondary" style="font-size: 12px;">JSON Eksport</button>
            <label class="btn-secondary" style="font-size: 12px; cursor: pointer; text-align: center;">
              JSON Import
              <input id="input-import-json" type="file" accept=".json,application/json" style="display: none;" />
            </label>
          </div>
        </div>

        <!-- Reset All Data -->
        <div class="form-group" style="padding-top: 10px; border-top: 1px solid var(--border-line);">
          <span class="form-label">Boshidan boshlash</span>
          ${!resetConfirmationStep ? `
            <button id="btn-ask-reset" class="btn-danger" style="width: 100%; font-size: 12px; background-color: var(--rose-subtle); color: var(--rose-primary);">
              Barcha ma’lumotlarni tozalash
            </button>
          ` : `
            <div style="padding: 12px; border-radius: var(--radius-md); background-color: var(--rose-subtle); border: 1px solid var(--rose-border); display: flex; flex-direction: column; gap: 10px;">
              <p style="font-size: 12px; color: var(--rose-primary); font-weight: 500;">
                Barcha vazifalar, maqsadlar, loglar va jurnallar butunlay o‘chiriladi. Rozimisiz?
              </p>
              <div style="display: flex; gap: 8px;">
                <button id="btn-cancel-reset" class="btn-secondary" style="flex: 1; font-size: 12px;">Bekor qilish</button>
                <button id="btn-confirm-reset" class="btn-danger" style="flex: 1; font-size: 12px;">Ha, tozalansin</button>
              </div>
            </div>
          `}
        </div>
      </div>
    </div>
  `;

  openModal(html);

  // Bind Events
  const handleSaveUsername = async () => {
    const input = document.getElementById('input-setting-username');
    const newName = input?.value.trim();
    if (!newName) {
      showToast('Ism bo‘sh bo‘lishi mumkin emas!');
      return;
    }
    await updateState(s => {
      if (!s.settings) s.settings = {};
      s.settings.userName = newName;
    });
    showToast(`Ism yangilandi: ${newName} ✓`);
    const nameEl = document.getElementById('sidebar-user-name');
    if (nameEl) nameEl.textContent = newName;
  };

  document.getElementById('btn-save-username')?.addEventListener('click', handleSaveUsername);
  document.getElementById('input-setting-username')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveUsername();
    }
  });

  if (options && options.focusUsername) {
    setTimeout(() => {
      const input = document.getElementById('input-setting-username');
      if (input) {
        input.focus();
        input.select();
      }
    }, 150);
  }
  document.getElementById('btn-theme-dark')?.addEventListener('click', async () => {
    await updateState(s => { s.settings.theme = 'dark'; });
    applyThemeClass('dark');
    renderSettingsModal();
  });

  document.getElementById('btn-theme-light')?.addEventListener('click', async () => {
    await updateState(s => { s.settings.theme = 'light'; });
    applyThemeClass('light');
    renderSettingsModal();
  });

  document.querySelectorAll('.btn-threshold').forEach(btn => {
    btn.addEventListener('click', async () => {
      const val = Number(btn.getAttribute('data-val'));
      await updateState(s => { s.settings.threshold = val; });
      renderSettingsModal();
    });
  });

  document.getElementById('btn-pwa-install')?.addEventListener('click', async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        showToast('Ilova o‘rnatilmoqda!');
      }
      deferredInstallPrompt = null;
    } else {
      showToast('Ilova brauzer orqali o‘rnatishga tayyor!');
    }
  });

  document.getElementById('btn-export-json')?.addEventListener('click', () => {
    exportDataAsJSON();
  });

  document.getElementById('input-import-json')?.addEventListener('change', (e) => {
    importDataFromJSON(e);
  });

  document.getElementById('btn-ask-reset')?.addEventListener('click', () => {
    resetConfirmationStep = true;
    renderSettingsModal();
  });

  document.getElementById('btn-cancel-reset')?.addEventListener('click', () => {
    resetConfirmationStep = false;
    renderSettingsModal();
  });

  document.getElementById('btn-confirm-reset')?.addEventListener('click', async () => {
    await clearAllStorage();
    await updateState(s => {
      s.tasks = [];
      s.goals = [];
      s.logs = {};
      s.snapshots = {};
      s.journals = {};
    });
    closeModal();
    showToast('Barcha ma’lumotlar tozalandi');
  });
}

function exportDataAsJSON() {
  try {
    const state = getState();
    const cleanBackup = {
      app: 'MY_DISCIPLINE',
      version: 3,
      exportedAt: new Date().toISOString(),
      ...state
    };

    const blob = new Blob([JSON.stringify(cleanBackup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my-discipline-backup-${getTodayISO()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast('JSON zaxira nusxasi yuklab olindi ✓');
  } catch (e) {
    showToast('Eksportda xatolik yuz berdi');
  }
}

function importDataFromJSON(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const parsed = JSON.parse(e.target.result);

      // Deep Schema Validation
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Noto‘g‘ri format');
      }

      if (!Array.isArray(parsed.tasks) || !Array.isArray(parsed.goals)) {
        throw new Error('Kerakli maydonlar topilmadi (tasks yoki goals)');
      }

      // Sanitize Imported Data
      const sanitizedTasks = parsed.tasks.map((t, i) => ({
        id: String(t.id || `t_${i}`),
        title: String(t.title || 'Vazifa').trim(),
        type: t.type === 'today' ? 'today' : 'daily',
        date: t.date || undefined,
        createdAt: t.createdAt || getTodayISO(),
        isActive: t.isActive !== false
      }));

      const sanitizedGoals = parsed.goals.map((g, i) => ({
        id: String(g.id || `g_${i}`),
        title: String(g.title || 'Maqsad').trim(),
        current: Math.max(0, Number(g.current) || 0),
        target: Math.max(1, Number(g.target) || 1),
        unit: String(g.unit || 'kun').trim(),
        type: g.type === 'long' ? 'long' : '30d'
      }));

      const sanitizedLogs = (parsed.logs && typeof parsed.logs === 'object') ? parsed.logs : {};
      const sanitizedSnapshots = (parsed.snapshots && typeof parsed.snapshots === 'object') ? parsed.snapshots : {};
      const sanitizedJournals = (parsed.journals && typeof parsed.journals === 'object') ? parsed.journals : {};

      const sanitizedSettings = {
        theme: parsed.settings?.theme === 'light' ? 'light' : 'dark',
        threshold: [70, 80, 90, 100].includes(Number(parsed.settings?.threshold))
          ? Number(parsed.settings.threshold)
          : 80
      };

      await updateState(s => {
        s.version = 3;
        s.settings = sanitizedSettings;
        s.tasks = sanitizedTasks;
        s.goals = sanitizedGoals;
        s.logs = sanitizedLogs;
        s.snapshots = sanitizedSnapshots;
        s.journals = sanitizedJournals;
      });

      applyThemeClass(sanitizedSettings.theme);
      closeModal();
      showToast('Ma’lumotlar muvaffaqiyatli import qilindi ✓');
    } catch (err) {
      showToast(`Import xatosi: ${err.message || 'Noto‘g‘ri fayl'}`);
    }
  };

  reader.readAsText(file);
  event.target.value = '';
}

export function applyThemeClass(theme) {
  const isDark = theme !== 'light';
  document.documentElement.classList.toggle('dark', isDark);
  const meta = document.getElementById('meta-theme-color');
  if (meta) meta.setAttribute('content', isDark ? '#0B0D10' : '#F8FAFC');
}

/**
 * Task Edit Modal
 */
export function openEditTaskModal(task) {
  if (!task) return;

  const html = `
    <div class="modal-card">
      <div class="modal-header">
        <h2 class="modal-title">Vazifani tahrirlash</h2>
        <button data-close-modal class="icon-btn" aria-label="Yopish">${ICONS.trash}</button>
      </div>

      <form id="form-edit-task" class="modal-body">
        <div class="form-group">
          <label class="form-label" for="edit-task-title">Vazifa nomi</label>
          <input id="edit-task-title" class="form-input" type="text" required value="${esc(task.title)}" />
        </div>

        <div class="form-group">
          <label class="form-label" for="edit-task-type">Turi</label>
          <select id="edit-task-type" class="form-select">
            <option value="daily" ${task.type === 'daily' ? 'selected' : ''}>Har kunlik vazifa</option>
            <option value="today" ${task.type === 'today' ? 'selected' : ''}>Faqat bugun uchun</option>
          </select>
        </div>

        <div class="modal-footer" style="padding: 0; margin-top: 8px;">
          <button type="button" data-close-modal class="btn-secondary">Bekor qilish</button>
          <button type="submit" class="btn-primary">Saqlash</button>
        </div>
      </form>
    </div>
  `;

  openModal(html);

  document.getElementById('form-edit-task')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('edit-task-title')?.value;
    const type = document.getElementById('edit-task-type')?.value;
    await editTask(task.id, title, type);
    closeModal();
  });
}

/**
 * Goal Edit Modal
 */
export function openEditGoalModal(goal) {
  if (!goal) return;

  const html = `
    <div class="modal-card">
      <div class="modal-header">
        <h2 class="modal-title">Maqsadni tahrirlash</h2>
        <button data-close-modal class="icon-btn" aria-label="Yopish">${ICONS.trash}</button>
      </div>

      <form id="form-edit-goal" class="modal-body">
        <div class="form-group">
          <label class="form-label" for="edit-goal-title">Maqsad nomi</label>
          <input id="edit-goal-title" class="form-input" type="text" required value="${esc(goal.title)}" />
        </div>

        <div class="grid-3" style="gap: 10px;">
          <div class="form-group">
            <label class="form-label" for="edit-goal-current">Hozirgi</label>
            <input id="edit-goal-current" class="form-input" type="number" min="0" required value="${goal.current}" />
          </div>
          <div class="form-group">
            <label class="form-label" for="edit-goal-target">Mo‘ljal</label>
            <input id="edit-goal-target" class="form-input" type="number" min="1" required value="${goal.target}" />
          </div>
          <div class="form-group">
            <label class="form-label" for="edit-goal-unit">Birlik</label>
            <input id="edit-goal-unit" class="form-input" type="text" required value="${esc(goal.unit)}" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="edit-goal-type">Turi</label>
          <select id="edit-goal-type" class="form-select">
            <option value="30d" ${goal.type === '30d' ? 'selected' : ''}>30 kunlik maqsad</option>
            <option value="long" ${goal.type === 'long' ? 'selected' : ''}>Uzoq muddatli maqsad</option>
          </select>
        </div>

        <div class="modal-footer" style="padding: 0; margin-top: 8px;">
          <button type="button" data-close-modal class="btn-secondary">Bekor qilish</button>
          <button type="submit" class="btn-primary">Saqlash</button>
        </div>
      </form>
    </div>
  `;

  openModal(html);

  document.getElementById('form-edit-goal')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('edit-goal-title')?.value;
    const current = document.getElementById('edit-goal-current')?.value;
    const target = document.getElementById('edit-goal-target')?.value;
    const unit = document.getElementById('edit-goal-unit')?.value;
    const type = document.getElementById('edit-goal-type')?.value;

    await editGoal(goal.id, { title, current, target, unit, type });
    closeModal();
  });
}

/**
 * Past Journal Edit Modal
 */
export function openEditJournalModal(dateISO, currentEntry) {
  const html = `
    <div class="modal-card">
      <div class="modal-header">
        <h2 class="modal-title">Jurnalni tahrirlash (${dateISO})</h2>
        <button data-close-modal class="icon-btn" aria-label="Yopish">${ICONS.trash}</button>
      </div>

      <form id="form-edit-journal" class="modal-body">
        <div class="form-group">
          <label class="form-label" for="edit-j-win">Asosiy yutuq</label>
          <textarea id="edit-j-win" class="form-textarea" rows="2">${esc(currentEntry.win || '')}</textarea>
        </div>

        <div class="form-group">
          <label class="form-label" for="edit-j-blocker">Nima xalaqit berdi</label>
          <textarea id="edit-j-blocker" class="form-textarea" rows="2">${esc(currentEntry.blocker || '')}</textarea>
        </div>

        <div class="form-group">
          <label class="form-label" for="edit-j-next">Ertaga birinchi vazifa</label>
          <input id="edit-j-next" class="form-input" type="text" value="${esc(currentEntry.next || '')}" />
        </div>

        <div class="modal-footer" style="padding: 0; margin-top: 8px;">
          <button type="button" data-close-modal class="btn-secondary">Bekor qilish</button>
          <button type="submit" class="btn-primary">Saqlash</button>
        </div>
      </form>
    </div>
  `;

  openModal(html);

  document.getElementById('form-edit-journal')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const win = document.getElementById('edit-j-win')?.value;
    const blocker = document.getElementById('edit-j-blocker')?.value;
    const next = document.getElementById('edit-j-next')?.value;

    await saveJournalEntry(dateISO, { win, blocker, next });
    closeModal();
  });
}
