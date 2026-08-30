# Evan Luebbert Portfolio — Current Project Context

This is the concise handoff for future work on the personal website. It records the current product state, settled interaction decisions, known limitations, and the next intended phase. The canonical task list is [TODO.md](./TODO.md); deeper design history is in [DESIGN_NOTES.md](./DESIGN_NOTES.md).

## Product intent

This project is a personal portfolio built as one cohesive interactive world rather than a conventional website with a decorative background. A continuously rendered liquid-glass strand is the narrative path. Camera travel, color, particles, HUD-like content, and mouse response make exploring the featured projects feel cinematic while keeping the portfolio readable and directly navigable.

The accepted visual foundation is a dark, high-contrast, molten colored-glass strand inspired primarily by the rendering language of [this Shadertoy study](https://www.shadertoy.com/view/llK3Dy). Other reference themes include audio-reactive geometry, fractal grids, constellations, sci-fi interface language, and the reactive particle behavior on [Igloo](https://www.igloo.inc/). Fractal/grid/constellation ideas are supporting flourishes, not the primary visual.

## Current working proof

- The active page is `app/signal-prototype-v4.tsx`, mounted by `app/page.tsx`.
- The liquid strand shader and camera helpers live in `app/signal-prototype.tsx`.
- The GPU particle simulation and rendering live in `app/ember-loom.ts`.
- The primary interface styling lives in `app/signal-prototype.module.css`.
- Current placeholder destinations are Home, Signal Atlas, and Velvet Circuit.
- Palettes persist per destination: amber/orange for Home, blue for Signal Atlas, and pink for Velvet Circuit. Destination changes interpolate directly between the current and selected palettes rather than returning to a base color.
- Direct project selection dynamically places the chosen destination ahead of the current camera position. Projects are not permanently fixed to world coordinates, so a visitor does not travel through every preceding project.
- Manual scrolling moves freely along the strand. When the camera reaches the beginning of the next destination or chapter checkpoint, the remaining transition completes and cannot stop in a half-faded state.
- Arrow keys, on-screen previous/next controls, destination index items, and chapter tabs navigate the same route model.
- Destination travel is deliberately longer and slower than chapter travel so the strand and authored camera path remain a featured experience.

Current navigation tuning in `app/signal-prototype-v4.tsx`:

- destination travel: 52 world units over 7.35 seconds;
- chapter travel: 13 world units over 2.45 seconds;
- manual scroll scale: 0.02;
- Home intro duration: 6 seconds.

## Camera and strand behavior

- The strand continues procedurally in both directions and is intended to feel practically infinite.
- Scrolling changes the camera's world position along the strand rather than sliding the strand past a stationary view.
- The camera follows a continuous authored procedural path with changing orbit, roll, viewing angle, and distance while retaining the strand as its subject.
- The strand can become diagonal or nearly vertical. Camera distance sometimes pulls back dramatically, especially around vertical compositions, but should not move closer than the accepted close framing.
- Focus follows the camera-relative strand depth. Some softness is part of the cinematic depth-of-field look, though a small fidelity improvement remains welcome.
- Timed screen shake was intentionally removed. It is controllable but currently unwanted.

## Particle system decisions

- The current GPU simulation is 160 × 160, or 25,600 particles.
- Ambient particles occupy a varied three-dimensional orbit around the strand, extend beyond its immediate edge, move in strand/world space during camera travel, and react to the pointer.
- Particle brightness and color respond to motion/velocity. Size, light, radius, and density vary so the outer field and mouse disturbance remain visible.
- Strand depth is used to occlude particles that pass behind it; the effect should read as orbiting in three dimensions rather than sliding across the foreground.
- Avoid repeated particle clusters, evenly spaced concentrations, static lines, synchronized streaks, or a uniform field of spinning line segments.
- Particles build the perimeter of Home and project frames. They form the project frame as a whole, remain attached and subtly alive across chapter changes, and return to the ambient strand field only when the complete destination leaves.
- Chapter changes keep the panel backdrop and chapter rail present; only chapter contents transition.
- Frame particles sit four pixels outside the visible panel border so the UI does not cover them.
- During formation, chapter travel, destination travel, and dissipation, structured perimeter groups are scattered into a loose cloud. Hard rectangular subgroups should not be visible until particles settle into the final frame.
- The settled particle frame may remain organized but must retain subtle flow/jitter along the frame so it never appears frozen.

Home opening timing:

1. Show only the strand and ambient orbit for the first 3 seconds.
2. From 3.00–5.28 seconds, ambient particles form the Home frame.
3. Once the particle frame is substantially complete, reveal the Home content immediately over roughly 0.24 seconds.
4. Hold navigation input through the 6-second opening sequence.

The same Home assembly should occur whenever Home is entered, not only on initial page load. Home particles should disassemble only when navigating away from Home.

## Content and interface decisions

- Home is a first-class destination in the index and will contain the owner's name, personal headline, short biography, and key social/contact links.
- Project panels should occupy at least half of a desktop viewport and use large, readable typography. The strand shifts to preserve negative space and should not overlap the content.
- Projects may use multiple chapters for title, description, media, context/impact, and external links. Real projects may receive individually tuned layouts based on their text and media.
- The site itself may become a dedicated portfolio project, “About this site,” covering the concept, references, shader, camera path, particle system, navigation, tools, development process, and lessons.
- Project selection must remain immediately available; nobody should be forced to scroll the entire strand to reach a specific project.
- A curated music track should begin without an upfront opt-in dialog. A discreet music-note control may later allow visitors to choose their own track. Final browser/audio policy behavior still needs to be designed and tested.
- Fractal grids, matrix/constellation patterns, sci-fi greebles, scan effects, and project-aware annotations may be added as restrained embellishments during final art direction.

## Known issues intentionally deferred

- Mobile is currently cluttered, overlapping, slow, and has misaligned particle frames. Do not patch it piecemeal before real content is stable; it needs a deliberate phone/tablet composition and adaptive rendering strategy.
- The current Pause control is broken conceptually: it does not pause every particle process and can damage transition state. Replace it later with a low-performance mode that preserves time and navigation while reducing resolution, device-pixel ratio, particle density, and optional post-processing.
- Prototype diagnostics, status labels, placeholder copy, redundant navigation instructions, and random HUD text need a final cleanup pass.
- The current project connector should be the particle-built frame/environment, not a short screen-space line sitting on top of the strand.
- Accessibility, reduced-motion behavior, keyboard/focus polish, sound controls, final performance tiers, and cross-device testing remain future work.
- `app/globals 2.css` is an existing untracked user file. Preserve it unless its purpose is explicitly resolved.

## Next phase

The proof of concept is visually and interactively sufficient. The next phase is accurate content integration, not another broad visual rewrite:

1. Collect the real Home biography, headline, calls to action, and social/contact URLs.
2. Select and order the 4–6 launch projects or experiences.
3. Gather complete copy, links, credits, and high-resolution media for each.
4. Fully implement one representative real project and tune its chapter structure.
5. Use that project to define the reusable content model, then add the remaining projects iteratively.
6. Build the “About this site” destination from the recorded development story and imagery.
7. Only after content structure is stable, perform the mobile redesign, low-performance mode, prototype cleanup, accessibility work, sound/music implementation, and final polish.

## Repository and hosting state

- Local repository: `/Users/evan/Personal Website`
- Branch: `main`
- Hosted site: <https://evan-luebbert.luebbertevan.chatgpt.site>
- The existing `origin` is the Sites source remote. Connecting a separate GitHub repository remains an explicit TODO and must preserve the Sites workflow.
- The repository README provides a concise project overview, local setup instructions, architecture notes, licensing, and the deployed link.
- Documentation-only handoff changes do not require a site deployment. Runtime changes should be built and visually checked in proportion to their risk before publishing.
