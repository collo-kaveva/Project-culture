/**
 * api.js — Data access layer. Loads county data (JSON) and the SVG map.
 * Centralizing fetch logic here means UI modules never talk to the network directly.
 */

let cachedCounties = null;

/**
 * Load all county data from data/counties.json
 * Returns a Promise resolving to an array of county objects.
 */
export async function loadCounties() {
  if (cachedCounties) return cachedCounties;

  try {
    const response = await fetch('data/counties.json');
    if (!response.ok) {
      throw new Error(`Failed to load county data: ${response.status}`);
    }
    const data = await response.json();
    cachedCounties = data.counties;
    return cachedCounties;
  } catch (err) {
    console.error('[api] Error loading counties.json:', err);
    throw err;
  }
}

/**
 * Load the SVG map markup as a string, ready for injection into the DOM.
 */
export async function loadMapSVG() {
  try {
    const response = await fetch('svg/kenya-map.svg');
    if (!response.ok) {
      throw new Error(`Failed to load map SVG: ${response.status}`);
    }
    return await response.text();
  } catch (err) {
    console.error('[api] Error loading kenya-map.svg:', err);
    throw err;
  }
}

/**
 * Get a single county by its numeric ID.
 */
export function getCountyById(id) {
  if (!cachedCounties) return null;
  return cachedCounties.find(c => c.id === Number(id)) || null;
}

/**
 * Get all cached counties synchronously (must call loadCounties() first).
 */
export function getAllCounties() {
  return cachedCounties || [];
}

/**
 * Compute basic national statistics from county data.
 */
export function computeStatistics(counties) {
  const totalPopulation = counties.reduce((sum, c) => {
    const pop = parseInt(String(c.population).replace(/,/g, ''), 10);
    return sum + (isNaN(pop) ? 0 : pop);
  }, 0);

  const byArea = [...counties].sort((a, b) => {
    const areaA = parseFloat(String(a.area).replace(/[^\d.]/g, ''));
    const areaB = parseFloat(String(b.area).replace(/[^\d.]/g, ''));
    return areaB - areaA;
  });

  const largestCounty = byArea[0];
  const smallestCounty = byArea[byArea.length - 1];

  const totalNationalParks = counties.reduce(
    (sum, c) => sum + (c.nationalParks ? c.nationalParks.length : 0),
    0
  );

  return {
    totalCounties: counties.length,
    totalPopulation,
    largestCounty,
    smallestCounty,
    totalNationalParks,
    highestMountain: 'Mount Kenya (5,199m)',
    longestRiver: 'Tana River (1,000km)',
    unescoSites: 5
  };
}
