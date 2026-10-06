![Octo Industries](./Octo-Industries/branding/horizontal-logo.png)

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

The existing artwork in `Octo-Industries/branding/octo-industries-logo-source.jpg` remains the source of truth. The transparent, color-preserving octopus cutout powers the complete logo system:

- `primary-logo.svg` / `.png` — stacked octopus and wordmark for splash screens and branding.
- `horizontal-logo.svg` / `.png` — octopus plus wordmark for hub headers and navigation.
- `home-button.svg` / `.png` — circular, text-free, clickable in-game home mark.
- `icon-only.svg` / `.png` — octopus-only icon for app marks, badges, and metadata.
- `watermark-logo.svg` / `.png` — transparent, text-free watermark artwork.
- `favicon.svg`, `favicon.png`, and `favicon.ico` — browser and app icon sizes, including `apple-touch-icon.png`.

Game pages use the circular home button, linking back to the hub, and a non-interactive icon-only watermark at 15% opacity. Drag the home button to any corner; its position is saved and shared between games. Keyboard users can focus the button and use the arrow keys to change corners. The watermark moves to the opposite bottom corner if needed to avoid overlap. The shared overlay is maintained by `game-branding.css` and `game-branding.js`. Keep the branding directory with the game projects when hosting or packaging the site.

| Logo variant | Preview |
| --- | --- |
| Primary | <img src="./Octo-Industries/branding/primary-logo.png" width="90" alt="Primary Octo Industries logo"> |
| Circular home button | <img src="./Octo-Industries/branding/home-button.png" width="64" alt="Circular Octo Industries home button"> |
| Icon only | <img src="./Octo-Industries/branding/icon-only.png" width="64" alt="Octo Industries icon"> |
| Watermark | <img src="./Octo-Industries/branding/watermark-logo.png" width="64" alt="Octo Industries watermark"> |
| Horizontal hub logo | <img src="./Octo-Industries/branding/horizontal-logo.png" width="160" alt="Horizontal Octo Industries logo"> |
