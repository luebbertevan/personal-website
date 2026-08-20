# Crux Vision — Engineering Chapter Handoff

This document preserves the established context for the fourth Crux Vision
case-study chapter. It is a handoff, not finished portfolio copy.

## Paste-ready summary

The fourth chapter is **ENGINEERING — Building Visuals from Video**.
It should demonstrate technically ambitious engineering, strong product
judgment, and careful interface design without becoming a dense architecture
report. The most compelling story is not that Crux Vision can draw a skeleton.
It is that raw pose estimation is uncertain, especially in climbing, and the
product has to decide what information deserves to be shown. Crux Vision keeps
raw pose results immutable, derives confidence-aware views, rejects implausible
or unreliable positions, preserves honest gaps, and smooths only within valid
segments. Balanced, Strict, and Permissive quality approaches expose different
tradeoffs between continuity and the risk of showing false positions. Display
and analytics views remain separate because an overlay that looks useful and a
dataset suitable for measurement do not necessarily need the same policy.

That pose-quality work connects directly to the interface. Ordinary users see a
small set of understandable controls; deeper thresholds, rejection reasons,
smoothing choices, and diagnostics remain available in an advanced calibration
workspace. The experience was designed around a climber's investigation rather
than around the computer-vision pipeline. A climber imports a local video,
selects a short range, and sees analysis arrive progressively while the source
video remains playable. Pose samples are synchronized by presentation timestamp
and rendered as live Canvas overlays using the same display transform as the
video, keeping portrait and landscape footage aligned without re-encoding or
uploading it.

The chapter should be honest about limitations. Trails are most meaningful with
a fixed or nearly fixed camera. MediaPipe can lose or misplace joints during
occlusion, crossed limbs, unusual climbing positions, motion blur, and fast
movement. Filtering can remove or smooth unreliable data, but it cannot recover
motion the model never observed. Crux Vision is projected image-space analysis,
not 3D motion capture or a biomechanical truth system. Manual keyframe
correction and AI-assisted frame correction exist only as future research
concepts; they are not shipped features.

## Locked chapter identity

- **Chapter:** 4
- **Label:** ENGINEERING
- **Title:** Building Visuals from Video
- **Previous title rejected:** “Built for Trust” felt generic and overused
- **Project framing:** Personal Project · Creator & Full-Stack Engineer
- **Scope:** The current Crux Vision product only, not the legacy version

The chapter needs to reinforce all of the qualities Evan wants the project to
communicate:

- Technically ambitious engineering
- Strong product thinking
- Visual and interface design
- Personal knowledge of climbing and the questions climbers ask

## Strongest narrative thread

The most persuasive framing is:

> Drawing pose data is straightforward compared with deciding when that data is
> trustworthy enough to show. The engineering challenge was to preserve the
> movement without disguising the uncertainty.

This connects multiple decisions into one coherent story:

1. Climbing footage is difficult computer-vision input.
2. Raw model output can be missing, noisy, delayed, or convincingly wrong.
3. A visually polished false trail would undermine the entire investigation.
4. Crux Vision therefore preserves source data, derives inspectable views, and
   prefers an honest gap to an invented movement.
5. Those technical constraints shape the controls, labels, defaults, and
   visual language exposed to the climber.

This is stronger than listing frameworks or describing the app as merely
“local-first.” It demonstrates engineering judgment in service of the product's
purpose.

## The current technical system

### Local video and progressive analysis

- A climber imports a portrait or landscape video from their device.
- The source becomes playable immediately through a local browser URL.
- The source video is not uploaded or re-encoded to add the overlay.
- The user analyzes only a selected range rather than processing the entire
  recording.
- MediaPipe Pose Landmarker runs progressively in a module worker so analysis
  does not need to block the interface.
- MediaPipe Full is the current quality default; Lite remains a faster option.
- Crux Vision requests analysis samples at 30 samples per second by default.

### Synchronizing video and visual data

- Pose samples are associated with presentation timestamps, not only frame
  indexes.
- Skeletons and trails are drawn against the video moment currently being
  presented.
- Media metadata and timed sample extraction preserve the upright display
  orientation of common phone footage.
- Video and every Canvas overlay layer share the same display transform.
- This shared coordinate contract is what keeps overlays registered while
  fitting portrait and landscape videos into responsive layouts.

### Rendering model

- The video remains the source of truth.
- Pose results remain timestamped data rather than a baked visual effect.
- Canvas renders the skeleton and trail layers live.
- Skeleton, trails, and other overlay layers can remain independently
  configurable.
- Derived points such as hip and shoulder midpoints exist only when their
  required source joints are accepted.

## Pose quality, filtering, and “correction”

Evan explicitly identified data correction and the different filtering
approaches as some of the most interesting engineering problems. The chapter
should use technically accurate language here: the current product primarily
**filters, validates, and smooths** pose data. It does not silently reconstruct
or manually correct missing motion.

### Data integrity contract

- Raw MediaPipe pose samples remain immutable.
- Every accepted, rejected, or smoothed view is derived from that raw source.
- Invalid or low-confidence joints create gaps instead of being joined into a
  false limb or trail.
- No interpolation is enabled in the current product.
- A model change requires new inference; quality-policy changes can recompute
  cached results without rerunning inference.
- Derived points and views retain versioned provenance.

This makes the processing reversible and inspectable. The system can revise
how it interprets a pose without rewriting what the model originally returned.

### Automatic quality pipeline

The current pipeline combines:

- Finite and in-bounds structural checks
- Separate visibility and presence thresholds
- Threshold precedence at joint, body-group, and global levels
- Acquisition/retention hysteresis so a joint does not flicker at one cutoff
- Presentation-time and body-scale-aware plausibility checks
- Rejection of isolated jumps, implausible velocity or acceleration, and
  extreme distal segment-length changes
- Segment-local smoothing that resets when data is missing or rejected
- A separate centered offline smoothing result for recorded-video review

The system does not treat “high confidence” as automatically correct. Temporal
and structural checks can reject a bad-but-confident pose slingshot.

### Balanced, Strict, and Permissive

The ordinary interface exposes three pose-quality approaches:

- **Balanced:** The default compromise between useful continuity and false
  visible positions
- **Strict:** Rejects more uncertain motion; useful when avoiding false limbs is
  more important, but it creates more gaps
- **Permissive:** Preserves more continuous data, with a greater risk of showing
  questionable positions

These are not cosmetic filters. They communicate a real product tradeoff:
showing more data does not necessarily mean showing better information.

### Display versus analytics

- Display can use smoothing to make an overlay easier to interpret during
  recorded-video review.
- Analytics uses stricter temporal and confidence limits and remains
  unsmoothed.
- Coverage is part of the meaning of any future metric; missing information
  cannot be hidden behind a clean-looking curve.

This separation is a strong example of both product and engineering judgment.
Visual comprehension and numerical analysis have related but different
integrity requirements.

### Calibration and iteration evidence

The quality policy was calibrated across dynamic portrait movement,
overhang/occlusion footage, and extended landscape movement. Useful evidence
from that work includes:

- Human review found the initial causal One Euro smoothing visibly trailed a
  fast lache movement by roughly 70 milliseconds.
- Increasing its speed response reduced lag, but one visible frame remained
  objectionable.
- A centered offline smoother looked better for recorded review and became the
  ordinary display default without changing the acceptance policy.
- MediaPipe Full became the default after human review found a visible quality
  improvement without a drastic analysis-time increase; Lite remains available
  for speed.
- The calibration is explicitly not motion-capture validation or a claim that
  missing motion can be reconstructed.

The precise coverage percentages in the calibration report are available as
supporting evidence, but they are probably too detailed for the main portfolio
chapter unless a compact annotation or expanded technical view needs them.

## Product and interface design story

The chapter is titled “Engineering,” while still showing how the strongest
technical choices are expressed through the product experience.

- The product starts with a climber's question and a short movement range, not
  a full-video processing job.
- The video stays visually dominant; surrounding controls support inspection.
- Ordinary settings are intentionally limited to understandable choices such as
  overlay visibility, pose-quality preset, and selected trails.
- Thresholds, raw/rejected previews, smoothing configuration, rejection
  reasons, metrics, and exports live in an advanced calibration workspace.
- Range selection, slow motion, looping, frame stepping, and named checkpoints
  turn the interface into a focused review surface rather than a generic media
  player.
- Trail appearance controls help a climber make the relevant movement legible
  without changing the underlying pose data.
- Settings and durable review edits participate in a bounded undo/redo history;
  navigation and playback seeks do not.
- The responsive layout protects the scale and orientation of the video on both
  desktop and phone.

A useful message is that technical complexity is present, but it is organized
around the investigation instead of exposed indiscriminately.

## Constraints and limitations to state plainly

### Camera movement

Movement trails currently describe motion in the image. A fixed or nearly
fixed camera makes those paths meaningful relative to the wall. Panning,
zooming, camera shake, and digital stabilization can make a stationary wall
contact appear to move or can distort comparisons between attempts.

Use “fixed camera” or “steady camera,” not “steady cam,” if the latter could be
read as specialized stabilization equipment.

### Pose-estimation limitations

MediaPipe can produce missing or incorrect joints when:

- A limb is hidden by the body or wall
- Limbs cross
- The climber enters an unusual pose
- The movement is very fast
- Motion blur obscures a joint
- The body leaves the frame

The product should show uncertainty rather than freeze, bridge, or invent an
occluded limb.

### Measurement boundaries

- Current overlays operate in projected image space.
- They do not establish real-world distance, force, power, effort, balance,
  safety, or biomechanical correctness.
- A visual difference between attempts can be caused by framing or camera
  motion as well as technique.
- Crux Vision helps a climber investigate; it does not declare the correct
  answer.

## Future correction concepts — not shipped

The project notes explore two possible correction workflows:

### Manual armature correction

A user could pause on a difficult frame, drag a joint or limb into an observed
or inferred position, add another correction keyframe after the failure, and
preview bounded interpolation. Every correction would need provenance and
would remain reversible, with raw, accepted, corrected, and interpolated data
kept distinct.

### AI-assisted frame correction

An optional image model could examine a user-selected failure frame and suggest
joint positions. The user would have to review and confirm the suggestion.
Original pose data would remain available, inference provenance would be
recorded, and explicit consent would be required before a frame left the
device.

Both ideas are contingent research. They can illustrate future potential only
if labeled clearly; they must never be described as current Crux Vision
capabilities.

## Visual direction for this chapter

Visuals should carry the engineering argument without turning the chapter into
a technical diagram gallery. One strong primary visual plus a compact
supporting comparison is likely enough.

Potentially useful evidence already present in the product:

- A raw / accepted / rejected / smoothed comparison on the same frame or short
  movement
- A trail with an honest gap where a joint is occluded, contrasted with a false
  connected path
- A compact pipeline showing local video → timestamped raw pose → quality policy
  → derived points/trails → synchronized Canvas overlay
- The ordinary Pose Quality selector beside a restrained glimpse of the
  advanced calibration workspace
- The same portrait video and overlay correctly registered at different
  responsive sizes

The most portfolio-friendly visual is probably a short looping comparison of
raw or unreliable pose data against the final confidence-aware overlay. It
demonstrates the problem and the design decision immediately. A pipeline can be
secondary if it is needed to clarify how the system works.

## Voice and phrasing to preserve

The writing should sound like a climber-engineer explaining a hard visual
problem, not a generic software case study. It should be curious, exact, and
honest about uncertainty.

Relevant language from Evan's earlier writing:

- “technical theory represented visually”
- “details and relationships”
- “magnify subtleties”
- “a microscope for video analysis”
- “a container for investigation”
- “complements video investigation”
- “a detail that is obscured through time”
- “movement paths, timing, sequencing, momentum”

Important conceptual statements from the conversation:

> The skeletons themselves are not strong analysis. It is the pose data and
> body positions that provide data to add visualization. The joint positions
> themselves are the true value.

> Crux Vision is not going to tell you the correct answer. It is a tool to help
> climbers grow, think, analyze, and understand climbing better.

> It is very satisfying to see technical theory represented visually or have
> confirmation about a theory you have about a move and why it was—or was
> not—working.

The chapter can retain some literary texture, but technical claims should stay
plain. Prefer language such as “preserve,” “derive,” “reject,” “inspect,” and
“show an honest gap” over claims of precision that the system has not measured.

## Claims and framing to avoid

- Do not present the skeleton as the product's primary analytical insight.
- Do not claim motion-capture, biomechanical, or real-world spatial accuracy.
- Do not say filtering recovers an occluded joint.
- Do not describe manual or AI correction as shipped.
- Do not claim Crux Vision determines correct climbing technique.
- Do not imply that more continuous pose data is inherently more accurate.
- Do not turn the chapter into a technology-stack list.
- Do not use the legacy implementation as the product example.
- Avoid generic phrases such as “built for trust,” “unlock insights,” or
  “cutting-edge AI.”

## Technical source map

- Product overview: `/Users/evan/crux-vision/README.md`
- Product contract: `/Users/evan/crux-vision/docs/r2-product-spec.md`
- Pose-quality decisions and evidence:
  `/Users/evan/crux-vision/docs/pose-quality-calibration-report.md`
- Human calibration findings:
  `/Users/evan/crux-vision/docs/pose-quality-human-calibration-findings.md`
- Future correction research:
  `/Users/evan/crux-vision/docs/future-pose-correction-notes.md`
- Future overlay research:
  `/Users/evan/crux-vision/docs/future-movement-overlay-report.md`
- Architecture and milestone context: `/Users/evan/crux-vision/ROADMAP.md`
- Broader case-study context:
  [`CRUX_VISION_CASE_STUDY_CONTEXT.md`](./CRUX_VISION_CASE_STUDY_CONTEXT.md)
- Current portfolio content draft:
  [`CRUX_VISION_PROJECT_CONTENT_DRAFT.md`](./CRUX_VISION_PROJECT_CONTENT_DRAFT.md)
