```markdown
# Design System Specification: The Architectural Blueprint

## 1. Overview & Creative North Star
In the world of supply chain and engineering, data is often treated as a burden to be managed. This design system reframes the Bill of Materials (BOM) from a static spreadsheet into a high-performance instrument. 

**The Creative North Star: The Architectural Blueprint.**
We are moving away from the "standard enterprise" look—characterized by boxy grids and suffocating lines—and toward a style that feels engineered yet editorial. We achieve this through **intentional asymmetry**, where sidebars and utility panels use varied widths to break the monotony, and **tonal layering**, where depth is communicated through color shifts rather than structural dividers. The goal is "High-Density Elegance": providing the user with massive amounts of data without the visual noise that causes fatigue.

---

## 2. Colors & Surface Architecture
This system utilizes a sophisticated palette of deep blues and nuanced grays. The hierarchy is not built with lines, but with shifts in luminosity.

### The "No-Line" Rule
**Explicit Instruction:** You are prohibited from using 1px solid borders for sectioning or containment. 
Boundaries must be defined solely through background color shifts. For example, a `surface-container-low` section sitting on a `surface` background provides all the definition needed. If a visual break is required, use a 4px to 8px gap of the background color to create "breathing gutters."

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers, like stacked sheets of architectural vellum. 
- **Base Layer:** `surface` (#f7f9ff)
- **Primary Content Areas:** `surface-container-low` (#eff4fc)
- **Nested Cards/Modules:** `surface-container-lowest` (#ffffff) to provide a soft "lift."
- **Active/Hover States:** `surface-container-high` (#dee9f6)

### The "Glass & Gradient" Rule
To elevate the system above "utility software," use **Glassmorphism** for floating elements (like part-detail overlays or version comparisons). Use a semi-transparent `surface-variant` with a 12px backdrop blur. 
**Signature Texture:** Primary CTAs should not be flat. Apply a subtle linear gradient from `primary` (#335e9f) to `primary_dim` (#255292) at a 135-degree angle to provide a "machined" satin finish.

---

## 3. Typography: The Editorial Scale
We use a dual-typeface system to balance engineering precision with high-end legibility.

- **Display & Headlines (Manrope):** Chosen for its geometric, modern personality. Use `headline-lg` (2rem) and `display-sm` (2.25rem) for dashboard titles and part numbers to create an authoritative, editorial feel. 
- **Data & Body (Inter):** The industry standard for readability at small scales. All BOM table data must use `body-md` (0.875rem) or `body-sm` (0.75rem).

**Typographic Hierarchy as Brand:** 
By pairing a wide, modern sans-serif (Manrope) for titles with a high-utility font (Inter) for data, we communicate that this system is both a strategic overview tool and a precise execution engine.

---

## 4. Elevation & Depth
In this design system, shadows are a last resort, not a default.

- **Tonal Layering:** Achieve 90% of your hierarchy by "stacking" surface tiers. A `surface-container-lowest` card on a `surface-container-low` background creates a natural, soft lift.
- **Ambient Shadows:** For floating modals or dropdowns, use a "Cloud Shadow": `Y: 12px, Blur: 32px, Color: #27343f at 6% opacity`. The shadow should be tinted with the `on-surface` color to feel integrated with the environment.
- **The "Ghost Border" Fallback:** If a container sits on a background of the same color, use a "Ghost Border": `outline-variant` (#a6b3c2) at **15% opacity**. Never use 100% opaque borders.

---

## 5. Component Logic

### BOM Tables & Lists
- **No Dividers:** Forbid the use of horizontal lines between rows. Instead, use a subtle `surface-container-lowest` background for every second row (zebra striping) or use a `surface-container-high` background on hover.
- **Data Density:** Use `label-sm` for secondary metadata (e.g., Lead Times, Supplier IDs) to keep the primary `body-md` part names prominent.

### Status Chips (Confirmed, Pending, Error)
Status shouldn't just be a color; it should be a signal.
- **Confirmed:** `on-primary-container` text on a custom green tint.
- **Pending:** `on-tertiary-container` text on an orange tint.
- **Error:** `on-error-container` (#752121) on `error_container` (#fe8983).
- **Style:** Chips must be `rounded-full` with a 10% opacity version of their text color as the background.

### Interactive Elements
- **Buttons:** Primary buttons use the "Signature Texture" gradient. Tertiary buttons (ghost) must never have a border; they should rely on `primary` text color and a `primary-container` background shift on hover.
- **Input Fields:** Use `surface-container-highest` (#d6e4f3) for the input track. Upon focus, transition the background to `surface-container-lowest` and apply a 2px `primary` bottom-only indicator.
- **Version Timeline:** Use a vertical "stepper" where the active version is a `surface-container-lowest` card and historical versions are smaller `surface-dim` modules.

---

## 6. Do’s and Don’ts

### Do
- **Do** prioritize vertical whitespace over lines. If a layout feels cluttered, add 8px of padding rather than adding a divider.
- **Do** use `on-surface-variant` (#53606d) for non-essential data to guide the eye toward the "Primary Part Name."
- **Do** align data types: Numbers should be tabular-lined (monospaced) to ensure columns of quantities and prices align perfectly.

### Don’t
- **Don’t** use high-contrast shadows. If the shadow is the first thing you notice, it's too dark.
- **Don’t** use "Pure Black" (#000000). Use `inverse_surface` (#0a0f13) for maximum contrast scenarios to maintain the premium blue-gray undertone.
- **Don’t** use default browser scrollbars. Style them to be thin, `rounded-full`, and use the `outline_variant` color at 40% opacity.

---

## 7. Signature Layout Pattern: The Side-Panel Pivot
For BOM management, avoid full-page refreshes. When a part is selected, use a **33% width right-aligned side panel** that slides over the main table. This panel should use `surface-container-lowest` with a heavy backdrop blur on the main table behind it. This maintains the user's context while providing the "deep dive" data they need.