# Crux Vision Case Study Context

This document preserves the decisions, voice, and project context established
while developing the Crux Vision portfolio case study. It is context for future
work, not a new brief or list of objectives.

## Short handoff summary

Crux Vision is Evan Luebbert's personal movement-review project for climbers,
begun in 2025. Evan is its creator and full-stack engineer. The case study
should convey four things together: a personal connection to climbing, strong
product thinking, technically ambitious engineering, and careful visual and
interface design. The current product turns local climbing video into a
workspace for examining movement and technique. Pose data powers synchronized
skeleton and movement-trail overlays, while range selection, looping,
slow-motion playback, frame navigation, checkpoints, selectable trail sources,
and appearance controls support focused investigation. The product does not
claim to give climbers a correct answer; it helps them see, compare, question,
and understand movement more deeply.

The case study follows the chapter-based precedent established by Fosty, but it
is intentionally conservative and visually led. The four decided chapters are:

1. **ORIGIN — Crux Vision**
2. **MOVEMENT REVIEW — Review the Crux**
3. **VISUAL OVERLAY — Movement Made Visible**
4. **ENGINEERING — Building Visuals from Video**

Chapter 1 has been drafted and implemented. Chapter 2 has a provisional content
draft and uncommitted implementation preparation in the portfolio worktree.
Chapters 3 and 4 have only their confirmed direction and titles. Keep the story
about the current Crux Vision rebuild; do not use or showcase the legacy
version. A brief statement about the project's still-untapped potential is
appropriate, but future concepts should not be presented as shipped features.

The visual hierarchy matters more than exhaustive technical explanation. The
Origin visual is a looping portrait clip with a skeleton and selected trails.
The most important future visual is a combined A/B presentation of two videos
of the same move performed with different methods, using trails to make their
movement paths easy to compare. Chapter 2 should use a compact feature-by-feature
breakdown with screenshots, following the Fosty Product chapter, instead of
depending on one long workflow recording.

## Project framing and factual boundaries

- **Project:** Crux Vision
- **Started:** 2025
- **Framing:** Personal Project
- **Credit:** Creator & Full-Stack Engineer
- **Primary current audience:** Individual climbers interested in trying the
  public beta
- **Perspectives Evan hopes to learn from:** Beginners, advanced climbers,
  coaches, and climbers with different styles
- **Potential coaching value:** The visual layer can help explain subtle
  movement and support mind-body connections
- **Available links:** Public beta and GitHub repository
- **Do not mention:** The absence of users
- **Do not imply:** Employment, a formal company role, validated coaching
  outcomes, motion-capture accuracy, or that future features already exist
- **Current product only:** The archived legacy implementation is reference
  material, not the product being presented

Public links currently used by the portfolio:

- Public beta: <https://crux-vision-rebuild.vercel.app/>
- GitHub: <https://github.com/luebbertevan/crux-vision>

## Central narrative

Climbing is technical, analytical, and sometimes difficult to observe from the first
person. On the wall, a climber can feel movement but cannot see the whole body
or the complete sequence. Watching another climber or reviewing footage adds an
outside perspective and is already a common way for climbers and coaches to
learn. Crux Vision adds another visual layer to that investigation.

The pose skeleton is not, by itself, the analysis. The underlying pose data and
joint positions make new visualizations possible. Movement trails are the
clearest current example: they reveal a path through space that ordinary video
spreads across time. A trail can show the movement of the hips, a foot swing, a
shoulder during a static move, the arc of a reach, the apex of a jump, or how
close a hand came to a hold. When attempts are compared, trails can expose
differences in path, timing, relative position, and technique.

Crux Vision is an investigative tool, not an automated coach or a source of
prescriptive answers. Its value is in directing attention, confirming or
challenging a theory, exposing details and relationships, and creating a shared
surface for climbers to discuss movement. Visuals are especially important
because detailed climbing mechanics can become inaccessible when described
only in words.

## Chapter decisions

### Chapter 1 — Origin

- **Label:** ORIGIN
- **Title:** Crux Vision
- **Status:** Content drafted and page implemented
- **Purpose:** Establish what the tool is before explaining the personal
  motivation; connect the product to Evan's experience as both a climber and an
  engineer
- **Story:** First-person climbing provides a limited view; video supplies an
  outside perspective; pose-derived visuals deepen that existing practice
- **Tone:** Personal, reflective, analytical, and accessible to non-climbers
- **Visual:** A seamless looping portrait video of one attempt with the
  synchronized skeleton and selected trails visible
- **Links:** Public beta and GitHub remain visible outside the scrolling copy

The approved draft lives in
[`CRUX_VISION_PROJECT_CONTENT_DRAFT.md`](./CRUX_VISION_PROJECT_CONTENT_DRAFT.md).
The page version adds one concluding paragraph that frames Crux Vision as a
microscope for video analysis and briefly acknowledges future potential.

### Chapter 2 — Movement Review

- **Label:** MOVEMENT REVIEW
- **Title:** Review the Crux
- **Status:** Provisional content and visual preparation exist; wording and
  layout are not yet treated as final
- **Purpose:** Explain the core review workflow in approachable product terms
- **Format decision:** Use a compact workflow/feature breakdown with key panel
  screenshots, similar to Fosty's Product chapter. Do not rely on a 20–30 second
  recording to explain the entire workflow.
- **Provisional feature groups:**
  - **Isolate the crux:** Select the short range containing the move or question
    worth examining; focused analysis also makes on-device processing faster
  - **Review with precision:** Loop, slow playback, step through analyzed
    frames, and create named checkpoints
  - **Focus the investigation:** Select the joint or derived body point that
    matches the question, then adjust the trail presentation
- **Prepared screenshot subjects:** Analysis range, checkpoints, precision
  playback, overlay sources, and trail appearance
- **Prepared media visible in the current worktree:**
  `crux-vision-analyze-range.webp`, `crux-vision-checkpoints.webp`,
  `crux-vision-playback-controls.webp`,
  `crux-vision-overlay-settings.webp`,
  `crux-vision-trail-appearance.webp`, and a short
  `crux-vision-movement-review.mp4` with poster

The current draft correctly emphasizes that users bring a question to the
tool. The controls create a focused review environment; they are not presented
as feature inventory for its own sake.

### Chapter 3 — Visual Overlay

- **Label:** VISUAL OVERLAY
- **Title:** Movement Made Visible
- **Status:** Direction decided; copy not drafted
- **Purpose:** Deliver the central visual proof of the product's value: pose
  data can make paths, timing, positions, and relationships visible
- **Primary visual:** Two videos of the same move performed with different
  methods, combined into one looping A/B presentation. Trails should carry the
  comparison; the result needs to be understandable before a reader knows the
  climbing-specific explanation.
- **Content emphasis:**
  - Trails reveal movement across time rather than merely decorating a frame
  - Comparison can expose differences in paths, timing, and relative body
    position
  - Different questions call for different joints or body points
  - The overlay can confirm a technical theory or direct attention to something
    the viewer did not know to examine
  - The most persuasive climbing detail may be shown visually and explained in
    plain language rather than through dense domain terminology

The chapter is a natural home for one concise, concrete example from Evan's own
climbing. The example should remain legible to a general portfolio audience and
let the visual carry most of the technical explanation.

### Chapter 4 — Engineering

- **Label:** ENGINEERING
- **Title:** Building Visuals from Video
- **Status:** Direction and title decided; copy not drafted
- **Purpose:** Show the product judgment, visual/interface design, and technical
  ambition required to turn imperfect video-derived pose data into a review
  experience a climber can interpret honestly
- **Important engineering story:** Data correction and the different filtering
  approaches are among the most interesting problems and should be included
- **Current product facts that can support the story:**
  - Local-first video review; the source video is not uploaded or re-encoded
  - MediaPipe pose inference runs progressively and is synchronized by
    presentation timestamp
  - Video and overlay layers share one display transform so portrait and
    landscape footage remain aligned
  - Confidence-aware skeletons and trails break across invalid gaps rather than
    drawing false connections
  - Balanced, Strict, and Permissive pose-quality approaches expose meaningful
    coverage/continuity tradeoffs
  - Filtering uses confidence precedence, hysteresis, temporal plausibility,
    structural checks, and segment-local smoothing that resets at gaps
  - Raw pose data remains immutable; filtered views are derived and inspectable
  - Playback, overlay, and appearance controls were designed around focused
    investigation rather than a generic media player
- **Constraints to state briefly and honestly:**
  - Trails are most trustworthy with a fixed or nearly fixed camera; camera
    movement changes image-space paths relative to the wall
  - MediaPipe can fail or return incorrect positions under occlusion, crossed
    limbs, unusual positions, and fast movement
  - Filtering can reject or smooth unreliable data, but it cannot truthfully
    reconstruct motion the model never observed
  - This is projected image-space analysis, not a physical 3D measurement or
    motion-capture system
- **Future correction context:** Manual keyframe correction and AI-assisted
  single-frame correction have been explored in project notes, but they are
  future concepts and must remain clearly separated from the current product

The previous candidate title “Built for Trust” was rejected as generic and
overused. “Building Visuals from Video” is the decided title.

## Vision and audience

Evan wants the case study to briefly discuss his vision for the project and who
it is for. The exact chapter placement has not been fixed.

The current audience is the individual climber who wants to investigate their
own footage. Evan also wants perspectives from beginners, advanced climbers,
coaches, and people with different climbing styles. Coaching is promising
because an overlay can make a subtle observation easier to point out and can
help an athlete connect what they see with what they feel.

Success does not require Crux Vision to produce a definitive answer. If a
climber learns something about their technique, a specific problem, or climbing
movement—or if the tool simply creates a more focused conversation between
climbers—that is meaningful value.

Crux Vision is only beginning. There is substantial room for additional
overlay visualizations, comparisons, and carefully bounded metrics. Mention
this potential briefly; the case study should remain centered on what works in
the current product.

## Visual strategy

- Treat visuals as primary evidence, not decoration.
- Keep the case study conservative: one strong visual idea per chapter is
  preferable to an exhaustive gallery.
- Let motion explain climbing concepts that would require too much specialist
  language in prose.
- Preserve image and video expand behavior where it materially helps a reader
  inspect the interface.
- Keep portrait video fully contained in expanded views; do not crop it to fill
  the panel.
- The established Crux accent is a darker, greener lime than the product's
  brightest neon green: RGB `143, 230, 96` in the portfolio implementation.
- Crux panels should use the same overall content-panel dimensions as the other
  projects so the particle border remains aligned.

The implemented Origin layout uses a continuous scrollable text column on the
left and a persistent portrait video on the right, with the simple Public Beta
and GitHub text links beneath the video. The video has only an Expand control;
there is no inline pause control or explanatory “live pose” badge. The chapter
navigation rail remains visible at the bottom.

## Voice and writing character

The preferred voice is personal, observant, and technically curious. It should
sound like a climber-engineer explaining why a visual discovery matters, not a
startup landing page or an academic paper. The writing can be thoughtful and
slightly literary, but it should stay concrete. It often moves from embodied
experience, to observation, to what the tool makes visible.

Useful characteristics:

- First-person experience where it establishes genuine motivation or evidence
- Precise verbs: examine, reveal, isolate, compare, magnify, confirm, direct
- An investigative rather than prescriptive posture
- Climbing-specific insight translated for a broad portfolio audience
- Technical honesty about uncertainty and limitations
- Occasional textured phrases, surrounded by simple sentences so they retain
  force

Avoid:

- Generic product language such as “revolutionary,” “unlock insights,” or
  “built for trust”
- Treating the skeleton itself as the analytical breakthrough
- Repeating “analysis” several times in one sentence
- Overexplaining climbing technique in language only climbers will understand
- Claiming the tool knows the correct method
- Flattening every distinctive phrase into neutral UX copy

## Source-language bank

These phrases and passages came directly from Evan's responses. They are not
all final copy; they preserve cadence, imagery, and ideas that should not be
lost. Spelling and punctuation have been lightly normalized where needed.

### Favored phrases

- “complements video investigation”
- “holistically”
- “magnify subtleties”
- “a microscope for video analysis” / “put a microscope to video analysis”
- “a container for investigation” / “a container for deeper analysis”
- “technical theory represented visually”
- “details and relationships”
- “a unique lens”
- “a surface to investigate climbing deeper”
- “movement paths, timing, sequencing, momentum”
- “a detail that is obscured through time”

### Perspective and motivation

> When I am looking at someone else climb, or at a video of myself climbing, I
> can see the entire body. I can see how each movement contributes to the next.
> I can see variations in technique and method. While you are on the wall, it is
> more difficult to notice those things.

> There are details that you miss purely because you do not have the entire
> picture. You cannot observe the entire body move through the sequence of a
> route.

> One of the reasons climbers like to work on the same route together is that
> they can get another perspective on the climb.

> As an engineer and climber, I wanted to combine my interests and create a tool
> that would provide an extra layer of information from climbing videos—a tool
> that could provide even more insight and accent the already valuable process
> of reviewing climbing movement.

### What trails reveal

> Movement trails are one visual overlay we can get from pose data. A trail
> reveals the path that a part of the body takes through space and provides a
> visual representation of a detail that is obscured through time.

> It could be the path of the hips as you make a move. It could be the path of
> your foot as you generate momentum, the path of your shoulders during a static
> movement, or the path of your hand as you reach. Trails can show the apex of a
> jump or the parabola of a swing.

> A trail can show information relative to the other trails. It can show that,
> at this position in the hip movement, my hand did this. It can show
> information relative to the wall, such as my hand getting this close to the
> hold on one attempt versus another.

### Investigative value

> Crux Vision provides a container to put a microscope to video analysis and
> magnify subtleties that you might not see at first glance. It is a tool that
> complements video investigation.

> Using Crux Vision, I have had breakthroughs and epiphanies about technique. It
> is very satisfying to see technical theory represented visually or to confirm
> a theory you have about a move and why it was—or was not—working.

> The overlay has helped identify subtle details and relationships I missed,
> like the connection between the hips and shoulders or how different methods
> on the same move change their relative timing and position.

> It has pulled my focus toward things I would not have noticed otherwise—things
> I would not have thought to look for or would not have been able to see without
> the visual overlay.

> Crux Vision is not going to tell you the correct answer. It is a tool to help
> climbers grow, think, analyze, and understand climbing better.

> If Crux Vision adds an element to an open conversation between climbers and
> provides a surface to investigate climbing deeper, I would consider that a
> success.

### Why visuals lead

> The depth of climbing-specific knowledge is not going to be approachable or
> relevant to most of the audience reading this, so I want to stay out of the
> details for the most part. It is one of the reasons the visualization is so
> powerful: it helps demonstrate visually what is very difficult to describe
> with words.

## Source map

- Portfolio content draft:
  [`CRUX_VISION_PROJECT_CONTENT_DRAFT.md`](./CRUX_VISION_PROJECT_CONTENT_DRAFT.md)
- Engineering and Design chapter handoff:
  [`CRUX_VISION_ENGINEERING_CHAPTER_HANDOFF.md`](./CRUX_VISION_ENGINEERING_CHAPTER_HANDOFF.md)
- Current portfolio implementation:
  [`app/signal-prototype-v4.tsx`](./app/signal-prototype-v4.tsx) and
  [`app/signal-prototype.module.css`](./app/signal-prototype.module.css)
- Fosty structure and voice precedent:
  [`FOSTY_PROJECT_CONTENT_DRAFT.md`](./FOSTY_PROJECT_CONTENT_DRAFT.md)
- Current product repository: `/Users/evan/crux-vision`
- Current product overview: `/Users/evan/crux-vision/README.md`
- Current product contract:
  `/Users/evan/crux-vision/docs/r2-product-spec.md`
- Filtering and correction context:
  `/Users/evan/crux-vision/docs/pose-quality-calibration-report.md` and
  `/Users/evan/crux-vision/docs/future-pose-correction-notes.md`
- Future visual ideas, for carefully labeled potential only:
  `/Users/evan/crux-vision/docs/future-movement-overlay-report.md`

## Current workspace note

At the time this context was written, the portfolio worktree contained
uncommitted Chapter 2 preparation in `app/signal-prototype-v4.tsx`, plus the
Crux movement-review screenshots, video, and poster listed above. Those changes
should be inspected and preserved before any new edit. The constants and media
handling are present, while the rendered Chapter 2 section may still be
incomplete. Other unrelated draft files and changes also exist in the worktree.
