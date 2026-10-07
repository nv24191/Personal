![Octo Industries](./Octo-Industries/branding/horizontal-logo.png)

# Octo Industries™ Game Hub

Octo Industries is a touch-friendly game launcher with a Node.js service for the private admin panel and live catalog. The repository-root `index.html` remains the public homepage. The generated catalog still supports static previews, but secure admin access and live publishing require the Node service.

## Run the hub

The project tools and hub source live together in `Octo-Industries/BehindTheScenes/`. In VS Code, open **Run and Debug**, select **Run Game Hub**, and press **F5**. This regenerates the game catalog, starts a local web server from the repository root, and opens the hub in your browser instead of trying to download the HTML file.

To run the public-only static preview, generate the catalog and start a local web server:

```sh
npm --prefix Octo-Industries/BehindTheScenes run sync
python3 -m http.server 8080
```

Open `http://localhost:8080/`. This preview does not provide the private admin API. To run the admin-capable service, generate an admin password hash in an interactive terminal, set the printed hash as `OCTO_ADMIN_PASSWORD_HASH`, and start the Node service:

```sh
npm --prefix Octo-Industries/BehindTheScenes run admin:hash
export OCTO_ADMIN_PASSWORD_HASH='scrypt$...'
npm --prefix Octo-Industries/BehindTheScenes start
```

Open `http://localhost:3000/admin`. Admin state is stored under `.octo-data/` locally; set `OCTO_DATA_DIR` to a persistent directory in hosted deployments. The hash is not the password, and the service refuses to start if it is missing or malformed.

## Discover and add games

`npm --prefix Octo-Industries/BehindTheScenes run sync` reads `game.json` metadata when available and automatically detects top-level game folders with an `index.html`. It validates launch paths and regenerates `Octo-Industries/BehindTheScenes/hub/catalog.js`. Manifest metadata supplies its title, description, category, tags, thumbnail, launch path, optional featured status, and optional screenshot list. If `screenshots` is omitted, supported image files in the game's `screenshots/` folder are added to its hub gallery automatically. Invalid launch or screenshot paths stop the sync with an error.

Add a game directory directly beneath `Octo-Industries/` with an `index.html`; the catalog sync automatically creates a title from the directory name, an `Other` category, basic tags, and a description. For banner art, it prefers the first original screenshot in `screenshots/`, then looks for promotional artwork named `logo`, `cover`, `title`, or `icon` (SVG, PNG, WebP, JPEG). Add `game.json` with a curated `bannerSource` when needed; `bannerFit: "contain"` preserves transparent logo artwork, while the default cover fit fills the shared 16:9 banner. The hub provides a browsable screenshot gallery when local screenshots are available. Generated `hub-banner.svg` files embed their source art, so they load offline at a consistent aspect ratio; games without local artwork use the hub's no-image treatment instead of a fabricated banner. The sync runs locally with `npm --prefix Octo-Industries/BehindTheScenes run sync` and automatically during Render deployment.

## Game projects

- `Octo-Industries/Block-Blast/` — Unity WebGL puzzle game.
- `Octo-Industries/Endless-Siege/` — HTML5 tower defense game.
- `Octo-Industries/Idle-Mining-Empire/` — locally hosted original HTML5 idle-mining game.
- `Octo-Industries/Red-Ball-4/` — locally hosted original Unity WebGL platform game, with offline caching and a local screenshot gallery.
- `Octo-Industries/Subway-Surfers/` — locally hosted original Subway Surfers: New York browser game, with locally stored assets and offline caching.
- `Octo-Industries/Ragdoll-Archers/` — Unity WebGL archery game.
- `Octo-Industries/Stickman-Hook/` — browser-based swinging platform game.
- `Octo-Industries/Tiny-Fishing/` — hub wrapper for the online game at `tiny-fishing.bitbucket.io`; an internet connection is required.
- `Octo-Industries/Toss-The-Turtle/` — Flash game launched locally by the bundled Ruffle player.

The existing `Octo-Industries/BehindTheScenes/` folder contains the hub, scripts, and project configuration alongside the game folders. The playable project folders above are the current copies used by the hub.

Every Play link opens the launch path from the generated catalog as a regular static route. The hub stores recently played game IDs in local browser storage; it does not require an account or send play history to a server.

## Admin panel

The Node service adds a server-authenticated `/admin` control room with password hashing (scrypt), expiring HTTP-only sessions, CSRF validation, same-origin checks, login throttling, audit events, and a persistent catalog overlay. Admin actions support editing game metadata, publishing/unpublishing catalog entries, queuing safe page-source scans and file/metadata checks, and generating a hub HTML build. Only published games appear in the live hub catalog.

The dashboard includes the **Octo AI Game Agent**, powered by Google Gemini 2.5 Pro by default (override with `OCTO_GEMINI_MODEL`). Google AI Studio offers a free API tier for eligible models, but it has quotas and rate limits and model availability varies by project. The free-tier terms state that submitted content may be used to improve Google products; do not send secrets or sensitive personal information. It can answer questions about the game catalog, recent jobs, and admin activity. Its chat is read-only; the owner must use the explicit dashboard controls to edit or publish games. Configure the `GEMINI_API_KEY` secret in Render to enable responses. Never put the key in browser code or commit it. The app adds no separate chat-message quota, but Google's project rate limits and free-tier quotas still apply. Chat sends the current catalog and recent job/activity summaries to Google as context.

The game URL scanner is intentionally a bounded source inspection: it blocks private/reserved IP ranges and non-standard ports, follows only a few redirects, and limits response size and time. It does not download or rewrite games, identify all runtime dependencies, run browser gameplay tests, verify rights, or establish offline readiness. "Offline verified" is only counted when explicitly present in the library data; the file health check does not claim gameplay or offline validation. Full preservation/download workflows, media approval, automated browser tests, and global branding controls are not implemented yet.

The generated standalone hub embeds the current published catalog but uses the site's existing static CSS, JavaScript, and game files; it is not a self-contained bundle. It is available at `/masterstandalone.html` after the admin build job completes.

## Hosting

The root `render.yaml` configures a Render Node web service that runs the catalog sync and serves the public site, protected admin routes, and APIs. It attaches a persistent disk at `/var/data`. Connect the repository to Render and use the Blueprint to apply these settings. In the Render service settings, set `OCTO_ADMIN_PASSWORD_HASH` to the output of `npm --prefix Octo-Industries/BehindTheScenes run admin:hash` and add `GEMINI_API_KEY` from [Google AI Studio](https://aistudio.google.com/apikey). Both are secrets. Do not commit them or enter them in browser code. Keep `index.html`, `Octo-Industries/`, and `render.yaml` together in the deployed branch.

Run `npm --prefix Octo-Industries/BehindTheScenes run sync` after changing game metadata or adding a game, and commit the generated `Octo-Industries/BehindTheScenes/hub/catalog.js`. The sync script validates game launch paths before writing the catalog. The server persists admin changes on its data disk and merges newly discovered catalog entries at startup.

## Branding assets

The existing artwork in `Octo-Industries/branding/octo-industries-logo-source.jpg` remains the source of truth. The transparent, color-preserving octopus cutout powers the complete logo system:

- `primary-logo.svg` / `.png` — stacked octopus and wordmark for splash screens and branding.
- `horizontal-logo.svg` / `.png` — octopus plus wordmark for hub headers and navigation.
- `home-button.svg` / `.png` — circular, text-free, clickable in-game home mark.
- `icon-only.svg` / `.png` — octopus-only icon for app marks, badges, and metadata.
- `watermark-logo.svg` / `.png` — transparent, text-free watermark artwork.
- `favicon.svg`, `favicon.png`, and `favicon.ico` — browser and app icon sizes, including `apple-touch-icon.png`.

Game pages use the circular home button, linking back to the hub, and a non-interactive icon-only watermark at 15% opacity. The shared corner defaults are configured in `game-branding.js` through `window.OCTO_GAME_BRANDING_CONFIG` (`hubButtonPosition` and `watermarkPosition`); changing them updates every game that loads the shared overlay. Players can still drag the home button to any corner; that personal preference is saved and shared between games. Keyboard users can focus the button and use the arrow keys to change corners. The shared overlay is maintained by `game-branding.css` and `game-branding.js`. Keep the branding directory with the game projects when hosting or packaging the site.

| Logo variant | Preview |
| --- | --- |
| Primary | <img src="./Octo-Industries/branding/primary-logo.png" width="90" alt="Primary Octo Industries logo"> |
| Circular home button | <img src="./Octo-Industries/branding/home-button.png" width="64" alt="Circular Octo Industries home button"> |
| Icon only | <img src="./Octo-Industries/branding/icon-only.png" width="64" alt="Octo Industries icon"> |
| Watermark | <img src="./Octo-Industries/branding/watermark-logo.png" width="64" alt="Octo Industries watermark"> |
| Horizontal hub logo | <img src="./Octo-Industries/branding/horizontal-logo.png" width="160" alt="Horizontal Octo Industries logo"> |
