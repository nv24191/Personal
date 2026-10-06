# Age of War 1

This folder is the complete Age of War project. Nothing outside this folder is required to edit or play the game.

## Files

- `index.html`: editable browser entry point used by the game hub.
- `src/game.js`: game rules, unit data, evolution, combat, and canvas rendering.
- `src/game.css`: editable layout, colors, controls, and iPad touch behavior.
- `assets/icon.svg`: local hub thumbnail artwork.
- `game.json`: hub metadata and launch information.
- `master.html`: self-contained master distribution. CSS and JavaScript are embedded, so it can be opened directly in Edge without a server or internet connection.
- `standalone.html`: generated compatibility copy of `master.html`.

## Editing

Edit `src/game.js` for gameplay and `src/game.css` for presentation. Use `index.html` while developing because it keeps the source files separate and easy to maintain. Open the game through a local server from the repository root, for example:

```sh
python3 -m http.server 8080
```

Then open `http://localhost:8080/Age-Of-War-1/`.

When source files change, regenerate the master distribution with:

```sh
npm run build
```

The build refreshes `master.html` through the existing Age of War package step and updates the generated distribution copy and ZIP archive. The hub continues to launch `index.html` so the editable project remains the canonical game entry point.
