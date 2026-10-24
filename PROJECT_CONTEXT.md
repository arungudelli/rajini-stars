# Rajini star animation — continuation context

## Project

Buildless HTML, CSS and JavaScript Canvas website. Open this folder as the repository root in VS Code.

- Origin: https://github.com/arungudelli/rajini-stars.git
- Branch: main, tracking origin/main.
- Live site: https://arungudelli.github.io/rajini-stars/
- GitHub Pages deploys from main, repository root.
- Preserve history: first commit 6c83673; second commit ab93d7a. Make subsequent changes as new commits.

## Agreed animation

The whole sequence fits within 20 seconds:

1. One large, solid silver star starts close to the viewer, recedes into the screen, shrinks, and disappears.
2. Small stars visibly assemble into the letter **R**. Hold the readable letter briefly.
3. R turns and splits outward into a sparse field of **150 five-point stars**, distributed across the screen in both dimensions.
4. Denser streams rise **straight vertically**, without horizontal drift, to reveal the Rajinikanth portrait.
5. Hold the completed portrait with restrained twinkling.

The user repeatedly distinguished the sparse R breakup from the denser portrait formation. Do not increase both together. Current portrait formation uses 176 column bins and 3 successive waves per occupied column, plus 160 loose rising sparks. Detailed stationary portrait points are separate from moving stars.

Stars need five readable, full arms with silver beveled faces and thickness. Avoid extreme edge-on flattening. The portrait is sampled from portrait.png; its bright pixels supply the drawing targets.

## Music and controls

theme-20s.mp3 contains only the opening approximately 20 seconds of the user-provided track. Animation and music stop at the 20-second endpoint. Audio fades in the last second.

On page load, a centered silver star and Click here tooltip wait silently. Clicking or keyboard-activating the star starts music and animation together from zero. Controls appear after starting. Pause, Replay and timeline scrubbing keep audio synchronized.

## Files and preview

- index.html: page and audio/control elements.
- style.css: responsive fullscreen black layout and controls.
- app.js: animation stages, particle generation, star renderer, audio synchronization.
- portrait.png: generated white-particle Rajini portrait on black.
- theme-20s.mp3: trimmed local music asset.

Preview with a local HTTP server; do not open via file:// because Canvas image sampling requires a suitable origin. Example: `python -m http.server 4173 --bind 127.0.0.1` from this folder. Preview URL: http://127.0.0.1:4173/ . Refresh after changes.

## References

- https://www.youtube.com/watch?v=JAHNgHnJbKM
- https://www.youtube.com/shorts/Jt8E2gZFCgY

The Shorts reference is clearer for the initial star, particle-built R, dimensional five-point stars during breakup, and vertical portrait streaks.

## Workflow

Make and review visual changes locally first. Publish when the user requests it. The animation and music are in commit ab93d7a. The next checkpoint adds the centered click-to-start star and this context note. Preserve these checkpoints and make future changes as new commits.
