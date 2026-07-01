/**
 * map.js — Interactive SVG map: hover/click states, zoom & pan, tooltips,
 * "dim others on select" behavior, and random-county selection.
 */

import { clamp } from './utils.js';

let svgRoot = null;
let mapContainer = null;
let tooltipEl = null;
let allCounties = [];
let onCountySelect = null;
let activeCountyId = null;

// Zoom/pan state
let scale = 1;
let translateX = 0;
let translateY = 0;
let isPanning = false;
let panStartX = 0, panStartY = 0;
const MIN_SCALE = 0.8;
const MAX_SCALE = 3.5;

export async function initMap(svgMarkup, counties, onSelectCallback) {
  mapContainer = document.getElementById('map-container');
  tooltipEl = document.getElementById('map-tooltip');
  allCounties = counties;
  onCountySelect = onSelectCallback;

  mapContainer.innerHTML = svgMarkup;
  svgRoot = mapContainer.querySelector('svg');

  attachCountyHandlers();
  attachZoomPanHandlers();
  attachMapControlButtons();

  return svgRoot;
}

function attachCountyHandlers() {
  const counties = svgRoot.querySelectorAll('.county');

  counties.forEach(path => {
    path.setAttribute('tabindex', '0');
    path.setAttribute('role', 'button');
    const name = path.dataset.name || 'County';
    path.setAttribute('aria-label', `${name} county — click for details`);

    path.addEventListener('mouseenter', (e) => handleHoverStart(e, path));
    path.addEventListener('mousemove', (e) => moveTooltip(e));
    path.addEventListener('mouseleave', () => handleHoverEnd(path));

    path.addEventListener('click', () => selectCounty(path));
    path.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectCounty(path);
      }
    });

    path.addEventListener('focus', (e) => handleHoverStart(e, path, true));
    path.addEventListener('blur', () => handleHoverEnd(path));
  });
}

function handleHoverStart(e, path, isFocus = false) {
  path.classList.add('is-hovered');
  const name = path.dataset.name;
  if (tooltipEl) {
    tooltipEl.textContent = `${name} County`;
    tooltipEl.classList.add('is-visible');
    if (!isFocus) moveTooltip(e);
    else positionTooltipNearElement(path);
  }
}

function handleHoverEnd(path) {
  path.classList.remove('is-hovered');
  tooltipEl?.classList.remove('is-visible');
}

function moveTooltip(e) {
  if (!tooltipEl) return;
  const offset = 16;
  tooltipEl.style.left = `${e.clientX + offset}px`;
  tooltipEl.style.top = `${e.clientY + offset}px`;
}

function positionTooltipNearElement(path) {
  const rect = path.getBoundingClientRect();
  tooltipEl.style.left = `${rect.left + rect.width / 2}px`;
  tooltipEl.style.top = `${rect.top - 36}px`;
}

/**
 * Select a county: pop animation, dim others, fire callback to open panel.
 */
export function selectCounty(pathOrId) {
  let path;
  if (typeof pathOrId === 'string' || typeof pathOrId === 'number') {
    path = svgRoot.querySelector(`.county[data-id="${pathOrId}"]`);
  } else {
    path = pathOrId;
  }
  if (!path) return;

  const id = parseInt(path.dataset.id, 10);
  activeCountyId = id;

  const allPaths = svgRoot.querySelectorAll('.county');
  allPaths.forEach(p => {
    p.classList.remove('is-active', 'is-dimmed', 'is-searched');
    if (p === path) {
      p.classList.add('is-active');
    } else {
      p.classList.add('is-dimmed');
    }
  });

  // bring active to front
  path.parentNode.appendChild(path);

  const county = allCounties.find(c => c.id === id);
  if (county && onCountySelect) {
    onCountySelect(county);
  }
}

/**
 * Clear the dim/active state (called when panel closes).
 */
export function clearSelection() {
  if (!svgRoot) return;
  svgRoot.querySelectorAll('.county').forEach(p => {
    p.classList.remove('is-active', 'is-dimmed');
  });
  activeCountyId = null;
}

/**
 * Highlight a county temporarily for search results (gold glow), without dimming others.
 */
export function highlightSearchResult(countyId) {
  if (!svgRoot) return;
  svgRoot.querySelectorAll('.county').forEach(p => p.classList.remove('is-searched'));
  const path = svgRoot.querySelector(`.county[data-id="${countyId}"]`);
  if (path) {
    path.classList.add('is-searched');
    setTimeout(() => path.classList.remove('is-searched'), 2200);
    zoomToCounty(countyId);
  }
}

/**
 * Select a uniformly random county — used by the "Random County" button.
 */
export function selectRandomCounty() {
  if (!allCounties.length) return;
  const random = allCounties[Math.floor(Math.random() * allCounties.length)];
  selectCounty(random.id);
  zoomToCounty(random.id);
}

/* ===================== Zoom & Pan ===================== */

function attachZoomPanHandlers() {
  mapContainer.addEventListener('wheel', (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(scale + delta);
  }, { passive: false });

  mapContainer.addEventListener('mousedown', (e) => {
    if (e.target.closest('.map-ctrl-btn')) return;
    isPanning = true;
    panStartX = e.clientX - translateX;
    panStartY = e.clientY - translateY;
    mapContainer.style.cursor = 'grabbing';
  });

  window.addEventListener('mousemove', (e) => {
    if (!isPanning) return;
    translateX = e.clientX - panStartX;
    translateY = e.clientY - panStartY;
    applyTransform();
  });

  window.addEventListener('mouseup', () => {
    isPanning = false;
    mapContainer.style.cursor = 'grab';
  });

  // Touch support for pan
  let lastTouchDist = null;
  mapContainer.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      isPanning = true;
      panStartX = e.touches[0].clientX - translateX;
      panStartY = e.touches[0].clientY - translateY;
    } else if (e.touches.length === 2) {
      lastTouchDist = getTouchDistance(e.touches);
    }
  }, { passive: true });

  mapContainer.addEventListener('touchmove', (e) => {
    if (e.touches.length === 1 && isPanning) {
      translateX = e.touches[0].clientX - panStartX;
      translateY = e.touches[0].clientY - panStartY;
      applyTransform();
    } else if (e.touches.length === 2) {
      const dist = getTouchDistance(e.touches);
      if (lastTouchDist) {
        const delta = (dist - lastTouchDist) / 200;
        setScale(scale + delta);
      }
      lastTouchDist = dist;
    }
  }, { passive: true });

  mapContainer.addEventListener('touchend', () => {
    isPanning = false;
    lastTouchDist = null;
  });
}

function getTouchDistance(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function setScale(newScale) {
  scale = clamp(newScale, MIN_SCALE, MAX_SCALE);
  applyTransform();
}

function applyTransform() {
  if (!svgRoot) return;
  svgRoot.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
}

export function resetView() {
  scale = 1;
  translateX = 0;
  translateY = 0;
  applyTransform();
}

function zoomToCounty(countyId) {
  const path = svgRoot.querySelector(`.county[data-id="${countyId}"]`);
  if (!path) return;

  const bbox = path.getBBox();
  const viewBox = svgRoot.viewBox.baseVal;
  const cx = bbox.x + bbox.width / 2;
  const cy = bbox.y + bbox.height / 2;

  const containerRect = mapContainer.getBoundingClientRect();
  const targetScale = clamp(2.2, MIN_SCALE, MAX_SCALE);

  // Calculate translation to center the county
  const svgCenterX = viewBox.width / 2;
  const svgCenterY = viewBox.height / 2;
  const scaleFactor = containerRect.width / viewBox.width;

  translateX = (svgCenterX - cx) * scaleFactor * targetScale * 0.5;
  translateY = (svgCenterY - cy) * scaleFactor * targetScale * 0.5;
  scale = targetScale;

  applyTransform();
}

function attachMapControlButtons() {
  document.getElementById('zoom-in-btn')?.addEventListener('click', () => setScale(scale + 0.3));
  document.getElementById('zoom-out-btn')?.addEventListener('click', () => setScale(scale - 0.3));
  document.getElementById('zoom-reset-btn')?.addEventListener('click', resetView);
  document.getElementById('random-county-btn')?.addEventListener('click', selectRandomCounty);
}

export function getSvgRoot() {
  return svgRoot;
}
