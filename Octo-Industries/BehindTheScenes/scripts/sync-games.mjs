import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const excludedDirectories = new Set(['.git', '.vscode', 'node_modules', 'dist']);
const manifests = [];

function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (!entry.isDirectory() || excludedDirectories.has(entry.name)) continue;

    const gameDirectory = resolve(directory, entry.name);
    const manifest = resolve(gameDirectory, 'game.json');
    if (existsSync(manifest)) manifests.push({ gameDirectory, manifest });
    walk(gameDirectory);
  }
}

function resolveGameFile(gameDirectory, value) {
  const collectionDirectory = dirname(gameDirectory);
  for (const candidate of [
    resolve(gameDirectory, value),
    resolve(collectionDirectory, value),
    resolve(root, value),
  ]) {
    if (candidate.startsWith(`${root}${sep}`) && existsSync(candidate) && statSync(candidate).isFile()) {
      return relative(root, candidate).split(sep).map(encodeURIComponent).join('/');
    }
  }
  return '';
}

walk(root);

const games = manifests.map(({ gameDirectory, manifest }) => {
  const game = JSON.parse(readFileSync(manifest, 'utf8'));
  for (const field of ['id', 'title', 'description', 'category', 'launch']) {
    if (!game[field]) throw new Error(`${manifest} is missing ${field}`);
  }

  const launch = resolveGameFile(gameDirectory, game.launch);
  if (!launch) throw new Error(`${game.title} has no valid launch file: ${game.launch}`);

  return {
    ...game,
    launch,
    thumbnail: resolveGameFile(gameDirectory, game.thumbnail || ''),
    tags: Array.isArray(game.tags) ? game.tags : [],
    featured: game.featured === true,
  };
}).sort((first, second) => first.title.localeCompare(second.title));

if (!games.length) throw new Error(`No game.json files found beneath ${root}`);

const output = resolve(root, 'Octo-Industries', 'BehindTheScenes', 'hub', 'catalog.js');
await import('node:fs/promises').then(({ mkdir }) => mkdir(dirname(output), { recursive: true }));
writeFileSync(output, `window.OCTO_GAMES = Object.freeze(${JSON.stringify(games, null, 2)});\n`);
console.log(`Discovered ${games.length} games. Catalog written to ${relative(root, output)}.`);
for (const game of games) {
  console.log(`  ${game.title}: ${game.launch}${game.thumbnail ? '' : ' (using artwork fallback)'}`);
}