# Baggio Magical Kicks

This entry preserves the original browser-delivered Flash game. The page embeds `games/baggio-magical-kicks.swf` through the repository's locally hosted Ruffle runtime; it does not load the source portal, advertisements, analytics, or tracking scripts.

Source page: https://www.footballgames.org/baggio-magical-kicks/

## Restore the original assets

Run `./fetch-original-assets.ps1` from this directory in PowerShell. The script downloads the original SWF and source thumbnail, verifies their SHA-256 checksums, and writes them to the paths used by the game page and catalog. The runtime does not request either file from the original hosts after this step.

The SWF is Flash version 5 (`CWS`), 309,221 bytes, SHA-256 `77B70319804B05FF9B59AD8724D675F6A384F0295684C74FE50F06CFD3D72F4E`. Its decompressed length matches the SWF header. A scan found no external media/data imports or runtime asset loaders; two embedded links point to `robertobaggio.com` and are denied by the local Ruffle configuration.

The thumbnail is the original portal's game artwork, not a gameplay screenshot. No gallery screenshots are claimed. The Ruffle runtime is shared from `Age-of-War/ruffle` to avoid duplicating its JavaScript and WebAssembly files.