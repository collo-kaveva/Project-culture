# Project Culture — Interactive Kenya Counties Explorer

A production-quality, framework-free (HTML5 + CSS3 + Vanilla JS ES6+) interactive web application that showcases all 47 counties of Kenya through an immersive, modern, Apple/Stripe-inspired interface.

## ✨ Features

- **Interactive SVG map** of all 47 counties — hover, click, search-highlight, zoom & pan (mouse, wheel, touch/pinch)
- **Gentle floating animation** on the whole map (paused on hover, respects `prefers-reduced-motion`)
- **Sliding info-drawer** with 20+ data points per county: capital, governor, population, area, languages, tribes, economy, tourism, national parks, universities, hospitals, road network, history, fun facts, nearby counties, coordinates, and external links
- **Live search** with fuzzy matching, autocomplete dropdown, keyboard navigation (↑ ↓ Enter Esc), and recent-search memory
- **Statistics dashboard** with a dependency-free Canvas bar chart of the 10 most populous counties
- **Quiz mode** — 10 randomized multiple-choice questions on capitals, governors, and counties
- **Favorites & recently-viewed**, persisted via `localStorage` (with in-memory fallback)
- **Dark mode**, **fullscreen mode**, keyboard shortcuts (`/`, `R`, `D`, `?`, `Esc`)
- Fully **responsive** (desktop → mobile, portrait & landscape) and **accessible** (ARIA labels, keyboard focus, semantic HTML, reduced-motion & high-contrast support)

## 📁 Folder Structure

```
ProjectCulture/
├── index.html
├── css/
│   ├── reset.css        — Base normalization
│   ├── variables.css    — Design tokens (colors, spacing, type, shadows)
│   ├── layout.css       — Page structure
│   ├── components.css   — Buttons, cards, search, panel, quiz, etc.
│   ├── animations.css   — Keyframes & motion utilities
│   ├── responsive.css   — Breakpoints
│   └── themes.css       — Dark mode overrides
├── js/
│   ├── app.js        — Entry point; wires all modules together
│   ├── api.js         — Data loading (counties.json, SVG map) + stats
│   ├── map.js          — SVG interactions: hover/click/zoom/pan
│   ├── search.js       — Live search + autocomplete + keyboard nav
│   ├── modal.js         — Sliding info panel rendering & events
│   ├── ui.js            — Toasts, navbar, stats, charts, theme toggle
│   ├── quiz.js          — Quiz mode logic
│   ├── animation.js     — Ripple, counters, stagger helpers
│   ├── storage.js       — localStorage wrapper (favorites, theme, etc.)
│   └── utils.js         — Debounce, fuzzy match, haversine distance, etc.
├── data/
│   └── counties.json    — All 47 counties' data (never hardcoded in JS)
├── svg/
│   └── kenya-map.svg    — 47 independent county <path> elements
└── assets/               — images, icons, logos, audio (placeholders)
```

## 🚀 Running locally

Because the app fetches `data/counties.json` and `svg/kenya-map.svg` via the Fetch API, it must be served over HTTP (not opened directly as a `file://` URL). From the `ProjectCulture` folder:

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

## 🎨 Design tokens

All colors, spacing, typography, and shadows are defined as CSS custom properties in `css/variables.css`, making the palette and design language easy to retheme.

## 🗺️ About the map

The map is a stylized, simplified representation of Kenya's 47 counties laid out by approximate relative geography (each county is an independent `<path>` with a `data-id` and `data-name`). It is built for interactivity and clarity rather than cartographic precision — for production use, consider swapping in a geographically accurate GeoJSON-to-SVG export.

## ⌨️ Keyboard shortcuts

| Key | Action |
|---|---|
| `/` | Focus search |
| `R` | Jump to a random county |
| `D` | Toggle dark mode |
| `?` | Show shortcuts modal |
| `Esc` | Close panel / modal |
| `↑` `↓` `Enter` | Navigate search results |

## 📝 Notes

- County data lives exclusively in `data/counties.json` per the project's data-separation requirement — nothing is hardcoded in JavaScript.
- No external UI frameworks (React/Vue/Angular/Bootstrap/Tailwind) are used; all styling is hand-authored CSS3 and all interactivity is Vanilla JS ES6 modules.
