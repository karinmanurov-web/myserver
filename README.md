# The Creative Lab

A personal collection of creative engines, visual experiments and tiny worlds.

**Imagine · Script · Create**

## Main dashboard

The root page is a static HTML/CSS/JavaScript dashboard designed for GitHub Pages.

### Current features
- Local device clock and date
- Weather widget powered by Open-Meteo (city search; no API key for basic non-commercial use)
- Focus timer
- Random creative inspiration
- Quick notes saved in the current browser
- Module catalogue loaded from `data/modules.json`

## Project structure

```
myserver/
├── index.html
├── main.css
├── main.js
├── data/
│   └── modules.json
├── assets/
│   └── favicon.svg
└── modules/             # Future standalone creative engines
```

## Adding an application

Add an entry to `data/modules.json`:

- `id`: stable unique identifier
- `name`: display name
- `category`: `motion`, `visual`, `director`, or `world`
- `icon`: emoji or short visual mark
- `description`: short explanation
- `status`: e.g. `PLANNED`, `PROTOTYPE`, `IDEA`, `AVAILABLE`
- `path`: relative URL to the module entry page; use `null` while it is not connected

The main page reads this registry and renders the cards automatically.

## Local development

Because the module catalogue is loaded with `fetch()`, serve the project through a local web server rather than opening `index.html` as a `file://` URL.

## Publishing

Enable GitHub Pages in repository Settings → Pages and publish from the `main` branch, root folder. The site will then update when changes are pushed to that source.
