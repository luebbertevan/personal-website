# Signal Spine — Project Todo

This is the canonical working task list for the portfolio. Design rationale and historical decisions live in [DESIGN_NOTES.md](./DESIGN_NOTES.md).

The detailed launch criteria and current finishing-work decisions live in [PRE_LAUNCH_CHECKLIST.md](./PRE_LAUNCH_CHECKLIST.md).

## Now — real content integration

The visual system and navigation proof are sufficiently mature. Use accurate content next so final layouts, chapter lengths, media needs, and responsive behavior are designed around reality rather than placeholders.

### Connect the project to GitHub

- [ ] Create or choose the GitHub repository that will own the Signal Spine source.
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
- [ ] Treat Signal Spine as an authored project rather than a footer colophon—it should be navigable from the main index and receive its own particle-built presentation.
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

- [x] Add the approved one-sentence description underneath each main index destination; do not depend on hover-only popovers.
  - **ABOUT** — The principles, interests, and experiences behind my work.
  - **FOSTY** — An operations platform for animal rescue foster care.
  - **CRUX VISION** — A video analysis tool for understanding climbing movement.
  - **INHERITANCE** — A motion capture retargeting pipeline for ML training datasets.
  - **VAL** — Product ownership and full stack development for a live recovery care platform.
- [x] Use the working destination order: About, Fosty, Crux Vision, Val, Inheritance.
- [ ] Confirm that the index descriptions remain visible and legible in the future mobile index treatment.
- [ ] Add direct, shareable destination URLs and browser Back/Forward behavior.

## Later — final polish after content is stable

### Mobile and responsive design

- [ ] Redesign the mobile composition; the current desktop-derived layout is cluttered, overlaps, performs poorly, and does not keep the particle frame aligned.
- [ ] Determine mobile content density, chapter length, media treatment, index behavior, touch navigation, and strand placement from final content.
- [ ] Establish explicit phone, tablet, laptop, and large-desktop compositions instead of relying only on proportional scaling.
- [ ] Reduce particle/render complexity adaptively on constrained devices without losing the strand’s identity.

### Replace Pause with low-performance mode

- [ ] Remove Pause rather than repairing it: it does not stop the complete particle system and interrupting time damages particle transition state.
- [ ] Add a low-performance mode that preserves navigation and transition continuity while reducing render resolution, device-pixel ratio, particle density, post-processing, and optional atmospheric layers.
- [ ] Consider automatic capability detection plus a persistent manual toggle; define exact behavior after final desktop and mobile compositions are known.

### Interface cleanup and final art direction

- [ ] Remove prototype diagnostics, placeholder labels, redundant instructions, random status text, and HUD copy that does not help visitors navigate or understand the work.
- [ ] Audit every persistent element for hierarchy and overlap once real content is present.
- [ ] Replace filler with intentional sci-fi greebles, micro-animations, scanning behaviors, coordinates, system phrases, or project-aware annotations.
- [ ] Keep decorative HUD language restrained and coherent so it reinforces the strand narrative instead of recreating prototype clutter.
- [ ] Complete final typography, spacing, accessibility, focus states, reduced-motion behavior, sound design, curated music controls, and cross-device testing.

## Tabled concepts

- [ ] Fully branching glass geometry with content at physical endpoints.
- [ ] Rollercoaster-scale loops and turns.
