# Octo Industries™ Game Hub

Octo Industries is a static, touch-friendly game launcher. The repository-root `index.html` is the homepage and works with GitHub Pages, Codespaces, and other static hosts. No frontend framework or runtime service is required.

## Run the hub

The project tools and hub source live together in `Octo-Industries/BehindTheScenes/`. In VS Code, open **Run and Debug**, select **Run Game Hub**, and press **F5**. This regenerates the game catalog, starts a local web server from the repository root, and opens the hub in your browser instead of trying to download the HTML file.

Alternatively, from the repository root, generate the game catalog and start a local web server:

```sh
npm --prefix Octo-Industries/BehindTheScenes run sync
python3 -m http.server 8080
```

Open `http://localhost:8080/`. Run the server from the repository root, not from inside a game folder. The root page loads the hub assets from `Octo-Industries/BehindTheScenes/hub/`, links to each validated game entry point, and displays missing cover art with a local fallback.

## Discover and add games

`npm --prefix Octo-Industries/BehindTheScenes run sync` recursively finds `game.json` files, checks their launch paths, and regenerates `Octo-Industries/BehindTheScenes/hub/catalog.js`. Game metadata supplies its title, description, category, tags, thumbnail, launch path, and optional featured status. Search indexes those fields. Missing thumbnail files are allowed; invalid launch paths stop the sync with an error.

Add a game directory and `game.json` with at least `id`, `title`, `description`, `category`, and `launch`. Paths can be relative to the game directory, its parent game collection, or the repository root. Add `thumbnail`, `tags`, and `"featured": true` as needed, then run `npm --prefix Octo-Industries/BehindTheScenes run sync`.

## Game projects

- `Octo-Industries/Age-Of-War-1/` — locally playable HTML5 strategy game; editable source is in `src/`.
- `Octo-Industries/Block-Blast/` — Unity WebGL puzzle game.
- `Octo-Industries/Endless-Siege/` — HTML5 tower defense game.
- `Octo-Industries/Ragdoll-Archers/` — Unity WebGL archery game.
- `Octo-Industries/Stickman-Hook/` — browser-based swinging platform game.
- `Octo-Industries/Toss-The-Turtle/` — Flash game launched locally by the bundled Ruffle player.

The existing `Octo-Industries/BehindTheScenes/` folder contains the hub, scripts, and project configuration alongside the game folders. Game ZIP archives are kept together in `Zips/`, with one archive per game. `Zips/BehindTheScenes.zip` is the complete source snapshot: it includes the hub, game projects, scripts, documentation, and project configuration, but excludes Git history and ZIP archives. The playable project folders above are the current copies used by the hub.

Every Play link opens that project's `game.json` launch page as a regular static route. The hub stores recently played game IDs in local browser storage; it does not require an account or send play history to a server.

## Hosting

The root `render.yaml` configures a Render Static Site to publish the repository root (`.`), where `index.html` lives. This is a static site and does not need a build command; the generated `Octo-Industries/BehindTheScenes/hub/catalog.js` is served with the rest of the source. Connect the repository to Render and use the Blueprint to apply these settings. Keep `index.html`, `Octo-Industries/`, and `render.yaml` together in the deployed branch.

Run `npm --prefix Octo-Industries/BehindTheScenes run sync` after changing game metadata or adding a game, and commit the generated `Octo-Industries/BehindTheScenes/hub/catalog.js` with the static site. The sync script validates game launch paths before writing the catalog.

## Branding assets

The official logo variants live in `Octo-Industries/branding/`: `primary-logo.svg` for prominent hub branding, `compact-logo.svg` for tight spaces, and `watermark-logo.svg` for icons and game watermarks. Game pages load the shared `game-branding.css` and `game-branding.js` to display the same responsive top-left badge and non-interactive bottom-right watermark. Keep the branding directory with the game projects when hosting or packaging the site.
