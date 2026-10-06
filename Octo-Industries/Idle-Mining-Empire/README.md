# Idle Mining Empire

This folder contains the original browser-delivered HTML5 game and the local resources it references. The project is launched through `index.html` and is registered in the Game Hub by `game.json`.

The original game bundle and game-specific media were served from [MortgageCalculator.org's Idle Mining Empire page](https://www.mortgagecalculator.org/money-games/idle-mining-empire/). The HTML wrapper's analytics are omitted. The original bundle includes a publisher-domain guard that aborts startup on self-hosted domains; that guard is bypassed so the game can initialize locally and on Render. The original engine requests 60 FPS; its animation-frame scheduler is capped at 60 updates per second on high-refresh displays, and its timer-based fallback also runs at 60 FPS. The publisher splash and outbound-link fallbacks are disabled, and ad and rewarded-ad settings remain off for local hosting. Gameplay code and mechanics are otherwise unchanged.

The repository does not contain an independently verified license document. The repository owner has stated that they are licensed to copy and self-host the game; retain any applicable license documentation with the project when redistributing it.

The game uses the shared Octo Industries home button and watermark from `../branding/`. The hub button links back to the root Game Hub and supports the shared position settings documented in the repository README.

The Game Hub banner uses the game's original splash artwork edge-to-edge. The shared catalog sync generates a self-contained 16:9 SVG without adding duplicate title or description text.
