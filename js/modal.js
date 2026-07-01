/**
 * modal.js — The county information panel (sliding drawer).
 * Renders detailed county data and handles open/close/favorite/share interactions.
 */

import { escapeHtml, formatNumber } from './utils.js';
import { isFavorite, toggleFavorite, addRecentlyViewed } from './storage.js';
import { showToast, renderFavoritesBar } from './ui.js';
import { findNearestCounties } from './utils.js';

let panelEl, overlayEl;
let allCountiesRef = [];
let onNavigateCallback = null;

export function initInfoPanel(allCounties, onNavigate) {
  panelEl = document.getElementById('info-panel');
  overlayEl = document.getElementById('overlay');
  allCountiesRef = allCounties;
  onNavigateCallback = onNavigate;

  overlayEl?.addEventListener('click', closePanel);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePanel();
  });
}

export function openCountyPanel(county) {
  if (!panelEl) return;

  addRecentlyViewed(county.id);
  panelEl.innerHTML = renderPanelContent(county);
  panelEl.classList.add('is-open');
  overlayEl?.classList.add('is-visible');
  panelEl.scrollTop = 0;

  attachPanelEvents(county);
}

export function closePanel() {
  panelEl?.classList.remove('is-open');
  overlayEl?.classList.remove('is-visible');
  document.dispatchEvent(new CustomEvent('panel:closed'));
}

function renderPanelContent(c) {
  const fav = isFavorite(c.id);
  const nearby = findNearestCounties(c, allCountiesRef, 4);

  return `
    <div class="panel-header">
      <button class="panel-header__close" id="panel-close-btn" aria-label="Close panel">✕</button>
      <div class="panel-header__number">County No. ${String(c.id).padStart(2, '0')} of 47</div>
      <h2 class="panel-header__name">${escapeHtml(c.name)}</h2>
      <div class="panel-header__capital">📍 ${escapeHtml(c.capital)}</div>
      <div class="panel-meta-chips">
        <span class="meta-chip">👥 ${escapeHtml(formatNumber(c.population))}</span>
        <span class="meta-chip">📐 ${escapeHtml(c.area)}</span>
      </div>
    </div>

    <div class="panel-body">

      <div class="panel-section">
        <div style="display:flex; gap: var(--space-2);">
          <button class="btn btn--primary" id="panel-fav-btn" style="flex:1;">
            ${fav ? '★ Favorited' : '☆ Add to Favorites'}
          </button>
          <button class="btn btn--secondary btn--icon-lg" id="panel-share-btn" aria-label="Copy link">🔗</button>
        </div>
      </div>

      <div class="panel-section">
        <div class="panel-section__title">📋 Quick Facts</div>
        <div class="panel-grid">
          <div class="panel-grid-item">
            <div class="panel-grid-item__label">Governor</div>
            <div class="panel-grid-item__value">${escapeHtml(c.governor)}</div>
          </div>
          <div class="panel-grid-item">
            <div class="panel-grid-item__label">Capital</div>
            <div class="panel-grid-item__value">${escapeHtml(c.capital)}</div>
          </div>
          <div class="panel-grid-item">
            <div class="panel-grid-item__label">Population</div>
            <div class="panel-grid-item__value">${escapeHtml(formatNumber(c.population))}</div>
          </div>
          <div class="panel-grid-item">
            <div class="panel-grid-item__label">Area</div>
            <div class="panel-grid-item__value">${escapeHtml(c.area)}</div>
          </div>
        </div>
      </div>

      <div class="panel-section">
        <div class="panel-section__title">🗣️ Languages</div>
        <div class="tag-list">
          ${c.languages.map(l => `<span class="tag">${escapeHtml(l)}</span>`).join('')}
        </div>
      </div>

      <div class="panel-section">
        <div class="panel-section__title">👨‍👩‍👧‍👦 Ethnic Communities</div>
        <div class="tag-list">
          ${c.tribes.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
        </div>
      </div>

      <div class="panel-section">
        <div class="panel-section__title">🌦️ Climate</div>
        <p class="panel-section__content">${escapeHtml(c.climate)}</p>
      </div>

      <div class="panel-section">
        <div class="panel-section__title">💼 Economic Activities</div>
        <div class="tag-list">
          ${c.economy.map(e => `<span class="tag">${escapeHtml(e)}</span>`).join('')}
        </div>
      </div>

      <div class="panel-section">
        <div class="panel-section__title">🏞️ Tourist Attractions</div>
        <div class="tag-list">
          ${c.tourism.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
        </div>
      </div>

      ${c.nationalParks && c.nationalParks.length ? `
      <div class="panel-section">
        <div class="panel-section__title">🦓 National Parks &amp; Reserves</div>
        <div class="tag-list">
          ${c.nationalParks.map(p => `<span class="tag">${escapeHtml(p)}</span>`).join('')}
        </div>
      </div>` : ''}

      <div class="panel-section">
        <div class="panel-section__title">🎓 Universities</div>
        <p class="panel-section__content">${c.universities && c.universities.length ? escapeHtml(c.universities.join(', ')) : 'No major universities listed.'}</p>
      </div>

      <div class="panel-section">
        <div class="panel-section__title">🏥 Hospitals</div>
        <p class="panel-section__content">${escapeHtml(c.hospitals.join(', '))}</p>
      </div>

      <div class="panel-section">
        <div class="panel-section__title">🛣️ Road Network</div>
        <p class="panel-section__content">${escapeHtml(c.roadNetwork)}</p>
      </div>

      <div class="panel-section">
        <div class="panel-section__title">🏘️ Major Towns</div>
        <div class="tag-list">
          ${c.majorTowns.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
        </div>
      </div>

      <div class="panel-section">
        <div class="panel-section__title">📜 Historical Background</div>
        <p class="panel-section__content">${escapeHtml(c.history)}</p>
      </div>

      <div class="panel-section">
        <div class="fun-fact-box">
          <strong>💡 Fun Fact</strong>
          ${escapeHtml(c.funFact)}
        </div>
      </div>

      <div class="panel-section">
        <div class="panel-section__title">🧭 Nearby Counties</div>
        <div class="tag-list">
          ${nearby.map(n => `<button class="nearby-county-chip" data-nearby-id="${n.id}">${escapeHtml(n.name)}</button>`).join('')}
        </div>
      </div>

      <div class="panel-section">
        <div class="panel-section__title">📍 Coordinates</div>
        <div class="panel-grid">
          <div class="panel-grid-item">
            <div class="panel-grid-item__label">Latitude</div>
            <div class="panel-grid-item__value">${c.coordinates.lat.toFixed(4)}°</div>
          </div>
          <div class="panel-grid-item">
            <div class="panel-grid-item__label">Longitude</div>
            <div class="panel-grid-item__value">${c.coordinates.lng.toFixed(4)}°</div>
          </div>
        </div>
      </div>

      <div class="panel-section">
        <div class="panel-section__title">🔗 Learn More</div>
        <div class="external-links">
          <a class="external-link" href="${c.wikipedia}" target="_blank" rel="noopener noreferrer">📖 Wikipedia</a>
          <a class="external-link" href="${c.googleMaps}" target="_blank" rel="noopener noreferrer">🗺️ Google Maps</a>
        </div>
      </div>

    </div>
  `;
}

function attachPanelEvents(county) {
  document.getElementById('panel-close-btn')?.addEventListener('click', closePanel);

  document.getElementById('panel-fav-btn')?.addEventListener('click', (e) => {
    const nowFav = toggleFavorite(county.id);
    e.target.textContent = nowFav ? '★ Favorited' : '☆ Add to Favorites';
    showToast(nowFav ? `${county.name} added to favorites` : `${county.name} removed from favorites`);
    renderFavoritesBar(allCountiesRef, (id) => {
      const c = allCountiesRef.find(cc => cc.id === id);
      if (c) openCountyPanel(c);
    });
  });

  document.getElementById('panel-share-btn')?.addEventListener('click', async () => {
    const url = `${window.location.origin}${window.location.pathname}#county-${county.id}`;
    try {
      await navigator.clipboard.writeText(url);
      showToast('Link copied to clipboard!');
    } catch {
      showToast('Could not copy link');
    }
  });

  panelEl.querySelectorAll('[data-nearby-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.nearbyId, 10);
      const c = allCountiesRef.find(cc => cc.id === id);
      if (c && onNavigateCallback) onNavigateCallback(c);
    });
  });
}
