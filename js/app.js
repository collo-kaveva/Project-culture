/**
 * app.js — Application entry point. Loads data, initializes all modules,
 * and wires up cross-module interactions (e.g. search → map → panel).
 */

import { loadCounties, loadMapSVG, computeStatistics } from './api.js';
import { initMap, selectCounty, highlightSearchResult, clearSelection } from './map.js';
import { initSearch } from './search.js';
import { initInfoPanel, openCountyPanel, closePanel } from './modal.js';
import {
  initToasts, showToast, initScrollReveal, initNavbarScroll,
  initSmoothScrollLinks, initThemeToggle, initFullscreenToggle,
  renderStatistics, renderPopulationChart, renderFavoritesBar, initShortcutsModal
} from './ui.js';
import { initQuiz } from './quiz.js';
import { attachRippleEffect } from './animation.js';
import { addRecentSearch } from './storage.js';

async function main() {
  initToasts();
  initNavbarScroll();
  initSmoothScrollLinks();
  initThemeToggle();
  initFullscreenToggle();
  initShortcutsModal();

  let counties = [];

  try {
    const [countyData, svgMarkup] = await Promise.all([
      loadCounties(),
      loadMapSVG()
    ]);
    counties = countyData;

    await initMap(svgMarkup, counties, handleCountySelected);

    initSearch(counties, (county) => {
      addRecentSearch(county.name);
      highlightSearchResult(county.id);
      selectCounty(county.id);
    });

    initInfoPanel(counties, (county) => {
      // navigate to a nearby county from within the panel
      selectCounty(county.id);
    });

    renderStatistics(computeStatistics(counties));
    renderPopulationChart(counties);
    renderFavoritesBar(counties, (id) => {
      const c = counties.find(cc => cc.id === id);
      if (c) {
        selectCounty(c.id);
        highlightSearchResult(c.id);
      }
    });

    initQuiz(counties);

    document.addEventListener('panel:closed', clearSelection);

    handleDeepLink(counties);

  } catch (err) {
    console.error('[app] Initialization failed:', err);
    showErrorState();
    return;
  }

  attachRippleEffect('.btn');
  initScrollReveal();
  attachExploreButton();
  attachKeyboardShortcuts(counties);

  showToast('Welcome to Project Culture 🇰🇪');
}

function handleCountySelected(county) {
  openCountyPanel(county);
}

function attachExploreButton() {
  const exploreBtn = document.getElementById('explore-btn');
  exploreBtn?.addEventListener('click', () => {
    document.getElementById('map-section')?.scrollIntoView({ behavior: 'smooth' });
  });
}

function attachKeyboardShortcuts(counties) {
  document.addEventListener('keydown', (e) => {
    const tag = e.target.tagName ? e.target.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'textarea') return;

    if (e.key === '/') {
      e.preventDefault();
      document.getElementById('search-input')?.focus();
    }

    if (e.key === 'r' || e.key === 'R') {
      document.getElementById('random-county-btn')?.click();
    }

    if (e.key === 'd' || e.key === 'D') {
      document.getElementById('theme-toggle')?.click();
    }
  });
}

function handleDeepLink(counties) {
  const hash = window.location.hash;
  const match = hash.match(/#county-(\d+)/);
  if (match) {
    const id = parseInt(match[1], 10);
    const county = counties.find(c => c.id === id);
    if (county) {
      setTimeout(() => {
        document.getElementById('map-section')?.scrollIntoView({ behavior: 'smooth' });
        selectCounty(id);
      }, 500);
    }
  }
}

function showErrorState() {
  const mapContainer = document.getElementById('map-container');
  if (mapContainer) {
    mapContainer.innerHTML = `
      <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%; text-align:center; padding: var(--space-8); gap: var(--space-3);">
        <div style="font-size:2.5rem;">⚠️</div>
        <p style="color:var(--clr-text-secondary);">We couldn't load the Kenya map data.<br>Please check your connection and refresh the page.</p>
        <button class="btn btn--primary" onclick="location.reload()">Retry</button>
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', main);
