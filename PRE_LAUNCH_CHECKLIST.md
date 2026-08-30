# Portfolio Pre-Launch Checklist

This document records the finishing work required after the portfolio content is complete. The canonical task status remains in [TODO.md](./TODO.md); this file preserves the launch decisions, acceptance criteria, and rationale behind that work.

## Recommended order of work

1. Finalize index descriptions and destination order.
2. Redesign the mobile composition.
3. Stabilize the shared mobile typography, navigation, spine framing, transition pacing, and responsive overflow behavior identified in the Phase 1 review.
4. Refine the mobile composition chapter by chapter, beginning with About.
5. Add direct, shareable project URLs and browser-history support.
6. Add adaptive rendering and a non-WebGL fallback.
7. Apply the minimal reduced-motion fallback; defer broader accessibility auditing.
8. Optimize the client bundle and media loading.
9. Perform real-device and cross-browser QA.
10. Complete metadata, analytics, repository cleanup, domain setup, and production deployment.

Index discovery comes before responsive work because the descriptions and final destination order are part of the base content. Mobile navigation should be designed around that finished index rather than revisited afterward.

## Index descriptions

On desktop, reveal the supporting text underneath each destination name when the entry is hovered or receives keyboard focus. Keep the mobile descriptions directly available in the future touch-specific index, where hover is not available.

- **ABOUT** — What I build and why.
- **FOSTY** — An operations platform for animal rescue foster care.
- **CRUX VISION** — A video analysis tool for understanding climbing movement.
- **INHERITANCE** — A motion capture retargeting pipeline for ML training datasets.
- **VAL** — Product ownership and full stack development for a live recovery care platform.

### Working destination order

1. About
2. Fosty
3. Crux Vision
4. Val
5. Inheritance

This preserves the two strongest and most personally distinctive case studies at the front while moving Val out of the final position. Val then establishes recent professional product ownership before Inheritance closes the portfolio with specialized technical depth. The order is editorial, not chronological: the first work should create interest, the middle should establish professional credibility and range, and the last case study should still provide a strong technical finish.

## Mobile and responsive composition

Phase 1 was implemented on August 27, 2026. Mobile now uses a compact identity bar, a full-screen project index with descriptions and nested chapters, a bottom previous/current/next dock, a compact chapter picker, a nearly full-viewport content panel, safe-area-aware chrome, single-column layout foundations, shorter transitions, lower mobile render resolution, and automatic chapter scroll reset. While reading, the compact top bar pairs Evan Luebbert with the current project, and the bottom navigation label shows only the current chapter so long project-and-chapter combinations do not compete for space.

### Phase 1 review and stabilization

Complete these shared-system corrections before tuning individual chapters:

The interface and typography portion was completed on August 27, 2026. Mobile now uses one identity system with an expressive opening state and a shared compact header state that remains visually consistent when the project menu opens. Primary reading, supporting, navigation, and utility text uses a 17px mobile baseline; captions use 16px; and tertiary metadata and uppercase labels use 13px. The menu utilities have a dedicated bottom-aligned composition.

The motion and responsive-structure portion was completed on August 27, 2026. Mobile project and chapter transitions now take a shorter route at a slower cadence, the strand is centered with less rotational drift on narrow screens, and the mobile panel is slightly more transparent so the visual remains legible behind the reading surface. Medium-width and short desktop windows now keep panels bounded to the viewport, give About a reliable internal scrolling path, and collapse Crux Vision, Inheritance, and Fosty layouts at project-specific content-fit breakpoints.

The follow-up framing correction keeps the mobile spine’s centerline passing through the viewport center throughout travel, without inheriting the desktop content-panel offset or velocity lead. Particle borders now measure the active panel’s responsive resting rectangle, account for the mobile panel’s vertical entrance motion, and automatically recalculate when the shell or any destination panel changes size.

About now uses panel-width-aware composition independently from the global navigation breakpoint. Narrow desktop panels share the compact title-and-portrait opening used on phones, while wide mobile and tablet panels receive roomier sizing. Crossing live from desktop into the mobile navigation mode dismisses the opening identity immediately; a genuine mobile page load still receives the intended opening animation.

Desktop panels now measure the active chapter rather than sharing one universal height. Short chapters contract around their content, long chapters retain the available viewport height with internal scrolling, and height changes are coordinated with chapter transitions. The responsive particle frame follows the changing panel bounds. In compact About layouts, the portrait spans the title and availability rows so the divider can return to the text column without creating an empty band beneath the title.

- Keep the opening **Evan Luebbert / Software Engineer** identity near the top of the mobile viewport so it does not overlap the spine’s focal area.
- Use **Software Engineer** beside the name for the opening and expanded-menu identity states. While reading, replace the role with the active project so the compact top bar provides project context.
- Increase the role size in the full-screen menu and reduce the excessive vertical gap between the menu identity and the first index entry.
- Use 17 CSS pixels for mobile paragraph, supporting, navigation, and utility text. Use 16 pixels for captions and 13 pixels for genuinely tertiary metadata and uppercase labels. Prioritize comfortable reading over creating hierarchy through small type.
- Recompose the menu footer as a deliberate bottom-aligned utility area. Increase the GitHub, LinkedIn, and résumé link sizes, separate the visual-control action from the links, and give that action an icon. This remains temporary until Pause is replaced by the quality control described below.
- Restore a slower, more deliberate mobile transition cadence. Preserve time to appreciate the spine; investigate shortening travel distance rather than making navigation abruptly fast.
- Recalibrate the spine’s mobile anchor, travel path, and panel relationship so its focal structure stays as centered and visible as possible across narrow aspect ratios.
- Audit responsive behavior by both width and available height. Medium and medium-small windows must never strand content below a fixed panel or remove its scrolling path.

- Treat mobile as an intentional composition rather than a scaled-down desktop layout.
- Use a compact project index or index drawer with the approved descriptions.
- Prefer normal vertical reading for long case studies and provide sticky, touch-friendly chapter navigation.
- Use touch targets of at least 44 by 44 CSS pixels and do not make essential information depend on hover.
- Account for device safe areas, mobile browser bars, portrait and landscape orientations, zoom, and large text.
- Test representative phone, tablet, laptop, and large-desktop sizes, including widths of 320, 375, 390, 600, 768, 860, and 1024 CSS pixels. At each relevant width, also test short viewport heights and reduced desktop windows rather than assuming width alone selects the correct composition.
- Remove fixed-height and clipped-overflow behavior that can make content unreachable on short mobile screens.
- Define breakpoint changes from actual content-fit failures. Allow individual chapters to enter the small-screen composition earlier when their layout requires it instead of forcing every chapter through one universal width threshold.

Media now has two states at every screen size: an inline preview and a full-screen lightbox. Image and video controls use an icon-only full-screen affordance with an accessible label. Tall screenshots may be cropped in the inline preview but must remain fully visible in the lightbox. Decorative imagery such as the About portrait remains non-expandable.

## Direct navigation and sharing

Implemented on August 29, 2026. Projects use concise root-level routes (`/fosty`, `/crux-vision`, `/val`, and `/inheritance`), and later chapters append a stable chapter slug. Native browser history remains synchronized without replacing or remounting the persistent visual world. Fresh deep links initialize the correct camera coordinate, palette, project, and chapter, skip the general About opening, and use a short project-specific particle reveal. The root route retains the full signature opening.

- Give each case study a direct, shareable URL, using the approved concise route structure such as `/fosty` rather than only a client-side destination.
- If real routes are deferred, add stable URL fragments as a minimum fallback.
- Keep the URL synchronized with destination and chapter navigation.
- Support browser Back and Forward behavior.
- Allow a direct visit to skip the general opening and arrive at the requested project or chapter.
- Add project-specific titles, descriptions, canonical URLs, and social previews when project routes exist.

## Adaptive rendering and performance

The adaptive rendering and resilience pass was completed on August 29, 2026. The finished interface is automatic and has no visitor-facing quality control. Full, Balanced, and Reduced all render the authentic WebGL strand; lower tiers reduce technical cost without substituting a CSS interpretation. A hidden diagnostic view can force tiers during validation. Renderer failure and unrecoverable context loss use a deliberately minimal near-black emergency background with no imitation strand, while direct-route content remains usable.

The client-loading pass was completed on August 30, 2026 without deferring or remounting the WebGL world. The renderer, strand, particle simulation, route controller, and destination-panel shells remain available as one continuous experience. Images and video posters now load only for the current or incoming chapter, and an MP4 source is attached only when its chapter becomes active or the visitor explicitly opens it fullscreen. On the About route this reduced observed page media from 19 images and five video requests to the single 63 KiB headshot and no video requests. The initial interactive JavaScript budget is 270 KiB gzip; the completed production build is approximately 254 KiB gzip. Existing automatic quality thresholds remain the animation-frame budget: Full downgrades after sustained averages above 22 ms, Balanced above 25 ms, and Reduced intentionally caps near 30 FPS.

- Replace Pause with an automatic **Full / Balanced / Reduced** quality system and keep validation controls out of the normal visitor interface.
- Use capability hints only as an initial estimate; measure real frame time and downgrade when the current machine cannot sustain the experience.
- Define approximately these tiers:
  - **Full:** current particle density and resolution with all visual passes.
  - **Balanced/Auto fallback:** reduced particle density and pixel ratio with simpler post-processing.
  - **Reduced:** substantially fewer particles, a lower render resolution, an optional 30 FPS cap, no depth-of-field or atmospheric effects, and poster images instead of automatic video playback.
- Pause rendering when the document is hidden.
- Keep manual tier overrides limited to the hidden diagnostic view; do not expose or persist them as visitor preferences.
- Load video sources only when their chapter or lightbox needs them.
- Keep project-level code splitting conditional on evidence that the interactive-JavaScript budget or real loading behavior has regressed. Do not split the tightly coordinated destination panels solely to reduce a chunk-size warning when doing so would risk panel measurement, particle framing, or seamless transitions.
- Establish a performance budget for initial JavaScript, initial media transfer, and sustained animation frame time.

## Resilience and fallback behavior

- Provide a deliberately minimal near-black emergency background if WebGL is unavailable or renderer creation fails. Do not imitate the strand with CSS or a lower-fidelity substitute.
- Keep the index and portfolio content usable without the particle system.
- Handle WebGL context loss without leaving the site blank.
- Provide an intentional loading state during visual initialization.
- Preserve basic access to content when JavaScript is unavailable.

## Accessibility and motion

The minimal launch scope was implemented on August 30, 2026. When a visitor's operating system requests reduced motion at page load, the site deliberately skips WebGL initialization and uses the existing near-black static presentation with no strand, particles, camera travel, or automatic video playback. Portfolio content and direct-route navigation remain available, and returning to the normal visual experience only requires disabling the preference and refreshing. Broader accessibility, high-contrast, large-text, zoom, and multi-screen-reader auditing is deferred rather than treated as a launch requirement.

A focused keyboard and dialog follow-up was completed the same day. Global route shortcuts no longer intercept arrow and paging keys while a visitor is focused inside a control or scrollable reading region. Expanded-image dialogs keep keyboard focus inside, close with Escape or the existing close controls, and return focus to the control that opened them. Verification remains intentionally limited to a short desktop and mobile smoke test rather than a broad accessibility audit.

- Make reduced motion skip or drastically shorten the opening and disable continuous decorative motion, not only CSS transitions and automatic video playback.
- Verify complete keyboard navigation and visible focus states.
- Trap focus inside open image and video dialogs, close them with Escape, and restore focus to the control that opened them.
- Verify screen-reader reading order and announce meaningful destination changes.
- Test color contrast, 200% zoom, large text, and high-contrast settings.
- Provide captions or an equivalent textual explanation for video when movement communicates meaningful information.

## Release QA

- Test iPhone Safari, Android Chrome, macOS Safari and Chrome, and Firefox.
- Test touch, mouse, trackpad, and keyboard navigation.
- Test a lower-powered or integrated-GPU computer, throttled CPU, and a slow network.
- Check loading, resizing, device rotation, external links, résumé download, lightboxes, videos, and every navigation path.
- Resize continuously through narrow desktop, tablet, and medium-small ranges; verify that every content panel remains internally scrollable whenever its content exceeds the available height, with special attention to About.
- Check for broken links, browser-console errors, missing assets, unexpected layout shifts, and content that becomes clipped or unreachable.
- Measure real-user loading, responsiveness, layout stability, and animation smoothness after launch.

## Discoverability and launch infrastructure

- Add a favicon and device icons.
- Add a canonical URL, `robots.txt`, and `sitemap.xml`.
- Add a useful not-found/error experience.
- Consider `Person` and `CreativeWork` structured data.
- Add minimal privacy-conscious analytics for project visits, chapter depth, external-link and résumé clicks, selected quality tier, WebGL failures, and real-user performance.
- Add lightweight client-error reporting.
- Replace the starter README, connect the intended GitHub repository, decide repository visibility, and add an appropriate license.
- Remove unused prototype and duplicate files without disturbing intentional history.
- Confirm media ownership, credits, confidentiality, résumé details, public-profile details, contact information, and external links.

## Domain and deployment

- Decide on the hosting target before configuring the domain. The current application uses a Vinext and Cloudflare Worker/Sites-oriented build, so a Vercel deployment requires a compatibility check or build adaptation.
- Purchase a concise personal domain with renewal pricing, WHOIS privacy, account recovery, auto-renewal, and two-factor authentication considered.
- Configure both the apex and `www` hostnames, choose one canonical hostname, and redirect the other.
- Verify DNS, HTTPS, certificates, production redirects, social previews, and direct project URLs on the final domain.
- Keep a reproducible production deployment tied to the intended source branch.

## Deliberately deferred polish

Do not add more decorative effects, sound, music, or nonessential HUD detail until the mobile, discovery, performance, resilience, accessibility, and launch work above is complete.
