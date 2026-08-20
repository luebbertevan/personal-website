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
crossed limbs, occlusion, motion blur, and positions that look unusual because
they are. The engineering challenge was to preserve the movement without
disguising that uncertainty.

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

A climber imports a local video and selects only the move they want to study.
MediaPipe analyzes that range progressively in a worker while the source
remains playable. Each pose sample keeps its presentation timestamp, and live
Canvas layers use the same display transform as the video. This keeps overlays
aligned across portrait and landscape footage without uploading or re-encoding
the clip.

#### Preserving uncertainty

Raw pose results remain immutable. Confidence, body-scale plausibility, and
motion over time determine which joints enter a derived view. Implausible jumps
and unreliable positions are rejected; smoothing stays inside valid segments.
When a joint disappears behind the climber or wall, Crux Vision shows an honest
gap instead of inventing a continuous path.

The ordinary interface reduces a large calibration system to three
understandable approaches. **Balanced** is the default compromise between
useful continuity and false positions. **Strict** rejects more uncertainty when
false limbs are more costly than gaps. **Permissive** preserves more motion
with a greater risk of questionable positions. More continuous data can be
useful, but it is not automatically more accurate.

Human review exposed roughly 70 milliseconds of lag from the first causal
smoothing approach. Testing against the same cached pose data led to a centered
offline smoother for recorded review and made MediaPipe Full the quality
default. Because the raw result remains unchanged, the display can evolve
without rewriting what the model originally returned.

Crux Vision works in projected image space and trails are most meaningful with
a fixed camera. It is a tool for investigation—not motion capture,
biomechanical truth, or a system that decides the correct way to climb.

### Recommended layout and visual

Keep this chapter primarily typographic. Following the Fosty engineering
chapter, place the technical highlights and technology tags immediately after
the title so they are visible before scrolling. Follow them with a restrained
comparison of Balanced, Strict, and Permissive that uses broken line segments
to make the continuity tradeoff visible. This communicates more of the
engineering story than a MediaPipe logo and stays more legible than a full
screenshot of the calibration workspace.

## Possible Chapter 5. Outlook

**Status:** Proposed structure, not yet decided.

### Label

OUTLOOK

### Working title

An Open Investigation

### Direction

Use a brief concluding chapter to explain that Crux Vision began with climbing
because it is the movement discipline I understand and care about most, while
the same visual-review principles may complement expertise in other sports and
movement disciplines. Frame the public beta as an evolving investigation:
future visualizations and review capabilities will be shaped by continued use
and feedback from climbers, coaches, and people with different movement
backgrounds.
