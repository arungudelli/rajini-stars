# Rajini — Written in stars

A buildless HTML, CSS and JavaScript Canvas animation. No external scripts or network dependencies.

Serve this folder with a local HTTP server and open index.html. For example: `python -m http.server 4173 --bind 127.0.0.1`.

Replay starts a new reveal. Pause holds the animation. The timeline scrubs through the 20-second sequence: a large silver star recedes into the screen and vanishes; 150 stars spread from its center to assemble R, hold the letter, and break outward across the screen; sparse vertical star streams then reveal the portrait as the field fades. Reduced-motion preferences show the completed portrait initially.

For GitHub Pages later, upload index.html, style.css, app.js, portrait.png and theme-20s.mp3 into the published repository folder. All assets use relative paths.

The portrait was generated using the built-in image generator with the user's reference image. Prompt: Rajinikanth in sunglasses, formed from sparse white luminous particles and broken vertical light streaks on solid black, matching the supplied portrait's composition.

Music: theme-20s.mp3 contains the opening 19.984 seconds (765 complete MP3 frames) of the user-provided Jailer 2 Theme.mp3. Playback stops at the 20-second animation endpoint and fades during the last second. Click Play with sound to restart the animation and audio together. Pause, Replay and timeline scrubbing also control audio. Visuals can autoplay silently before this click.

