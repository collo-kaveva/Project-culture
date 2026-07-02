/**
 * storage.js — Persistent state management (favorites, recently viewed, theme, recent searches)
 * Uses localStorage with a namespaced key and graceful fallback to in-memory store
 * if localStorage is unavailable (e.g. private browsing restrictions).
 */

const NAMESPACE = 'projectCulture';

/** In-memory fallback store, used if localStorage throws */
const memoryStore = {};

function isStorageAvailable() {
  try {
    const testKey = '__pc_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

const STORAGE_OK = isStorageAvailable();

function getKey(key) {
  return `${NAMESPACE}:${key}`;
}

function get(key, fallback = null) {
  try {
    if (STORAGE_OK) {
      const raw = window.localStorage.getItem(getKey(key));
      return raw !== null ? JSON.parse(raw) : fallback;
    }
    return key in memoryStore ? memoryStore[key] : fallback;
  } catch (e) {
    return fallback;
  }
}

function set(key, value) {
  try {
    if (STORAGE_OK) {
      window.localStorage.setItem(getKey(key), JSON.stringify(value));
    } else {
      memoryStore[key] = value;
    }
    return true;
  } catch (e) {
    return false;
  }
}

/* ===================== Favorites ===================== */

export function getFavorites() {
  return get('favorites', []);
}

export function isFavorite(countyId) {
  return getFavorites().includes(countyId);
}

export function toggleFavorite(countyId) {
  const favs = getFavorites();
  const idx = favs.indexOf(countyId);
  if (idx === -1) {
    favs.push(countyId);
  } else {
    favs.splice(idx, 1);
  }
  set('favorites', favs);
  return favs.includes(countyId);
}

/* ===================== Recently Viewed ===================== */

export function getRecentlyViewed() {
  return get('recentlyViewed', []);
}

export function addRecentlyViewed(countyId) {
  let recent = getRecentlyViewed();
  recent = recent.filter(id => id !== countyId);
  recent.unshift(countyId);
  recent = recent.slice(0, 8);
  set('recentlyViewed', recent);
  return recent;
}

/* ===================== Recent Searches ===================== */

export function getRecentSearches() {
  return get('recentSearches', []);
}

export function addRecentSearch(query) {
  if (!query || !query.trim()) return getRecentSearches();
  let recent = getRecentSearches();
  recent = recent.filter(q => q.toLowerCase() !== query.toLowerCase());
  recent.unshift(query);
  recent = recent.slice(0, 5);
  set('recentSearches', recent);
  return recent;
}

export function clearRecentSearches() {
  set('recentSearches', []);
}

/* ===================== Theme ===================== */

export function getTheme() {
  return get('theme', null);
}

export function setTheme(theme) {
  set('theme', theme);
}

/* ===================== Quiz Stats ===================== */

export function getQuizBestScore() {
  return get('quizBestScore', 0);
}

export function setQuizBestScore(score) {
  const best = getQuizBestScore();
  if (score > best) {
    set('quizBestScore', score);
    return true; // new record
  }
  return false;
}
