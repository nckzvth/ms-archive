# MS//Archive • MapleStory Classic Registry

A high-performance, pixel-accurate archival utility for MapleStory Classic (v83 / MCW 1), inspired by macOS Finder, Raycast, and Linear.

Live Production URL: **[https://nckzvth.github.io/ms-archive/](https://nckzvth.github.io/ms-archive/)**

---

## Architecture & Features

- **Three-Pane Utility Shell:**
  - **Pane 1 — Left Taxonomy Tree:** Collapsible hierarchical directory across Equips, Use Items, Etc, Setup, Cash Shop, and the World Registry (Monsters, Maps, NPCs, Quests).
  - **Pane 2 — Stream Feed:** Virtualized list rendering thousands of entities at 60fps powered by `@tanstack/react-virtual`, with contextual class and level band filters, multi-column sorting, and sub-millisecond search.
  - **Pane 3 — Inspector & Vitrine Canvas:** High-resolution pixelated sprite vitrine with $(0,0)$ origin crosshairs, animation state scrubber, live character mannequin rendering, combat and stat matrices, and contextual tabs (Scrolls, Spawns, Related Quests, Portals).
- **Global Spotlight Search (`⌘K` / `Ctrl+K`):** Instant client-side fuzzy search powered by `minisearch`.
- **Level Band Quest Explorer:** Hierarchical quest categorization by logical level bands (`Lv. 1 - 10`, `Lv. 11 - 20`, `Lv. 21 - 30`, `Lv. 31 - 45`, `Lv. 46 - 60`, `Lv. 61+`).
- **Resilient Data Layer:** Live dynamic queries via `maplestory.io` backed by IndexedDB persistence and bundled seed data for instant zero-latency cold boots.
- **Deep-Linked URL State:** Synchronized category, filter, sort, tab, and entity selection to URL query parameters for shareable deep links.

---

## Tech Stack

- **Framework:** React 19 + TypeScript (Strict Mode)
- **Build Tool:** Vite 6
- **Data & Virtualization:** `@tanstack/react-query`, `@tanstack/react-virtual`, `idb-keyval`, `minisearch`
- **Styling:** Tailwind CSS + Google Fonts (Geist, JetBrains Mono) + Lucide Icons

---

## Development

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev

# Run production build
npm run build

# Preview production build
npm run preview
```
