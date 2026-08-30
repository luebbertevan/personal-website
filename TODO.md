# Evan Luebbert Portfolio — Project Todo

This is the canonical working task list for the portfolio. Design rationale and historical decisions live in [DESIGN_NOTES.md](./DESIGN_NOTES.md).

The detailed launch criteria and current finishing-work decisions live in [PRE_LAUNCH_CHECKLIST.md](./PRE_LAUNCH_CHECKLIST.md).

## Now — real content integration

The visual system and navigation proof are sufficiently mature. Use accurate content next so final layouts, chapter lengths, media needs, and responsive behavior are designed around reality rather than placeholders.

### Connect the project to GitHub

- [ ] Create the GitHub repository that will own the personal website source.
- [ ] Decide whether the repository should be public or private before pushing any code or development history.
- [ ] Connect the local project to that repository and push the complete intentional history without disturbing the existing Sites deployment workflow.
- [ ] Replace the starter README with a project-specific overview, setup instructions, architecture notes, screenshots, credits, and the deployed-site link.
- [ ] Add an appropriate license and confirm that no private content, credentials, restricted media, or confidential project assets are included.
- [ ] Decide whether the finished “About this site” section should link directly to the source repository.

### Collect content

- [ ] Finalize the Home introduction: name treatment, primary headline, short biography, location/availability if useful, and preferred call to action.
- [ ] Confirm social and contact destinations: LinkedIn, GitHub, X/Twitter, email, résumé, and any additional profiles.
- [ ] Select the 4–6 projects or experiences for the first release and establish their intended order.
- [ ] For each project, collect: title, subtitle, external link, concise overview, role, collaborators, timeframe, responsibilities, process, outcome/impact, technologies or disciplines, and final call to action.
- [ ] Collect source media at the highest available quality: cover image, screenshots, photography, video, motion clips, diagrams, logos, and captions/alt text.
- [ ] Record media ownership, credits, confidentiality constraints, and anything that needs redaction or replacement.
- [ ] Decide which projects need the full multi-chapter treatment and which should remain concise link destinations.

### Audit external profiles and public links

- [ ] Review every section of LinkedIn for outdated titles, dates, descriptions, education, skills, availability, and contact information.
- [ ] Rewrite the LinkedIn About section and headline so they match the current résumé and portfolio positioning.
- [ ] Add missing current experience to LinkedIn and remove or correct duplicate and inaccurate entries.
- [ ] Review all public GitHub repositories for accurate names, descriptions, visibility, topics, links, and README files.
- [ ] Rename repositories where the current name is unclear or no longer matches the project.
- [ ] Choose and reorder the GitHub repositories that should be pinned on the profile.
- [ ] Update the GitHub profile bio, location, organization, and external links.
- [ ] Verify that LinkedIn, GitHub, the résumé, and the portfolio all link to the correct current destinations and describe the same work consistently.
- [ ] Repeat the public-link check before launch and remove any broken, private, placeholder, or outdated destinations.

### Add “About this site” as a portfolio project

- [ ] Add a dedicated first-class destination explaining the site itself; do not implement it until the content phase begins.
- [ ] Treat the site itself as an authored project rather than a footer colophon—it should be navigable from the main index and receive its own particle-built presentation.
- [ ] Define its story chapters from: concept and goals, visual references, liquid-glass strand development, procedural camera path, particle system, navigation model, sound/music direction, responsive/performance decisions, tools/technology, and lessons or outcome.
- [ ] Collect development imagery and motion: shader studies, transition iterations, particle experiments, screenshots, short clips, and behind-the-scenes diagrams.
- [ ] Credit relevant inspirations, reference works, tools, and collaborators appropriately.

### Implement content iteratively

- [ ] Replace the Home placeholder copy and connect real social/contact links.
- [ ] Fully populate one representative project and tune its chapter structure around the real text and media.
- [ ] Use that project to define the reusable content model.
- [ ] Populate remaining projects one at a time, allowing project-specific layouts where the media or story requires them.
- [ ] Build the “About this site” destination once its narrative and development assets are collected.
- [ ] Revisit navigation labels, direct-link behavior, project order, and where “About this site” belongs once the complete content set is visible.
- [ ] Freeze the content structure before final responsive and performance work.

### Finalize index discovery and order

Complete this before mobile and responsive work so the responsive index is designed around finished base content.

- [x] Add the approved one-sentence description as a desktop hover and keyboard-focus reveal beneath each main index destination; keep descriptions directly accessible in the future touch-specific index.
  - **ABOUT** — What I build and why.
  - **FOSTY** — An operations platform for animal rescue foster care.
  - **CRUX VISION** — A video analysis tool for understanding climbing movement.
  - **INHERITANCE** — A motion capture retargeting pipeline for ML training datasets.
  - **VAL** — Product ownership and full stack development for a live recovery care platform.
- [x] Use the working destination order: About, Fosty, Crux Vision, Val, Inheritance.
- [x] Keep index descriptions visible and legible in the mobile project menu.
- [x] Add direct, shareable destination URLs and browser Back/Forward behavior. Projects use concise root-level routes such as `/fosty`; later chapters extend the route, such as `/fosty/engineering`. In-site navigation updates native browser history without remounting the persistent WebGL experience, while direct visits initialize the requested destination and chapter with a short project-specific reveal.

## Later — final polish after content is stable

### Mobile and responsive design

- [x] Implement Phase 1 mobile foundations: compact identity bar, full-screen project/chapter menu, bottom chronological controls, current project/chapter picker, safe-area-aware viewport panel, single-column layout defaults, shorter transitions, mobile strand framing, and chapter scroll reset.
- [x] Standardize expandable media at every screen size to two modes only: cropped or contained inline preview and a true full-screen lightbox, using an icon-only control with an accessible label.
- [x] Complete the Phase 1 stabilization pass before chapter-specific composition work:
  - [x] Move the opening mobile identity from the middle to the top so it does not overlap the spine.
  - [x] Use intentional identity and location states: name and role for the expressive opening and expanded menu, then name and active project in the compact reading header.
  - [x] Keep the bottom navigation focused on the current chapter only, with the active project carried by the compact top bar.
  - [x] Tighten the whitespace between the compact menu header and the first index entry.
  - [x] Use the approved mobile type scale: 17px for paragraph, supporting, navigation, and utility text; 16px captions; and 13px tertiary metadata and uppercase labels.
  - [x] Recompose the menu utilities as a bottom-aligned block, separate the visual control from the profile links, and use an icon for the visual control.
  - [x] Slow the mobile transitions and reduce travel distance so the spine remains expressive without abrupt motion.
  - [x] Recenter and preserve more of the spine across narrow phone aspect ratios.
- [x] Audit the shared content panel and breakpoint logic across medium and medium-small screens. Constrained desktop-style panels now remain viewport-bounded, and About has an internal scrolling path when its content exceeds the available height.
- [x] Allow project-specific small-screen breakpoints where content stops fitting before the global mobile threshold.
- [ ] Refine mobile content density, chapter length, media crops, and custom composition chapter by chapter. Continue from the stabilized About pass with Fosty, using [PHASE_2_MOBILE_HANDOFF.md](./PHASE_2_MOBILE_HANDOFF.md) as the implementation handoff.
  - [x] Recompose the About opening with a restrained 28–34px title and a compact portrait aligned at the top of the first content row.
  - [x] Test the portrait entirely above a full-width opening divider; retract the treatment after it introduced excessive vertical space.
  - [x] Make the About composition respond to content-panel width so narrow desktop panels and wide mobile panels receive appropriate shared layout rules.
  - [x] Retract the full-width-divider treatment: let the portrait span the title and availability rows so it no longer creates artificial vertical space.
- [x] Size desktop panels to the active chapter content, capped by the available viewport, and coordinate the panel and particle-border height during chapter transitions.
- [ ] Establish explicit phone, tablet, laptop, and large-desktop compositions instead of relying only on proportional scaling.
- [x] Extend the initial mobile resolution reduction into measured adaptive particle/render tiers for constrained devices without losing the strand’s identity. Full, Balanced, and Reduced all preserve the authentic WebGL strand; Auto selects an initial tier and downgrades only after sustained slow frame-time windows.

### Replace Pause with low-performance mode

- [x] Remove Pause rather than repairing it: it does not stop the complete particle system and interrupting time damages particle transition state.
- [x] Add a low-performance mode that preserves navigation and transition continuity while reducing render resolution, device-pixel ratio, particle density, post-processing, and optional atmospheric layers.
- [x] Use automatic capability detection and sustained frame-time measurement without adding a visitor-facing quality control. A hidden diagnostic view remains available for validation only.

### Client bundle and media loading

- [x] Preserve the WebGL strand, particle simulation, route controller, and destination shells as one continuously mounted experience.
- [x] Load images and video posters only for the current or incoming chapter.
- [x] Attach MP4 sources only for the active chapter or an explicit fullscreen request; unload inactive project videos.
- [x] Show an accent-colored loading spinner inside visible media frames until each requested image or video is ready; keep inactive deferred media quiet.
- [x] Remove external font requests and retain local system-font fallbacks.
- [x] Enforce a 270 KiB gzip initial interactive-JavaScript budget in the production test suite.
- [x] Defer project-level code splitting unless measurement shows that the budget or visitor experience has regressed; seamless panel measurement and particle framing take priority over an isolated chunk-size warning.

### Interface cleanup and final art direction

- [ ] Remove prototype diagnostics, placeholder labels, redundant instructions, random status text, and HUD copy that does not help visitors navigate or understand the work.
- [ ] Audit every persistent element for hierarchy and overlap once real content is present.
- [ ] Replace filler with intentional sci-fi greebles, micro-animations, scanning behaviors, coordinates, system phrases, or project-aware annotations.
- [ ] Keep decorative HUD language restrained and coherent so it reinforces the strand narrative instead of recreating prototype clutter.
- [ ] Complete final typography, spacing, accessibility, focus states, reduced-motion behavior, sound design, curated music controls, and cross-device testing.

## Tabled concepts

- [ ] Fully branching glass geometry with content at physical endpoints.
- [ ] Rollercoaster-scale loops and turns.
