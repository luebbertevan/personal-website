# Evan Luebbert Portfolio — Discovery Notes

## Locked visual direction

- The liquid-carbon material study is an acceptable foundation and should be preserved.
- The strand should be the narrative structure of the portfolio, not decorative background media.
- Improve fidelity slightly while retaining the cinematic depth-of-field character.

## Continuous traversal

- Prove that the current procedural strand continues seamlessly left and right.
- Scrolling must translate a world-space camera along the strand; it must not reset animation or slide a texture.
- Surface animation, noise, refraction, and volumetric lighting stay continuous during camera movement.
- Focus is recalculated from camera-relative depth every frame and therefore travels with the camera.
- Remove the original timed camera shake. It is a controllable authored effect, not a requirement of the material.
- Use subtle world-space mist, HUD coordinates, and later particle parallax to make camera travel legible.
- Remove the finite cap from the strand field so traversal is practically unbounded in either direction.
- Use smooth procedural camera-path functions rather than a finite list of keyframes so the camera path also continues indefinitely.
- Vary camera orbit, distance, and roll while keeping the current strand coordinate as the look target.
- Allow the strand to become diagonal and occasionally near-vertical, but never let the camera enter the material.
- Recalculate the focal depth from the camera's changing orbital radius so the strand stays readable during zooms.
- Keep the existing close framing as the minimum distance; do not push the camera closer to the material.
- Script occasional wider scenic views, with the strongest pullbacks aligned to near-vertical compositions and a slower independent distance rhythm for broader variation.
- Let pullbacks blend continuously rather than behaving like discrete zoom cuts, and keep focus derived from the final scripted distance.
- Make the wide beats deliberately dramatic: preserve the 3.55 close radius while allowing authored pullbacks as far as 7.75, with eased shoulders and a sustained wide plateau.

## Portfolio integration direction

- Treat the strand as a continuous narrative coordinate, but instantiate project and experience anchors dynamically relative to the camera so direct navigation never has to cross unselected destinations.
- Prefer crisp HTML content connected visually to the strand over text rendered inside the shader.
- Explore a sci-fi HUD language that appears to scan, annotate, and reveal information on the 3D material.
- Let changes in twist, glow, focus, speed, and camera distance announce portfolio waypoints.
- At a waypoint, the camera may pull back and create negative space for title, imagery, description, and links.
- Use particle or light tendrils as an efficient branching illusion before attempting multiple raymarched glass branches.
- Preserve direct project navigation so visitors never need to traverse the entire line.
- Iteration 01 uses a single fixed waypoint at world X +22 to prove content arrival before direct navigation is added.
- Remove the centered diagnostic reticle from the product UI; retain only meaningful, peripheral navigation indicators.
- Use significantly larger functional typography and place project content in negative space created by shifting the strand composition during arrival.
- Prove project-aware color by fading the amber material and interface accent into a signal-blue palette as the waypoint is approached.
- Iteration 02 turns the waypoint label into the first clickable project index item and uses a 2.4-second eased camera move that visitors can interrupt with scroll or keyboard input.
- Increase every functional text tier again, including peripheral navigation, metadata, project copy, tags, and actions; legibility takes precedence over preserving large empty UI margins.
- Stage the project arrival in layers: metadata, title, body copy, and action reveal separately while the camera performs an additional waypoint-specific pullback.
- Use a temporary screen-space line and glowing node to connect the project HUD to the strand. Defer true world-tracked 3D connections or branching project geometry to the later strand-connection iteration.
- Iteration 03 expands one project into four fixed world-space chapters at X +22, +28, +34, and +40: introduction, media, context/impact, and launch.
- Keep the project palette and content frame active across the complete local sequence, with crossfades between chapters and a progress rail that makes the story length legible.
- Extend the temporary connector far enough for its glowing node to visibly meet the shifted strand composition.
- Add a personal `00 / Home` destination during Iteration 04 (direct navigation). It should introduce the owner’s name and personal headline with a unique composition, and remain a first-class item in the index.
- Iteration 04 replaces globally fixed project coordinates with dynamically placed route anchors. Direct selection positions the chosen destination a short distance from the camera’s current strand coordinate, so it never travels through unselected projects.
- Preserve chronological next/previous behavior as `Home → Signal Atlas → Velvet Circuit`, while allowing any index item to become the next rendered destination from anywhere on the strand.
- Snap scrolling, arrow keys, on-screen controls, and chapter tabs to complete states; content fades out before travel and the destination fades in only after arrival, eliminating persistent halfway compositions.
- Give project panels at least half of the desktop viewport and shift the strand farther left so larger bodies of text and multiple media assets can fit without overlap.
- Persist the active destination palette across all of its chapters. Interpolate directly from the current palette to the selected palette during destination travel, without returning to amber between projects.
- Use `00 / Home` as the personal introduction with name and headline. Add `02 / Velvet Circuit` as a pink second-project proof.

## Tabled concepts

- Fully branching glass geometry with content at physical endpoints.
- Rollercoaster-scale loops and turns.

## Project roadmap

The canonical working task list lives in [TODO.md](./TODO.md). Keep this file focused on design decisions and historical rationale; update `TODO.md` as priorities, content, and completion status change.

The concise implementation handoff for future chats lives in [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md).
