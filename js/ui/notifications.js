/* ==========================================================================
   MY DISCIPLINE — Notifications & Status Module
   Toast alerts, Online/Offline banner, PWA update prompt
   ========================================================================== */

import { esc } from '../core/dates.js';

let toastTimeout = null;

/**
 * Shows an accessible toast notification
 */
export function showToast(message, duration = 2400) {
  const root = document.getElementById('toast-root');
  if (!root) return;

  root.innerHTML = `
    <div class="toast" role="alert" aria-live="polite">
      <span>${esc(message)}</span>
    </div>
  `;

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    root.innerHTML = '';
  }, duration);
}

/**
 * Updates top status bar for offline state or service worker updates
 */
export function renderStatusBar({ isOnline = true, hasUpdate = false, onUpdate = null }) {
  const bannerContainer = document.getElementById('status-banner-root');
  if (!bannerContainer) return;

  if (!isOnline) {
    bannerContainer.innerHTML = `
      <div class="status-banner offline">
        <span>⚠️ Internet yo‘q — Ilova to‘liq oflayn rejimda ishlamoqda.</span>
      </div>
    `;
    return;
  }

  if (hasUpdate) {
    bannerContainer.innerHTML = `
      <div class="status-banner update">
        <span>Yangi versiya mavjud!</span>
        <button id="btn-sw-update">Yangilash</button>
      </div>
    `;

    document.getElementById('btn-sw-update')?.addEventListener('click', () => {
      if (typeof onUpdate === 'function') onUpdate();
    });
    return;
  }

  bannerContainer.innerHTML = '';
}
