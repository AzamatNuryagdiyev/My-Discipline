/* ==========================================================================
   MY DISCIPLINE — Navigation Module
   Synchronizes Desktop Sidebar, Mobile Bottom Bar, and Active View
   ========================================================================== */

import { ICONS } from './components.js';
import { getState } from '../core/state.js';
import { getStreakInfo, getTotalPoints } from '../features/statistics.js';

export const TABS = [
  { id: 'today',        label: 'Bugun',     icon: ICONS.today },
  { id: 'goals',        label: 'Maqsadlar', icon: ICONS.goals },
  { id: 'calendar',     label: 'Kalendar',  icon: ICONS.calendar },
  { id: 'journal',      label: 'Jurnal',    icon: ICONS.journal },
  { id: 'achievements', label: 'Yutuqlar',  icon: ICONS.achievements }
];

let activeTabId = 'today';
let onTabChangeCallback = null;

export function getActiveTab() {
  return activeTabId;
}

export function setActiveTab(tabId) {
  activeTabId = tabId;
  updateNavUI();
  if (typeof onTabChangeCallback === 'function') {
    onTabChangeCallback(tabId);
  }
}

export function initNavigation(onChange) {
  onTabChangeCallback = onChange;
  updateNavUI();
}

/**
 * Updates Desktop and Mobile Nav elements and Header badges
 */
export function updateNavUI() {
  const state = getState();
  const streak = getStreakInfo(state);
  const totalPoints = getTotalPoints(state);

  // Update Header Badges
  const hdrStreak = document.getElementById('hdr-streak');
  const hdrPoints = document.getElementById('hdr-points');
  if (hdrStreak) hdrStreak.textContent = `${streak.current} kun`;
  if (hdrPoints) hdrPoints.textContent = `${totalPoints} ball`;

  const userNameEl = document.getElementById('sidebar-user-name');
  if (userNameEl) userNameEl.textContent = state.settings?.userName || 'Azamat';

  // Render Desktop Sidebar Nav
  const desktopNav = document.getElementById('desktop-nav');
  if (desktopNav) {
    desktopNav.innerHTML = TABS.map(tab => {
      const isActive = activeTabId === tab.id;
      return `
        <button class="nav-btn ${isActive ? 'active' : ''}" data-tab="${tab.id}">
          ${isActive ? '<span class="nav-indicator-dot"></span>' : ''}
          <span class="nav-btn-icon">${tab.icon}</span>
          <span>${tab.label}</span>
        </button>
      `;
    }).join('');

    desktopNav.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-tab');
        if (target) setActiveTab(target);
      });
    });
  }

  // Render Mobile Bottom Nav
  const mobileNav = document.getElementById('mobile-nav');
  if (mobileNav) {
    mobileNav.innerHTML = TABS.map(tab => {
      const isActive = activeTabId === tab.id;
      return `
        <button class="mobile-nav-btn ${isActive ? 'active' : ''}" data-tab="${tab.id}">
          ${tab.icon}
          <span class="mobile-nav-label">${tab.label}</span>
        </button>
      `;
    }).join('');

    mobileNav.querySelectorAll('.mobile-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-tab');
        if (target) setActiveTab(target);
      });
    });
  }
}
