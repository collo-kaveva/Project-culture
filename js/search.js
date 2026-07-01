/**
 * search.js — Live search with autocomplete, keyboard navigation, and recent searches.
 */

import { debounce, fuzzyMatch, escapeHtml } from './utils.js';
import { getRecentSearches, addRecentSearch } from './storage.js';

let inputEl, dropdownEl, clearBtn;
let allCounties = [];
let onSelectCallback = null;
let focusedIndex = -1;
let currentResults = [];

export function initSearch(counties, onSelect) {
  allCounties = counties;
  onSelectCallback = onSelect;

  inputEl = document.getElementById('search-input');
  dropdownEl = document.getElementById('search-dropdown');
  clearBtn = document.getElementById('search-clear');

  if (!inputEl) return;

  const debouncedSearch = debounce(handleInput, 150);
  inputEl.addEventListener('input', debouncedSearch);
  inputEl.addEventListener('focus', () => {
    if (inputEl.value.trim() === '') {
      showRecentSearches();
    } else {
      handleInput();
    }
  });

  inputEl.addEventListener('keydown', handleKeydown);

  clearBtn?.addEventListener('click', () => {
    inputEl.value = '';
    closeDropdown();
    inputEl.focus();
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('#search-wrapper')) {
      closeDropdown();
    }
  });
}

function handleInput() {
  const query = inputEl.value.trim();

  if (query === '') {
    showRecentSearches();
    return;
  }

  const results = allCounties
    .filter(c =>
      fuzzyMatch(query, c.name) ||
      fuzzyMatch(query, c.capital) ||
      c.tribes.some(t => fuzzyMatch(query, t))
    )
    .sort((a, b) => {
      // exact prefix matches first
      const aStarts = a.name.toLowerCase().startsWith(query.toLowerCase());
      const bStarts = b.name.toLowerCase().startsWith(query.toLowerCase());
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.name.localeCompare(b.name);
    })
    .slice(0, 8);

  currentResults = results;
  focusedIndex = -1;
  renderResults(results, query);
}

function renderResults(results, query) {
  if (results.length === 0) {
    dropdownEl.innerHTML = `
      <div style="padding: var(--space-6); text-align:center; color: var(--clr-text-muted); font-size: var(--text-sm);">
        No counties found for "${escapeHtml(query)}"
      </div>
    `;
    openDropdown();
    return;
  }

  dropdownEl.innerHTML = `
    <div class="search-dropdown-section">Counties (${results.length})</div>
    ${results.map((c, i) => `
      <div class="search-result-item" data-index="${i}" data-county-id="${c.id}">
        <div class="search-result-item__number">${c.id}</div>
        <div class="search-result-item__info">
          <div class="search-result-item__name">${highlightMatch(c.name, query)}</div>
          <div class="search-result-item__capital">${escapeHtml(c.capital)} · ${escapeHtml(c.population)} people</div>
        </div>
      </div>
    `).join('')}
  `;

  attachResultHandlers();
  openDropdown();
}

function highlightMatch(text, query) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return escapeHtml(text);
  const before = escapeHtml(text.slice(0, idx));
  const match = escapeHtml(text.slice(idx, idx + query.length));
  const after = escapeHtml(text.slice(idx + query.length));
  return `${before}<strong style="color:var(--clr-primary)">${match}</strong>${after}`;
}

function showRecentSearches() {
  const recent = getRecentSearches();
  if (recent.length === 0) {
    closeDropdown();
    return;
  }

  dropdownEl.innerHTML = `
    <div class="search-dropdown-section">Recent Searches</div>
    ${recent.map((q, i) => `
      <div class="search-result-item" data-recent-index="${i}">
        <div class="search-result-item__number" style="background:var(--clr-text-muted);">🕒</div>
        <div class="search-result-item__info">
          <div class="search-result-item__name">${escapeHtml(q)}</div>
        </div>
      </div>
    `).join('')}
  `;

  dropdownEl.querySelectorAll('[data-recent-index]').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.dataset.recentIndex, 10);
      inputEl.value = recent[idx];
      handleInput();
    });
  });

  currentResults = [];
  openDropdown();
}

function attachResultHandlers() {
  dropdownEl.querySelectorAll('.search-result-item[data-county-id]').forEach(el => {
    el.addEventListener('click', () => {
      const id = parseInt(el.dataset.countyId, 10);
      selectResult(id);
    });
  });
}

function selectResult(countyId) {
  const county = allCounties.find(c => c.id === countyId);
  if (!county) return;

  addRecentSearch(county.name);
  inputEl.value = county.name;
  closeDropdown();

  if (onSelectCallback) onSelectCallback(county);
}

function handleKeydown(e) {
  const items = dropdownEl.querySelectorAll('.search-result-item');
  if (items.length === 0) return;

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    focusedIndex = Math.min(focusedIndex + 1, items.length - 1);
    updateFocusedItem(items);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    focusedIndex = Math.max(focusedIndex - 1, 0);
    updateFocusedItem(items);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (focusedIndex >= 0 && currentResults[focusedIndex]) {
      selectResult(currentResults[focusedIndex].id);
    } else if (currentResults.length > 0) {
      selectResult(currentResults[0].id);
    }
  } else if (e.key === 'Escape') {
    closeDropdown();
    inputEl.blur();
  }
}

function updateFocusedItem(items) {
  items.forEach((item, i) => {
    item.classList.toggle('is-focused', i === focusedIndex);
    if (i === focusedIndex) {
      item.scrollIntoView({ block: 'nearest' });
    }
  });
}

function openDropdown() {
  dropdownEl.classList.add('is-open');
}

function closeDropdown() {
  dropdownEl.classList.remove('is-open');
  focusedIndex = -1;
}
