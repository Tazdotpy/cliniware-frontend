# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Cliniware — a static frontend prototype for a clinic management system (Spanish, República Dominicana). Plain HTML/CSS/JS, no framework, no build step, no package.json. Every page is a self-contained `.html` file with inline `<script>` logic at the bottom.

## Running it

No build/lint/test tooling exists. Open the HTML files directly in a browser, or serve the directory statically, e.g.:

```
python3 -m http.server 8000
```

Login at `index.html` with a test user from `js/app.js` (`USUARIOS_PRUEBA`), e.g. `admin` / `admin123`.

## Architecture

**Pages** (`index.html`, `dashboard.html`, `pacientes.html`, `medicos.html`, `citas.html`, `pagos.html`, `servicios.html`, `usuarios.html`) each follow the same shape:
1. `<head>` links the single stylesheet `css/cliniware.css`.
2. Body has a sidebar (`.sidebar`) + `.main-content` layout, copy-pasted per page — `js/sidebar.html.snippet` holds the canonical markup to paste when adding a new page or editing nav links. There is no templating; sidebar HTML must be updated in every page by hand.
3. Two shared modals live at the bottom of most pages: a create/edit form modal and a `modal-confirm` confirmation modal (used via `Modal.confirm()`).
4. `js/app.js` is loaded, then an inline `<script>` calls `initSidebar('<page-key>')` and defines that page's state and functions.

**`js/app.js`** is the shared runtime, loaded by every page:
- `Auth` — login/logout/session via `localStorage` key `cliniware_user`; `requireAuth()` redirects to `index.html` if not logged in.
- `initSidebar(activeLink)` — populates sidebar user info, marks the active nav link, hides `.admin-only` elements for non-ADMIN roles, wires the logout button, and fills the topbar date.
- `Toast` — `Toast.success/error/warning/info(msg)`, appends a toast container to `<body>` on first use.
- `Modal` — `Modal.open(id)` / `close(id)` / `closeAll()` / `confirm(title, message, onConfirm)`. Overlay click and Escape key close all modals (wired once, globally, at the bottom of `app.js`).
- `Api` — `get/post/put/delete` wrappers around `fetch` against `API_BASE` (`http://localhost:8080/api`); on failure they `console.warn` and return `null`/`false` rather than throwing. **No page currently calls `Api`** — every page operates on `MockData` in memory instead.
- `MockData` — hardcoded seed arrays (`pacientes`, `medicos`, `especialidades`, `servicios`, `citas`, `pagos`) standing in for the backend. Each page does `let x = [...MockData.x]` and mutates that local copy; nothing persists across a page reload.
- `Utils` — `formatDate`, `formatMoney` (DOP currency), `formatDateTime`, `calcAge`, `getEstadoBadge` (maps status strings to badge CSS classes), `debounce`, `generateId`.

**Per-page script pattern** (see `pacientes.html` as the reference implementation): local state array copied from `MockData`, a `filtrados` array for the current filter/search result, a `render()` function that repaints the table body + stat cards + pagination from `filtrados`, `applyFilter()` that recomputes `filtrados` from the search box / filter selects and calls `render()`, and CRUD functions (`abrirModalCrear`, `editar*`, `guardar*`, `eliminar*`, sometimes `toggle*`/`anular*`/`cambiarEstado`) that mutate the local array and call `applyFilter()`/`render()` plus a `Toast`. Follow this exact pattern when adding fields or a new entity page rather than introducing a different state-management approach.

**Styling** — everything comes from the single `css/cliniware.css`, driven by CSS custom properties defined on `:root` (colors, `--sidebar-*`, `--radius-*`, `--shadow-*`). Reuse existing utility classes (`.badge badge-*`, `.btn btn-primary/ghost/danger`, `.card`, `.stat-card`, `.form-control`, `.table-wrapper`, `.empty-state`, etc.) instead of adding new CSS when an equivalent already exists.

## Notes for future backend integration

`API_BASE` and the `Api` helper in `js/app.js` are already shaped for a REST backend but unused — pages read/write `MockData` directly. When wiring a real backend, the intended seam is to replace the `MockData` reads/writes in each page's script with `Api.get/post/put/delete` calls, keeping `render()`/`applyFilter()` unchanged.
