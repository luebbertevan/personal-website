# Crux Vision Project Content Draft

## Chapter 1. Origin

### Label

ORIGIN

### Title

Crux Vision

### Project details

Personal Project  
Creator & Full-Stack Engineer  
2025–present

### Body

Crux Vision is a movement-review tool I created to turn climbing footage into a
workspace for examining motion and technique. It uses pose data to create video
overlays that reveal new layers of visual information, helping climbers examine
movement holistically and magnify subtleties that ordinary playback can
obscure.

Climbers are always trying to improve, whether we are building strength,
refining our technique, or working to complete a route at the edge of our
ability. We are constantly looking to learn and grow, which makes analysis,
technique, and movement comprehension central to the sport.

While climbing, you experience everything from a first-person perspective. You
are limited to what you can see and feel, and you cannot observe your own body
completely. That often means missing the bigger picture: how your body moves
through the full sequence of a route. Watching another climber or reviewing
footage of yourself reveals details and relationships that are difficult to
recognize while you are on the wall.

Video extends that collaborative process by giving climbers an outside
view. Crux Vision complements video investigation by
creating a container for deeper analysis. Movement trails can reveal the path
of the hips, the timing of a foot swing, the arc of a reach, or the relationship
between different parts of the body.

Using Crux Vision, I have experienced the satisfaction of seeing technical
theory represented visually. It has confirmed ideas I had about why a move
was or was not working, exposed relationships I had missed, and directed my
attention toward things I would not have thought to examine.


- TRY THE PUBLIC BETA
- VIEW ON GITHUB

### Recommended visual

A seamless loop of a single climbing attempt with the Crux Vision reference
skeleton and selected movement trails visible. The clip should reach meaningful
movement quickly so the relationship between the climber and the overlays is
immediately legible.

## Chapter 2. Movement Review

### Label

MOVEMENT REVIEW

### Title

Review the Crux

### Introduction

Crux Vision combines focused pose analysis with precision playback controls,
making it easier to isolate a move and investigate a specific question. Instead
of processing an entire recording, climbers can select the short segment that
contains the movement they want to understand and move fluidly between ordinary
video review and pose-based overlays.

### Feature captions

#### ISOLATE THE CRUX

Select the section that contains the move you want to understand, often the
hardest move, a recurring fall, or a place where two methods differ. Focusing
the range keeps the analysis centered on relevant climbing and allows the
on-device pose model to return results much faster.

**Recommended screenshot:** The range-selection and analysis controls with a
short range clearly marked on the timeline.

#### REVIEW WITH PRECISION

Loop the selected range, slow down playback, step through analyzed frames, and
create named checkpoints for important positions. These controls make it easy
to repeat a movement, examine individual moments, and return quickly to the
parts of an attempt that deserve closer attention.

**Recommended screenshot:** The playback controls showing speed, looping,
frame navigation, and at least one named checkpoint.

#### FOCUS THE INVESTIGATION

Choose the body part that matches the question you are asking. One review might
focus on the path of an ankle while generating momentum; another might examine
the hips, shoulders, wrist, knee, or elbow. The selected trail turns a movement
path that is obscured through time into something visible, helping confirm an
observation, reveal a new detail, or explain the movement to another climber.

**Recommended screenshot:** The overlay controls with a specific joint selected
and its trail clearly visible over the climber.

## Chapter 3. Visual Overlay

### Label

VISUAL OVERLAY

### Title

Movement Made Visible

### Introduction

Movement trails trace parts of your body through space, preserving the
complete shape of a movement as a persistent visual path. For
this comparison, I selected my left ankle, hip midpoint, and shoulder midpoint
to investigate two attempts at the same dynamic move.

### The move

The move begins from a poor foothold: a flat, sideways-facing surface that is
difficult to jump from without slipping. The destination holds are two
opposing side-pulls. To stay on the wall, I need to catch them with
enough height to keep my arms bent, create compression through my upper body,
and press my foot into the flat wall.

It is a quick, coordinated movement, and the momentum, body position, and
timing all have to come together within a fraction of a second.

### Reading the trails

In the unsuccessful attempt, I try to power directly through the move by
pulling on the sloped handholds and jumping. My chest and shoulders lead while
my hips follow behind. I arrive with my arms extended and my body stretched
away from the wall, without enough leverage or any support from my feet to hold
the position.

In the successful attempt, I generate momentum differently. I swing my left
leg backward, then drive it forward and upward. The ankle trail makes
that larger arc immediately visible. The swing carries my hips through the
movement, allowing them to lead rather than trail behind my shoulders. The hip
and shoulder trajectories rise higher, and I arrive more centered beneath the
holds, with bent arms and a foot pressing into the wall to take weight off my
arms.

My climbing experience gave me a theory about why one attempt worked and the
other did not. Crux Vision gave that theory a visible form. Isolating the move
and comparing trails pulled attention toward the timing and relationships that
ordinary playback spreads across a fraction of a second.

The overlay does not replace the experience of a climber. It complements that
knowledge, providing an intuitive surface for individuals, groups, and coaches
to examine movement, make nuanced observations, confirm theories, and explain
complex technique to one another.

### Recommended layout and visual

Let the side-by-side comparison video fill almost the entire content-panel
width. Do not label the attempts: the fall makes the unsuccessful attempt
clear. Place the supplied trail legend directly beneath the video rather than
over it:


Keep the introduction above the video short. Place **THE MOVE** and **READING
THE TRAILS** below it so the visual comparison lands before the detailed
explanation. The current comparison asset is
`public/videos/crux-vision-fail-vs-success.mp4`.

## Chapter 4. Engineering

### Label

ENGINEERING

### Title

Building Visuals from Video

### Draft

Drawing a skeleton is straightforward compared with deciding when its data is
trustworthy enough to show. Climbing gives a pose model difficult input:
crossed limbs, occlusion, motion blur, and unusual body positions the model was
not trained for. Sometimes these conditions result in MediaPipe output with
missing data or detection errors. The engineering challenge was to preserve
the movement without disguising that uncertainty.

### Technical highlights

- Progressive, on-device pose analysis in a module worker
- Presentation-timestamp synchronization for live overlays
- Immutable raw pose data with derived, inspectable views
- Confidence-aware filtering and gap-bounded smoothing

### Technology tags

- React
- TypeScript
- Vite
- MediaPipe Pose
- MediaBunny
- Canvas 2D
- Web Workers

#### From video to overlay

A climber imports a local video and selects only the range they want to study,
keeping the analysis focused and reducing processing time. MediaPipe analyzes
that range progressively in a worker, drawing the overlay as results arrive so
the climber can begin reviewing the movement while the source video remains
playable. Each pose sample keeps its presentation timestamp, and live Canvas
layers use the same display transform as the video. This keeps overlays aligned
across portrait and landscape footage without uploading or re-encoding the
clip.

#### Preserving uncertainty

Raw pose results remain immutable. Confidence, body-scale plausibility, and
motion over time determine which joints enter a derived view. Implausible jumps
and unreliable positions are rejected; smoothing stays inside valid segments.
When a joint disappears behind the climber or wall, Crux Vision shows an honest
gap instead of inventing a continuous path.

The ordinary interface reduces a large calibration system to three
understandable approaches. **Balanced** uses moderate confidence and motion
cutoffs to balance useful continuity against false positions. **Strict** uses
higher confidence cutoffs and tighter motion limits, creating more gaps to
avoid false limbs. **Permissive** uses lower confidence cutoffs and looser
motion limits to preserve more data, with a greater risk of questionable
positions. More continuous data can be useful, but it is not automatically
more accurate.

#### Calibration by iteration

Calibration is an iterative process rather than a search for one universally
correct filter. I compare raw, accepted, rejected, One Euro, and centered views
against the same cached MediaPipe results, isolating each policy or filter
change from a new inference run. Coverage, rejection, gap, and smoothing
metrics reveal how a setting changes the data, but visual review determines
whether the resulting body positions still make sense.

The public beta exposes this deeper workspace for advanced manual calibration.
Thresholds, continuity rules, smoothing behavior, and preview modes can be
adjusted while the original pose samples remain immutable. Most climbers only
need the Balanced, Strict, and Permissive presets; the advanced controls make
the reasoning behind those presets inspectable and give me a controlled surface
for developing better defaults.

Calibration remains ongoing. I am continuing to test across static positions,
explosive dynamic moves, overhangs and occlusion, crossed limbs, varied camera
angles, and different styles of climbing. A change should improve more than one
kind of movement without creating a new failure somewhere else.

#### Smoothing recorded movement

Even accepted pose landmarks can shift slightly from frame to frame. That
noise makes a skeleton appear to jitter and turns a movement trail into a
jagged path. Smoothing produces more visually stable poses and cleaner overlays
and trails, but every smoother must trade some immediate responsiveness for
visual continuity.

The **One Euro filter** is adaptive and causal: it uses the current and earlier
accepted samples, applying more smoothing to slow or nearly still movement and
responding more quickly as movement speed increases. Because it does not look
ahead, it follows the chronology of the incoming pose track, but it can still
visibly trail a fast, dynamic move.

The **centered offline smoother** uses accepted samples before and after each
timestamp. Its symmetric window avoids the same systematic trailing and
produced the most useful display for recorded dynamic movement while still
removing substantial jitter, so it became the display default. Looking forward
creates a different risk: movement can appear to begin slightly early. Both
smoothers stay inside accepted segments and reset at missing or rejected data
rather than blending across a gap. Accepted raw retains the original model output.

##### Confidence by scope

MediaPipe attaches two confidence signals to each detected joint. **Visibility**
estimates whether the joint is clearly visible rather than hidden by the body,
wall, or another limb. **Presence** estimates whether the joint is actually
within the captured frame. Crux Vision requires both signals to clear their
configured thresholds before a joint enters an accepted view.

A global threshold establishes the baseline, while body-group overrides can
target repeated problems in related joints without over-filtering the entire
body. Joint-level overrides provide an even narrower adjustment when needed.
Higher thresholds remove more questionable positions, reducing false limbs at
the cost of more missing data and broken trails. Lower thresholds preserve more
continuous movement, but increase the chance that an uncertain or incorrect
position will remain visible.

#### Continuity and plausibility

Confidence hysteresis uses different requirements for acquiring and retaining
a joint, preventing borderline data from blinking on and off at a single
cutoff. Timestamp-aware plausibility checks compare joint speed, acceleration,
and changes in apparent limb length against body scale, rejecting positions
that would require an implausible jump even when the model reports high
confidence. The smoothing controls then tune filter responsiveness within the accepted values.

#### Limitations

Filtering and smoothing can reject noise or make accepted movement easier to
read, but they cannot recover a joint the model never observed. One Euro can
lag fast movement, while centered smoothing can anticipate movement onset. Both
remain approximations that need continued comparison against accepted raw data.

Movement trails are most useful with a fixed or nearly fixed camera. Camera
movement can distort trails because the overlay measures motion within the
image, including movement introduced by panning, zooming, or camera shake.

Computer vision remains imperfect. Calibration can improve the usefulness of
the visual result, but it cannot repair major detection errors or missing data.
Crux Vision should not be treated as flawless motion capture or biomechanical
truth.

### Recommended layout and visual

Keep this chapter primarily typographic. Following the Fosty engineering
chapter, place the introduction and technical highlights in two equally
weighted columns immediately after the title. Put a full-width technology row
directly beneath them so the stack remains visible before scrolling. Follow it
with a restrained comparison of Balanced, Strict, and Permissive using one
continuous line in each card.

Let **CALIBRATION BY ITERATION** span the content width as a short introduction
to the advanced workspace. Beneath it, pair each of the first two screenshots
with its corresponding explanation in a stacked sequence. The full screenshot
occupies the left third and the text occupies the right two thirds:

1. Pose-quality calibration screenshot with **SMOOTHING RECORDED MOVEMENT**.
2. Confidence-controls screenshot with **CONFIDENCE BY SCOPE**.

Keep each explanation in one text column and give its heading the full width of
that column. The final row remains three equal, top-aligned columns:
continuity-and-smoothing screenshot; **CONTINUITY AND PLAUSIBILITY** text; and
**LIMITATIONS** text. Show every screenshot in full rather than cropping it into
a preview window. Keep captions short:

- **COMPARE DERIVED VIEWS:** Preview raw, accepted, rejected, One Euro, and
  centered pose data from the same cached analysis, with metrics that make the
  effects of each policy visible.
- **CONFIDENCE THRESHOLDS:** Tune visibility and presence globally or for a
  body group when a recurring confidence problem needs a more targeted rule.
- **CONTINUITY CONTROLS:** Adjust reacquisition, motion plausibility, One Euro
  responsiveness, and the centered smoothing window without bridging rejected
  gaps.

Current screenshot sources and suggested portfolio asset names:

- `/Users/evan/Documents/Screenshots/Screenshot 2026-08-20 at 1.19.16 PM.png`
  → `public/images/crux-vision-calibration-overview.webp`
- `/Users/evan/Documents/Screenshots/Screenshot 2026-08-20 at 1.20.47 PM.png`
  → `public/images/crux-vision-confidence-controls.webp`
- `/Users/evan/Documents/Screenshots/Screenshot 2026-08-20 at 1.22.03 PM.png`
  → `public/images/crux-vision-continuity-smoothing.webp`

## Chapter 5. Outlook

**Status:** Draft for review.

### Label

OUTLOOK

### Title

An Open Investigation

### Body

Crux Vision began with climbing because it is the movement discipline I am familiar with
and passionate about. Other sports and movement disciplines could benefit from
the same concept: visuals can create a shared language between what someone
feels, what a video shows, and what another person can observe.

The public beta is the first useful version of that idea. My immediate goal is
to make the complete workflow comfortable during an ordinary gym session, then
let real use guide what comes next. I want future features to grow from the
questions climbers and coaches bring to the tool, not from adding visual
complexity for its own sake.

There is substantial room to deepen the investigation. New overlays could show
the direction and speed of a movement, preserve earlier positions as ghost
poses, or bring several settings together around a question such as hip drive,
a leg swing, or the sequence of body positions through a move. Carefully
bounded measurements could help examine timing, angles, stillness, and movement
paths while remaining honest about missing or uncertain pose data.

Video comparison is espacially valuable. Synchronizing two attempts could make
differences in path, timing, body position, and method easier to see. Over
time, saved review sessions, editable annotations, and shareable visuals could
turn Crux Vision into a richer surface for collaboration between climbers and
coaches. The same principles may also complement expertise in other sports and
movement disciplines, but each one brings its own questions. I would want
those directions to be explored with the people who understand them.

Crux Vision will never pretend to know the correct way to move.
It's purpose is to help athletes learn something about their technique, give
coaches a clearer way to explain an observation, or add a new element to an open
conversation between climbers.

I welcome your taste! Try Crux Vision with your own climbing video. If it helps
you notice something or if you have observations or improvments I would love to hear about
it. I welcome feedback, feature requests, and open conversations about where
the project should go next.

### Calls to action

- TRY THE PUBLIC BETA: <https://crux-vision-rebuild.vercel.app/>
- SHARE FEEDBACK: luebbertevan@gmail.com (just mirror the link on my about page with the copy icon and functionality)

### Recommended layout and visual

Keep the closing chapter concise and primarily typographic. Let the first two
paragraphs establish the vision, then give the future-feature paragraphs enough
space to read as possibilities rather than a promised feature list. End with
the invitation and two clear actions: the public beta and a direct feedback or
contact link. If the chapter needs a visual accent, use a restrained progression
of labels—**New visual lenses**, **Compare attempts**, and **Share the
investigation**—instead of product mockups for features that do not exist yet.
