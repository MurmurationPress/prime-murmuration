# PRIME Murmuration

PRIME Murmuration is a deterministic, locally coordinated particle-field visualisation of a distributed intelligence. Its global coherence emerges from local boids behaviour, geographic habitat, transient centres, pressure response, and slower-decaying computational expenditure.

> **One distributed entity, several temporary centres, no stable edge, and no fixed command point.**

This public repository is a deployment snapshot. The canonical source is maintained in a private repository; no manuscripts, story-world notes, research, or other private material is published here.

## Live site

- Custom domain: <https://murmuration.murmurationpress.co.uk>
- GitHub Pages fallback: <https://murmurationpress.github.io/prime-murmuration/>

DNS for the custom domain is managed separately from this repository.

## Run locally

```bash
python3 -m http.server 8080
```

Open <http://localhost:8080>. p5.js 1.11.8 is vendored in `vendor/`; the simulation has no runtime internet dependency.

## Controls

- **H** — toggle controls / clean presentation mode
- **Space** — pause or resume
- **R** — reset to the current deterministic seed
- **P** — apply default pressure using current control values
- **1** — pressure over southern England
- **2** — pressure over the Midlands
- **3** — pressure over northern England
- **4** — pressure over the Glasgow–Edinburgh central belt
- **5** — pressure over south-east England / London
- **0** — clear pressure immediately

With controls visible, clicking or tapping the map applies pressure at that position. The pressure diagnostic can display active geometry during tuning. Clean mode hides the panel, toggle, diagnostics, status text, and pressure geometry while retaining keyboard control.

## Configurations

- `subtle` — restrained default field with 2,000 agents
- `dense` — increased agent density and collective glow
- `agitated` — faster, less settled movement
- `pressure-test` — earlier, wider, stronger scheduled pressure

Parameters and pressure presets are defined in `src/config.js`.

## Export

- **Save PNG** captures the current frame.
- **PNG sequence** writes 300 frames at 30 fps. Chromium can write directly to a selected directory; other browsers may request permission for multiple downloads.
- **Record WebM** records a ten-second canvas stream when supported by the browser.

Recommended interactive recording workflow:

1. Press **R** to reset.
2. Click **Record WebM**.
3. Press **H** for clean mode.
4. Let the field establish.
5. Press **1–5** to apply pressure.
6. Let displacement and recovery play out until recording completes.

The working canvas is 540×960 for responsive playback and shares the portrait aspect ratio of 1080×1920 output.

## Geography and thermodynamics

Land is the strongest computational habitat. Sea remains permeable but resistant, with weak coastal continuity and minimal open-water persistence. Population and infrastructure weightings are intentionally approximate and replaceable; mainland-European spillover remains faint.

Behavioural movement produces synthetic computational expenditure. That expenditure decays more slowly than visible motion, so pressure leaves a faint trace of where coherence was while new cost follows it elsewhere.

## Ghost integration

The deployed simulation can be embedded in a Ghost page using an HTML card:

```html
<iframe
  src="https://murmuration.murmurationpress.co.uk/"
  title="PRIME Murmuration"
  loading="lazy"
  allow="fullscreen"
  style="width:100%;aspect-ratio:9/16;border:0;background:#030a12"
></iframe>
```

Ghost theme Content Security Policy settings must allow frames from `murmuration.murmurationpress.co.uk` if a restrictive policy is enabled.

## Publishing updates

Maintainers publish from the private canonical source with its allow-list sync script. The process copies only `index.html`, `styles.css`, `src/`, `vendor/`, and reviewed deployment metadata. It never mirrors the private repository root.

After syncing, review `git status`, `git diff`, and the complete file list in this repository. Run the local validation suite, commit the snapshot, and push `main`. GitHub Actions then deploys the repository root to Pages.
