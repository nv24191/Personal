import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const gameDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '../../Baggio-Magical-Kicks');
const assets = [
  {
    output: resolve(gameDirectory, 'games/baggio-magical-kicks.swf'),
    source: 'https://www.footballgames.org/wp-content/games/baggio-magical-kicks.swf',
    expectedHash: '77B70319804B05FF9B59AD8724D675F6A384F0295684C74FE50F06CFD3D72F4E',
    expectedSize: 309221,
    signature: 'CWS',
    name: 'original Baggio Magical Kicks SWF',
  },
  {
    output: resolve(gameDirectory, 'hub/banner-source.jpg'),
    source: 'https://footballgames.b-cdn.net/wp-content/thumbs/baggio-magical-kicks.jpg',
    expectedHash: '0AAC7E54A81AB6EB1B74FA66DA133E24B17237924F21FB4E1C5B7652B7B5D6C3',
    expectedSize: 8253,
    signature: '\xff\xd8\xff',
    name: 'original Baggio game artwork',
  },
];
const maximumSize = 1_000_000;

function sha256(data) {
  return createHash('sha256').update(data).digest('hex').toUpperCase();
}

async function readExisting(asset) {
  try {
    const data = await readFile(asset.output);
    if (sha256(data) !== asset.expectedHash) {
      throw new Error(`Existing ${asset.name} failed SHA-256 verification: ${asset.output}`);
    }
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

async function download(asset) {
  const response = await fetch(asset.source, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok || !response.body) {
    throw new Error(`Could not download ${asset.name} (HTTP ${response.status}).`);
  }

  const advertisedSize = Number(response.headers.get('content-length'));
  if (advertisedSize && advertisedSize > maximumSize) {
    throw new Error(`The original Baggio SWF exceeded the ${maximumSize}-byte download limit.`);
  }

  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maximumSize) {
      await reader.cancel();
      throw new Error(`The original Baggio SWF exceeded the ${maximumSize}-byte download limit.`);
    }
    chunks.push(Buffer.from(value));
  }

  const data = Buffer.concat(chunks, size);
  if (data.length !== asset.expectedSize || data.subarray(0, 3).toString('binary') !== asset.signature) {
    throw new Error(`The downloaded ${asset.name} did not match its expected size or file signature.`);
  }
  if (sha256(data) !== asset.expectedHash) {
    throw new Error(`The downloaded ${asset.name} failed SHA-256 verification.`);
  }

  await mkdir(dirname(asset.output), { recursive: true });
  const temporary = `${asset.output}.${process.pid}.download`;
  try {
    await writeFile(temporary, data, { flag: 'wx' });
    await rename(temporary, asset.output);
  } finally {
    await rm(temporary, { force: true });
  }
  console.log(`Downloaded and verified ${asset.name}.`);
}

for (const asset of assets) {
  if (!(await readExisting(asset))) await download(asset);
}