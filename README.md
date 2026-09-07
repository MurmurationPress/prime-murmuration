# PRIME Murmuration

PRIME Murmuration is a deterministic, locally coordinated particle-field visualisation of a distributed intelligence. Its global coherence emerges from local boids behaviour, geographic habitat, transient centres, pressure response, and slower-decaying computational expenditure.

> **One distributed entity, several temporary centres, no stable edge, and no fixed command point.**

This public repository is a deployment snapshot. The canonical source is maintained in the private [`MurmurationPress/murmuration-animations`](https://github.com/MurmurationPress/murmuration-animations) repository under `animations/murmuration/`; no manuscripts, story-world notes, research, or other private material is published here.

## Live site

- Custom domain: <https://murmuration.murmurationpress.co.uk>
- GitHub Pages fallback: <https://murmurationpress.github.io/prime-murmuration/>
- Ghost wrapper: <https://murmurationpress.co.uk/murmuration/>

DNS for the custom domain is managed separately from this repository.

## Run locally

```bash
python3 -m http.server 8080
```

Open <http://localhost:8080>. The public root starts the 16-second `book3-global`
reveal with seed 1296 and controls available. p5.js 1.11.8 is vendored in `vendor/`; the simulation has no runtime internet dependency.

## Controls

- **H** — toggle controls / clean presentation mode
- **Space** — pause or resume
- **R** — reset to the current deterministic seed
- **P** — apply default pressure using current control values
- **1–5** — pressure presets for the current scene (the Americas, Europe, Africa and Asia in global mode; UK regions in regional mode)
- **0** — clear pressure immediately

With controls visible, clicking or tapping the map applies pressure at that position. The pressure diagnostic can display active geometry during tuning. Clean mode hides the panel, toggle, diagnostics and pressure geometry while retaining keyboard control. Book 3 retains its restrained global readout.

## Configurations

- `book3-global` — public default: 16-second regional-to-global reveal with 1,800 global agents
- `subtle` — original regional field with 2,000 agents
- `dense` — increased agent density and collective glow
- `agitated` — faster, less settled movement
- `pressure-test` — earlier, wider, stronger scheduled pressure

Parameters and pressure presets are defined in `src/config.js`. Switch presets or
scenes using the controls. URL parameters override the public default:

- `?preset=subtle` — original regional mode
- `?preset=dense` — dense regional mode
- `?preset=book3-global&reveal=0` — global ecology without the reveal
- `?seed=42` — global reveal with an explicit deterministic seed
- `?seed=42&frame=195` — paused, deterministic global review frame

`entry-config.js` selects the public default. Canonical local authoring retains
`subtle`; the publisher supplies this public configuration without forking the app.

## Export

- **Save PNG** captures the current frame.
- **PNG sequence** writes 480 frames for Book 3 or 300 for regional presets, at 30 fps. Chromium can write directly to a selected directory; other browsers may request permission for multiple downloads.
- **Record WebM** records a 16-second Book 3 stream or a ten-second regional stream when supported by the browser.

Recommended interactive recording workflow:

1. Press **R** to reset.
2. Click **Record WebM**.
3. Press **H** for clean mode.
4. Let the field establish.
5. Press **1–5** to apply pressure.
6. Let displacement and recovery play out until recording completes.

The working canvas is 540×960 for responsive playback and shares the portrait aspect ratio of 1080×1920 output.

## Geography and thermodynamics

Global mode combines synthetic population, infrastructure and connectivity fields with packaged world land geometry and weak long-distance corridors. Sea remains permeable but more resistant outside corridors. Regional presets retain their original UK/Ireland/north-west Europe habitat. No live map service is used.

Behavioural movement produces synthetic computational expenditure. That expenditure decays more slowly than visible motion, so pressure leaves a faint trace of where coherence was while new cost follows it elsewhere.

## Ghost integration

The intended Ghost wrapper is <https://murmurationpress.co.uk/murmuration/>. The deployed simulation can be embedded there using an HTML card:

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

Maintainers publish from `MurmurationPress/murmuration-animations` with `scripts/publish-murmuration.sh`. The allow-list process copies only `index.html`, `styles.css`, public `entry-config.js`, `src/`, `vendor/`, `data/`, optional `assets/`, and reviewed deployment metadata. It never mirrors the private repository root.

After syncing, review `git status`, `git diff`, and the complete file list in this repository. Run the local validation suite, commit the snapshot, and push `main`. GitHub Actions then deploys the repository root to Pages.
