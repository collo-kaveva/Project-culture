/**
 * utils.js — Shared utility functions for Project Culture
 */

/**
 * Debounce a function call
 * @param {Function} fn
 * @param {number} delay
 */
export function debounce(fn, delay = 250) {
  let timer = null;
  return function debounced(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Clamp a number between min and max
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Format a large number with commas
 */
export function formatNumber(num) {
  if (typeof num === 'string') {
    const parsed = parseInt(num.replace(/,/g, ''), 10);
    if (!isNaN(parsed)) return parsed.toLocaleString('en-US');
    return num;
  }
  return num.toLocaleString('en-US');
}

/**
 * Parse population string to number (handles commas)
 */
export function parsePopulation(str) {
  if (typeof str === 'number') return str;
  return parseInt(String(str).replace(/,/g, ''), 10) || 0;
}

/**
 * Parse area string (e.g. "229.9 km²") to number
 */
export function parseArea(str) {
  if (typeof str === 'number') return str;
  const match = String(str).match(/[\d,]+\.?\d*/);
  return match ? parseFloat(match[0].replace(/,/g, '')) : 0;
}

/**
 * Simple fuzzy match: checks if query characters appear in order within target
 */
export function fuzzyMatch(query, target) {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (t.includes(q)) return true;
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
}

/**
 * Calculate distance between two lat/lng points (Haversine, in km)
 */
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Find N nearest counties to a given county by coordinates
 */
export function findNearestCounties(county, allCounties, n = 4) {
  return allCounties
    .filter(c => c.id !== county.id)
    .map(c => ({
      county: c,
      distance: haversineDistance(
        county.coordinates.lat, county.coordinates.lng,
        c.coordinates.lat, c.coordinates.lng
      )
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, n)
    .map(item => item.county);
}

/**
 * Escape HTML to prevent injection when rendering dynamic data
 */
export function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Generate a simple SVG-safe id from a name
 */
export function slugify(str) {
  return String(str).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/**
 * Wait helper (for orchestrating animation sequences)
 */
export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get a random integer between min (inclusive) and max (inclusive)
 */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Pick a random item from an array
 */
export function randomItem(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

/**
 * Shuffle an array (Fisher-Yates), returns a new array
 */
export function shuffle(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
