---
name: Archival Utility
colors:
  surface: '#f9f9fa'
  surface-dim: '#dadadb'
  surface-bright: '#f9f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f4'
  surface-container: '#eeeeef'
  surface-container-high: '#e8e8e9'
  surface-container-highest: '#e2e2e3'
  on-surface: '#1a1c1d'
  on-surface-variant: '#47464b'
  inverse-surface: '#2f3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#77767b'
  outline-variant: '#c8c5cb'
  surface-tint: '#5f5e61'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1b1b1e'
  on-primary-container: '#858387'
  inverse-primary: '#c8c5ca'
  secondary: '#5d5e66'
  on-secondary: '#ffffff'
  secondary-container: '#e3e1ec'
  on-secondary-container: '#63646c'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1d1b16'
  on-tertiary-container: '#88837c'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e4e1e6'
  primary-fixed-dim: '#c8c5ca'
  on-primary-fixed: '#1b1b1e'
  on-primary-fixed-variant: '#47464a'
  secondary-fixed: '#e3e1ec'
  secondary-fixed-dim: '#c6c5cf'
  on-secondary-fixed: '#1a1b22'
  on-secondary-fixed-variant: '#46464e'
  tertiary-fixed: '#e8e2d9'
  tertiary-fixed-dim: '#cbc6bd'
  on-tertiary-fixed: '#1d1b16'
  on-tertiary-fixed-variant: '#494640'
  background: '#f9f9fa'
  on-background: '#1a1c1d'
  surface-variant: '#e2e2e3'
typography:
  headline-lg:
    fontFamily: Geist
    fontSize: 1.25rem
    fontWeight: '600'
    lineHeight: 1.5rem
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Geist
    fontSize: 1rem
    fontWeight: '600'
    lineHeight: 1.25rem
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Geist
    fontSize: 0.875rem
    fontWeight: '600'
    lineHeight: 1.125rem
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Geist
    fontSize: 0.875rem
    fontWeight: '400'
    lineHeight: 1.25rem
    letterSpacing: -0.005em
  body-md:
    fontFamily: Geist
    fontSize: 0.8125rem
    fontWeight: '400'
    lineHeight: 1.125rem
    letterSpacing: '0'
  body-sm:
    fontFamily: Geist
    fontSize: 0.75rem
    fontWeight: '400'
    lineHeight: 1rem
    letterSpacing: 0.005em
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 0.75rem
    fontWeight: '500'
    lineHeight: 1rem
    letterSpacing: -0.01em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 0.6875rem
    fontWeight: '400'
    lineHeight: 0.875rem
    letterSpacing: '0'
  code:
    fontFamily: JetBrains Mono
    fontSize: 0.6875rem
    fontWeight: '400'
    lineHeight: 0.9375rem
    letterSpacing: -0.02em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 0.5rem
  margin: 0.75rem
  space-xs: 0.125rem
  space-sm: 0.25rem
  space-md: 0.5rem
  space-lg: 0.75rem
  space-xl: 1rem
---

## Brand & Style

This design system approaches video game asset inspection through the discipline of archival cataloging and technical utilities. It abandons juvenile gaming aesthetics, skeuomorphic banners, and decorative fluff in favor of a quiet, architectural, Swiss-inspired digital workspace reminiscent of macOS Finder, Raycast, and Linear.

### Brand Tenets
- **Architectural Neutrality:** The UI acts as museum-grade archival vitrines. By remaining monochromatic, rigorous, and understated, it allows vibrant pixel-art sprites, maps, and audio waveforms to be the singular chromatic focus.
- **Utilitarian Velocity:** High-density, data-rich layouts engineered for desktop muscle memory, split-pane browsing, keyboard command navigation, and zero-latency inspection.
- **Precision Engineering:** Hairline structures, strict typographic baselines, tabular figure alignment, and deliberate visual weight over decorative gradients.

### Style Formula
- **Quiet Modernism × Operating System Utility:** Native macOS-like column navigation, subtle frosted structural chrome, razor-thin 1-pixel borders, and high functional density.

## Colors

The palette is strictly calibrated around neutral zinc and cool slate tones to preserve absolute chromatic neutrality. Color is reserved exclusively for sprite graphics, functional status indicators, and keyboard focus rings.

### Chromatic Strategy
- **Canvas Base (`#FAFAFA`):** An optical off-white background that prevents visual fatigue compared to pure white, mimicking archival paper.
- **Surface Elevation (`#FFFFFF`):** Reserved for primary viewport panels and active inspector canvases.
- **Sub-surfaces & Sidebars (`#F4F4F4`):** Soft, neutral separation for column hierarchies, navigation trees, and breadcrumbs.
- **Divider & Border Hairlines (`#E4E4E7` / rgba(0, 0, 0, 0.08)):** Precise structural delineations. Darker variant (`#D4D4D8`) used for active splitters and window chrome boundaries.
- **Primary Text (`#09090B`):** Deep carbon black for maximum contrast and readability on micro-typography.
- **Muted Text (`#71717A`):** Neutral gray for technical metadata, byte sizes, and labels.
- **Accent Accentuation (`#2563EB`):** A singular electric blue used exclusively for focused keyboard active states, selected tree items, and range scrubber heads.

## Typography

The typography relies on **Geist** for crisp, geometric sans-serif legibility across dense UI layouts, paired with **JetBrains Mono** for property tables, memory offsets, asset IDs, sprite coordinate systems, and physics variables.

### Rules of Application
- **Tabular Numerals Everywhere:** All numeric readouts (frame counters, origin anchor points `(X, Y)`, delay timers, z-index weights) must enable `font-variant-numeric: tabular-nums` to prevent layout jittering during frame scrub.
- **Micro-Scale Legibility:** With high-density layouts, the system leans heavily on `0.75rem` and `0.8125rem` sizes. Optical contrast is maintained via font weight (500/600 for headers and keys) rather than excessive size differences.
- **Monochrome Hierarchy:** Differentiate informational hierarchy strictly through opacity and weight tiers (`#09090B` primary, `#71717A` secondary, `#A1A1AA` tertiary) rather than font swapping.

## Layout & Spacing

The architecture operates on an OS-style split-view docking paradigm with a strict 4px base spatial unit, maximizing functional canvas space and screen utilization.

### Viewport Architecture
- **Three-Column Split-View:**
  - **Left Rail (Navigation / Taxonomy Tree):** Fixed width range (200px - 260px), collapsable. Contains WZ directory nodes (Mob, Skill, Map, Item, Sound).
  - **Center Canvas (Data Grid / Miller Columns / Asset List):** Fluid responsive width. Supports toggling between compact tabular list view and 64px/128px checkerboard thumbnail grids.
  - **Right Panel (Inspector & Sprite Stage):** Resizable (320px - 480px). Houses real-time sprite renderers, origin vector overlays, frame scrubbers, and nested property manifests.
- **Top Utility Chrome:** 38px height. Houses translucent breadcrumb navigation, Raycast-style global search trigger (`Cmd + K`), and layout view modes.
- **Bottom Status & Scrubber Dock:** 28px height. Houses memory usage, current animation frame counts, and raw node paths.

### Spacing Hygiene
- Zero margin bloat: Margins and gaps do not exceed `1rem` inside data tables and toolbars.
- Structural borders (`1px solid var(--border)`) handle panel separation rather than loose spatial gutters.

## Elevation & Depth

This design system rejects heavy floating cards, drop shadows, and visual bloat. Depth is communicated strictly via planar structural layering, subtle translucency, and crisp hairlines.

### Principles of Depth
- **Zero Card Elevation:** Content rows and inspector sections do not sit on floating drop-shadowed cards. Surfaces are flat planes divided by hairline borders (`1px` width with `rgba(0,0,0,0.06)`).
- **Translucent Glass Toolbars:** Floating control strips (e.g., animation transport controls, canvas zoom pills) utilize high-blur backdrop filtering:
  - Background: `rgba(255, 255, 255, 0.8)`
  - Backdrop Blur: `12px`
  - Border: `1px solid rgba(0, 0, 0, 0.08)`
- **Modal Overlays & Palettes (Command K):** When invoking high-order utilities like quick-switchers, use an overlay shadow with high blur and low opacity:
  - Shadow: `0 16px 32px -8px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.06)`
- **Sprite Stage:** The preview viewport uses a crisp SVG-rendered 8px checkerboard pattern in `rgba(0, 0, 0, 0.03)` with a precise 1px crosshair intersection at the sprite's `(0, 0)` origin point.

## Shapes

The geometric signature is precise, tight, and utilitarian. It mirrors the exact feel of modern desktop interfaces where curves are slight and functional.

### Shape Tiers
- **Base Components (Inputs, Buttons, Tree Items):** `rounded` (0.25rem / 4px). Small, deliberate corner radii that do not waste clickable area.
- **Floating Toolbars & Modals:** `rounded-lg` (0.5rem / 8px). Used solely for detached floating islands, tooltips, and flyout menus.
- **Tags & Badges:** `rounded` (0.25rem / 4px). Strict rectangle geometry; rounded pill shapes are strictly prohibited to maintain architectural discipline.
- **Canvas Sprite Containers:** `0px` radius. Clean, razor-sharp viewports with a 1px inner hairline.

## Components

### Buttons & Icon Triggers
- **Action Buttons:** 24px height for micro-actions, 28px for standard. Single-color fill: `#18181B` with white text for primary, or transparent surface with `1px solid #E4E4E7` hover states for secondary.
- **Ghost Icon Actions:** 24×24px square bounding boxes, zero default border or background, transitioning to `#F4F4F5` on hover.

### Data Tables & Tree Views
- **Tree Rows:** 24px item height. Left indentation of 12px per hierarchy level. Selected row receives a solid `#F4F4F5` fill with a subtle 2px accent indicator on the leading edge.
- **Data Rows:** Hairline divider at the bottom (`#F4F4F5`). High typography contrast. Active row highlighted in `#F4F4F5` with no shadow. Hover states change background instantly without transition lag.

### Form Inputs & Filters
- **Property Field Pairs:** Left-aligned key in muted mono (`#71717A`), right-aligned input field.
- **Compact Inputs:** 22px height, flat background `#FFFFFF`, border `1px solid #E4E4E7`, focusing to `1px solid #18181B` without focus rings or glow halos.

### Sprite Viewer & Animation Transport
- **Playback Controls:** Minimal transport strip containing play/pause, step forward/backward, and frame speed toggle (0.5x, 1x, 2x).
- **Origin & Box Toggles:** Monochromatic segmented control toggles for layer visibility: `[Origin Crosshair]`, `[Head Hitbox]`, `[Body Hitbox]`, `[Foothold Anchor]`.

### Tags & Metadata Pills
- Rectangular blocks with `0.25rem` corners.
- Background: `#F4F4F5`, Text: `#3F3F46`, Border: `1px solid #E4E4E7`. No bright primary background fills; status badges use a 6px solid colored dot to indicate states (active, deprecated, hidden).