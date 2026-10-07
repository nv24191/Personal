# Miragine War

Original Miragine War Flash game (`games/miragine-war.swf`, 640×480, native 30 FPS), played locally through the bundled Ruffle runtime in `ruffle/`. Launch through `index.html`; the Game Hub registers it via `game.json`.

- Ruffle is set to `frameRate: 60` in `index.html`. The SWF is natively 30 FPS, so this makes the game run about 2× faster; delete that line to restore the original speed.
- No requests are made to the original host at load time.
- Octo Industries rebranding patched into the SWF (gameplay untouched): the MoFunZone logo splash is removed, the "MIRAGINE presents" splash and corner mark now read "OCTO INDUSTRIES", the MoFunZone menu logo and email text are replaced/removed, and the splash mark and "More Games" button open the Octo Industries Game Hub instead of external sites. On the credits screen the contact email and Facebook/Twitter lines now point to Octo Industries; the original programmer, artist and music credits are kept.
- `index.html` sets `allowScriptAccess: true` so those buttons can navigate to `../../index.html`.
- `screenshots/` and `hub/banner-source.png` are captures from the running game (battle, menu and tutorial screens).
