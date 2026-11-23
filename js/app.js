/* ==========================================================================
   MY DISCIPLINE — Main Application Orchestrator
   Initializes Storage, State, Service Worker, UI, and Events
   ========================================================================== */

import { initState, getState, subscribeState } from './core/state.js';
import { initNavigation, getActiveTab, setActiveTab, updateNavUI } from './ui/navigation.js';
import { renderTodayView, renderGoalsView, renderCalendarView, renderJournalView, renderAchievementsView } from './ui/dashboard.js';
import { applyThemeClass, openSettingsModal, registerInstallPrompt } from './ui/components.js';
import { renderStatusBar } from './ui/notifications.js';

let registrationWaitingWorker = null;

/**
 * Renders the currently selected tab
 */
export function renderActiveView() {
  const container = document.getElementById('app-main');
  if (!container) return;

  const currentTab = getActiveTab();
  switch (currentTab) {
    case 'today':
      renderTodayView(container);
      break;
    case 'goals':
      renderGoalsView(container);
      break;
    case 'calendar':
      renderCalendarView(container);
      break;
    case 'journal':
      renderJournalView(container);
      break;
    case 'achievements':
      renderAchievementsView(container);
      break;
    default:
      renderTodayView(container);
  }
}

/**
 * Service Worker Registration & Lifecycle Management
 */
async function registerServiceWorker() {
  if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    try {
      const reg = await navigator.serviceWorker.register('./service-worker.js', { scope: './' });

      // If waiting worker exists on load
      if (reg.waiting) {
        registrationWaitingWorker = reg.waiting;
        promptServiceWorkerUpdate();
      }

      // Detect newly installed service worker
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            registrationWaitingWorker = newWorker;
            promptServiceWorkerUpdate();
          }
        });
      });

      // Reload when new worker takes control
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    } catch (err) {
      console.info('Service Worker registration skipped or failed:', err);
    }
  }
}

function promptServiceWorkerUpdate() {
  renderStatusBar({
    isOnline: navigator.onLine,
    hasUpdate: true,
    onUpdate: () => {
      if (registrationWaitingWorker) {
        registrationWaitingWorker.postMessage({ type: 'SKIP_WAITING' });
      }
    }
  });
}

/**
 * Network Connectivity Listeners
 */
function setupConnectivityListeners() {
  const updateOnlineStatus = () => {
    renderStatusBar({
      isOnline: navigator.onLine,
      hasUpdate: Boolean(registrationWaitingWorker)
    });
  };

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();
}

/**
 * App Bootstrapper
 */
async function bootstrap() {
  // 1. Initialize State (IndexedDB -> Legacy Migration -> Demo Fallback)
  const state = await initState();

  // 2. Apply Theme
  applyThemeClass(state.settings?.theme || 'dark');

  // 3. Setup Navigation & View Switching
  initNavigation(() => {
    renderActiveView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // 4. Render Initial View
  renderActiveView();

  // 5. Subscribe to State Mutations (re-render active view on change)
  subscribeState(() => {
    updateNavUI();
    renderActiveView();
  });

  // 6. Header & Sidebar Buttons
  document.getElementById('btn-header-streak')?.addEventListener('click', () => setActiveTab('achievements'));
  document.getElementById('btn-header-points')?.addEventListener('click', () => setActiveTab('achievements'));
  document.getElementById('btn-header-settings')?.addEventListener('click', () => openSettingsModal());
  document.getElementById('btn-sidebar-settings')?.addEventListener('click', () => openSettingsModal());
  document.getElementById('btn-sidebar-user')?.addEventListener('click', () => openSettingsModal({ focusUsername: true }));

  // 7. PWA Install Event Listener
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    registerInstallPrompt(e);
  });

  // 8. Offline status & Service Worker
  setupConnectivityListeners();
  registerServiceWorker();

  // 9. Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = document.getElementById('modal-root');
      if (modal && modal.classList.contains('open')) {
        modal.classList.remove('open');
        modal.innerHTML = '';
      }
    }
  });
}

// Start application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
