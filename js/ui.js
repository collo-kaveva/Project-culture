/**
 * ui.js — General UI utilities: toasts, scroll reveal, navbar behavior,
 * statistics dashboard rendering, canvas charts, theme toggling, favorites bar.
 */

import { formatNumber, parsePopulation, escapeHtml } from './utils.js';
import { getTheme, setTheme, getFavorites, toggleFavorite, isFavorite } from './storage.js';

/* ===================== Toasts ===================== */

let toastContainer = null;

export function initToasts() {
  toastContainer = document.getElementById('toast-container');
}

export function showToast(message, duration = 2600) {
  if (!toastContainer) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast--out');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  }, duration);
}

/* ===================== Scroll Reveal ===================== */

export function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || elements.length === 0) {
    elements.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  elements.forEach(el => observer.observe(el));
}

/* ===================== Navbar scroll state + scroll-to-top ===================== */

export function initNavbarScroll() {
  const navbar = document.getElementById('navbar');
  const scrollTopBtn = document.getElementById('scroll-top');
  if (!navbar) return;

  let lastY = window.scrollY;

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    navbar.style.boxShadow = y > 8 ? 'var(--shadow-sm)' : 'none';

    if (scrollTopBtn) {
      scrollTopBtn.classList.toggle('is-visible', y > 600);
    }
    lastY = y;
  }, { passive: true });

  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}

/* ===================== Smooth scroll for nav links ===================== */

export function initSmoothScrollLinks() {
  document.querySelectorAll('[data-scroll-to]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = el.getAttribute('data-scroll-to');
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

/* ===================== Theme Toggle ===================== */

export function initThemeToggle() {
  const toggleBtn = document.getElementById('theme-toggle');
  const savedTheme = getTheme() || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  applyTheme(savedTheme);

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      setTheme(next);
      showToast(next === 'dark' ? 'Dark mode enabled' : 'Light mode enabled');
    });
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

/* ===================== Fullscreen Toggle ===================== */

export function initFullscreenToggle() {
  const btn = document.getElementById('fullscreen-toggle');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    try {
      if (!document.fullscreenElement) {
        await document.getElementById('map-section').requestFullscreen();
        showToast('Fullscreen mode enabled — press Esc to exit');
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      showToast('Fullscreen not supported on this device');
    }
  });
}

/* ===================== Statistics Dashboard ===================== */

export function renderStatistics(stats) {
  const container = document.getElementById('stats-bar');
  if (!container) return;

  const items = [
    { icon: '🗺️', value: stats.totalCounties, label: 'Total Counties' },
    { icon: '👥', value: formatNumber(stats.totalPopulation), label: 'Population' },
    { icon: '📏', value: stats.largestCounty.name, label: 'Largest County' },
    { icon: '📐', value: stats.smallestCounty.name, label: 'Smallest County' },
    { icon: '⛰️', value: 'Mt. Kenya', label: 'Highest Mountain' },
    { icon: '🌊', value: 'Tana River', label: 'Longest River' },
    { icon: '🦁', value: stats.totalNationalParks + '+', label: 'National Parks' },
    { icon: '🏛️', value: stats.unescoSites, label: 'UNESCO Sites' }
  ];

  container.innerHTML = items.map(item => `
    <div class="stat-card reveal">
      <div class="stat-card__icon">${item.icon}</div>
      <div class="stat-card__value">${escapeHtml(String(item.value))}</div>
      <div class="stat-card__label">${escapeHtml(item.label)}</div>
    </div>
  `).join('');

  initScrollReveal();
}

/* ===================== Population Chart (Canvas, no libraries) ===================== */

export function renderPopulationChart(counties, canvasId = 'population-chart') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const cssWidth = canvas.clientWidth || 600;
  const cssHeight = canvas.clientHeight || 300;
  canvas.width = cssWidth * dpr;
  canvas.height = cssHeight * dpr;
  ctx.scale(dpr, dpr);

  const top10 = [...counties]
    .sort((a, b) => parsePopulation(b.population) - parsePopulation(a.population))
    .slice(0, 10);

  const max = parsePopulation(top10[0].population);
  const padding = { top: 20, right: 16, bottom: 70, left: 16 };
  const chartWidth = cssWidth - padding.left - padding.right;
  const chartHeight = cssHeight - padding.top - padding.bottom;
  const barWidth = chartWidth / top10.length;
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  ctx.clearRect(0, 0, cssWidth, cssHeight);

  const colors = ['#2E7D32', '#1976D2', '#FFB300', '#D81B60', '#6A1B9A', '#00897B', '#F57F17', '#558B2F', '#5D4037', '#1565C0'];

  top10.forEach((county, i) => {
    const value = parsePopulation(county.population);
    const barHeight = (value / max) * chartHeight;
    const x = padding.left + i * barWidth + barWidth * 0.15;
    const y = padding.top + chartHeight - barHeight;
    const w = barWidth * 0.7;

    // bar with rounded top
    const radius = 6;
    ctx.beginPath();
    ctx.moveTo(x, y + barHeight);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.lineTo(x + w - radius, y);
    ctx.arcTo(x + w, y, x + w, y + radius, radius);
    ctx.lineTo(x + w, y + barHeight);
    ctx.closePath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.fill();

    // value label
    ctx.fillStyle = isDark ? '#E6EDF3' : '#1A1D23';
    ctx.font = '600 10px Inter, sans-serif';
    ctx.textAlign = 'center';
    const valLabel = value >= 1000000 ? (value / 1000000).toFixed(1) + 'M' : (value / 1000).toFixed(0) + 'K';
    ctx.fillText(valLabel, x + w / 2, y - 6);

    // county label (rotated)
    ctx.save();
    ctx.translate(x + w / 2, padding.top + chartHeight + 12);
    ctx.rotate(-Math.PI / 5);
    ctx.fillStyle = isDark ? '#8B949E' : '#5A6272';
    ctx.font = '500 10px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(county.name, 0, 0);
    ctx.restore();
  });
}

/* ===================== Favorites Bar ===================== */

export function renderFavoritesBar(counties, onSelectCounty) {
  const container = document.getElementById('favorites-bar');
  if (!container) return;

  const favIds = getFavorites();
  if (favIds.length === 0) {
    container.innerHTML = `<p style="color:var(--clr-text-muted); font-size:var(--text-sm);">No favorites yet — click the ★ in a county panel to save it here.</p>`;
    return;
  }

  const favCounties = favIds.map(id => counties.find(c => c.id === id)).filter(Boolean);

  container.innerHTML = favCounties.map(c => `
    <button class="nearby-county-chip" data-county-id="${c.id}" aria-label="View ${escapeHtml(c.name)}">
      ★ ${escapeHtml(c.name)}
    </button>
  `).join('');

  container.querySelectorAll('[data-county-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      onSelectCounty(parseInt(btn.dataset.countyId, 10));
    });
  });
}

/* ===================== Keyboard Shortcuts Modal ===================== */

export function initShortcutsModal() {
  const modal = document.getElementById('shortcuts-modal');
  const openBtn = document.getElementById('shortcuts-btn');
  const closeBtn = document.getElementById('shortcuts-close');

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => modal.classList.add('is-open'));
  }
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.remove('is-open'));
  }
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('is-open');
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === '?' && !isTyping(e.target)) {
      modal?.classList.toggle('is-open');
    }
    if (e.key === 'Escape') {
      modal?.classList.remove('is-open');
    }
  });
}

function isTyping(target) {
  const tag = target.tagName ? target.tagName.toLowerCase() : '';
  return tag === 'input' || tag === 'textarea';
}
