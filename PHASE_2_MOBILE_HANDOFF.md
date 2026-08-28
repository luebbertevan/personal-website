# Phase 2 Mobile Composition Handoff

This is the working handoff for chapter-by-chapter mobile composition. It intentionally omits completed Phase 1 design history and details that are easy to recover from the interface or code.

## Phase 2 goal and order

Refine the actual case-study content one chapter at a time rather than making another broad mobile-system rewrite. The About pass is stable enough to serve as a reference. Continue with Fosty in chapter order, then Crux Vision, Val, and Inheritance. Keep each change local to the chapter unless the same problem clearly repeats elsewhere.

For each chapter, make the reading order, content density, media size or crop, scrolling, and spacing feel intentional on a phone. Sections should normally read one after another even when the desktop version uses columns. Preserve a custom composition only when it materially improves the story and still works at the responsive edges.

## Responsive model to preserve

Navigation mode and content composition are deliberately separate systems:

- The viewport breakpoint at `860px` changes the navigation shell. At `860px` and below the site uses the compact top header, full-screen project menu, and bottom navigation dock. At `861px` and above it retains the desktop index, controls, and chapter rail.
- The project panel is a named inline-size container. Content can switch to compact composition when the panel itself reaches `700px`, regardless of which navigation shell is active.
- This separation is intentional. A narrow panel in desktop navigation may need phone-like content composition, while a wide tablet panel in mobile navigation may have room for a more spacious layout. Do not collapse these into one universal viewport breakpoint.
- Complex projects also collapse before the global mobile breakpoint when their content stops fitting: Crux Vision at `1200px`, Inheritance at `1160px`, and Fosty at `1040px`. Treat these as content-fit breakpoints, not device categories. Add another project-specific breakpoint only when a real chapter demonstrates the need.
- `app/signal-prototype.module.css` currently contains more than one `max-width: 860px` block. The later Phase 1 block intentionally overrides parts of the earlier responsive rules. Check the final cascade before changing or removing a rule.

Desktop and mobile panel sizing are intentionally different:

- On desktop, TypeScript measures the active chapter, contracts the panel around short chapters, and caps long chapters at the available viewport height with internal scrolling. Panel height and top position are written through `--dynamic-panel-height` and `--dynamic-panel-top`.
- In mobile navigation mode those dynamic desktop values are removed. The panel occupies the safe area between the compact header and bottom dock, and its chapter content scrolls normally.
- Short viewport height matters independently from width. No chapter may place content below a clipped panel without a usable scroll path.

The particle frame is coupled to layout:

- The frame is calculated from the active panel's resting `getBoundingClientRect()`, corrected for entrance translation, with an eight-pixel gap.
- Resize observers update both the panel measurement and particle bounds. Any chapter change that alters intrinsic height, overflow, transforms, or panel position must be checked against the frame during direct entry and chapter transitions—not only after navigating away and back.
- Keep the spine centered through the mobile viewport. Do not reuse the desktop panel offset for mobile framing.

## Composition constraints

- Preserve the mobile reading baseline: `17px` for paragraphs, supporting copy, navigation, and utility links; `16px` for captions; `13px` for tertiary metadata and uppercase labels.
- Media has exactly two states on every screen size: an inline preview and a true full-screen lightbox. Use the icon-only expand control with an accessible label. Do not restore the former fit-to-panel intermediate state.
- Long screenshots may use a reasonable inline crop. The full image must remain available in the lightbox. Check portrait and landscape media independently rather than applying one fixed image height everywhere.
- The shared dark interface surface is currently `65%` opacity. The full-screen project menu remains blur-free and hides the content panel plus the compact top and bottom bars so only the menu and spine show through.
- About's compact layout is panel-width-driven. The portrait spans the title and availability rows; do not reserve a tall empty title row merely to align the divider with the portrait.

## Required checks for each chapter

Test the chapter at representative phone and tablet widths, plus the transition edges where the two responsive systems cross:

- `390px` phone width and at least one narrow `320–375px` width.
- `600px` and `768px` tablet widths.
- `860px` and `861px` viewport widths.
- A constrained desktop window around `1024px`, including a short height.
- Panel widths immediately below and above the `700px` container breakpoint when the chapter can reach them.
- Any project-specific breakpoint used by that chapter.

At each relevant size, verify normal reading order, no horizontal overflow, reachable bottom content, appropriate inline media crop, lightbox behavior, panel/particle-frame alignment, and direct arrival into the chapter.

## Relevant implementation files

- `app/signal-prototype-v4.tsx`: route state, mobile overlays, motion, dynamic desktop panel measurement, and particle-frame bounds.
- `app/signal-prototype.module.css`: global, project-specific, viewport, and container-responsive composition.
- `tests/rendered-html.test.mjs`: structural regression coverage. Run `npm test` after each implementation chunk.

