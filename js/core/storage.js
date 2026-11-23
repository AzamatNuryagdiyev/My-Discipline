/* ==========================================================================
   MY DISCIPLINE — Dual Storage Engine (IndexedDB + localStorage Fallback)
   ========================================================================== */

const DB_NAME = 'my_discipline_pwa_db';
const DB_VERSION = 1;
const LOCAL_STORAGE_BACKUP_KEY = 'my_discipline_v3_state';

let idbDatabase = null;

/**
 * Opens and initializes IndexedDB
 */
export async function openIndexedDB() {
  if (idbDatabase) return idbDatabase;

  return new Promise((resolve) => {
    if (!window.indexedDB) {
      resolve(null);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains('app_data')) {
        db.createObjectStore('app_data', { keyPath: 'key' });
      }
    };

    request.onsuccess = (event) => {
      idbDatabase = event.target.result;
      resolve(idbDatabase);
    };

    request.onerror = () => {
      resolve(null);
    };
  });
}

/**
 * Saves state both to IndexedDB and as synchronous localStorage backup
 */
export async function persistState(state) {
  try {
    // 1. Synchronous localStorage backup (instant, resilient)
    const jsonStr = JSON.stringify(state);
    localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, jsonStr);

    // 2. IndexedDB persistence
    const db = await openIndexedDB();
    if (db) {
      return new Promise((resolve) => {
        const tx = db.transaction('app_data', 'readwrite');
        const store = tx.objectStore('app_data');
        store.put({ key: 'main_state', data: state, updatedAt: Date.now() });
        tx.oncomplete = () => resolve(true);
        tx.onerror = () => resolve(false);
      });
    }
  } catch (err) {
    console.warn('Storage persist error:', err);
  }
}

/**
 * Loads state from IndexedDB if available, otherwise from localStorage backup
 */
export async function retrieveState() {
  try {
    const db = await openIndexedDB();
    if (db) {
      const dbState = await new Promise((resolve) => {
        const tx = db.transaction('app_data', 'readonly');
        const store = tx.objectStore('app_data');
        const req = store.get('main_state');
        req.onsuccess = () => resolve(req.result ? req.result.data : null);
        req.onerror = () => resolve(null);
      });

      if (dbState && typeof dbState === 'object') {
        return dbState;
      }
    }

    // Fallback to localStorage backup
    const raw = localStorage.getItem(LOCAL_STORAGE_BACKUP_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Storage retrieve error:', err);
  }

  return null;
}

/**
 * Clear all data from both storage engines
 */
export async function clearAllStorage() {
  try {
    localStorage.removeItem(LOCAL_STORAGE_BACKUP_KEY);

    const db = await openIndexedDB();
    if (db) {
      const tx = db.transaction('app_data', 'readwrite');
      const store = tx.objectStore('app_data');
      store.clear();
    }
  } catch (err) {
    console.warn('Clear storage error:', err);
  }
}
