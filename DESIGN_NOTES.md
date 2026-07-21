# Signal Spine — Discovery Notes

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

## Portfolio integration direction

- Treat the strand as a true timeline with fixed world-space coordinates for projects and experiences.
- Prefer crisp HTML content connected visually to the strand over text rendered inside the shader.
- Explore a sci-fi HUD language that appears to scan, annotate, and reveal information on the 3D material.
- Let changes in twist, glow, focus, speed, and camera distance announce portfolio waypoints.
- At a waypoint, the camera may pull back and create negative space for title, imagery, description, and links.
- Use particle or light tendrils as an efficient branching illusion before attempting multiple raymarched glass branches.
- Preserve direct project navigation so visitors never need to traverse the entire line.

## Tabled concepts

- Fully branching glass geometry with content at physical endpoints.
- Rollercoaster-scale loops and turns.
- Final portfolio information architecture and project content.
