# A tribute to Thalaivar ⭐

A little fanboy moment, brought to life with code. A star becomes **R**, breaks into silver stars, and reveals Rajinikanth’s portrait—with music, all inside the browser.

**[Watch the tribute](https://arungudelli.github.io/rajini-stars/)** · Click the star to begin with sound.

## The story behind this

Ever since I saw the **Jailer 2 title card**, I wanted to recreate that feeling with code. The star, the letter R, the way it breaks apart, and then Thalaivar appearing—it stayed with me.

As a developer, I kept thinking: can I build something like this with just HTML, CSS, and JavaScript?

With the help of **OpenAI Codex**, that idea came to life. I brought the fanboy energy and the visual direction; Codex helped write the code, create the portrait asset, and work through the animation and music synchronization. We kept refining it: fewer stars here, denser streams there, slower motion, a better star shape. Small changes until it started feeling closer to what I had imagined.

This is my browser-based take on that title-card moment. Mostly, it’s a developer finding a way to say: **forever a Thalaivar fan.** ❤️

## What happens on screen

1. Click the silver star to start the animation and music together.
2. A large star moves into the distance and disappears.
3. Small stars come together to form **R**.
4. R breaks into 150 silver stars that spread across the screen.
5. Denser streams rise vertically to reveal Rajini’s portrait.
6. The portrait holds and twinkles as the music fades out.

The full experience fits within **20 seconds**. You can pause, replay, mute, or scrub through it.

## How it’s built, in simple terms

- **HTML** holds the page, music, buttons, and social links.
- **CSS** creates the dark layout and adapts it to different screen sizes.
- **JavaScript and Canvas** draw the stars and move them frame by frame.
- The bright parts of a portrait image tell the stars where the final drawing should appear.
- The music’s playback time keeps the animation in sync. Clicking the opening star starts both together.

No framework, backend, or build step—just static files hosted on **GitHub Pages**.

## Run it locally

From this repository’s folder, run:

```sh
python -m http.server 4173 --bind 127.0.0.1
```

Open [localhost:4173](http://localhost:4173/) and click the star. Keep the terminal running while you preview it.

## Files

| File | What it does |
| --- | --- |
| `index.html` | Page, controls, music, and profile links |
| `style.css` | Layout and styling |
| `app.js` | Star shapes, animation, and sound synchronization |
| `portrait.png` | Portrait used to guide the final reveal |
| `theme-20s.mp3` | Opening approximately 20 seconds of the supplied theme track |

## Credits

- **Inspiration:** the Jailer 2 title-card sequence and Superstar Rajinikanth.
- **Idea, visual direction, and iteration:** [Arun Gudelli](https://www.linkedin.com/in/arungudelli/).
- **Coding collaboration:** OpenAI Codex, which helped implement and refine the animation, controls, and audio synchronization.
- **Portrait asset:** created with OpenAI’s image generation tool using a supplied visual reference.

Made with ❤️ by **Arun Gudelli**, with help from **Codex**.
