# Baggio Magical Kicks

This entry preserves the original browser-delivered Flash game. The page embeds `games/baggio-magical-kicks.swf` through the repository's locally hosted Ruffle runtime; it does not load the source portal, advertisements, analytics, or tracking scripts.

Source page: https://www.footballgames.org/baggio-magical-kicks/

## Restore the original assets

The regular `npm run sync` build downloads the original SWF and source artwork if either is missing, verifying their size, file signature, and SHA-256 before catalog generation. The generated banner and game page use only local assets after the build.

The SWF is Flash version 5 (`CWS`), 309,221 bytes, SHA-256 `77B70319804B05FF9B59AD8724D675F6A384F0295684C74FE50F06CFD3D72F4E`. Its decompressed length matches the SWF header. A scan found no external media/data imports or runtime asset loaders; two embedded links point to `robertobaggio.com` and are denied by the local Ruffle configuration.

The thumbnail is the original portal's game artwork, not a gameplay screenshot. No gallery screenshots are claimed. The Ruffle runtime is shared from `Age-of-War/ruffle` to avoid duplicating its JavaScript and WebAssembly files.