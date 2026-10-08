# Ragdoll Hit

This entry hosts the original Unity WebGL build from the source site's game-only host. The article/embed wrapper, Poki SDK, advertisements, analytics scripts, and unrelated portal content are not included. A local no-op Poki compatibility shim preserves the game's expected callbacks while disabling ad breaks and external SDK requests. The game starts from the local Unity 2022.3.6f1 loader and local files in `Build/`.

The `npm run sync` pre-sync step fetches any missing Unity runtime files and the two real gameplay screenshots, validating each file's expected size, signature, and SHA-256 before catalog generation. The Unity data archive contains seven embedded game files; no separate `StreamingAssets` directory or external runtime URLs were found in its metadata/data scan.

The local player fills the viewport and retains Unity's native WebGL sizing behavior. Its service worker caches local game and branding files as they are used, so the first online play seeds later offline launches without an eager second download. The manifest uses the original gameplay screenshots for its banner and gallery. The global Octo Industries home button and watermark use the shared configurable branding controls.

Source game page: https://ragdollhitonline.io/ragdoll-hit

Game payload host: https://freetoplayz.github.io/ragdoll-hit/