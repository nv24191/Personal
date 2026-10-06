# Ragdoll Archers Offline

This folder contains a local copy of the public Ragdoll Archers Unity WebGL
build, with the original game payload kept unchanged. The local wrapper adds
the requested `Made by Octo Industries` footer.

## Play

For best compatibility with Microsoft Edge on iPad, serve this folder from a
local HTTP server and open the server address in Edge. Unity WebGL builds often
cannot load compressed `.unityweb` assets directly from a `file://` URL because
of browser security rules.

On a computer, run:

```sh
python3 -m http.server 8765 --directory ragdoll-archers
```

Then open `http://<computer-ip>:8765` on the iPad while both devices are on the
same network. No internet connection is used by the game after the files are
downloaded.

The page uses the browser's `requestAnimationFrame` loop and requests a
high-performance WebGL context, allowing the game to run at up to 60 FPS when
the iPad display, browser, and game workload support it. The compiled Unity
game controls its own exact frame pacing.

The game metadata and original developer attribution remain unchanged. The
Octo Industries footer identifies the offline wrapper/package, not ownership of
the original game or its assets.