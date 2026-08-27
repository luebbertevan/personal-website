# Portfolio Pre-Launch Checklist

This document records the finishing work required after the portfolio content is complete. The canonical task status remains in [TODO.md](./TODO.md); this file preserves the launch decisions, acceptance criteria, and rationale behind that work.

## Recommended order of work

1. Finalize index descriptions and destination order.
2. Redesign the mobile composition.
3. Add direct, shareable project URLs and browser-history support.
4. Add adaptive rendering and a non-WebGL fallback.
5. Complete accessibility and reduced-motion behavior.
6. Optimize the client bundle and media loading.
7. Perform real-device and cross-browser QA.
8. Complete metadata, analytics, repository cleanup, domain setup, and production deployment.

Index discovery comes before responsive work because the descriptions and final destination order are part of the base content. Mobile navigation should be designed around that finished index rather than revisited afterward.

## Index descriptions

On desktop, reveal the supporting text underneath each destination name when the entry is hovered or receives keyboard focus. Keep the mobile descriptions directly available in the future touch-specific index, where hover is not available.

- **ABOUT** — Who I am and how I work.
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

- Treat mobile as an intentional composition rather than a scaled-down desktop layout.
- Use a compact project index or index drawer with the approved descriptions.
- Prefer normal vertical reading for long case studies and provide sticky, touch-friendly chapter navigation.
- Use touch targets of at least 44 by 44 CSS pixels and do not make essential information depend on hover.
- Account for device safe areas, mobile browser bars, portrait and landscape orientations, zoom, and large text.
- Test representative phone, tablet, laptop, and large-desktop sizes, including widths of 320, 375, 390, 768, and 1024 CSS pixels.
- Remove fixed-height and clipped-overflow behavior that can make content unreachable on short mobile screens.

## Direct navigation and sharing

- Give each case study a direct, shareable URL, preferably a route such as `/work/fosty` rather than only a client-side destination.
- If real routes are deferred, add stable URL fragments as a minimum fallback.
- Keep the URL synchronized with destination and chapter navigation.
- Support browser Back and Forward behavior.
- Allow a direct visit to skip the general opening and arrive at the requested project or chapter.
- Add project-specific titles, descriptions, canonical URLs, and social previews when project routes exist.

## Adaptive rendering and performance

- Replace Pause with a persistent **Auto / Full / Reduced** visual-quality control.
- Use capability hints only as an initial estimate; measure real frame time and downgrade when the current machine cannot sustain the experience.
- Define approximately these tiers:
  - **Full:** current particle density and resolution with all visual passes.
  - **Balanced/Auto fallback:** reduced particle density and pixel ratio with simpler post-processing.
  - **Reduced:** substantially fewer particles, a lower render resolution, an optional 30 FPS cap, no depth-of-field or atmospheric effects, and poster images instead of automatic video playback.
- Pause rendering when the document is hidden.
- Remember a visitor's manual quality choice locally.
- Load video sources only when their chapter or lightbox needs them.
- Split the large case-study client component so visitors do not need to parse every interactive feature before the first view becomes usable.
- Establish a performance budget for initial JavaScript, initial media transfer, and sustained animation frame time.

## Resilience and fallback behavior

- Provide a branded static background if WebGL is unavailable or renderer creation fails.
- Keep the index and portfolio content usable without the particle system.
- Handle WebGL context loss without leaving the site blank.
- Provide an intentional loading state during visual initialization.
- Preserve basic access to content when JavaScript is unavailable.

## Accessibility and motion

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
